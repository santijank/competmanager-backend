<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Competition;
use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class CertificateController extends Controller
{
    /**
     * Get all competitions with filters
     */
    public function index(Request $request): JsonResponse
    {
        $query = Competition::with(['category']);

        // Filter by category
        if ($request->has('category_id')) {
            $query->where('category_id', $request->category_id);
        }

        // Filter by status
        if ($request->has('is_active')) {
            $query->where('is_active', $request->is_active === 'true' || $request->is_active === '1');
        }

        // Filter by registration status
        if ($request->has('registration_status')) {
            $query->where('registration_status', $request->registration_status);
        }

        // Filter by school group
        if ($request->has('school_group_id')) {
            $query->where('school_group_id', $request->school_group_id);
        }

        $competitions = $query->orderBy('start_date', 'desc')->paginate(15);

        return response()->json([
            'success' => true,
            'data' => $competitions->items(),
            'meta' => [
                'current_page' => $competitions->currentPage(),
                'last_page' => $competitions->lastPage(),
                'per_page' => $competitions->perPage(),
                'total' => $competitions->total(),
            ]
        ]);
    }

    /**
     * Get single competition
     */
    public function show(int $id): JsonResponse
    {
        $competition = Competition::with(['category'])->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $competition
        ]);
    }

    /**
     * Create single competition
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'code' => 'required|string|unique:competitions,code',
            'category_id' => 'required|exists:categories,id',
            'competition_type' => 'required|string',
            'level' => 'required|string',
            'max_students' => 'required|integer|min:1',
            'max_teachers' => 'required|integer|min:1',
            'max_judges' => 'required|integer|min:1',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'registration_start_date' => 'required|date',
            'registration_end_date' => 'required|date|after_or_equal:registration_start_date|before_or_equal:start_date',
            'venue' => 'nullable|string',
            'registration_status' => 'required|in:open,closed',
            'is_active' => 'required|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }

        $competition = Competition::create($request->all());

        return response()->json([
            'success' => true,
            'message' => 'สร้างการแข่งขันสำเร็จ',
            'data' => $competition->load('category')
        ], 201);
    }

    /**
     * ⭐ Bulk Create Competitions
     * สร้างการแข่งขันทั้งหมวดหมู่
     */
    public function bulkStore(Request $request): JsonResponse
    {
        // Log request for debugging
        Log::info('Bulk Store Request:', $request->all());

        $validator = Validator::make($request->all(), [
            'category_id' => 'required|exists:categories,id',
            'competitions' => 'required|array|min:1',
            'competitions.*.name' => 'required|string|max:255',
            'competitions.*.code' => 'required|string|distinct',
            'competitions.*.level' => 'required|string',
            'competitions.*.description' => 'nullable|string',
            'competitions.*.rules' => 'nullable|string',
            
            // Common fields (ใช้ร่วมกันทั้งหมด)
            'common.competition_type' => 'required|string',
            'common.max_students' => 'required|integer|min:1',
            'common.max_teachers' => 'required|integer|min:1',
            'common.max_judges' => 'required|integer|min:1',
            'common.start_date' => 'required|date',
            'common.end_date' => 'required|date|after_or_equal:common.start_date',
            'common.registration_start_date' => 'required|date',
            'common.registration_end_date' => 'required|date|after_or_equal:common.registration_start_date',
            'common.venue' => 'nullable|string',
            'common.contact_person' => 'nullable|string',
            'common.contact_phone' => 'nullable|string',
            'common.contact_email' => 'nullable|email',
            'common.school_group_id' => 'nullable|exists:school_groups,id',
            'common.registration_status' => 'required|in:open,closed',
            'common.is_active' => 'required|boolean',
        ]);

        if ($validator->fails()) {
            Log::error('Validation failed:', $validator->errors()->toArray());
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }

        $created = [];
        $errors = [];

        DB::beginTransaction();
        
        try {
            $category_id = $request->input('category_id');
            $common = $request->input('common');

            foreach ($request->input('competitions') as $index => $comp) {
                try {
                    // เช็คว่า code ซ้ำหรือไม่
                    $exists = Competition::where('code', $comp['code'])->exists();
                    if ($exists) {
                        $errors[] = [
                            'index' => $index,
                            'name' => $comp['name'],
                            'code' => $comp['code'],
                            'error' => 'รหัสการแข่งขันซ้ำ'
                        ];
                        continue;
                    }

                    // ✅ แก้ไข: แปลง empty string เป็น null
                    $description = isset($comp['description']) && $comp['description'] !== '' 
                        ? $comp['description'] 
                        : null;
                    
                    $rules = isset($comp['rules']) && $comp['rules'] !== '' 
                        ? $comp['rules'] 
                        : null;

                    // ✅ แก้ไข: ดึงค่าจาก array อย่างชัดเจน
                    $competitionData = [
                        'name' => $comp['name'],
                        'code' => $comp['code'],
                        'category_id' => $category_id,
                        'competition_type' => $common['competition_type'],
                        'level' => $comp['level'],
                        'description' => $description,
                        'rules' => $rules,
                        'max_students' => (int) $common['max_students'],
                        'max_teachers' => (int) $common['max_teachers'],
                        'max_judges' => (int) $common['max_judges'],
                        'start_date' => $common['start_date'],
                        'end_date' => $common['end_date'],
                        'registration_start_date' => $common['registration_start_date'],
                        'registration_end_date' => $common['registration_end_date'],
                        'venue' => $common['venue'] ?? null,
                        'contact_person' => $common['contact_person'] ?? null,
                        'contact_phone' => $common['contact_phone'] ?? null,
                        'contact_email' => $common['contact_email'] ?? null,
                        'school_group_id' => $common['school_group_id'] ?? null,
                        'registration_status' => $common['registration_status'],
                        'is_active' => (bool) $common['is_active'],
                    ];

                    Log::info("Creating competition {$index}:", $competitionData);

                    // สร้าง competition
                    $competition = Competition::create($competitionData);

                    $created[] = $competition;

                } catch (\Exception $e) {
                    Log::error("Error creating competition {$index}: " . $e->getMessage());
                    $errors[] = [
                        'index' => $index,
                        'name' => $comp['name'],
                        'code' => $comp['code'],
                        'error' => $e->getMessage()
                    ];
                }
            }

            DB::commit();

            $message = count($created) > 0 
                ? "สร้างการแข่งขันสำเร็จ " . count($created) . " รายการ"
                : "ไม่สามารถสร้างการแข่งขันได้";

            return response()->json([
                'success' => count($created) > 0,
                'message' => $message,
                'data' => [
                    'created' => $created,
                    'errors' => $errors,
                    'summary' => [
                        'total' => count($request->input('competitions')),
                        'created' => count($created),
                        'failed' => count($errors),
                    ]
                ]
            ], count($created) > 0 ? 201 : 422);

        } catch (\Exception $e) {
            DB::rollBack();
            
            Log::error('Bulk Store Error: ' . $e->getMessage());
            Log::error('Stack trace: ' . $e->getTraceAsString());
            
            return response()->json([
                'success' => false,
                'message' => 'เกิดข้อผิดพลาดในการสร้างการแข่งขัน',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update competition
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $competition = Competition::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|string|max:255',
            'code' => 'sometimes|string|unique:competitions,code,' . $id,
            'category_id' => 'sometimes|exists:categories,id',
            'start_date' => 'sometimes|date',
            'end_date' => 'sometimes|date|after_or_equal:start_date',
            'registration_start_date' => 'sometimes|date',
            'registration_end_date' => 'sometimes|date',
            'registration_status' => 'sometimes|in:open,closed',
            'is_active' => 'sometimes|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }

        $competition->update($request->all());

        return response()->json([
            'success' => true,
            'message' => 'แก้ไขการแข่งขันสำเร็จ',
            'data' => $competition->load('category')
        ]);
    }

    /**
     * Delete competition
     */
    public function destroy(int $id): JsonResponse
    {
        $competition = Competition::findOrFail($id);
        $competition->delete();

        return response()->json([
            'success' => true,
            'message' => 'ลบการแข่งขันสำเร็จ'
        ]);
    }

    /**
     * Get competition statistics
     */
    public function statistics(): JsonResponse
    {
        $total = Competition::count();
        $active = Competition::where('is_active', true)->count();
        $registrationOpen = Competition::where('registration_status', 'open')->count();
        
        return response()->json([
            'success' => true,
            'data' => [
                'total' => $total,
                'active' => $active,
                'registration_open' => $registrationOpen,
                'registration_closed' => $total - $registrationOpen,
            ]
        ]);
    }
}