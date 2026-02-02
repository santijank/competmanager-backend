<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\SchoolGroupController;
use App\Http\Controllers\Api\SchoolController;
use App\Http\Controllers\Api\CompetitionController;
use App\Http\Controllers\Api\RegistrationController;
use App\Http\Controllers\Api\RegistrationSettingsController;  
use App\Http\Controllers\Api\RegistrationExportController;
use App\Http\Controllers\Api\ScoreExportController;
use App\Http\Controllers\Api\ResultController;
use App\Http\Controllers\Api\CertificateController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\TwoTierCompetitionController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\ScoreController;
use App\Http\Controllers\Api\JudgeController;
use App\Http\Controllers\Api\PublicApiController;
use App\Http\Controllers\Admin\DocumentController;
use App\Http\Controllers\Api\CommitteeMemberController;
use App\Http\Controllers\Api\AnnouncementController;
use App\Http\Controllers\Api\PublicResultController;

// ============================================
// ✅ Public Routes (ไม่ต้อง Auth)
// ============================================
Route::post('/auth/login', [AuthController::class, 'login']);

// ✅ Public API สำหรับดูข้อมูล (ไม่ต้อง login)
Route::get('/categories', [CategoryController::class, 'index']);
Route::get('/categories/{id}', [CategoryController::class, 'show']);
Route::get('/school-groups', [SchoolGroupController::class, 'index']);
Route::get('/schools', [SchoolController::class, 'index']);

// Public Routes (ไม่ต้อง Auth)
Route::prefix('public')->group(function () {
    Route::get('/groups', [PublicApiController::class, 'getGroups']);
    Route::get('/groups/{id}', [PublicApiController::class, 'getGroupDetail']);
    Route::get('/groups/{id}/results', [PublicApiController::class, 'getGroupResults']);
    
    // ✅ Public Dashboard (ไม่ต้อง login)
    Route::get('/dashboard/overview', [DashboardController::class, 'publicOverview']);
    Route::get('/dashboard/groups', [DashboardController::class, 'publicAllGroups']);
    
    // 📢 Public Results (ผลการแข่งขันสาธารณะ)
    Route::get('/results', [PublicResultController::class, 'index']);
    Route::get('/results/{id}', [PublicResultController::class, 'show'])->where('id', '[0-9]+');
    Route::get('/results/statistics', [PublicResultController::class, 'statistics']);
});

// ============================================
// 📢 Public Announcements (ไม่ต้อง Auth)
// ============================================
Route::get('/announcements', [AnnouncementController::class, 'index']);
Route::get('/announcements/{id}', [AnnouncementController::class, 'show'])->where('id', '[0-9]+');

// ⭐ เฉพาะ statistics เป็น public route
Route::get('/competitions/statistics', [CompetitionController::class, 'statistics']);

