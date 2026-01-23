<?php

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
});


// ⭐ วาง specific routes ก่อน generic routes
Route::get('/competitions/statistics', [CompetitionController::class, 'statistics']);
Route::get('/competitions', [CompetitionController::class, 'index']);
Route::get('/competitions/{id}', [CompetitionController::class, 'show'])->where('id', '[0-9]+');

// ============================================
// 🔒 Protected Routes (ต้อง Auth)
// ============================================
Route::middleware('auth:sanctum')->group(function () {
    
    // Auth
    Route::get('/auth/user', [AuthController::class, 'user']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);

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

     // Admin Routes (ต้อง Auth)
     Route::middleware('auth:sanctum')->group(function () {
    Route::post('/admin/update-group-statistics', [PublicApiController::class, 'updateAllGroupStatistics']);
   });



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
        Route::get('/competitions/{competition}/registrations/export/pdf', 
            [RegistrationExportController::class, 'exportPdf']);
        
        Route::get('/competitions/{competition}/registrations/export/excel', 
            [RegistrationExportController::class, 'exportExcel']);
        
        Route::get('/competitions/{competition}/registrations/export/summary', 
            [RegistrationExportController::class, 'exportSummary']);
        
        Route::get('/competitions/{competition}/registrations/{registration}/export/certificate', 
            [RegistrationExportController::class, 'exportCertificate']);
    });

    // ============================================
    // 🎯 Score Management (ระบบใส่คะแนน)
    // ============================================
    
    // ดูรายการการแข่งขันที่สามารถใส่คะแนนได้
    Route::get('/scores/competitions', [ScoreController::class, 'getCompetitionsForScoring']);
    
    // ดูคะแนนและสถิติ (ทุกคนที่ login)
    Route::get('/competitions/{id}/scores', [ScoreController::class, 'getScores'])->where('id', '[0-9]+');
    Route::get('/competitions/{id}/score-statistics', [ScoreController::class, 'getStatistics'])->where('id', '[0-9]+');
    
    // ใส่คะแนนและจัดการ (Group Admin, District Admin only)
    Route::middleware('role:admin,district_admin,group_admin')->group(function () {
        Route::get('/competitions/{id}/scorable', [CompetitionController::class, 'getScorableRegistrations'])->where('id', '[0-9]+');
        Route::post('/competitions/{id}/scores', [ScoreController::class, 'saveScores'])->where('id', '[0-9]+');
        Route::post('/competitions/{id}/finalize', [ScoreController::class, 'finalize'])->where('id', '[0-9]+');
        
        Route::post('/scores', [ScoreController::class, 'storeScore']);
        Route::post('/scores/bulk', [ScoreController::class, 'bulkStoreScores']);
        Route::post('/scores/competitions/{competition}/finalize', [ScoreController::class, 'finalizeScores']);
        Route::get('/scores/competitions/{competition}/scores', [ScoreController::class, 'getCompetitionScores']);
    });

    // ============================================
    // 📊 Score Export Routes
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
    Route::middleware('role:admin')->group(function () {
        Route::post('/schools', [SchoolController::class, 'store']);
        Route::put('/schools/{id}', [SchoolController::class, 'update']);
        Route::delete('/schools/{id}', [SchoolController::class, 'destroy']);
    });

    // ============================================
    // 🏆 Competitions
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
    
});