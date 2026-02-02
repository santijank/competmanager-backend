<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Competition;
use App\Models\SchoolGroup;
use App\Models\Registration;
use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

/**
 * 🎯 Two-Tier Competition Controller
 * 
 * จัดการระบบการแข่งขัน 2 ระดับ:
 * 1. Group Level (Group Admin)
 * 2. District Level (District Admin)
 */
class TwoTierCompetitionController extends Controller
{
    // ============================================
    // GROUP ADMIN METHODS
    // ============================================

    /**
     * ✅ GET /api/competitions/group
     * ดูรายการแข่งขันของกลุ่มตัวเอง
     */
    public function getGroupCompetitions(Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            
            // ตรวจสอบ permission
            if (!in_array($user->role, ['group_admin', 'admin'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'คุณไม่มีสิทธิ์เข้าถึงข้อมูลนี้',
                ], 403);
            }

            // ถ้าเป็น group_admin ให้ดูเฉพาะกลุ่มตัวเอง
            $schoolGroupId = $user->role === 'group_admin' 
                ? $user->school_group_id 
                : $request->input('school_group_id');

            if (!$schoolGroupId) {
                return response()->json([
                    'success' => false,
                    'message' => 'ไม่พบข้อมูลกลุ่มโรงเรียน',
                ], 400);
            }

            // ✅ Query competitions (ใช้ competition_level ที่เป็น enum)
            $query = Competition::with(['category', 'schoolGroup'])
                ->where('school_group_id', $schoolGroupId)
                ->where('competition_level', 'group');  // ✅ ใช้ competition_level

            // Filters - ใช้ filled() แทน has() เพื่อป้องกัน null values
            if ($request->filled('status')) {
                $query->where('status', $request->status);
            }

            if ($request->filled('registration_status')) {
                $query->where('registration_status', $request->registration_status);
            }

            if ($request->filled('category_id')) {
                $query->where('category_id', $request->category_id);
            }

            // Search
            if ($request->filled('search')) {
                $search = $request->search;
                $query->where(function($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                      ->orWhere('code', 'like', "%{$search}%");
                });
            }

            // Sort
            $sortBy = $request->input('sort_by', 'created_at');
            $sortOrder = $request->input('sort_order', 'desc');
            $query->orderBy($sortBy, $sortOrder);

            // Paginate or get all
            if ($request->input('paginate', true)) {
                $perPage = $request->input('per_page', 20);
                $competitions = $query->paginate($perPage);
            } else {
                $competitions = $query->get();
            }

            // Statistics
            $stats = $this->getGroupStatistics($schoolGroupId);

            return response()->json([
                'success' => true,
                'data' => $competitions,
                'statistics' => $stats,
            ]);

        } catch (\Exception $e) {
            Log::error('Get group competitions error: ' . $e->getMessage());
            Log::error('Stack trace: ' . $e->getTraceAsString());
            return response()->json([
                'success' => false,
                'message' => 'เกิดข้อผิดพลาด',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * ✅ GET /api/competitions/group/statistics
     * สถิติของกลุ่ม
     */
    public function getGroupStatistics($schoolGroupId)
    {
        // ✅ Base query ที่ถูกต้อง
        $baseQuery = Competition::where('school_group_id', $schoolGroupId)
            ->where('competition_level', 'group');  // ✅ ใช้ competition_level

        return [
            'total' => (clone $baseQuery)->count(),
            'draft' => (clone $baseQuery)->where('status', 'draft')->count(),
            'active' => (clone $baseQuery)->where('status', 'active')->count(),
            'closed' => (clone $baseQuery)->where('status', 'closed')->count(),
            'not_scheduled' => (clone $baseQuery)
                ->whereNull('competition_date')
                ->count(),
            'registration_open' => (clone $baseQuery)
                ->where('registration_status', 'open')
                ->count(),
            'registration_upcoming' => (clone $baseQuery)
                ->where('registration_status', 'upcoming')
                ->count(),
            'registration_closed' => (clone $baseQuery)
                ->where('registration_status', 'closed')
                ->count(),
            'total_registrations' => Registration::whereIn(
                'competition_id',
                (clone $baseQuery)->pluck('id')
            )->count(),
        ];
    }

    /**
     * ✅ PUT /api/competitions/group/{id}/schedule
     * กำหนดวัน/เวลา/สถานที่แข่งขัน
     */
    public function updateGroupSchedule(Request $request, $id): JsonResponse
    {
        try {
            $user = $request->user();
            $competition = Competition::findOrFail($id);

            // ตรวจสอบ permission
            if ($user->role === 'group_admin' && $user->school_group_id !== $competition->school_group_id) {
                return response()->json([
                    'success' => false,
                    'message' => 'คุณไม่มีสิทธิ์แก้ไขการแข่งขันนี้',
                ], 403);
            }

            // Validation
            $validated = $request->validate([
                'competition_date' => 'required|date|after:today',
                'competition_start_time' => 'required|date_format:H:i',
                'competition_end_time' => 'required|date_format:H:i|after:competition_start_time',
                'venue' => 'nullable|string|max:255',
                'registration_start_date' => 'nullable|date',
                'registration_end_date' => 'nullable|date|after:registration_start_date',
            ]);

            DB::beginTransaction();
            try {
                // Update schedule
                $competition->update([
                    'competition_date' => $validated['competition_date'],
                    'competition_start_time' => $validated['competition_start_time'],
                    'competition_end_time' => $validated['competition_end_time'],
                    'venue' => $validated['venue'] ?? null,
                    'registration_start_date' => $validated['registration_start_date'] ?? null,
                    'registration_end_date' => $validated['registration_end_date'] ?? null,
                    'status' => 'active', // เปลี่ยนจาก draft เป็น active
                ]);

                DB::commit();

                return response()->json([
                    'success' => true,
                    'message' => 'กำหนดวันแข่งขันสำเร็จ',
                    'data' => $competition->fresh()->load(['category', 'schoolGroup']),
                ]);

            } catch (\Exception $e) {
                DB::rollBack();
                throw $e;
            }

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'ข้อมูลไม่ถูกต้อง',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            Log::error('Update schedule error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'เกิดข้อผิดพลาด',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * ✅ POST /api/competitions/group/{id}/open-registration
     * เปิดรับสมัคร
     */
    public function openRegistration(Request $request, $id): JsonResponse
    {
        try {
            $user = $request->user();
            $competition = Competition::findOrFail($id);

            // ตรวจสอบ permission
            if ($user->role === 'group_admin' && $user->school_group_id !== $competition->school_group_id) {
                return response()->json([
                    'success' => false,
                    'message' => 'คุณไม่มีสิทธิ์เปิดรับสมัครการแข่งขันนี้',
                ], 403);
            }

            // ตรวจสอบว่ากำหนดวันแข่งขันแล้วหรือยัง
            if (!$competition->competition_date) {
                return response()->json([
                    'success' => false,
                    'message' => 'กรุณากำหนดวันแข่งขันก่อนเปิดรับสมัคร',
                ], 400);
            }

            DB::beginTransaction();
            try {
                // อัพเดทสถานะ
                $competition->update([
                    'registration_status' => 'open',
                    'status' => 'active',
                ]);

                // ถ้ายังไม่มีวันรับสมัคร ให้ตั้งเป็นวันนี้ - 3 วันก่อนแข่ง
                if (!$competition->registration_start_date) {
                    $competition->update([
                        'registration_start_date' => now(),
                        'registration_end_date' => Carbon::parse($competition->competition_date)->subDays(3),
                    ]);
                }

                DB::commit();

                return response()->json([
                    'success' => true,
                    'message' => 'เปิดรับสมัครสำเร็จ',
                    'data' => $competition->fresh()->load(['category', 'schoolGroup']),
                ]);

            } catch (\Exception $e) {
                DB::rollBack();
                throw $e;
            }

        } catch (\Exception $e) {
            Log::error('Open registration error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'เกิดข้อผิดพลาด',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * ✅ POST /api/competitions/group/{id}/close-registration
     * ปิดรับสมัคร
     */
    public function closeRegistration(Request $request, $id): JsonResponse
    {
        try {
            $user = $request->user();
            $competition = Competition::findOrFail($id);

            // ตรวจสอบ permission
            if ($user->role === 'group_admin' && $user->school_group_id !== $competition->school_group_id) {
                return response()->json([
                    'success' => false,
                    'message' => 'คุณไม่มีสิทธิ์ปิดรับสมัครการแข่งขันนี้',
                ], 403);
            }

            $competition->update([
                'registration_status' => 'closed',
            ]);

            return response()->json([
                'success' => true,
                'message' => 'ปิดรับสมัครสำเร็จ',
                'data' => $competition->fresh()->load(['category', 'schoolGroup']),
            ]);

        } catch (\Exception $e) {
            Log::error('Close registration error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'เกิดข้อผิดพลาด',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * ⭐ POST /api/competitions/group/bulk-open-registration
     * เปิดรับสมัครแบบ Bulk (ทั้งหมดหรือตามหมวดหมู่)
     */
    public function bulkOpenRegistration(Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            
            // ตรวจสอบ permission
            if (!in_array($user->role, ['group_admin', 'admin'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'คุณไม่มีสิทธิ์ใช้งานฟีเจอร์นี้',
                ], 403);
            }

            // Validation
            $validated = $request->validate([
                'registration_start_date' => 'required|date',
                'registration_end_date' => 'required|date|after:registration_start_date',
                'category_id' => 'nullable|exists:categories,id',
            ]);

            // ถ้าเป็น group_admin ให้ดูเฉพาะกลุ่มตัวเอง
            $schoolGroupId = $user->role === 'group_admin' 
                ? $user->school_group_id 
                : $request->input('school_group_id');

            if (!$schoolGroupId) {
                return response()->json([
                    'success' => false,
                    'message' => 'ไม่พบข้อมูลกลุ่มโรงเรียน',
                ], 400);
            }

            DB::beginTransaction();
            try {
                // Query competitions - ✅ ใช้ competition_level
                $query = Competition::where('school_group_id', $schoolGroupId)
                    ->where('competition_level', 'group')  // ✅ ใช้ competition_level
                    ->where('is_active', true)
                    ->where('registration_status', '!=', 'closed'); // ไม่เปิดที่ปิดไปแล้ว

                // ถ้าระบุหมวดหมู่
                if ($request->filled('category_id')) {
                    $query->where('category_id', $request->category_id);
                }

                $competitions = $query->get();

                if ($competitions->isEmpty()) {
                    DB::rollBack();
                    return response()->json([
                        'success' => false,
                        'message' => 'ไม่พบรายการแข่งขันที่สามารถเปิดรับสมัครได้',
                    ], 400);
                }

                // Update ทุกรายการ
                $updated = 0;
                foreach ($competitions as $competition) {
                    $competition->update([
                        'registration_status' => 'open',
                        'registration_start_date' => $validated['registration_start_date'],
                        'registration_end_date' => $validated['registration_end_date'],
                        'status' => 'active',
                    ]);
                    $updated++;
                }

                DB::commit();

                $categoryName = $request->filled('category_id') 
                    ? Category::find($request->category_id)->name 
                    : 'ทั้งหมด';

                return response()->json([
                    'success' => true,
                    'message' => "เปิดรับสมัครสำเร็จ {$updated} รายการ (หมวด: {$categoryName})",
                    'data' => [
                        'updated_count' => $updated,
                        'category' => $categoryName,
                        'registration_start_date' => $validated['registration_start_date'],
                        'registration_end_date' => $validated['registration_end_date'],
                    ],
                ]);

            } catch (\Exception $e) {
                DB::rollBack();
                throw $e;
            }

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'ข้อมูลไม่ถูกต้อง',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            Log::error('Bulk open registration error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'เกิดข้อผิดพลาด',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * ✅ POST /api/competitions/group/{id}/submit-to-district
     * ส่งผู้ชนะไปยังระดับเขต
     */
    public function submitToDistrict(Request $request, $id): JsonResponse
    {
        try {
            $user = $request->user();
            $competition = Competition::findOrFail($id);

            // ตรวจสอบ permission
            if ($user->role === 'group_admin' && $user->school_group_id !== $competition->school_group_id) {
                return response()->json([
                    'success' => false,
                    'message' => 'คุณไม่มีสิทธิ์ส่งผลการแข่งขันนี้',
                ], 403);
            }

            // ตรวจสอบว่ามีผลการแข่งขันหรือยัง
            $hasResults = $competition->results()->exists();
            if (!$hasResults) {
                return response()->json([
                    'success' => false,
                    'message' => 'กรุณากรอกผลการแข่งขันก่อนส่งไปยังระดับเขต',
                ], 400);
            }

            DB::beginTransaction();
            try {
                // Get top 2 results
                $topResults = $competition->results()
                    ->orderBy('rank', 'asc')
                    ->limit(2)
                    ->get();

                // TODO: Create district level registrations for top performers

                // อัพเดทสถานะ
                $competition->update([
                    'status' => 'closed',
                ]);

                DB::commit();

                return response()->json([
                    'success' => true,
                    'message' => 'ส่งผลการแข่งขันไปยังระดับเขตสำเร็จ',
                    'data' => $competition->fresh()->load(['category', 'schoolGroup']),
                    'total_advanced' => $topResults->count(),
                ]);

            } catch (\Exception $e) {
                DB::rollBack();
                throw $e;
            }

        } catch (\Exception $e) {
            Log::error('Submit to district error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'เกิดข้อผิดพลาด',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    // ============================================
    // DISTRICT ADMIN METHODS
    // ============================================

    /**
     * ✅ POST /api/competitions/two-tier/master
     * สร้าง Master Competition (District Admin only)
     */
    public function createMaster(Request $request): JsonResponse
    {
        // TODO: Implement if needed
        return response()->json([
            'success' => false,
            'message' => 'ฟีเจอร์นี้ยังไม่พร้อมใช้งาน',
        ], 501);
    }

    /**
     * ✅ POST /api/competitions/two-tier/{id}/activate-all-groups
     * เปิดให้ทุกกลุ่มโรงเรียน (District Admin only)
     */
    public function activateForAllGroups(Request $request, $id): JsonResponse
    {
        // TODO: Implement if needed
        return response()->json([
            'success' => false,
            'message' => 'ฟีเจอร์นี้ยังไม่พร้อมใช้งาน',
        ], 501);
    }

    /**
     * ✅ GET /api/competitions/two-tier/{id}/overview
     * ดูภาพรวมของ Master Competition (District Admin only)
     */
    public function getMasterOverview(Request $request, $id): JsonResponse
    {
        // TODO: Implement if needed
        return response()->json([
            'success' => false,
            'message' => 'ฟีเจอร์นี้ยังไม่พร้อมใช้งาน',
        ], 501);
    }
}