// ============================================
// 🔒 Protected Routes (ต้อง Auth)
// ============================================
Route::middleware('auth:sanctum')->group(function () {
    
    // Auth
    Route::get('/auth/user', [AuthController::class, 'user']);
    Route::get('/auth/me', function (Request $request) {
        return response()->json($request->user()->load('schoolGroup'));
    });
    Route::post('/auth/logout', [AuthController::class, 'logout']);

    // ============================================
    // 🏆 Competitions (ย้ายมาใน protected section)
    // ============================================
    Route::get('/competitions', [CompetitionController::class, 'index']);
    Route::get('/competitions/{id}', [CompetitionController::class, 'show'])->where('id', '[0-9]+');

    // ============================================
    // 📊 Dashboard Stats
    // ============================================
    Route::get('/dashboard/stats', [DashboardController::class, 'stats']);
    Route::get('/dashboard/group-admin', [DashboardController::class, 'groupAdminStats']);
    Route::get('/dashboard/school-admin', [DashboardController::class, 'schoolAdminStats']);
    Route::get('/dashboard/district-admin', [DashboardController::class, 'districtAdminStats']);

    // ============================================
    // ⭐ Two-Tier Competition System
    // ============================================
    
    // District Admin Routes (Admin ใหญ่ - ระดับเขต)
    Route::prefix('competitions/two-tier')->group(function () {
        Route::post('/master', [TwoTierCompetitionController::class, 'createMaster']);
        Route::post('/{id}/activate-all-groups', [TwoTierCompetitionController::class, 'activateForAllGroups'])->where('id', '[0-9]+');
        Route::get('/{id}/overview', [TwoTierCompetitionController::class, 'getMasterOverview'])->where('id', '[0-9]+');
    });
    
    // Group Admin Routes (Admin กลุ่ม - ระดับกลุ่ม)
    Route::prefix('competitions/group')->group(function () {
        Route::get('/', [TwoTierCompetitionController::class, 'getGroupCompetitions']);
        Route::post('/bulk-open-registration', [TwoTierCompetitionController::class, 'bulkOpenRegistration']);
        Route::put('/{id}/schedule', [TwoTierCompetitionController::class, 'updateGroupSchedule'])->where('id', '[0-9]+');
        Route::post('/{id}/open-registration', [TwoTierCompetitionController::class, 'openRegistration'])->where('id', '[0-9]+');
        Route::post('/{id}/close-registration', [TwoTierCompetitionController::class, 'closeRegistration'])->where('id', '[0-9]+');
        Route::post('/{id}/submit-to-district', [TwoTierCompetitionController::class, 'submitToDistrict'])->where('id', '[0-9]+');
    });

    // ✅ แก้ไข - ลบ middleware ซ้อนออก
    Route::post('/admin/update-group-statistics', [PublicApiController::class, 'updateAllGroupStatistics']);

    // ============================================
    // 📝 Registrations Routes
    // ============================================
    Route::prefix('registrations')->group(function () {
        // ดูรายการและสถิติ (ทุกคนที่ login)
        Route::get('/', [RegistrationController::class, 'index']);
        Route::get('/statistics', [RegistrationController::class, 'statistics']);
        Route::get('/{id}', [RegistrationController::class, 'show'])->where('id', '[0-9]+');
        
        Route::get('/settings', [RegistrationSettingsController::class, 'index'])
            ->middleware('role:group_admin');
        Route::put('/settings', [RegistrationSettingsController::class, 'update'])
            ->middleware('role:group_admin');
        Route::get('/status', [RegistrationSettingsController::class, 'status']);
        
        // ลงทะเบียน, แก้ไข, ยกเลิก (Teacher, School Admin, Group Admin, District Admin)
        Route::middleware('role:admin,group_admin,school_admin,district_admin,teacher')->group(function () {
            Route::post('/', [RegistrationController::class, 'store']);
            Route::put('/{id}', [RegistrationController::class, 'update'])->where('id', '[0-9]+');
            Route::delete('/{id}', [RegistrationController::class, 'destroy'])->where('id', '[0-9]+');
        });
        
        // อนุมัติ/ปฏิเสธ (Group Admin, District Admin, Admin only)
        Route::middleware('role:admin,district_admin,group_admin')->group(function () {
            Route::post('/{id}/approve', [RegistrationController::class, 'approve'])->where('id', '[0-9]+');
            Route::post('/{id}/reject', [RegistrationController::class, 'reject'])->where('id', '[0-9]+');
            Route::post('/bulk-approve', [RegistrationController::class, 'bulkApprove']);
        });
    });

    // ============================================
    // 📄 Registration Export Routes
    // ============================================
    Route::middleware('role:admin,district_admin,group_admin')->group(function () {
        
        // ✅ Export Registration (ส่งออกรายการลงทะเบียน)
        Route::get('/registrations/competitions/{competition}/export/pdf', 
            [RegistrationExportController::class, 'exportPdf']);
            
        Route::get('/registrations/competitions/{competition}/export/excel', 
            [RegistrationExportController::class, 'exportExcel']);
            
        Route::get('/registrations/competitions/{competition}/export/labels', 
            [RegistrationExportController::class, 'exportLabels']);
        
        Route::get('/registrations/competitions/{competition}/export/statistics',
            [RegistrationExportController::class, 'exportStatistics']);
    });

    // ============================================
    // 📊 Score Management (ระบบจัดการคะแนน)
    // ============================================
    
    // View scores (ดูคะแนน) - ทุก role ที่ login
    Route::get('/scores', [ScoreController::class, 'index']);
    Route::get('/scores/{id}', [ScoreController::class, 'show']);
    
    // Fetch registrations for scoring - เฉพาะ judge, committee, group_admin, district_admin
    Route::get('/competitions/{id}/scorable-registrations', [CompetitionController::class, 'getScorableRegistrations'])
        ->middleware('role:judge,committee,admin,district_admin,group_admin');
    
    // Manage scores (จัดการคะแนน) - เฉพาะ judge, committee, group_admin, district_admin
    Route::middleware('role:judge,committee,admin,district_admin,group_admin')->group(function () {
        Route::post('/scores', [ScoreController::class, 'store']);
        Route::put('/scores/{id}', [ScoreController::class, 'update']);
        Route::delete('/scores/{id}', [ScoreController::class, 'destroy']);
        
        // Bulk scoring operations
        Route::post('/scores/bulk-update', [ScoreController::class, 'bulkUpdate']);
        Route::post('/competitions/{competition}/scores/auto-rank', [ScoreController::class, 'autoRank']);
        Route::post('/competitions/{competition}/publish-results', [CompetitionController::class, 'publish']);
        Route::post('/competitions/{competition}/unpublish-results', [CompetitionController::class, 'unpublish']);
    });

    // ============================================
    // 📊 Score Export Routes (ส่งออกคะแนน)
    // ============================================
    Route::middleware('role:admin,district_admin,group_admin')->group(function () {
        
        Route::get('/competitions/{competition}/scores/export/pdf', 
            [ScoreExportController::class, 'exportPdf']);
        
        Route::get('/competitions/{competition}/scores/export/excel', 
            [ScoreExportController::class, 'exportExcel']);
        
        Route::get('/competitions/{competition}/scores/export/blank-sheet', 
            [ScoreExportController::class, 'exportBlankSheet']);
        
        Route::get('/competitions/{competition}/scores/export/leaderboard', 
            [ScoreExportController::class, 'exportLeaderboard']);
    });

    // ============================================
    // 👥 Judge Management (ระบบกรรมการตัดสิน)
    // ============================================
    
    // ดูรายชื่อกรรมการ (ทุกคนที่ login)
    Route::get('/competitions/{competition}/judges', [JudgeController::class, 'index']);
    
    // จัดการกรรมการ (Group Admin, District Admin only)
    Route::middleware('role:admin,district_admin,group_admin')->group(function () {
        Route::post('/competitions/{competition}/judges', [JudgeController::class, 'store']);
        Route::put('/competitions/{competition}/judges/{judge}', [JudgeController::class, 'update']);
        Route::delete('/competitions/{competition}/judges/{judge}', [JudgeController::class, 'destroy']);
    });

    // ============================================
    // 📂 Categories
    // ============================================
    Route::get('/categories/{id}/templates', [CategoryController::class, 'getTemplates']);
    
    Route::middleware('role:admin,committee,district_admin')->group(function () {
        Route::post('/categories', [CategoryController::class, 'store']);
        Route::put('/categories/{id}', [CategoryController::class, 'update']);
        Route::delete('/categories/{id}', [CategoryController::class, 'destroy']);
    });

    // ============================================
    // 🏫 School Groups
    // ============================================
    Route::middleware('role:admin')->group(function () {
        Route::post('/school-groups', [SchoolGroupController::class, 'store']);
        Route::put('/school-groups/{id}', [SchoolGroupController::class, 'update']);
        Route::delete('/school-groups/{id}', [SchoolGroupController::class, 'destroy']);
    });

    // ============================================
    // 🏫 Schools
    // ============================================
    Route::middleware('role:admin,district_admin')->group(function () {
        Route::post('/schools', [SchoolController::class, 'store']);
        Route::put('/schools/{id}', [SchoolController::class, 'update']);
        Route::delete('/schools/{id}', [SchoolController::class, 'destroy']);
    });

    // ============================================
    // 🏆 Competitions Management
    // ============================================
    Route::middleware('role:admin,committee,district_admin')->group(function () {
        Route::post('/competitions', [CompetitionController::class, 'store']);
        Route::post('/competitions/bulk', [CompetitionController::class, 'bulkStore']);
        Route::post('/competitions/bulk-create', [CompetitionController::class, 'bulkCreate']);
        Route::put('/competitions/{id}', [CompetitionController::class, 'update'])->where('id', '[0-9]+');
    });
    
    Route::middleware('role:admin')->group(function () {
        Route::delete('/competitions/{id}', [CompetitionController::class, 'destroy'])->where('id', '[0-9]+');
    });

    // ============================================
    // 🏅 Results
    // ============================================
    Route::get('/results', [ResultController::class, 'index']);
    Route::get('/results/competitions/{competitionId}/leaderboard', [ResultController::class, 'leaderboard']);
    Route::get('/results/{id}', [ResultController::class, 'show']);
    
    Route::middleware('role:admin,committee,district_admin')->group(function () {
        Route::post('/results', [ResultController::class, 'store']);
        Route::put('/results/{id}', [ResultController::class, 'update']);
        Route::delete('/results/{id}', [ResultController::class, 'destroy']);
        Route::post('/results/competitions/{competitionId}/calculate-ranks', [ResultController::class, 'calculateRanks']);
        Route::post('/results/competitions/{competitionId}/assign-medals', [ResultController::class, 'assignMedals']);
    });

    // ============================================
    // 🎓 Certificates
    // ============================================
    Route::get('/certificates', [CertificateController::class, 'index']);
    Route::get('/certificates/{id}/download', [CertificateController::class, 'download']);
    Route::get('/certificates/{id}', [CertificateController::class, 'show']);
    
    Route::middleware('role:admin,committee,district_admin')->group(function () {
        Route::post('/certificates/results/{resultId}/generate', [CertificateController::class, 'generate']);
        Route::post('/certificates/competitions/{competitionId}/bulk-generate', [CertificateController::class, 'bulkGenerate']);
        Route::post('/certificates/{id}/generate-pdf', [CertificateController::class, 'generatePdf']);
    });

    // ============================================
    // 👥 User Management (Admin + District Admin)
    // ============================================
    Route::middleware('role:admin,district_admin')->group(function () {
        Route::get('/users', [UserController::class, 'index']);
        Route::get('/users/generate-password', [UserController::class, 'generatePassword']);
        Route::post('/users', [UserController::class, 'store']);
        Route::post('/users/bulk-reset-password', [UserController::class, 'bulkResetPassword']);
        Route::put('/users/{id}', [UserController::class, 'update']);
        Route::delete('/users/{id}', [UserController::class, 'destroy']);
        Route::post('/users/{id}/reset-password', [UserController::class, 'resetPassword']);
    });

    // ============================================
    // 👥 Committee Members (Admin + District Admin + Group Admin)
    // ============================================
    Route::prefix('committee-members')->middleware('role:admin,district_admin,group_admin')->group(function () {
        Route::get('/', [CommitteeMemberController::class, 'index']);
        Route::get('/statistics', [CommitteeMemberController::class, 'statistics']);
        Route::post('/', [CommitteeMemberController::class, 'store']);
        Route::get('/{id}', [CommitteeMemberController::class, 'show'])->where('id', '[0-9]+');
        Route::put('/{id}', [CommitteeMemberController::class, 'update'])->where('id', '[0-9]+');
        Route::delete('/{id}', [CommitteeMemberController::class, 'destroy'])->where('id', '[0-9]+');
    });

    // ============================================
    // 📢 Announcements Management (Protected)
    // ============================================
    Route::middleware('role:admin,district_admin,group_admin')->group(function () {
        Route::post('/announcements', [AnnouncementController::class, 'store']);
        Route::put('/announcements/{id}', [AnnouncementController::class, 'update'])->where('id', '[0-9]+');
        Route::delete('/announcements/{id}', [AnnouncementController::class, 'destroy'])->where('id', '[0-9]+');
        Route::post('/announcements/{id}/toggle-pin', [AnnouncementController::class, 'togglePin'])->where('id', '[0-9]+');
        
        // จัดการไฟล์แนบ
        Route::delete('/announcements/{announcementId}/files/{fileId}', [AnnouncementController::class, 'deleteFile'])
            ->where(['announcementId' => '[0-9]+', 'fileId' => '[0-9]+']);
    });
    
    // ดาวน์โหลดไฟล์ (ทุกคนที่ login)
    Route::get('/announcements/{announcementId}/files/{fileId}/download', [AnnouncementController::class, 'downloadFile'])
        ->where(['announcementId' => '[0-9]+', 'fileId' => '[0-9]+']);
    
});