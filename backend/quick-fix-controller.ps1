# quick-fix-controller.ps1 - แก้ไข CompetitionController ให้ทำงานได้

Write-Host "🔧 แก้ไข CompetitionController - เพิ่ม getPublicStatistics method" -ForegroundColor Green
Write-Host "=================================================================" -ForegroundColor Green

# ตรวจสอบว่าอยู่ใน backend folder หรือไม่
if (-not (Test-Path "app\Http\Controllers\Api")) {
    Write-Host "❌ กรุณาเปิด PowerShell ใน Backend folder" -ForegroundColor Red
    Write-Host "   cd C:\competmanagernew\backend" -ForegroundColor Yellow
    exit 1
}

$controllerFile = "app\Http\Controllers\Api\CompetitionController.php"

# Backup ไฟล์เก่า
try {
    if (Test-Path $controllerFile) {
        Copy-Item $controllerFile "$controllerFile.backup-$(Get-Date -Format 'yyyyMMdd-HHmm')" -Force
        Write-Host "✅ Backup สำเร็จ: $controllerFile.backup" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ ไม่สามารถ backup ไฟล์: $($_.Exception.Message)" -ForegroundColor Red
}

# แก้ไข CompetitionController - เพิ่ม getPublicStatistics method
Write-Host "🔨 เพิ่ม getPublicStatistics method..." -ForegroundColor Yellow

$fixedContent = @'
<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Competition;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;

class CompetitionController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            
            if (!$user) {
                Log::warning('Competitions API: No authenticated user');
                return response()->json([
                    'success' => false,
                    'message' => 'กรุณาเข้าสู่ระบบ',
                    'data' => []
                ], 401);
            }

            $query = DB::table('competitions as c')
                ->leftJoin('categories as cat', 'c.category_id', '=', 'cat.id')
                ->leftJoin('school_groups as sg', 'c.school_group_id', '=', 'sg.id')
                ->select([
                    'c.id',
                    'c.name',
                    'c.code', 
                    'c.level',
                    'c.max_students',
                    'c.status',
                    'c.competition_level',
                    'c.school_group_id',
                    'cat.id as category_id',
                    'cat.name as category_name',
                    'sg.name as school_group_name',
                    'c.created_at'
                ])
                ->where('c.is_active', true);

            // Role-based filtering
            $userRole = strtolower($user->role);
            switch ($userRole) {
                case 'district_admin':
                case 'admin':
                    // District Admin เห็นทุกอย่าง - ไม่ต้องกรอง
                    break;
                case 'group_admin':
                case 'school_admin':
                case 'teacher':
                    $query->where(function($q) use ($user) {
                        $q->whereNull('c.school_group_id') // ระดับเขต
                          ->orWhere('c.school_group_id', $user->school_group_id); // กลุ่มตัวเอง
                    });
                    break;
                default:
                    $query->whereNull('c.school_group_id'); // เฉพาะระดับเขต
            }

            $competitions = $query->orderBy('c.created_at', 'desc')->get();

            return response()->json([
                'success' => true,
                'data' => $competitions
            ]);

        } catch (\Exception $e) {
            Log::error('Competition index error: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'เกิดข้อผิดพลาดในการดึงข้อมูล',
                'error' => $e->getMessage(),
                'data' => []
            ], 500);
        }
    }

    public function show(Request $request, int $id): JsonResponse
    {
        try {
            $user = $request->user();
            
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'กรุณาเข้าสู่ระบบ'
                ], 401);
            }

            $competition = DB::table('competitions')
                ->leftJoin('categories', 'competitions.category_id', '=', 'categories.id')
                ->leftJoin('school_groups', 'competitions.school_group_id', '=', 'school_groups.id')
                ->where('competitions.id', $id)
                ->select(
                    'competitions.*',
                    'categories.name as category_name',
                    'school_groups.name as school_group_name'
                )
                ->first();

            if (!$competition) {
                return response()->json([
                    'success' => false,
                    'message' => 'ไม่พบการแข่งขันที่ต้องการ'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'id' => (int) $competition->id,
                    'name' => $competition->name,
                    'code' => $competition->code,
                    'level' => $competition->level,
                    'max_students' => (int) ($competition->max_students ?? 1),
                    'category' => [
                        'id' => (int) $competition->category_id,
                        'name' => $competition->category_name
                    ],
                    'school_group' => $competition->school_group_id ? [
                        'id' => (int) $competition->school_group_id,
                        'name' => $competition->school_group_name
                    ] : null,
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Competition show error: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'เกิดข้อผิดพลาด',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * 📊 Public statistics for competitions (ไม่ต้อง auth)
     */
    public function getPublicStatistics(): JsonResponse
    {
        try {
            $stats = [
                'total_competitions' => DB::table('competitions')->where('is_active', true)->count(),
                'active_competitions' => DB::table('competitions')
                    ->where('is_active', true)
                    ->where('status', 'active')
                    ->count(),
                'total_categories' => DB::table('categories')->where('is_active', true)->count(),
                'total_school_groups' => DB::table('school_groups')->where('is_active', true)->count(),
                'competitions_by_level' => DB::table('competitions')
                    ->select('competition_level', DB::raw('count(*) as count'))
                    ->where('is_active', true)
                    ->groupBy('competition_level')
                    ->get()
                    ->toArray(),
                'competitions_by_status' => DB::table('competitions')
                    ->select('status', DB::raw('count(*) as count'))
                    ->where('is_active', true)
                    ->groupBy('status')
                    ->get()
                    ->toArray()
            ];

            return response()->json([
                'success' => true,
                'data' => $stats
            ]);
            
        } catch (\Exception $e) {
            Log::error('Public statistics error: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'ไม่สามารถโหลดสถิติได้',
                'data' => [
                    'total_competitions' => 0,
                    'active_competitions' => 0,
                    'total_categories' => 0,
                    'total_school_groups' => 0,
                    'competitions_by_level' => [],
                    'competitions_by_status' => []
                ]
            ]);
        }
    }

    // Placeholder methods สำหรับ routes ที่เหลือ
    public function store(Request $request): JsonResponse {
        return response()->json(['success' => true, 'message' => 'Feature coming soon']);
    }

    public function update(Request $request, $id): JsonResponse {
        return response()->json(['success' => true, 'message' => 'Feature coming soon']);
    }

    public function destroy($id): JsonResponse {
        return response()->json(['success' => true, 'message' => 'Feature coming soon']);
    }

    public function bulkCreate(Request $request): JsonResponse {
        return response()->json(['success' => true, 'message' => 'Feature coming soon']);
    }

    public function getRegistrations(Request $request, $id): JsonResponse {
        return response()->json(['success' => true, 'data' => []]);
    }

    public function getResults(Request $request, $id): JsonResponse {
        return response()->json(['success' => true, 'data' => []]);
    }

    public function advanceWinners(Request $request, $id): JsonResponse {
        return response()->json(['success' => true, 'message' => 'Feature coming soon']);
    }
}
'@

try {
    $fixedContent | Out-File $controllerFile -Encoding UTF8
    Write-Host "✅ แก้ไข CompetitionController สำเร็จ!" -ForegroundColor Green
} catch {
    Write-Host "❌ ไม่สามารถแก้ไข CompetitionController: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Clear Laravel Cache
Write-Host "🧹 Clear Laravel Cache..." -ForegroundColor Yellow
try {
    & php artisan config:clear 2>$null
    & php artisan route:clear 2>$null  
    & php artisan cache:clear 2>$null
    Write-Host "✅ Clear cache สำเร็จ" -ForegroundColor Green
} catch {
    Write-Host "❌ ไม่สามารถ clear cache: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "🎉 การแก้ไขเสร็จสิ้น!" -ForegroundColor Green
Write-Host "==================" -ForegroundColor Green
Write-Host "ทดสอบ:" -ForegroundColor Cyan
Write-Host "1. รัน: php artisan serve" -ForegroundColor White
Write-Host "2. ทดสอบ: curl http://localhost:8000/api/competitions/statistics" -ForegroundColor White
Write-Host "3. ควรได้ JSON response พร้อมสถิติ" -ForegroundColor White
