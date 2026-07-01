<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\CompetitionController;
use App\Http\Controllers\Api\RegistrationController;
use App\Http\Controllers\Api\ResultController;
use App\Http\Controllers\Api\SchoolController;
use App\Http\Controllers\Api\SchoolGroupController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\AnnouncementController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\JudgeController;
use App\Http\Controllers\Api\StatisticsController;
use App\Http\Controllers\Api\ActivityLogController;
use App\Http\Controllers\Api\IssueController;
use App\Http\Controllers\Api\SystemSettingController;
use App\Http\Controllers\Api\IdCardController;
use App\Http\Controllers\Api\MessageController;
use App\Http\Controllers\Api\CertificateController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// ✅ Health Check Route (สำหรับ Railway Healthcheck)
Route::get('health', function () {
    return response()->json([
        'status' => 'ok',
        'timestamp' => now()->toISOString(),
        'service' => 'competmanager-backend'
    ]);
});

// Public routes (no auth required)
Route::prefix('auth')->group(function () {
    Route::post('login', [AuthController::class, 'login']);
    Route::post('logout', [AuthController::class, 'logout']);
    Route::post('refresh', [AuthController::class, 'refresh']);
});

// Public statistics
Route::get('competitions/statistics', [CompetitionController::class, 'getPublicStatistics']);

// Public dashboard routes (no auth required)
Route::prefix('public')->group(function () {
    Route::get('/dashboard/overview', [\App\Http\Controllers\Api\PublicApiController::class, 'getDashboardOverview']);
    Route::get('/dashboard/groups', [\App\Http\Controllers\Api\PublicApiController::class, 'getDashboardGroups']);
    Route::get('/groups', [\App\Http\Controllers\Api\PublicApiController::class, 'getGroups']);
    Route::get('/groups/{id}', [\App\Http\Controllers\Api\PublicApiController::class, 'getGroupDetail']);
    Route::get('/groups/{id}/results', [\App\Http\Controllers\Api\PublicApiController::class, 'getGroupResults']);
    Route::get('/competitions', [\App\Http\Controllers\Api\PublicApiController::class, 'getPublicCompetitions']);
    Route::get('/district-registrations', [\App\Http\Controllers\Api\PublicApiController::class, 'getDistrictRegistrations']);
    Route::get('/district-committee-members', [\App\Http\Controllers\Api\PublicApiController::class, 'getDistrictCommitteeMembers']);
});

// Public announcements (no auth required)
Route::get('announcements/public', [AnnouncementController::class, 'publicIndex']);

// Public schedules (no auth required)
Route::get('schedules/public', [\App\Http\Controllers\Api\CompetitionScheduleController::class, 'getPublishedSchedules']);

// Public results (no auth required)
Route::get('results/public', [\App\Http\Controllers\Api\ScoreController::class, 'getPublishedResults']);

// Public certificate verification (no auth required)
Route::get('certificates/verify/{code}', [CertificateController::class, 'verify']);

// Public certificate listing & download (no auth required)
Route::get('certificates/public', [CertificateController::class, 'publicIndex']);
Route::get('certificates/public/batch-download', [CertificateController::class, 'publicBatchDownload']);

// Certificate PDF routes — auth ผ่าน ?token= (สำหรับ window.open) หรือ Bearer header
// อยู่นอก auth:sanctum เพราะ window.open ไม่สามารถส่ง Authorization header ได้
// controller จัดการ auth เองผ่าน authenticateFromToken()
Route::prefix('certificates')->group(function () {
    Route::get('/preview', [CertificateController::class, 'preview']);
    Route::get('/batch-download', [CertificateController::class, 'batchDownload']);
    Route::get('/{id}/download', [CertificateController::class, 'download']);
});

// Public results PDF (no auth required)
Route::get('results/pdf', [\App\Http\Controllers\Api\ResultPdfController::class, 'generatePdf']);
Route::get('results/pdf/preview', [\App\Http\Controllers\Api\ResultPdfController::class, 'previewPdf']);
Route::get('results/pdf/competition/{id}', [\App\Http\Controllers\Api\ResultPdfController::class, 'generateCompetitionPdf']);

