<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Competition;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

class CompetitionController extends Controller
{
    /**
     * ✅ Get competitions with STRICT role-based filtering
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

            Log::info('=== COMPETITION API ===', [
                'user_id' => $user->id,
                'user_role' => $user->role,
                'user_school_group_id' => $user->school_group_id ?? 'NULL',
            ]);

            // ✅ Simple query builder
            $query = DB::table('competitions')
                ->leftJoin('categories', 'competitions.category_id', '=', 'categories.id')
                ->leftJoin('school_groups', 'competitions.school_group_id', '=', 'school_groups.id')
                ->select(
                    'competitions.*',
                    'categories.name as category_name',
                    'school_groups.name as school_group_name'
                );

            $filterApplied = 'none';

            // ✅ **STRICT FILTERING**
            switch (strtolower($user->role)) {
                case 'district_admin':
                case 'admin':
                    $filterApplied = 'Admin - ดูทั้งหมด';
                    break;

                case 'group_admin':
                    if ($user->school_group_id) {
                        $query->where('competitions.school_group_id', $user->school_group_id);
                        $filterApplied = "Group Admin - กลุ่ม {$user->school_group_id}";
                    } else {
                        $query->whereNull('competitions.school_group_id');
                        $filterApplied = 'Group Admin - สาธารณะเท่านั้น';
                    }
                    break;

                case 'school_admin':
                case 'teacher':
                    if ($user->school_group_id) {
                        $query->where('competitions.school_group_id', $user->school_group_id);
                        $filterApplied = "School Admin - กลุ่ม {$user->school_group_id}";
                    } else {
                        $query->whereNull('competitions.school_group_id');
                        $filterApplied = 'School Admin - สาธารณะเท่านั้น';
                    }
                    break;

                default:
                    $query->whereNull('competitions.school_group_id');
                    $filterApplied = 'Default - สาธารณะเท่านั้น';
                    break;
            }

            // ✅ Additional filters
            if ($request->filled('category_id') && $request->category_id !== 'all') {
                $query->where('competitions.category_id', $request->category_id);
            }

            if ($request->filled('is_active')) {
                $query->where('competitions.is_active', true);
            }

            if ($request->filled('registration_status')) {
                $query->where('competitions.registration_status', $request->registration_status);
            }

            // ✅ Admin group filter
            if ($request->filled('school_group_id') && 
                $request->school_group_id !== 'all' && 
                in_array(strtolower($user->role), ['district_admin', 'admin'])) {
                
                $query->where('competitions.school_group_id', $request->school_group_id);
                $filterApplied .= " + Manual filter";
            }

            // ✅ Execute query
            $totalCount = DB::table('competitions')->count();
            $competitions = $query
                ->orderBy('competitions.created_at', 'desc')
                ->limit(100)
                ->get();

            // ✅ Format data
            $formattedData = $competitions->map(function ($comp) {
                return [
                    'id' => $comp->id,
                    'name' => $comp->name,
                    'code' => $comp->code,
                    'level' => $comp->level,
                    'max_students' => $comp->max_students,
                    'min_students' => $comp->min_students ?? 1,
                    'max_teachers' => $comp->max_teachers,
                    'school_group_id' => $comp->school_group_id,
                    'category' => [
                        'id' => $comp->category_id,
                        'name' => $comp->category_name
                    ],
                    'school_group' => $comp->school_group_id ? [
                        'id' => $comp->school_group_id,
                        'name' => $comp->school_group_name
                    ] : null,
                    'created_at' => $comp->created_at,
                ];
            });

            Log::info('=== RESULTS ===', [
                'filter' => $filterApplied,
                'total_db' => $totalCount,
                'returned' => count($formattedData)
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
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Competition API Error: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'เกิดข้อผิดพลาด',
                'error' => $e->getMessage(),
                'data' => []
            ], 500);
        }
    }

    public function show(Request $request, int $id): JsonResponse
    {
        try {
            $user = $request->user();
            $competition = Competition::with(['category', 'schoolGroup'])->find($id);

            if (!$competition) {
                return response()->json([
                    'success' => false,
                    'message' => 'ไม่พบการแข่งขัน'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $competition
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'เกิดข้อผิดพลาด',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}

    public function show(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        $competition = Competition::with(['category', 'schoolGroup'])->findOrFail($id);

        // ตรวจสอบสิทธิ์
        if (in_array($user->role, ['school_admin', 'teacher', 'group_admin'])) {
            if ($competition->school_group_id && $competition->school_group_id != $user->school_group_id) {
                return response()->json([
                    'success' => false,
                    'message' => 'คุณไม่มีสิทธิ์เข้าถึงการแข่งขันนี้'
                ], 403);
            }
        }

        return response()->json([
            'success' => true,
            'data' => $competition
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $user = $request->user();
        
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|unique:competitions,code',
            'category_id' => 'required|exists:categories,id',
            'competition_type' => 'required|string',
            'level' => 'required|string',
            'max_students' => 'required|integer|min:1',
            'max_teachers' => 'required|integer|min:1',
            'max_judges' => 'required|integer|min:1',
            'start_date' => 'required|date',
            'end_date' => 'required|date',
            'registration_start_date' => 'required|date',
            'registration_end_date' => 'required|date',
            'registration_status' => 'required|in:open,closed',
            'is_active' => 'required|boolean',
        ]);

        // Group Admin สร้างได้เฉพาะกลุ่มตัวเอง
        if ($user->role === 'group_admin') {
            $data['school_group_id'] = $user->school_group_id;
        }

        $competition = Competition::create($data);

        return response()->json([
            'success' => true,
            'message' => 'สร้างการแข่งขันสำเร็จ',
            'data' => $competition->load('category')
        ], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        $competition = Competition::findOrFail($id);

        // ตรวจสอบสิทธิ์
        if ($user->role === 'group_admin') {
            if ($competition->school_group_id !== $user->school_group_id) {
                return response()->json([
                    'success' => false,
                    'message' => 'คุณไม่มีสิทธิ์แก้ไข'
                ], 403);
            }
        }

        $data = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|unique:competitions,code,' . $id,
            'category_id' => 'required|exists:categories,id',
            'level' => 'required|string',
            'max_students' => 'required|integer|min:1',
            'max_teachers' => 'required|integer|min:1',
            'max_judges' => 'required|integer|min:1',
            'start_date' => 'required|date',
            'end_date' => 'required|date',
            'registration_start_date' => 'required|date',
            'registration_end_date' => 'required|date',
            'registration_status' => 'required|in:open,closed',
            'is_active' => 'required|boolean',
        ]);

        $competition->update($data);

        return response()->json([
            'success' => true,
            'message' => 'แก้ไขสำเร็จ',
            'data' => $competition->load('category')
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        $competition = Competition::findOrFail($id);
        $competition->delete();

        return response()->json([
            'success' => true,
            'message' => 'ลบสำเร็จ'
        ]);
    }
}