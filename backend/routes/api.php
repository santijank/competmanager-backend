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
});

// Public announcements (no auth required)
Route::get('announcements/public', [AnnouncementController::class, 'publicIndex']);

// Public schedules (no auth required)
Route::get('schedules/public', [\App\Http\Controllers\Api\CompetitionScheduleController::class, 'getPublishedSchedules']);

// Public results (no auth required)
Route::get('results/public', [\App\Http\Controllers\Api\ScoreController::class, 'getPublishedResults']);

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
    
    // Competitions (protected routes)
    Route::apiResource('competitions', CompetitionController::class);
    Route::post('competitions/bulk-create', [CompetitionController::class, 'bulkCreate']);
    Route::post('competitions/bulk-update-excluded-groups', [CompetitionController::class, 'bulkUpdateExcludedGroups']);
    Route::get('competitions/school-group/{schoolGroupId}', [CompetitionController::class, 'getCompetitionsForSchoolGroup']);
    Route::get('competitions/{id}/registrations', [CompetitionController::class, 'getRegistrations']);
    Route::get('competitions/{id}/results', [CompetitionController::class, 'getResults']);
    Route::post('competitions/{id}/advance-winners', [CompetitionController::class, 'advanceWinners']);
    
    // Registrations
    Route::get('registrations/statistics', [RegistrationController::class, 'statistics']);
    Route::get('registrations/district-competitions', [RegistrationController::class, 'districtCompetitions']);
    Route::get('registrations/group-overview', [RegistrationController::class, 'groupOverview']);
    Route::get('registrations/status', [RegistrationController::class, 'status']);
    Route::get('registrations/settings', [RegistrationController::class, 'getSettings']);
    Route::put('registrations/settings', [RegistrationController::class, 'updateSettings']);
    Route::post('registrations/district-bulk-update', [RegistrationController::class, 'bulkUpdateDistrictRegistration']);
    Route::get('registrations/reset-preview', [RegistrationController::class, 'resetPreview']);
    Route::post('registrations/reset', [RegistrationController::class, 'reset']);
    Route::post('registrations/bulk-approve', [RegistrationController::class, 'bulkApprove']);
    Route::apiResource('registrations', RegistrationController::class);
    Route::post('registrations/{id}/approve', [RegistrationController::class, 'approve']);
    Route::post('registrations/{id}/reject', [RegistrationController::class, 'reject']);

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
    Route::get('committee-members/signin-pdf/{competitionId}', [\App\Http\Controllers\Api\CommitteeMemberController::class, 'generateSignInPdf']);
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

    // Documents - PDF Generation
    Route::prefix('documents')->group(function () {
        Route::get('competitions/{competition}/student-checkin', [\App\Http\Controllers\Admin\DocumentController::class, 'generateStudentCheckin']);
        Route::get('competitions/{competition}/teacher-checkin', [\App\Http\Controllers\Admin\DocumentController::class, 'generateTeacherCheckin']);
        Route::get('competitions/{competition}/committee-checkin', [\App\Http\Controllers\Admin\DocumentController::class, 'generateCommitteeCheckin']);
        Route::get('competitions/{competition}/score-sheet', [\App\Http\Controllers\Admin\DocumentController::class, 'generateScoreSheet']);
        Route::get('competitions/{competition}/cover-sheet', [\App\Http\Controllers\Admin\DocumentController::class, 'generateCoverSheet']);
        Route::get('competitions/{competition}/summary', [\App\Http\Controllers\Admin\DocumentController::class, 'generateSummary']);
        Route::get('school-registrations', [\App\Http\Controllers\Admin\DocumentController::class, 'generateSchoolRegistrations']);
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