// Protected routes (require authentication)
Route::middleware(['auth:sanctum'])->group(function () {
    // User & Auth
    Route::get('user', [AuthController::class, 'user']);
    Route::post('change-password', [AuthController::class, 'changePassword']);
    Route::apiResource('users', UserController::class);
    Route::post('users/{id}/reset-password', [UserController::class, 'resetPassword']);
    
    // Dashboard - ✅ เพิ่ม /stats ที่หายไป
    Route::get('dashboard', [DashboardController::class, 'index']);
    Route::get('dashboard/stats', [DashboardController::class, 'stats']); // ← แก้ไข: เพิ่มนี้

    // Online Users - แสดงจำนวนผู้ใช้งานออนไลน์
    Route::get('online-users', [\App\Http\Controllers\Api\OnlineUsersController::class, 'index']);
    Route::get('dashboard/school-admin', [DashboardController::class, 'schoolAdmin']);
    Route::get('dashboard/group-admin', [DashboardController::class, 'groupAdmin']);
    Route::get('dashboard/district-admin', [DashboardController::class, 'districtAdmin']);
    
    // Categories
    Route::apiResource('categories', CategoryController::class);
    Route::get('categories/{id}/templates', [CategoryController::class, 'getTemplates']);
    
    // School Groups
    Route::apiResource('school-groups', SchoolGroupController::class);
    
    // Schools
    Route::apiResource('schools', SchoolController::class);
    
    // Competitions (custom routes ต้องอยู่ก่อน apiResource เพื่อไม่ให้ถูก {competition} ดักไว้)
    Route::post('competitions/bulk-create', [CompetitionController::class, 'bulkCreate']);
    Route::post('competitions/bulk-update-excluded-groups', [CompetitionController::class, 'bulkUpdateExcludedGroups']);
    Route::post('competitions/bulk-update-skip-group', [CompetitionController::class, 'bulkUpdateSkipGroupLevel']);
    Route::get('competitions/school-group/{schoolGroupId}', [CompetitionController::class, 'getCompetitionsForSchoolGroup']);
    Route::get('competitions/check-mismatches', [CompetitionController::class, 'checkMismatches']);
    Route::post('competitions/sync-with-parent', [CompetitionController::class, 'syncWithParent']);
    Route::post('competitions/auto-link-parent', [CompetitionController::class, 'autoLinkParent']);
    Route::apiResource('competitions', CompetitionController::class);
    Route::get('competitions/{id}/registrations', [CompetitionController::class, 'getRegistrations']);
    Route::get('competitions/{id}/results', [CompetitionController::class, 'getResults']);
    Route::post('competitions/{id}/advance-winners', [CompetitionController::class, 'advanceWinners']);

    // Registrations
    Route::get('registrations/statistics', [RegistrationController::class, 'statistics']);
    Route::get('registrations/district-competitions', [RegistrationController::class, 'districtCompetitions']);
    Route::get('registrations/district-representatives-pdf', [RegistrationController::class, 'districtRepresentativesPdf']);
    Route::get('registrations/group-overview', [RegistrationController::class, 'groupOverview']);
    Route::get('registrations/status', [RegistrationController::class, 'status']);
    Route::get('registrations/settings', [RegistrationController::class, 'getSettings']);
    Route::put('registrations/settings', [RegistrationController::class, 'updateSettings']);
    Route::post('registrations/district-bulk-update', [RegistrationController::class, 'bulkUpdateDistrictRegistration']);
    Route::get('registrations/reset-preview', [RegistrationController::class, 'resetPreview']);
    Route::post('registrations/reset', [RegistrationController::class, 'reset']);
    Route::post('registrations/bulk-approve', [RegistrationController::class, 'bulkApprove']);
    Route::get('registrations/check-missed-district', [RegistrationController::class, 'checkMissedDistrict']);
    Route::get('registrations/check-approved-no-score', [RegistrationController::class, 'checkApprovedNoScore']);
    Route::get('registrations/check-pending', [RegistrationController::class, 'checkPendingRegistrations']);
    Route::get('registrations/check-special-in-group', [RegistrationController::class, 'checkSpecialInGroup']);
    Route::get('registrations/check-m13-in-group', [RegistrationController::class, 'checkM13InGroup']);
    Route::post('registrations/promote-to-district', [RegistrationController::class, 'promoteToDistrict']);
    Route::apiResource('registrations', RegistrationController::class);
    Route::post('registrations/{id}/approve', [RegistrationController::class, 'approve']);
    Route::post('registrations/{id}/reject', [RegistrationController::class, 'reject']);
    Route::post('registrations/{id}/change-participant', [RegistrationController::class, 'changeParticipant']);

    // System Settings - ตั้งค่าช่วงเวลาเปิดแก้ไขรายชื่อ
    Route::get('system-settings/edit-name', [SystemSettingController::class, 'getEditNameSettings']);
    Route::put('system-settings/edit-name', [SystemSettingController::class, 'updateEditNameSettings']);
    Route::get('system-settings/participant-change', [SystemSettingController::class, 'getParticipantChange']);
    Route::put('system-settings/participant-change', [SystemSettingController::class, 'updateParticipantChange']);
    Route::get('system-settings/certificate', [SystemSettingController::class, 'getCertificateSettings']);
    Route::post('system-settings/certificate', [SystemSettingController::class, 'updateCertificateSettings']);
    Route::get('system-settings/permissions', [SystemSettingController::class, 'getPermissions']);
    Route::put('system-settings/permissions', [SystemSettingController::class, 'updatePermissions']);

    // Results
    Route::apiResource('results', ResultController::class);
    Route::post('results/competitions/{competitionId}/calculate-ranks', [ResultController::class, 'calculateRanks']);
    Route::get('results/competitions/{competitionId}/leaderboard', [ResultController::class, 'getLeaderboard']);
    Route::post('results/competitions/{competitionId}/export', [ResultController::class, 'exportResults']);
    
    // Judges - ✅ ใช้ fallback method สำหรับ controller ที่ไม่มี
    Route::get('competitions/{competitionId}/judges', function() {
        return response()->json(['success' => true, 'data' => []]);
    });
    Route::post('competitions/{competitionId}/judges', function() {
        return response()->json(['success' => true, 'message' => 'Feature coming soon']);
    });
    Route::put('competitions/{competitionId}/judges/{judgeId}', function() {
        return response()->json(['success' => true, 'message' => 'Feature coming soon']);
    });
    Route::delete('competitions/{competitionId}/judges/{judgeId}', function() {
        return response()->json(['success' => true, 'message' => 'Feature coming soon']);
    });
    
    // Announcements
    Route::apiResource('announcements', AnnouncementController::class);
    Route::post('announcements/{id}/toggle-pin', [AnnouncementController::class, 'togglePin']);

    // Messages - ระบบส่งข้อความ
    Route::prefix('messages')->group(function () {
        Route::get('/conversations', [MessageController::class, 'index']);
        Route::post('/conversations', [MessageController::class, 'store']);
        Route::get('/conversations/broadcast', [MessageController::class, 'getBroadcast']);
        Route::get('/conversations/{id}', [MessageController::class, 'show']);
        Route::post('/conversations/{id}/messages', [MessageController::class, 'sendMessage']);
        Route::post('/conversations/{id}/read', [MessageController::class, 'markAsRead']);
        Route::get('/unread-count', [MessageController::class, 'unreadCount']);
        Route::get('/users/search', [MessageController::class, 'searchUsers']);
    });

    // Certificates - ระบบเกียรติบัตร (preview/download อยู่นอก auth:sanctum ด้านบน)
    Route::prefix('certificates')->group(function () {
        Route::get('/', [CertificateController::class, 'index']);
        Route::get('/eligible', [CertificateController::class, 'eligible']);
        Route::post('/generate', [CertificateController::class, 'generate']);
        Route::get('/number-settings', [CertificateController::class, 'numberSettings']);
        Route::post('/number-settings', [CertificateController::class, 'updateNumberSettings']);
        Route::post('/number-settings/reset', [CertificateController::class, 'resetNumberSettings']);
        Route::get('/group-settings/{groupId}', [CertificateController::class, 'groupCertificateSettings']);
        Route::post('/group-date', [CertificateController::class, 'updateGroupDate']);
        Route::delete('/all', [CertificateController::class, 'destroyAll']);
        Route::delete('/filtered', [CertificateController::class, 'destroyFiltered']);
        Route::get('/eligible-committee', [CertificateController::class, 'eligibleCommittee']);
        Route::post('/generate-committee', [CertificateController::class, 'generateCommittee']);
        Route::get('/eligible-staff', [CertificateController::class, 'eligibleStaff']);
        Route::post('/generate-staff', [CertificateController::class, 'generateStaff']);
        Route::delete('/{id}', [CertificateController::class, 'destroy']);
    });

    // Issues / Tickets - ระบบแจ้งปัญหา
    Route::prefix('issues')->group(function () {
        Route::get('/statistics', [IssueController::class, 'statistics']);
        Route::get('/', [IssueController::class, 'index']);
        Route::post('/', [IssueController::class, 'store']);
        Route::get('/{id}', [IssueController::class, 'show']);
        Route::put('/{id}', [IssueController::class, 'update']);
        Route::patch('/{id}/status', [IssueController::class, 'updateStatus']);
        Route::patch('/{id}/assign', [IssueController::class, 'assign']);
        Route::post('/{id}/replies', [IssueController::class, 'addReply']);
    });

    // Auth - get current user
    Route::get('auth/me', [AuthController::class, 'user']);

    // Activity Logs (district_admin only)
    Route::prefix('activity-logs')->group(function () {
        Route::get('/', [ActivityLogController::class, 'index']);
        Route::get('/stats', [ActivityLogController::class, 'stats']);
        Route::get('/user/{userId}', [ActivityLogController::class, 'userLogs']);
        Route::post('/cleanup', [ActivityLogController::class, 'cleanup']);
        Route::get('/export', [ActivityLogController::class, 'export']);
    });

    // Committee Members - คณะทำงาน
    Route::get('committee-members/statistics', [\App\Http\Controllers\Api\CommitteeMemberController::class, 'statistics']);
    Route::get('committee-members/competitions', [\App\Http\Controllers\Api\CommitteeMemberController::class, 'getAllCompetitions']);
    Route::get('committee-members/staff-pdf', [\App\Http\Controllers\Api\CommitteeMemberController::class, 'generateStaffPdf']);
    Route::post('committee-members/batch', [\App\Http\Controllers\Api\CommitteeMemberController::class, 'storeBatch']);
    Route::apiResource('committee-members', \App\Http\Controllers\Api\CommitteeMemberController::class);
    
    // Reports - ✅ ใช้ fallback method สำหรับ controller ที่ไม่มี
    Route::get('reports/competitions', function() {
        return response()->json(['success' => true, 'data' => []]);
    });
    Route::get('reports/registrations', function() {
        return response()->json(['success' => true, 'data' => []]);
    });
    Route::get('reports/results', function() {
        return response()->json(['success' => true, 'data' => []]);
    });
    Route::get('reports/schools', function() {
        return response()->json(['success' => true, 'data' => []]);
    });
    Route::post('reports/export/{type}', function() {
        return response()->json(['success' => true, 'message' => 'Export feature coming soon']);
    });
    
    // Statistics
    Route::get('statistics/overview', [StatisticsController::class, 'overview']);
    Route::get('statistics/competitions', [StatisticsController::class, 'competitions']);
    Route::get('statistics/registrations', [StatisticsController::class, 'registrations']);
    Route::get('statistics/schools', [StatisticsController::class, 'schools']);

    // ID Cards - บัตรประจำตัวผู้เข้าแข่งขัน
    Route::prefix('id-cards')->group(function () {
        Route::get('photo-stats', [IdCardController::class, 'photoStats']);
        Route::get('photos-to-migrate', [IdCardController::class, 'photosToMigrate']);
        Route::post('migrate-photo', [IdCardController::class, 'migratePhoto']);
        Route::post('clear-photo-data', [IdCardController::class, 'clearPhotoData']);
        Route::get('school/pdf', [IdCardController::class, 'generateAllPdf']);
        Route::get('registrations/{registrationId}/pdf', [IdCardController::class, 'generatePdf']);
        Route::get('registrations/{registrationId}/photos', [IdCardController::class, 'getPhotos']);
        Route::post('registrations/{registrationId}/photos', [IdCardController::class, 'uploadPhoto']);
        Route::delete('registrations/{registrationId}/photos', [IdCardController::class, 'deletePhoto']);
    });

    // Documents - PDF Generation
    Route::prefix('documents')->group(function () {
        Route::get('competitions/{competition}/student-checkin', [\App\Http\Controllers\Admin\DocumentController::class, 'generateStudentCheckin']);
        Route::get('competitions/{competition}/teacher-checkin', [\App\Http\Controllers\Admin\DocumentController::class, 'generateTeacherCheckin']);
        Route::get('competitions/{competition}/committee-checkin', [\App\Http\Controllers\Admin\DocumentController::class, 'generateCommitteeCheckin']);
        Route::get('competitions/{competition}/staff-checkin', [\App\Http\Controllers\Admin\DocumentController::class, 'generateStaffCheckin']);
        Route::get('competitions/{competition}/score-sheet', [\App\Http\Controllers\Admin\DocumentController::class, 'generateScoreSheet']);
        Route::get('competitions/{competition}/cover-sheet', [\App\Http\Controllers\Admin\DocumentController::class, 'generateCoverSheet']);
        Route::get('competitions/{competition}/summary', [\App\Http\Controllers\Admin\DocumentController::class, 'generateSummary']);
        Route::get('school-registrations', [\App\Http\Controllers\Admin\DocumentController::class, 'generateSchoolRegistrations']);
        Route::post('batch-export', [\App\Http\Controllers\Admin\DocumentController::class, 'batchExport']);
        Route::get('category-overview', [\App\Http\Controllers\Admin\DocumentController::class, 'generateCategoryOverview']);
    });

    // Competition Schedules (ตารางสถานที่แข่งขัน)
    Route::prefix('schedules')->group(function () {
        Route::get('/approved-competitions', [\App\Http\Controllers\Api\CompetitionScheduleController::class, 'getApprovedCompetitions']);
        Route::post('/', [\App\Http\Controllers\Api\CompetitionScheduleController::class, 'store']);
        Route::post('/bulk', [\App\Http\Controllers\Api\CompetitionScheduleController::class, 'bulkSave']);
        Route::post('/{id}/toggle-publish', [\App\Http\Controllers\Api\CompetitionScheduleController::class, 'togglePublish']);
        Route::delete('/{id}', [\App\Http\Controllers\Api\CompetitionScheduleController::class, 'destroy']);
    });

    // Scores - จัดการคะแนน
    Route::prefix('scores')->group(function () {
        Route::get('/competitions', [\App\Http\Controllers\Api\ScoreController::class, 'getCompetitionsForScoring']);
        Route::post('/', [\App\Http\Controllers\Api\ScoreController::class, 'storeScore']);
        Route::post('/bulk', [\App\Http\Controllers\Api\ScoreController::class, 'bulkStoreScores']);
        Route::get('/group-results', [\App\Http\Controllers\Api\ScoreController::class, 'getGroupLevelResults']);
        Route::get('/group-certificates-pdf/{competitionId}', [\App\Http\Controllers\Api\ScoreController::class, 'exportGroupCertificatesPdf']);
        Route::get('/district-results', [\App\Http\Controllers\Api\ScoreController::class, 'getDistrictLevelResults']);
        Route::get('/district-summary', [\App\Http\Controllers\Api\ScoreController::class, 'districtSummary']);
        Route::get('/archive-export', [\App\Http\Controllers\Api\ScoreController::class, 'archiveExport']);
        Route::get('/district-certificates-pdf/{competitionId}', [\App\Http\Controllers\Api\ScoreController::class, 'exportDistrictCertificatesPdf']);
        Route::get('/pending-publish', [\App\Http\Controllers\Api\ScoreController::class, 'getPendingPublishCompetitions']);
    });

    // Competition Scores
    Route::get('competitions/{id}/scorable', [\App\Http\Controllers\Api\ScoreController::class, 'getScorable']);
    Route::get('competitions/{id}/scores', [\App\Http\Controllers\Api\ScoreController::class, 'getScores']);
    Route::post('competitions/{id}/scores', [\App\Http\Controllers\Api\ScoreController::class, 'saveScores']);
    Route::get('competitions/{id}/score-statistics', [\App\Http\Controllers\Api\ScoreController::class, 'getStatistics']);
    Route::post('competitions/{id}/finalize', [\App\Http\Controllers\Api\ScoreController::class, 'finalize']);
    Route::post('competitions/{id}/unfinalize', [\App\Http\Controllers\Api\ScoreController::class, 'unfinalize']);
    Route::post('competitions/{id}/publish', [\App\Http\Controllers\Api\ScoreController::class, 'publishResults']);
    Route::post('competitions/{id}/unpublish', [\App\Http\Controllers\Api\ScoreController::class, 'unpublishResults']);
    Route::post('competitions/{id}/promote-to-district', [\App\Http\Controllers\Api\ScoreController::class, 'promoteToDistrict']);

    // Score Exports - PDF/Excel
    Route::get('competitions/{id}/scores/export/pdf', [\App\Http\Controllers\Api\ScoreExportController::class, 'exportPdf']);
    Route::get('competitions/{id}/scores/export/excel', [\App\Http\Controllers\Api\ScoreExportController::class, 'exportExcel']);
    Route::get('competitions/{id}/scores/export/blank-sheet', [\App\Http\Controllers\Api\ScoreExportController::class, 'exportBlankSheet']);
    Route::get('competitions/{id}/scores/export/leaderboard', [\App\Http\Controllers\Api\ScoreExportController::class, 'exportLeaderboard']);
    Route::match(['get', 'post'], 'scores/export/batch-pdf', [\App\Http\Controllers\Api\ScoreExportController::class, 'batchExportPdf']);
    Route::get('scores/export/my-school-pdf', [\App\Http\Controllers\Api\ScoreExportController::class, 'mySchoolExportPdf']);
    Route::get('scores/export/my-school-excel', [\App\Http\Controllers\Api\ScoreExportController::class, 'mySchoolExportExcel']);

    // Admin: Clear test data (results, scores, announcements)
    Route::post('admin/clear-test-data', function(Request $request) {
        $user = $request->user();
        if (!in_array($user->role, ['admin', 'district_admin'])) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        \Illuminate\Support\Facades\DB::statement('SET FOREIGN_KEY_CHECKS=0');

        $deleted = [];

        // Clear certificates
        $deleted['certificates'] = \Illuminate\Support\Facades\DB::table('certificates')->count();
        \Illuminate\Support\Facades\DB::table('certificates')->truncate();

        // Clear results
        $deleted['results'] = \Illuminate\Support\Facades\DB::table('results')->count();
        \Illuminate\Support\Facades\DB::table('results')->truncate();

        // Clear scores
        $deleted['scores'] = \Illuminate\Support\Facades\DB::table('scores')->count();
        \Illuminate\Support\Facades\DB::table('scores')->truncate();

        // Clear announcements
        $deleted['announcements'] = \Illuminate\Support\Facades\DB::table('announcements')->count();
        \Illuminate\Support\Facades\DB::table('announcements')->truncate();

        // Reset is_published and is_finalized on competitions
        \Illuminate\Support\Facades\DB::table('competitions')->update([
            'is_published' => false,
            'is_finalized' => false
        ]);

        \Illuminate\Support\Facades\DB::statement('SET FOREIGN_KEY_CHECKS=1');

        return response()->json([
            'success' => true,
            'message' => 'Test data cleared successfully',
            'deleted' => $deleted
        ]);
    });

    // File uploads
    Route::post('upload', function(Request $request) {
        if ($request->hasFile('file')) {
            $file = $request->file('file');
            $path = $file->store('uploads', 'public');
            return response()->json([
                'success' => true,
                'url' => asset('storage/' . $path),
                'path' => $path
            ]);
        }
        
        return response()->json([
            'success' => false,
            'message' => 'No file uploaded'
        ], 400);
    });
});

// Catch all for 404
Route::fallback(function () {
    return response()->json([
        'success' => false,
        'message' => 'API endpoint not found'
    ], 404);
});