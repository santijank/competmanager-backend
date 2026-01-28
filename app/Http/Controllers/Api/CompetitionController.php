<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Competition;
use App\Models\Category;
use App\Models\SchoolGroup;
use App\Models\Registration;
use App\Models\CompetitionAdvancement;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class CompetitionController extends Controller
{
    /**
     * ✅ Get all competitions with role-based filtering
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $query = Competition::with(['category']);

        // ✅ ROLE-BASED ACCESS CONTROL
        // ถ้าเป็น group_admin หรือ committee ระดับ group → แสดงเฉพาะกลุ่มตัวเอง
        if ($this->shouldFilterBySchoolGroup($user)) {
            $query->where('school_group_id', $user->school_group_id);
        }
        // ถ้าเป็น admin หรือ committee ระดับ district → ดูได้ทุกกลุ่ม
        // (ไม่ต้องเพิ่ม where เพราะจะดูทุกกลุ่ม)

        // ✅ Additional filters (ถ้ามีการส่งมา)
        if ($request->has('category_id')) {
            $query->where('category_id', $request->category_id);
        }

        if ($request->has('is_active')) {
            $query->where('is_active', $request->is_active === 'true' || $request->is_active === '1');
        }

        if ($request->has('registration_status')) {
            $query->where('registration_status', $request->registration_status);
        }

        // ✅ Admin/Committee district level สามารถ filter ดูกลุ่มอื่นได้
        if ($request->has('school_group_id') && $this->canViewAllGroups($user)) {
            $query->where('school_group_id', $request->school_group_id);
        }

        // ✅ Pagination with custom per_page
        $perPage = $request->input('per_page', 15);
        $competitions = $query->orderBy('start_date', 'desc')->paginate($perPage);

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
     * Get single competition (with access control)
     */
    public function show(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        $competition = Competition::with(['category'])->findOrFail($id);

        // ✅ Check access permission
        if ($this->shouldFilterBySchoolGroup($user)) {
            if ($competition->school_group_id != $user->school_group_id) {
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

    /**
     * Create single competition
     */
    public function store(Request $request): JsonResponse
    {
        $user = $request->user();

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

        $data = $request->all();

        // ✅ Auto-assign school_group_id for group_admin
        if ($this->shouldFilterBySchoolGroup($user)) {
            $data['school_group_id'] = $user->school_group_id;
        }

        $competition = Competition::create($data);

        return response()->json([
            'success' => true,
            'message' => 'สร้างการแข่งขันสำเร็จ',
            'data' => $competition->load('category')
        ], 201);
    }

    /**
     * ⭐ Bulk Store Competitions (Original method - for UI bulk creation)
     */
    public function bulkStore(Request $request): JsonResponse
    {
        $user = $request->user();

        $validator = Validator::make($request->all(), [
            'category_id' => 'required|exists:categories,id',
            'competitions' => 'required|array|min:1',
            'competitions.*.name' => 'required|string|max:255',
            'competitions.*.code' => 'required|string|distinct',
            'competitions.*.level' => 'required|string',
            
            // Common fields
            'common.competition_type' => 'required|string',
            'common.max_students' => 'required|integer|min:1',
            'common.max_teachers' => 'required|integer|min:1',
            'common.max_judges' => 'required|integer|min:1',
            'common.start_date' => 'required|date',
            'common.end_date' => 'required|date|after_or_equal:common.start_date',
            'common.registration_start_date' => 'required|date',
            'common.registration_end_date' => 'required|date|after_or_equal:common.registration_start_date',
            'common.venue' => 'nullable|string',
            'common.registration_status' => 'required|in:open,closed',
            'common.is_active' => 'required|boolean',
        ]);

        if ($validator->fails()) {
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
            $category_id = $request->category_id;
            $common = $request->common;

            // ✅ Determine school_group_id
            $school_group_id = null;
            if ($this->shouldFilterBySchoolGroup($user)) {
                // Group admin: use their school_group_id
                $school_group_id = $user->school_group_id;
            } else {
                // District admin: use from request or null
                $school_group_id = $common['school_group_id'] ?? null;
            }

            foreach ($request->competitions as $index => $comp) {
                // Check duplicate code
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

                // Create competition
                $competition = Competition::create([
                    'name' => $comp['name'],
                    'code' => $comp['code'],
                    'category_id' => $category_id,
                    'competition_type' => $common['competition_type'],
                    'level' => $comp['level'],
                    'description' => $comp['description'] ?? null,
                    'rules' => $comp['rules'] ?? null,
                    'max_students' => $common['max_students'],
                    'max_teachers' => $common['max_teachers'],
                    'max_judges' => $common['max_judges'],
                    'start_date' => $common['start_date'],
                    'end_date' => $common['end_date'],
                    'registration_start_date' => $common['registration_start_date'],
                    'registration_end_date' => $common['registration_end_date'],
                    'venue' => $common['venue'],
                    'contact_person' => $common['contact_person'] ?? null,
                    'contact_phone' => $common['contact_phone'] ?? null,
                    'contact_email' => $common['contact_email'] ?? null,
                    'school_group_id' => $school_group_id,
                    'registration_status' => $common['registration_status'],
                    'is_active' => $common['is_active'],
                ]);

                $created[] = $competition;
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => "สร้างการแข่งขันสำเร็จ " . count($created) . " รายการ",
                'data' => [
                    'created' => $created,
                    'errors' => $errors,
                    'summary' => [
                        'total' => count($request->competitions),
                        'created' => count($created),
                        'failed' => count($errors),
                    ]
                ]
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            
            return response()->json([
                'success' => false,
                'message' => 'เกิดข้อผิดพลาดในการสร้างการแข่งขัน',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * ⭐ NEW: Bulk create competitions by category (Master Competition)
     * POST /api/competitions/bulk-create
     */
   /**
     * ⭐ Bulk Create Competitions
     * POST /api/competitions/bulk-create
     * 
     * Creates competitions for multiple school groups based on master templates
     */
    public function bulkCreate(Request $request)
    {
        $validated = $request->validate([
            'method' => 'required|in:category,single',
            'category_id' => 'required_if:method,category|exists:categories,id',
            'name' => 'required_if:method,single|string|max:255',
            'level' => 'required_if:method,single|string',
            'max_student' => 'required_if:method,single|integer|min:1',
            'max_teacher' => 'required_if:method,single|integer|min:1',
            'registration_start_date' => 'required|date',
            'registration_end_date' => 'required|date|after:registration_start_date',
            'school_group_ids' => 'required|array|min:1',
            'school_group_ids.*' => 'exists:school_groups,id',
        ]);

        DB::beginTransaction();
        try {
            $created = [];
            $errors = [];
            $schoolGroupIds = $validated['school_group_ids'];
            
            if ($validated['method'] === 'category') {
                // Get master competitions in this category
                $masterCompetitions = Competition::where('category_id', $validated['category_id'])
                    ->where('is_master', 1)
                    ->get();

                if ($masterCompetitions->isEmpty()) {
                    return response()->json([
                        'success' => false,
                        'message' => 'ไม่พบรายการแข่งขันในหมวดหมู่นี้',
                    ], 404);
                }

                // สร้างรายการแข่งขันสำหรับแต่ละกลุ่ม
                foreach ($masterCompetitions as $master) {
                    foreach ($schoolGroupIds as $groupId) {
                        try {
                            $competition = Competition::create([
                                'name' => $master->name,
                                'code' => $master->code . '-G' . $groupId . '-' . time(),
                                'description' => $master->description,
                                'category_id' => $master->category_id,
                                'competition_type' => $master->competition_type ?? 'regular',
                                
                                // ✅ ใช้ field ที่ถูกต้อง (ตาม schema จริง)
                                'level' => $master->level,
                                'max_student' => $master->max_student,
                                'max_teacher' => $master->max_teacher,
                                'max_judge' => $master->max_judge ?? 3,
                                
                                // วันที่
                                'start_date' => $validated['registration_start_date'],
                                'end_date' => $validated['registration_end_date'],
                                'registration_start_date' => $validated['registration_start_date'],
                                'registration_end_date' => $validated['registration_end_date'],
                                'group_registration_start' => $validated['registration_start_date'],
                                'group_registration_end' => $validated['registration_end_date'],

                                
                                // Group assignment
                                'school_group_id' => $groupId,
                                'competition_level' => 'group',
                                'parent_competition_id' => $master->id,
                                'is_master' => false,
                                
                                // Status
                                'status' => 'draft',
                                'is_active' => false,
                                'registration_status' => 'upcoming',
                                'auto_close_registration' => true,
                                'advancement_count' => 2,
                            ]);
                            
                            $created[] = $competition;
                        } catch (\Exception $e) {
                            $errors[] = [
                                'master_id' => $master->id,
                                'master_name' => $master->name,
                                'group_id' => $groupId,
                                'error' => $e->getMessage()
                            ];
                            Log::error('Failed to create competition', [
                                'master' => $master->id,
                                'group' => $groupId,
                                'error' => $e->getMessage()
                            ]);
                        }
                    }
                }
            } else {
                // Single competition method
                foreach ($schoolGroupIds as $groupId) {
                    try {
                        $competition = Competition::create([
                            'name' => $validated['name'],
                            'code' => 'COMP-' . time() . '-G' . $groupId,
                            'category_id' => $validated['category_id'],
                            'competition_type' => 'regular',
                            
                            // ✅ ใช้ field ที่ถูกต้อง
                            'level' => $validated['level'],
                            'max_student' => $validated['max_student'],
                            'max_teacher' => $validated['max_teacher'],
                            'max_judge' => 3,
                            
                            // วันที่
                            'start_date' => $validated['registration_start_date'],
                            'end_date' => $validated['registration_end_date'],
                            'registration_start_date' => $validated['registration_start_date'],
                            'registration_end_date' => $validated['registration_end_date'],
                            
                            // Group assignment
                            'school_group_id' => $groupId,
                            'competition_level' => 'group',
                            'is_master' => false,
                            
                            // Status
                            'status' => 'draft',
                            'is_active' => false,
                            'registration_status' => 'upcoming',
                            'auto_close_registration' => true,
                            'advancement_count' => 2,
                        ]);
                        
                        $created[] = $competition;
                    } catch (\Exception $e) {
                        $errors[] = [
                            'group_id' => $groupId,
                            'error' => $e->getMessage()
                        ];
                    }
                }
            }

            if (empty($created)) {
                DB::rollBack();
                return response()->json([
                    'success' => false,
                    'message' => 'ไม่สามารถสร้างการแข่งขันได้',
                    'errors' => $errors,
                ], 500);
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'สร้างการแข่งขันสำเร็จ',
                'data' => [
                    'total_created' => count($created),
                    'competitions_per_group' => count($masterCompetitions ?? [1]),
                    'groups' => count($schoolGroupIds),
                    'registration_period' => [
                        'start' => $validated['registration_start_date'],
                        'end' => $validated['registration_end_date'],
                    ],
                    'errors' => $errors,
                ],
            ], 200);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Bulk create competitions error: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'เกิดข้อผิดพลาดในการสร้างการแข่งขัน',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * ⭐ NEW: Set competition schedule (Group Admin only)
     * PUT /api/competitions/{id}/schedule
     */
    public function setSchedule(Request $request, $id)
    {
        $competition = Competition::findOrFail($id);

        // Check authorization (Group Admin of this group)
        $user = $request->user();
        if ($user->role !== 'group_admin' || $user->school_group_id !== $competition->school_group_id) {
            return response()->json([
                'success' => false,
                'message' => 'คุณไม่มีสิทธิ์กำหนดวันแข่งขันนี้',
            ], 403);
        }

        // Check if registration is closed
        if ($competition->registration_status !== 'closed') {
            return response()->json([
                'success' => false,
                'message' => 'ต้องปิดรับสมัครก่อนจึงจะกำหนดวันแข่งขันได้',
            ], 400);
        }

        $validated = $request->validate([
            'competition_date' => 'required|date|after:registration_end_date',
            'competition_start_time' => 'nullable|date_format:H:i',
            'competition_end_time' => 'nullable|date_format:H:i|after:competition_start_time',
            'venue' => 'required|string|max:500',
            'notes' => 'nullable|string|max:1000',
        ]);

        $competition->update($validated);

        // Update participants count
        $competition->updateParticipantsCount();

        // TODO: Send notifications to participants

        return response()->json([
            'success' => true,
            'message' => 'กำหนดวันแข่งขันสำเร็จ',
            'data' => [
                'competition_id' => $competition->id,
                'competition_date' => $competition->competition_date,
                'participants_count' => $competition->participants_count,
            ],
        ]);
    }

    /**
     * ⭐ NEW: Get participants summary (after registration closed)
     * GET /api/competitions/{id}/participants-summary
     */
    public function participantsSummary($id)
    {
        $competition = Competition::with([
            'registrations' => function($query) {
                $query->with(['school', 'students', 'teachers']);
            }
        ])->findOrFail($id);

        $summary = [
            'total_registrations' => $competition->registrations->count(),
            'approved' => $competition->registrations->where('status', 'approved')->count(),
            'pending' => $competition->registrations->where('status', 'pending')->count(),
            'rejected' => $competition->registrations->where('status', 'rejected')->count(),
        ];

        $participants = $competition->registrations()
            ->where('status', 'approved')
            ->with(['school', 'students', 'teachers'])
            ->get()
            ->map(function($reg) {
                return [
                    'id' => $reg->id,
                    'student_name' => $reg->students[0]['name'] ?? '',
                    'student_grade' => $reg->students[0]['grade'] ?? '',
                    'student_class' => $reg->students[0]['class'] ?? '',
                    'school_name' => $reg->school->name ?? '',
                    'teacher_name' => $reg->teachers[0]['name'] ?? '',
                    'contact_phone' => $reg->contact_phone,
                ];
            });

        return response()->json([
            'success' => true,
            'data' => [
                'competition' => [
                    'id' => $competition->id,
                    'name' => $competition->name,
                    'registration_closed' => $competition->registration_status === 'closed',
                ],
                'summary' => $summary,
                'participants' => $participants,
                'schedule_status' => $competition->competition_date ? 'scheduled' : 'pending',
                'competition_date' => $competition->competition_date,
                'venue' => $competition->venue,
            ],
        ]);
    }

    /**
     * ⭐ NEW: Advance winners to district level
     * POST /api/competitions/{id}/advance-winners
     */
    public function advanceWinners(Request $request, $id)
    {
        $competition = Competition::findOrFail($id);

        // Check authorization
        $user = $request->user();
        if ($user->role !== 'group_admin' || $user->school_group_id !== $competition->school_group_id) {
            return response()->json([
                'success' => false,
                'message' => 'คุณไม่มีสิทธิ์ส่งผู้ชนะจากการแข่งขันนี้',
            ], 403);
        }

        $validated = $request->validate([
            'winners' => 'required|array|min:1|max:2',
            'winners.*.result_id' => 'required|exists:results,id',
            'winners.*.rank' => 'required|integer|min:1|max:2',
            'winners.*.registration_id' => 'required|exists:registrations,id',
        ]);

        DB::beginTransaction();
        try {
            // Find or create district competition
            $districtCompetition = Competition::firstOrCreate([
                'parent_competition_id' => $competition->parent_competition_id ?? $competition->id,
                'level' => 'district',
                'category_id' => $competition->category_id,
            ], [
                'name' => $competition->name . ' - ระดับเขต',
                'code' => 'DIST-' . ($competition->parent_competition_id ?? $competition->id),
                'level_type' => $competition->level_type,
                'max_students' => $competition->max_students,
                'max_teachers' => $competition->max_teachers,
                'school_group_id' => null, // District level has no specific group
                'status' => 'draft',
                'is_active' => false,
                'registration_status' => 'closed',
            ]);

            $advancedRegistrations = [];

            foreach ($validated['winners'] as $winner) {
                $sourceRegistration = Registration::find($winner['registration_id']);
                
                // Create district registration
                $districtRegistration = Registration::create([
                    'competition_id' => $districtCompetition->id,
                    'school_id' => $sourceRegistration->school_id,
                    'students' => $sourceRegistration->students,
                    'teachers' => $sourceRegistration->teachers,
                    'contact_phone' => $sourceRegistration->contact_phone,
                    'notes' => $sourceRegistration->notes,
                    'status' => 'approved', // Auto-approved
                    'source_result_id' => $winner['result_id'],
                    'auto_generated' => true,
                    'advancement_rank' => $winner['rank'],
                ]);

                // Track advancement
                CompetitionAdvancement::create([
                    'source_competition_id' => $competition->id,
                    'source_result_id' => $winner['result_id'],
                    'source_rank' => $winner['rank'],
                    'target_competition_id' => $districtCompetition->id,
                    'target_registration_id' => $districtRegistration->id,
                    'advanced_by' => $user->id,
                    'advanced_at' => now(),
                    'status' => 'confirmed',
                ]);

                $advancedRegistrations[] = $districtRegistration;
            }

            // Update district competition participants count
            $districtCompetition->updateParticipantsCount();

            DB::commit();

            // TODO: Notify District Admin

            return response()->json([
                'success' => true,
                'message' => 'ส่งผู้ชนะไปแข่งขันระดับเขตสำเร็จ',
                'data' => [
                    'district_competition_id' => $districtCompetition->id,
                    'district_registrations' => collect($advancedRegistrations)->map(fn($r) => [
                        'id' => $r->id,
                        'student' => $r->students[0]['name'] ?? '',
                        'rank' => $r->advancement_rank,
                    ]),
                ],
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Advance winners error: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'เกิดข้อผิดพลาดในการส่งผู้ชนะ',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Update competition (with access control)
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        $competition = Competition::findOrFail($id);

        // ✅ Check access permission
        if ($this->shouldFilterBySchoolGroup($user)) {
            if ($competition->school_group_id != $user->school_group_id) {
                return response()->json([
                    'success' => false,
                    'message' => 'คุณไม่มีสิทธิ์แก้ไขการแข่งขันนี้'
                ], 403);
            }
        }

        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|required|string|max:255',
            'code' => 'sometimes|required|string|unique:competitions,code,' . $id,
            'category_id' => 'sometimes|required|exists:categories,id',
            'competition_type' => 'sometimes|required|string',
            'level' => 'sometimes|required|string',
            'max_students' => 'sometimes|required|integer|min:1',
            'max_teachers' => 'sometimes|required|integer|min:1',
            'max_judges' => 'sometimes|required|integer|min:1',
            'start_date' => 'sometimes|required|date',
            'end_date' => 'sometimes|required|date|after_or_equal:start_date',
            'registration_start_date' => 'sometimes|required|date',
            'registration_end_date' => 'sometimes|required|date',
            'venue' => 'nullable|string',
            'registration_status' => 'sometimes|required|in:open,closed',
            'is_active' => 'sometimes|required|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }

        $data = $request->all();

        // ✅ Prevent group_admin from changing school_group_id
        if ($this->shouldFilterBySchoolGroup($user)) {
            unset($data['school_group_id']);
        }

        $competition->update($data);

        return response()->json([
            'success' => true,
            'message' => 'อัปเดตการแข่งขันสำเร็จ',
            'data' => $competition->load('category')
        ]);
    }

    /**
     * Delete competition (with access control)
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        $competition = Competition::findOrFail($id);

        // ✅ Check access permission
        if ($this->shouldFilterBySchoolGroup($user)) {
            if ($competition->school_group_id != $user->school_group_id) {
                return response()->json([
                    'success' => false,
                    'message' => 'คุณไม่มีสิทธิ์ลบการแข่งขันนี้'
                ], 403);
            }
        }

        $competition->delete();

        return response()->json([
            'success' => true,
            'message' => 'ลบการแข่งขันสำเร็จ'
        ]);
    }

    /**
     * ✅ Helper: Check if user should see only their school group
     */
    private function shouldFilterBySchoolGroup($user): bool
    {
        // Group admin always sees only their group
        if ($user && $user->role === 'group_admin') {
            return true;
        }

        // Committee at group level sees only their group
        if ($user && $user->role === 'committee' && $user->committee_level === 'group') {
            return true;
        }

        // Teacher sees only their group
        if ($user && $user->role === 'teacher') {
            return true;
        }

        return false;
    }

    /**
     * ✅ Helper: Check if user can view all groups
     */
    private function canViewAllGroups($user): bool
    {
        // District admin can view all
        if ($user->role === 'admin') {
            return true;
        }

        // Committee at district level can view all
        if ($user->role === 'committee' && $user->committee_level === 'district') {
            return true;
        }

        return false;
    }

    /**
     * ✅ Get scorable registrations for a competition
     * 
     * Returns approved registrations that can be scored
     * Filters by school group for group_admin
     * 
     * @param Request $request
     * @param int $id Competition ID
     * @return JsonResponse
     */
    public function getScorableRegistrations(Request $request, int $id): JsonResponse
    {
        try {
            $user = $request->user();
            
            // Get competition
            $competition = Competition::with(['category'])->findOrFail($id);
            
            // Check access permission
            if ($this->shouldFilterBySchoolGroup($user)) {
                if ($competition->school_group_id != $user->school_group_id && 
                    $competition->competition_level !== 'district') {
                    return response()->json([
                        'success' => false,
                        'message' => 'คุณไม่มีสิทธิ์เข้าถึงการแข่งขันนี้'
                    ], 403);
                }
            }
            
            // Build query for approved registrations
            $query = Registration::with(['school', 'teacher', 'score'])
                ->where('competition_id', $id)
                ->where('status', 'approved');
            
            // Filter by school group for group_admin
            if ($user->role === 'group_admin') {
                $schoolIds = DB::table('schools')
                    ->where('school_group_id', $user->school_group_id)
                    ->pluck('id');
                $query->whereIn('school_id', $schoolIds);
            }
            
            $registrations = $query->orderBy('created_at', 'asc')->get();
            
            Log::info('Scorable registrations fetched', [
                'competition_id' => $id,
                'user_id' => $user->id,
                'user_role' => $user->role,
                'count' => $registrations->count()
            ]);
            
            return response()->json([
                'success' => true,
                'data' => [
                    'competition' => $competition,
                    'registrations' => $registrations
                ]
            ]);
            
        } catch (\Exception $e) {
            Log::error('Error fetching scorable registrations', [
                'competition_id' => $id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'เกิดข้อผิดพลาดในการดึงข้อมูล',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * ประกาศผล (Publish Results)
     * 
     * เฉพาะ Admin, District Admin, Group Admin
     */
    public function publish($id)
    {
        try {
            $competition = Competition::findOrFail($id);
            $user = auth()->user();

            // ตรวจสอบสิทธิ์
            if (!in_array($user->role, ['admin', 'district_admin', 'group_admin'])) {
                return response()->json([
                    'error' => 'Unauthorized',
                    'message' => 'คุณไม่มีสิทธิ์ประกาศผล'
                ], 403);
            }

            // ตรวจสอบว่าเป็น group_admin → ต้องเป็นกลุ่มตัวเอง
            if ($user->role === 'group_admin' && $competition->school_group_id !== $user->school_group_id) {
                return response()->json([
                    'error' => 'Unauthorized',
                    'message' => 'คุณสามารถประกาศผลได้เฉพาะกลุ่มของคุณเท่านั้น'
                ], 403);
            }

            // 🔍 Log ก่อน update
            Log::info('🔍 Before publish update', [
                'competition_id' => $id,
                'current_is_published' => $competition->is_published,
                'current_published_at' => $competition->published_at,
                'user_id' => $user->id
            ]);

            // ประกาศผล - ใช้ DB transaction
            \DB::beginTransaction();
            
            $competition->is_published = true;
            $competition->published_at = now();
            $saved = $competition->save();
            
            \DB::commit();

            // Force refresh จาก database
            $competition->refresh();

            // ✅ Log หลัง update
            Log::info('✅ After publish update', [
                'competition_id' => $id,
                'new_is_published' => $competition->is_published,
                'new_published_at' => $competition->published_at,
                'save_result' => $saved,
                'user_id' => $user->id
            ]);

            Log::info('Competition published', [
                'competition_id' => $id,
                'published_by' => $user->id,
                'user_role' => $user->role
            ]);

            return response()->json([
                'success' => true,
                'message' => 'ประกาศผลสำเร็จ',
                'competition' => $competition
            ]);

        } catch (\Exception $e) {
            \DB::rollBack();
            
            Log::error('Error publishing competition', [
                'competition_id' => $id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'เกิดข้อผิดพลาดในการประกาศผล',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * ยกเลิกประกาศผล (Unpublish Results)
     * 
     * เฉพาะ Admin, District Admin, Group Admin
     */
    public function unpublish($id)
    {
        try {
            $competition = Competition::findOrFail($id);
            $user = auth()->user();

            // ตรวจสอบสิทธิ์
            if (!in_array($user->role, ['admin', 'district_admin', 'group_admin'])) {
                return response()->json([
                    'error' => 'Unauthorized',
                    'message' => 'คุณไม่มีสิทธิ์ยกเลิกประกาศผล'
                ], 403);
            }

            // ตรวจสอบว่าเป็น group_admin → ต้องเป็นกลุ่มตัวเอง
            if ($user->role === 'group_admin' && $competition->school_group_id !== $user->school_group_id) {
                return response()->json([
                    'error' => 'Unauthorized',
                    'message' => 'คุณสามารถยกเลิกประกาศผลได้เฉพาะกลุ่มของคุณเท่านั้น'
                ], 403);
            }

            // 🔍 Log ก่อน update
            Log::info('🔍 Before unpublish update', [
                'competition_id' => $id,
                'current_is_published' => $competition->is_published,
                'current_published_at' => $competition->published_at
            ]);

            // ยกเลิกประกาศผล - ใช้ DB transaction
            \DB::beginTransaction();
            
            $competition->is_published = false;
            $competition->published_at = null;
            $saved = $competition->save();
            
            \DB::commit();

            // Force refresh จาก database
            $competition->refresh();

            // ✅ Log หลัง update
            Log::info('✅ After unpublish update', [
                'competition_id' => $id,
                'new_is_published' => $competition->is_published,
                'new_published_at' => $competition->published_at,
                'save_result' => $saved
            ]);

            Log::info('Competition unpublished', [
                'competition_id' => $id,
                'unpublished_by' => $user->id,
                'user_role' => $user->role
            ]);

            return response()->json([
                'success' => true,
                'message' => 'ยกเลิกประกาศผลสำเร็จ',
                'competition' => $competition
            ]);

        } catch (\Exception $e) {
            \DB::rollBack();
            
            Log::error('Error unpublishing competition', [
                'competition_id' => $id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'เกิดข้อผิดพลาดในการยกเลิกประกาศผล',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
