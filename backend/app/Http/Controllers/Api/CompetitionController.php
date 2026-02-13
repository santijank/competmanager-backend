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
    /**
     * ✅ WORKING VERSION - Get competitions with STRICT role-based filtering
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'กรุณาเข้าสู่ระบบ',
                    'data' => []
                ], 401);
            }

            Log::info('🔍 Competition API Request', [
                'user_id' => $user->id,
                'user_role' => $user->role,
                'user_school_group_id' => $user->school_group_id,
                'user_name' => $user->name,
                'request_params' => $request->all()
            ]);

            // ✅ ใช้ Query Builder แทน Eloquent เพื่อหลีกเลี่ยง relationship issues
            $query = DB::table('competitions')
                ->leftJoin('categories', 'competitions.category_id', '=', 'categories.id')
                ->leftJoin('school_groups', 'competitions.school_group_id', '=', 'school_groups.id')
                ->select(
                    'competitions.*',
                    'categories.name as category_name',
                    'school_groups.name as school_group_name'
                );
            $filterApplied = 'none';

            // ✅ **STRICT FILTERING ตาม Role**
            $userRole = strtolower($user->role);

            switch ($userRole) {
                case 'district_admin':
                case 'admin':
                    // District Admin เห็นทั้งหมด
                    $filterApplied = 'District Admin - เห็นทั้งหมด';
                    break;

                case 'group_admin':
                    // Group Admin เห็นเฉพาะกลุ่มตัวเอง + กิจกรรมระดับเขตที่ข้ามระดับกลุ่ม
                    if ($user->school_group_id) {
                        $query->where(function ($q) use ($user) {
                            $q->where('competitions.school_group_id', $user->school_group_id)
                              ->orWhere(function ($q2) {
                                  $q2->where('competitions.competition_level', 'district')
                                     ->where('competitions.skip_group_level', true);
                              });
                        });
                        $filterApplied = "Group Admin - กลุ่ม {$user->school_group_id} + skip_group_level";
                    } else {
                        $query->whereNull('competitions.school_group_id');
                        $filterApplied = 'Group Admin - เฉพาะสาธารณะ';
                    }
                    break;

                case 'school_admin':
                case 'teacher':
                    // School Admin/Teacher เห็นเฉพาะกลุ่มของโรงเรียน + กิจกรรมระดับเขตที่ข้ามระดับกลุ่ม
                    $schoolGroupId = $user->school_group_id;
                    // ถ้าไม่มี school_group_id ให้ค้นหาจาก school
                    if (!$schoolGroupId && $user->school_id) {
                        $school = \App\Models\School::find($user->school_id);
                        $schoolGroupId = $school ? $school->school_group_id : null;
                    }

                    if ($schoolGroupId) {
                        // ✅ เห็นกิจกรรมของกลุ่มตัวเอง OR กิจกรรมระดับเขตที่ข้ามระดับกลุ่ม
                        $query->where(function ($q) use ($schoolGroupId) {
                            $q->where('competitions.school_group_id', $schoolGroupId)
                              ->orWhere(function ($q2) {
                                  $q2->where('competitions.competition_level', 'district')
                                     ->where('competitions.skip_group_level', true);
                              });
                        });
                        $filterApplied = "School Admin - กลุ่ม {$schoolGroupId} + skip_group_level";
                    } else {
                        $query->whereNull('competitions.school_group_id');
                        $filterApplied = 'School Admin - เฉพาะสาธารณะ';
                    }
                    break;

                default:
                    // Role อื่นๆ เห็นเฉพาะสาธารณะ
                    $query->whereNull('competitions.school_group_id');
                    $filterApplied = "Role {$userRole} - เฉพาะสาธารณะ";
                    break;
            }

            // ✅ Additional filters
            if ($request->filled('category_id') && $request->category_id !== 'all') {
                $query->where('competitions.category_id', $request->category_id);
            }

            if ($request->filled('is_active')) {
                $query->where('competitions.is_active', true);
            }

            if ($request->filled('registration_status') && $request->registration_status !== 'all') {
                $query->where('competitions.registration_status', $request->registration_status);
            }

            // ✅ Admin manual group filter (เฉพาะ District Admin/Admin)
            if ($request->filled('school_group_id') &&
                $request->school_group_id !== 'all' &&
                in_array($userRole, ['district_admin', 'admin'])) {

                $query->where('competitions.school_group_id', $request->school_group_id);
                $filterApplied .= " + Manual filter กลุ่ม {$request->school_group_id}";
            }

            // ✅ Execute query
            $totalCount = DB::table('competitions')->count();

            $perPage = $request->filled('per_page') ? (int) $request->per_page : 100;
            if ($perPage <= 0 || $perPage > 1000) $perPage = 100;

            $competitions = $query
                ->orderBy('competitions.created_at', 'desc')
                ->limit($perPage)
                ->get();

            // ✅ Format data
            $formattedData = $competitions->map(function ($comp) {
                // Parse excluded_school_groups ถ้าเป็น JSON string
                $excludedGroups = null;
                if (!empty($comp->excluded_school_groups)) {
                    $excludedGroups = is_string($comp->excluded_school_groups)
                        ? json_decode($comp->excluded_school_groups, true)
                        : $comp->excluded_school_groups;
                }

                return [
                    'id' => (int) $comp->id,
                    'name' => $comp->name,
                    'code' => $comp->code,
                    'level' => $comp->level,
                    'competition_level' => $comp->competition_level ?? 'group',
                    'max_students' => (int) ($comp->max_students ?? 1),
                    'min_students' => (int) ($comp->min_students ?? 1),
                    'max_teachers' => (int) ($comp->max_teachers ?? 1),
                    'school_group_id' => $comp->school_group_id ? (int) $comp->school_group_id : null,
                    'category' => [
                        'id' => (int) $comp->category_id,
                        'name' => $comp->category_name
                    ],
                    'school_group' => $comp->school_group_id ? [
                        'id' => (int) $comp->school_group_id,
                        'name' => $comp->school_group_name
                    ] : null,
                    'registration_status' => $comp->registration_status ?? 'upcoming',
                    'is_active' => (bool) $comp->is_active,
                    'excluded_school_groups' => $excludedGroups ?? [], // ✅ เพิ่ม excluded_school_groups
                    'exclusion_reason' => $comp->exclusion_reason ?? null, // ✅ เพิ่ม exclusion_reason
                    'skip_group_level' => (bool) ($comp->skip_group_level ?? false), // ✅ ข้ามระดับกลุ่ม
                    'created_at' => $comp->created_at,
                ];
            })->toArray();

            Log::info('✅ Competition API Success', [
                'user_role' => $user->role,
                'filter_applied' => $filterApplied,
                'total_in_db' => $totalCount,
                'filtered_count' => count($formattedData),
                'returned_items' => count($formattedData)
            ]);

            return response()->json([
                'success' => true,
                'data' => $formattedData,
                'meta' => [
                    'current_page' => 1,
                    'last_page' => 1,
                    'per_page' => 100,
                    'total' => count($formattedData),
                ],
                'debug' => [
                    'user_role' => $user->role,
                    'user_school_group_id' => $user->school_group_id,
                    'filter_applied' => $filterApplied,
                    'total_in_db' => $totalCount,
                    'filtered_count' => count($formattedData),
                    'can_view_all_groups' => in_array($userRole, ['district_admin', 'admin']),
                    'timestamp' => now()->toDateTimeString()
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('❌ Competition API Error', [
                'error_message' => $e->getMessage(),
                'error_file' => $e->getFile(),
                'error_line' => $e->getLine(),
                'user_id' => $user->id ?? null,
                'stack_trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'เกิดข้อผิดพลาดในการดึงข้อมูล',
                'error' => $e->getMessage(),
                'data' => []
            ], 500);
        }
    }

    /**
     * ✅ Get single competition
     */
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

            // ✅ Access control
            $userRole = strtolower($user->role);
            $canView = false;

            switch ($userRole) {
                case 'district_admin':
                case 'admin':
                    $canView = true;
                    break;
                case 'group_admin':
                case 'school_admin':
                case 'teacher':
                    $canView = ($competition->school_group_id === null || 
                              $competition->school_group_id === $user->school_group_id);
                    break;
                default:
                    $canView = ($competition->school_group_id === null);
            }

            if (!$canView) {
                return response()->json([
                    'success' => false,
                    'message' => 'คุณไม่มีสิทธิ์เข้าถึงการแข่งขันนี้'
                ], 403);
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'id' => (int) $competition->id,
                    'name' => $competition->name,
                    'code' => $competition->code,
                    'level' => $competition->level,
                    'competition_level' => $competition->competition_level ?? 'group', // ✅ เพิ่ม
                    'max_students' => (int) ($competition->max_students ?? 1),
                    'min_students' => (int) ($competition->min_students ?? 1),
                    'max_teachers' => (int) ($competition->max_teachers ?? 1),
                    'registration_status' => $competition->registration_status ?? 'upcoming',
                    'is_active' => (bool) $competition->is_active,
                    'school_group_id' => $competition->school_group_id ? (int) $competition->school_group_id : null,
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
     * ✅ Create new competition
     * Permissions: Admin, District Admin, Group Admin (own group only)
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $user = $request->user();

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'กรุณาเข้าสู่ระบบ'
                ], 401);
            }

            $userRole = strtolower($user->role);

            // ✅ ตรวจสอบสิทธิ์การสร้าง
            if (!in_array($userRole, ['admin', 'district_admin', 'group_admin'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'คุณไม่มีสิทธิ์สร้างการแข่งขัน'
                ], 403);
            }

            $validator = \Illuminate\Support\Facades\Validator::make($request->all(), [
                'name' => 'required|string|max:255',
                'code' => 'required|string|max:50|unique:competitions,code',
                'category_id' => 'required|exists:categories,id',
                'level' => 'nullable|string|max:50',
                'competition_level' => 'nullable|in:group,district',
                'min_students' => 'nullable|integer|min:1',
                'max_students' => 'nullable|integer|min:1',
                'min_teachers' => 'nullable|integer|min:0',
                'max_teachers' => 'nullable|integer|min:0',
                'school_group_id' => 'nullable|exists:school_groups,id',
                'start_date' => 'nullable|date',
                'end_date' => 'nullable|date|after_or_equal:start_date',
                'registration_status' => 'nullable|in:upcoming,open,closed',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'ข้อมูลไม่ถูกต้อง',
                    'errors' => $validator->errors()
                ], 422);
            }

            // ✅ Group Admin สามารถสร้างได้เฉพาะในกลุ่มตัวเอง
            $schoolGroupId = $request->school_group_id;
            if ($userRole === 'group_admin') {
                $schoolGroupId = $user->school_group_id;
            }

            $competition = Competition::create([
                'name' => $request->name,
                'code' => $request->code,
                'category_id' => $request->category_id,
                'level' => $request->level ?? 'ทั่วไป',
                'competition_level' => $request->competition_level ?? 'group',
                'min_students' => $request->min_students ?? 1,
                'max_students' => $request->max_students ?? 5,
                'min_teachers' => $request->min_teachers ?? 1,
                'max_teachers' => $request->max_teachers ?? 2,
                'school_group_id' => $schoolGroupId,
                'start_date' => $request->start_date,
                'end_date' => $request->end_date,
                'registration_status' => $request->registration_status ?? 'upcoming',
                'status' => 'draft',
                'is_active' => true,
            ]);

            Log::info('Competition created', [
                'competition_id' => $competition->id,
                'created_by' => $user->id,
                'user_role' => $user->role
            ]);

            return response()->json([
                'success' => true,
                'message' => 'สร้างการแข่งขันสำเร็จ',
                'data' => $competition->load(['category', 'schoolGroup'])
            ], 201);

        } catch (\Exception $e) {
            Log::error('Competition store error: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'เกิดข้อผิดพลาดในการสร้างการแข่งขัน',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * ✅ Update competition
     * Permissions: Admin, District Admin, Group Admin (own group only)
     */
    public function update(Request $request, int $id): JsonResponse
    {
        try {
            $user = $request->user();

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'กรุณาเข้าสู่ระบบ'
                ], 401);
            }

            $competition = Competition::findOrFail($id);
            $userRole = strtolower($user->role);

            // ✅ ตรวจสอบสิทธิ์การแก้ไข
            if (!in_array($userRole, ['admin', 'district_admin', 'group_admin'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'คุณไม่มีสิทธิ์แก้ไขการแข่งขัน'
                ], 403);
            }

            // Group Admin สามารถแก้ไขได้เฉพาะในกลุ่มตัวเอง
            if ($userRole === 'group_admin' && $competition->school_group_id !== $user->school_group_id) {
                return response()->json([
                    'success' => false,
                    'message' => 'คุณไม่มีสิทธิ์แก้ไขการแข่งขันนี้'
                ], 403);
            }

            $validator = \Illuminate\Support\Facades\Validator::make($request->all(), [
                'name' => 'sometimes|string|max:255',
                'code' => 'sometimes|string|max:50|unique:competitions,code,' . $id,
                'category_id' => 'sometimes|exists:categories,id',
                'level' => 'nullable|string|max:50',
                'competition_level' => 'nullable|in:group,district',
                'min_students' => 'nullable|integer|min:1',
                'max_students' => 'nullable|integer|min:1',
                'min_teachers' => 'nullable|integer|min:0',
                'max_teachers' => 'nullable|integer|min:0',
                'school_group_id' => 'nullable|exists:school_groups,id',
                'excluded_school_groups' => 'nullable|array', // ✅ เพิ่ม validation
                'excluded_school_groups.*' => 'integer|exists:school_groups,id',
                'exclusion_reason' => 'nullable|string|max:500',
                'start_date' => 'nullable|date',
                'end_date' => 'nullable|date|after_or_equal:start_date',
                'registration_status' => 'nullable|in:upcoming,open,closed',
                'is_active' => 'nullable|boolean',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'ข้อมูลไม่ถูกต้อง',
                    'errors' => $validator->errors()
                ], 422);
            }

            // ✅ Group Admin ไม่สามารถเปลี่ยน school_group_id และ excluded_school_groups
            $updateData = $request->only([
                'name', 'code', 'category_id', 'level', 'competition_level',
                'min_students', 'max_students', 'min_teachers', 'max_teachers',
                'start_date', 'end_date', 'registration_status', 'is_active'
            ]);

            // ✅ เฉพาะ Admin/District Admin สามารถแก้ไข school_group_id และ excluded_school_groups
            if (in_array($userRole, ['admin', 'district_admin'])) {
                if ($request->has('school_group_id')) {
                    $updateData['school_group_id'] = $request->school_group_id;
                }
                if ($request->has('excluded_school_groups')) {
                    $updateData['excluded_school_groups'] = $request->excluded_school_groups;
                }
                if ($request->has('exclusion_reason')) {
                    $updateData['exclusion_reason'] = $request->exclusion_reason;
                }
            }

            $competition->update($updateData);

            Log::info('Competition updated', [
                'competition_id' => $competition->id,
                'updated_by' => $user->id,
                'user_role' => $user->role
            ]);

            return response()->json([
                'success' => true,
                'message' => 'อัพเดทการแข่งขันสำเร็จ',
                'data' => $competition->fresh()->load(['category', 'schoolGroup'])
            ]);

        } catch (\Exception $e) {
            Log::error('Competition update error: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'เกิดข้อผิดพลาดในการอัพเดทการแข่งขัน',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * ✅ Delete competition
     * Permissions: Admin, District Admin, Group Admin (own group only)
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        try {
            $user = $request->user();

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'กรุณาเข้าสู่ระบบ'
                ], 401);
            }

            $competition = Competition::findOrFail($id);
            $userRole = strtolower($user->role);

            // ✅ ตรวจสอบสิทธิ์การลบ
            if (!in_array($userRole, ['admin', 'district_admin', 'group_admin'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'คุณไม่มีสิทธิ์ลบการแข่งขัน'
                ], 403);
            }

            // Group Admin สามารถลบได้เฉพาะในกลุ่มตัวเอง
            if ($userRole === 'group_admin' && $competition->school_group_id !== $user->school_group_id) {
                return response()->json([
                    'success' => false,
                    'message' => 'คุณไม่มีสิทธิ์ลบการแข่งขันนี้'
                ], 403);
            }

            // ตรวจสอบว่ามีการลงทะเบียนอยู่หรือไม่
            if ($competition->registrations()->count() > 0) {
                return response()->json([
                    'success' => false,
                    'message' => 'ไม่สามารถลบได้ เนื่องจากมีการลงทะเบียนในการแข่งขันนี้แล้ว'
                ], 422);
            }

            $competition->delete();

            Log::info('Competition deleted', [
                'competition_id' => $id,
                'deleted_by' => $user->id,
                'user_role' => $user->role
            ]);

            return response()->json([
                'success' => true,
                'message' => 'ลบการแข่งขันสำเร็จ'
            ]);

        } catch (\Exception $e) {
            Log::error('Competition destroy error: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'เกิดข้อผิดพลาดในการลบการแข่งขัน',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * ✅ Get registrations for a competition
     */
    public function getRegistrations(Request $request, int $id): JsonResponse
    {
        try {
            $user = $request->user();

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'กรุณาเข้าสู่ระบบ'
                ], 401);
            }

            $competition = Competition::findOrFail($id);
            $userRole = strtolower($user->role);

            // ตรวจสอบสิทธิ์การเข้าถึง
            if ($userRole === 'group_admin' && $competition->school_group_id !== $user->school_group_id) {
                return response()->json([
                    'success' => false,
                    'message' => 'คุณไม่มีสิทธิ์เข้าถึงข้อมูลนี้'
                ], 403);
            }

            $registrations = $competition->registrations()
                ->with(['school.schoolGroup'])
                ->orderBy('created_at', 'desc')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $registrations
            ]);

        } catch (\Exception $e) {
            Log::error('Get competition registrations error: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'เกิดข้อผิดพลาด',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * ✅ Get results for a competition
     */
    public function getResults(Request $request, int $id): JsonResponse
    {
        try {
            $user = $request->user();

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'กรุณาเข้าสู่ระบบ'
                ], 401);
            }

            $competition = Competition::findOrFail($id);

            $results = $competition->results()
                ->with(['registration.school'])
                ->orderBy('rank', 'asc')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $results
            ]);

        } catch (\Exception $e) {
            Log::error('Get competition results error: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'เกิดข้อผิดพลาด',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * ✅ Advance winners to next level
     */
    public function advanceWinners(Request $request, int $id): JsonResponse
    {
        try {
            $user = $request->user();

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'กรุณาเข้าสู่ระบบ'
                ], 401);
            }

            $userRole = strtolower($user->role);

            if (!in_array($userRole, ['admin', 'district_admin', 'group_admin'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'คุณไม่มีสิทธิ์ดำเนินการนี้'
                ], 403);
            }

            // TODO: Implement advance winners logic
            return response()->json([
                'success' => true,
                'message' => 'ฟังก์ชันนี้กำลังพัฒนา'
            ]);

        } catch (\Exception $e) {
            Log::error('Advance winners error: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'เกิดข้อผิดพลาด',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * ✅ Bulk create competitions
     */
    public function bulkCreate(Request $request): JsonResponse
    {
        try {
            $user = $request->user();

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'กรุณาเข้าสู่ระบบ'
                ], 401);
            }

            $userRole = strtolower($user->role);

            if (!in_array($userRole, ['admin', 'district_admin'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'คุณไม่มีสิทธิ์ดำเนินการนี้'
                ], 403);
            }

            // TODO: Implement bulk create logic
            return response()->json([
                'success' => true,
                'message' => 'ฟังก์ชันนี้กำลังพัฒนา'
            ]);

        } catch (\Exception $e) {
            Log::error('Bulk create competitions error: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'เกิดข้อผิดพลาด',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * ✅ Get public statistics
     */
    public function getPublicStatistics(): JsonResponse
    {
        try {
            $totalCompetitions = Competition::where('is_active', true)->count();
            $openRegistrations = Competition::where('registration_status', 'open')
                ->where('is_active', true)
                ->count();
            $totalRegistrations = \App\Models\Registration::count();
            $approvedRegistrations = \App\Models\Registration::where('status', 'approved')->count();

            return response()->json([
                'success' => true,
                'data' => [
                    'total_competitions' => $totalCompetitions,
                    'open_registrations' => $openRegistrations,
                    'total_registrations' => $totalRegistrations,
                    'approved_registrations' => $approvedRegistrations,
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Get public statistics error: ' . $e->getMessage());

            return response()->json([
                'success' => true,
                'data' => [
                    'total_competitions' => 0,
                    'open_registrations' => 0,
                    'total_registrations' => 0,
                    'approved_registrations' => 0,
                ]
            ]);
        }
    }

    /**
     * ✅ Bulk update excluded school groups for multiple competitions
     * สำหรับ District Admin จัดการกลุ่มที่ยกเว้นทีละหลายกิจกรรม
     */
    public function bulkUpdateExcludedGroups(Request $request): JsonResponse
    {
        try {
            $user = $request->user();

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'กรุณาเข้าสู่ระบบ'
                ], 401);
            }

            $userRole = strtolower($user->role);

            // ✅ เฉพาะ Admin/District Admin เท่านั้น
            if (!in_array($userRole, ['admin', 'district_admin'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'คุณไม่มีสิทธิ์ดำเนินการนี้'
                ], 403);
            }

            $validator = \Illuminate\Support\Facades\Validator::make($request->all(), [
                'competition_ids' => 'required|array|min:1',
                'competition_ids.*' => 'integer|exists:competitions,id',
                'action' => 'required|in:add,remove,set',
                'school_group_ids' => 'required|array',
                'school_group_ids.*' => 'integer|exists:school_groups,id',
                'exclusion_reason' => 'nullable|string|max:500',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'ข้อมูลไม่ถูกต้อง',
                    'errors' => $validator->errors()
                ], 422);
            }

            $action = $request->action;
            $schoolGroupIds = $request->school_group_ids;
            $exclusionReason = $request->exclusion_reason;
            $updatedCount = 0;

            foreach ($request->competition_ids as $competitionId) {
                $competition = Competition::find($competitionId);
                if (!$competition) continue;

                $currentExcluded = $competition->excluded_school_groups ?? [];

                switch ($action) {
                    case 'add':
                        // เพิ่มกลุ่มเข้าไปในรายการยกเว้น
                        $newExcluded = array_values(array_unique(array_merge($currentExcluded, $schoolGroupIds)));
                        break;

                    case 'remove':
                        // ลบกลุ่มออกจากรายการยกเว้น
                        $newExcluded = array_values(array_diff($currentExcluded, $schoolGroupIds));
                        break;

                    case 'set':
                        // ตั้งค่าใหม่ทั้งหมด
                        $newExcluded = array_values(array_unique($schoolGroupIds));
                        break;

                    default:
                        continue 2;
                }

                $competition->excluded_school_groups = $newExcluded;
                if ($exclusionReason !== null) {
                    $competition->exclusion_reason = $exclusionReason;
                }
                $competition->save();
                $updatedCount++;
            }

            Log::info('Bulk update excluded groups', [
                'action' => $action,
                'school_group_ids' => $schoolGroupIds,
                'updated_count' => $updatedCount,
                'updated_by' => $user->id
            ]);

            return response()->json([
                'success' => true,
                'message' => "อัพเดทสำเร็จ {$updatedCount} กิจกรรม",
                'updated_count' => $updatedCount
            ]);

        } catch (\Exception $e) {
            Log::error('Bulk update excluded groups error: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'เกิดข้อผิดพลาด',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * ✅ Get competitions with exclusion info for a specific school group
     * ดึงรายการกิจกรรมพร้อมข้อมูลว่ากลุ่มนี้ถูกยกเว้นหรือไม่
     */
    public function getCompetitionsForSchoolGroup(Request $request, int $schoolGroupId): JsonResponse
    {
        try {
            $user = $request->user();

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'กรุณาเข้าสู่ระบบ'
                ], 401);
            }

            $competitions = Competition::with(['category:id,name', 'schoolGroup:id,name'])
                ->where('is_active', true)
                ->get()
                ->map(function ($comp) use ($schoolGroupId) {
                    $isExcluded = $comp->isSchoolGroupExcluded($schoolGroupId);

                    return [
                        'id' => $comp->id,
                        'code' => $comp->code,
                        'name' => $comp->name,
                        'level' => $comp->level,
                        'competition_level' => $comp->competition_level,
                        'category' => $comp->category,
                        'school_group' => $comp->schoolGroup,
                        'is_excluded' => $isExcluded,
                        'exclusion_reason' => $isExcluded ? $comp->exclusion_reason : null,
                        'excluded_school_groups' => $comp->excluded_school_groups ?? [],
                    ];
                });

            // แยกเป็น 2 กลุ่ม: สามารถลงทะเบียนได้ และ ถูกยกเว้น
            $available = $competitions->where('is_excluded', false)->values();
            $excluded = $competitions->where('is_excluded', true)->values();

            return response()->json([
                'success' => true,
                'data' => [
                    'school_group_id' => $schoolGroupId,
                    'available_count' => $available->count(),
                    'excluded_count' => $excluded->count(),
                    'available_competitions' => $available,
                    'excluded_competitions' => $excluded,
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Get competitions for school group error: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'เกิดข้อผิดพลาด',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * ตรวจสอบ group competitions ที่ชื่อ/code/category_id ไม่ตรงกับ parent district competition
     */
    public function checkMismatches(Request $request)
    {
        try {
            $user = auth()->user();
            if (!in_array($user->role, ['admin', 'district_admin'])) {
                return response()->json(['error' => 'Unauthorized'], 403);
            }

            // ดึง group competitions ที่มี parent_competition_id
            $groupComps = Competition::with(['parentCompetition', 'schoolGroup:id,name', 'category:id,name'])
                ->where('competition_level', 'group')
                ->whereNotNull('parent_competition_id')
                ->get();

            $mismatches = [];
            foreach ($groupComps as $group) {
                $parent = $group->parentCompetition;
                if (!$parent) continue;

                $issues = [];
                if (trim($group->name) !== trim($parent->name)) {
                    $issues[] = [
                        'field' => 'name',
                        'group_value' => $group->name,
                        'district_value' => $parent->name,
                    ];
                }
                if ($group->code !== $parent->code) {
                    $issues[] = [
                        'field' => 'code',
                        'group_value' => $group->code,
                        'district_value' => $parent->code,
                    ];
                }
                if ($group->category_id !== $parent->category_id) {
                    $issues[] = [
                        'field' => 'category_id',
                        'group_value' => $group->category_id,
                        'district_value' => $parent->category_id,
                    ];
                }
                if ($group->level !== $parent->level) {
                    $issues[] = [
                        'field' => 'level',
                        'group_value' => $group->level,
                        'district_value' => $parent->level,
                    ];
                }

                if (!empty($issues)) {
                    $mismatches[] = [
                        'group_competition_id' => $group->id,
                        'group_name' => $group->name,
                        'group_code' => $group->code,
                        'school_group' => $group->schoolGroup->name ?? 'N/A',
                        'school_group_id' => $group->school_group_id,
                        'district_competition_id' => $parent->id,
                        'district_name' => $parent->name,
                        'district_code' => $parent->code,
                        'issues' => $issues,
                    ];
                }
            }

            // ดึง group competitions ที่ไม่มี parent_competition_id (อาจมีปัญหา)
            $orphans = Competition::with(['schoolGroup:id,name', 'category:id,name'])
                ->where('competition_level', 'group')
                ->whereNull('parent_competition_id')
                ->where('is_active', true)
                ->get()
                ->map(function ($comp) {
                    return [
                        'group_competition_id' => $comp->id,
                        'group_name' => $comp->name,
                        'group_code' => $comp->code,
                        'school_group' => $comp->schoolGroup->name ?? 'N/A',
                        'school_group_id' => $comp->school_group_id,
                        'category_id' => $comp->category_id,
                        'level' => $comp->level,
                    ];
                });

            return response()->json([
                'success' => true,
                'data' => [
                    'mismatch_count' => count($mismatches),
                    'orphan_count' => $orphans->count(),
                    'mismatches' => $mismatches,
                    'orphans' => $orphans,
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Check mismatches error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'เกิดข้อผิดพลาด: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Sync group competitions ทั้งหมดให้ name/code/category_id/level ตรงกับ parent district competition
     */
    public function syncWithParent(Request $request)
    {
        try {
            $user = auth()->user();
            if (!in_array($user->role, ['admin', 'district_admin'])) {
                return response()->json(['error' => 'Unauthorized'], 403);
            }

            $groupComps = Competition::with('parentCompetition')
                ->where('competition_level', 'group')
                ->whereNotNull('parent_competition_id')
                ->get();

            $updated = [];
            $skipped = [];

            DB::beginTransaction();

            foreach ($groupComps as $group) {
                $parent = $group->parentCompetition;
                if (!$parent) {
                    $skipped[] = [
                        'id' => $group->id,
                        'name' => $group->name,
                        'reason' => 'parent not found',
                    ];
                    continue;
                }

                $changes = [];
                if (trim($group->name) !== trim($parent->name)) {
                    $changes['name'] = ['from' => $group->name, 'to' => $parent->name];
                    $group->name = $parent->name;
                }
                // ไม่ sync code เพราะ code เป็น unique ต่อ record (group แต่ละกลุ่มมี code ต่างกัน)
                if ($group->category_id !== $parent->category_id) {
                    $changes['category_id'] = ['from' => $group->category_id, 'to' => $parent->category_id];
                    $group->category_id = $parent->category_id;
                }
                if ($group->level !== $parent->level) {
                    $changes['level'] = ['from' => $group->level, 'to' => $parent->level];
                    $group->level = $parent->level;
                }

                if (!empty($changes)) {
                    $group->save();
                    $updated[] = [
                        'id' => $group->id,
                        'school_group_id' => $group->school_group_id,
                        'changes' => $changes,
                    ];
                }
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Sync สำเร็จ อัปเดต ' . count($updated) . ' รายการ',
                'data' => [
                    'updated_count' => count($updated),
                    'skipped_count' => count($skipped),
                    'updated' => $updated,
                    'skipped' => $skipped,
                ]
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Sync with parent error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'เกิดข้อผิดพลาด: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * ✅ Bulk update skip_group_level for multiple district competitions
     * สำหรับ Admin กำหนดว่ากิจกรรมไหนข้ามระดับกลุ่ม
     */
    public function bulkUpdateSkipGroupLevel(Request $request): JsonResponse
    {
        try {
            $user = $request->user();

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'กรุณาเข้าสู่ระบบ'
                ], 401);
            }

            $userRole = strtolower($user->role);

            // ✅ เฉพาะ Admin/District Admin เท่านั้น
            if (!in_array($userRole, ['admin', 'district_admin'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'คุณไม่มีสิทธิ์ดำเนินการนี้'
                ], 403);
            }

            $validator = \Illuminate\Support\Facades\Validator::make($request->all(), [
                'competition_ids' => 'required|array|min:1',
                'competition_ids.*' => 'integer|exists:competitions,id',
                'skip_group_level' => 'required|boolean',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'ข้อมูลไม่ถูกต้อง',
                    'errors' => $validator->errors()
                ], 422);
            }

            $skipGroupLevel = $request->skip_group_level;
            $updatedCount = 0;

            foreach ($request->competition_ids as $competitionId) {
                $competition = Competition::find($competitionId);
                if (!$competition) continue;

                // อัพเดทเฉพาะ district competitions
                if ($competition->competition_level === 'district') {
                    $competition->skip_group_level = $skipGroupLevel;
                    $competition->save();
                    $updatedCount++;
                }
            }

            Log::info('Bulk update skip_group_level', [
                'skip_group_level' => $skipGroupLevel,
                'updated_count' => $updatedCount,
                'updated_by' => $user->id
            ]);

            $statusText = $skipGroupLevel ? 'ข้ามระดับกลุ่ม' : 'ไม่ข้ามระดับกลุ่ม';

            return response()->json([
                'success' => true,
                'message' => "อัพเดทสำเร็จ {$updatedCount} กิจกรรม → {$statusText}",
                'updated_count' => $updatedCount
            ]);

        } catch (\Exception $e) {
            Log::error('Bulk update skip_group_level error: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'เกิดข้อผิดพลาด',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Auto-link orphan group competitions ที่ไม่มี parent_competition_id
     * โดย match จาก category_id + level + ชื่อที่ตรงกัน กับ district competition
     */
    public function autoLinkParent(Request $request)
    {
        try {
            $user = auth()->user();
            if (!in_array($user->role, ['admin', 'district_admin'])) {
                return response()->json(['error' => 'Unauthorized'], 403);
            }

            $dryRun = $request->boolean('dry_run', false);

            // ดึง group competitions ที่ไม่มี parent
            $orphans = Competition::where('competition_level', 'group')
                ->whereNull('parent_competition_id')
                ->where('is_active', true)
                ->get();

            // ดึง district competitions ทั้งหมด
            $districtComps = Competition::where('competition_level', 'district')
                ->where('status', 'active')
                ->get();

            $linked = [];
            $notFound = [];
            $multipleFound = [];

            if (!$dryRun) {
                DB::beginTransaction();
            }

            foreach ($orphans as $orphan) {
                $orphanName = trim($orphan->name);
                // ลบ suffix ระดับ
                $cleanName = preg_replace('/\s*\(ระดับ[^)]*\)\s*/', '', $orphanName);
                $cleanName = trim($cleanName);

                // หา district competition ที่ match
                $matches = $districtComps->filter(function ($dc) use ($orphan, $cleanName, $orphanName) {
                    if ($dc->category_id !== $orphan->category_id) return false;
                    if ($dc->level !== $orphan->level) return false;

                    $dcName = trim($dc->name);
                    $dcCleanName = preg_replace('/\s*\(ระดับ[^)]*\)\s*/', '', $dcName);
                    $dcCleanName = trim($dcCleanName);

                    // ชื่อตรงกัน (exact หลัง clean) หรือ contains
                    return $dcCleanName === $cleanName
                        || str_contains($dcName, $cleanName)
                        || str_contains($dcCleanName, $cleanName)
                        || str_contains($orphanName, $dcCleanName);
                });

                if ($matches->count() === 1) {
                    $parent = $matches->first();
                    if (!$dryRun) {
                        $orphan->parent_competition_id = $parent->id;
                        $orphan->save();
                    }
                    $linked[] = [
                        'group_id' => $orphan->id,
                        'group_name' => $orphan->name,
                        'group_code' => $orphan->code,
                        'school_group_id' => $orphan->school_group_id,
                        'district_id' => $parent->id,
                        'district_name' => $parent->name,
                    ];
                } elseif ($matches->count() > 1) {
                    $multipleFound[] = [
                        'group_id' => $orphan->id,
                        'group_name' => $orphan->name,
                        'group_code' => $orphan->code,
                        'school_group_id' => $orphan->school_group_id,
                        'category_id' => $orphan->category_id,
                        'level' => $orphan->level,
                        'candidate_count' => $matches->count(),
                        'candidates' => $matches->map(fn($m) => ['id' => $m->id, 'name' => $m->name])->values(),
                    ];
                } else {
                    $notFound[] = [
                        'group_id' => $orphan->id,
                        'group_name' => $orphan->name,
                        'group_code' => $orphan->code,
                        'school_group_id' => $orphan->school_group_id,
                        'category_id' => $orphan->category_id,
                        'level' => $orphan->level,
                    ];
                }
            }

            if (!$dryRun) {
                DB::commit();
            }

            return response()->json([
                'success' => true,
                'dry_run' => $dryRun,
                'message' => ($dryRun ? '[DRY RUN] ' : '') . 'Auto-link สำเร็จ เชื่อม ' . count($linked) . ' รายการ',
                'data' => [
                    'total_orphans' => $orphans->count(),
                    'linked_count' => count($linked),
                    'not_found_count' => count($notFound),
                    'multiple_found_count' => count($multipleFound),
                    'linked' => $linked,
                    'not_found' => $notFound,
                    'multiple_found' => $multipleFound,
                ]
            ]);

        } catch (\Exception $e) {
            if (!($request->boolean('dry_run', false))) {
                DB::rollBack();
            }
            Log::error('Auto-link parent error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'เกิดข้อผิดพลาด: ' . $e->getMessage()
            ], 500);
        }
    }
}