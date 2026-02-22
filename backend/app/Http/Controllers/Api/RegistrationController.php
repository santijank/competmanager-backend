<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Registration;
use App\Models\Competition;
use App\Models\School;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use App\Models\SystemSetting;
use Barryvdh\DomPDF\Facade\Pdf;

class RegistrationController extends Controller
{
    /**
     * ✅ Get all registrations with role-based filtering
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $query = Registration::with(['competition.category', 'competition.schoolGroup', 'school.schoolGroup']);

        // ✅ ROLE-BASED ACCESS CONTROL
        if ($user) {
            if (in_array($user->role, ['school_admin', 'teacher'])) {
                // School Admin/Teacher เห็นเฉพาะโรงเรียนตัวเอง
                if ($user->school_id) {
                    $query->where('school_id', $user->school_id);
                } else {
                    // ถ้าไม่มี school_id ให้ค้นหาผ่าน school_group_id
                    $schoolIds = $this->getSchoolIdsByGroup($user->school_group_id);
                    $query->whereIn('school_id', $schoolIds);
                }
            } elseif ($user->role === 'group_admin') {
                // Group Admin เห็นทั้งกลุ่ม
                if ($user->school_group_id) {
                    $schoolIds = $this->getSchoolIdsByGroup($user->school_group_id);
                    $query->whereIn('school_id', $schoolIds);
                }
            } elseif (in_array($user->role, ['category_admin', 'data_entry'])) {
                // Category Admin/Data Entry เห็นเฉพาะหมวดหมู่ของตน (รวมทุกหมวดพิเศษเรียนรวม)
                $categoryIds = $user->getCategoryIdsForScope();
                if (!empty($categoryIds)) {
                    $query->whereHas('competition', function($q) use ($categoryIds, $user) {
                        $q->whereIn('category_id', $categoryIds);
                        if ($user->competition_name_filter) {
                            $filter = $user->competition_name_filter;
                            if (str_starts_with($filter, '!')) {
                                $q->where('name', 'NOT LIKE', '%' . substr($filter, 1) . '%');
                            } else {
                                $q->where('name', 'LIKE', '%' . $filter . '%');
                            }
                        }
                    });
                }
            }
            // District Admin/Admin เห็นได้ทั้งหมด
        }

        // ✅ Additional filters
        if ($request->has('competition_id')) {
            $query->where('competition_id', $request->competition_id);
        }

        if ($request->has('status') && $request->status) {
            $query->where('status', $request->status);
        }

        if ($request->has('school_id') && $this->canViewAllSchools($user)) {
            $query->where('school_id', $request->school_id);
        }

        // ✅ Filter ตาม competition_level (district / group)
        if ($request->filled('competition_level')) {
            $compLevel = $request->competition_level;
            $query->whereHas('competition', function($q) use ($compLevel) {
                $q->where('competition_level', $compLevel);
            });
        }

        // ✅ Filter ตาม school_group_id ของ competition
        if ($request->has('school_group_id') && $request->school_group_id && $this->canViewAllSchools($user)) {
            $query->whereHas('competition', function($q) use ($request) {
                $q->where('school_group_id', $request->school_group_id);
            });
        }

        // ✅ รองรับ paginate=false เพื่อดึงข้อมูลทั้งหมด
        $shouldPaginate = $request->input('paginate', 'true');

        // แปลง string 'false' เป็น boolean
        if ($shouldPaginate === 'false' || $shouldPaginate === false) {
            // ดึงทั้งหมดโดยไม่ paginate
            $registrations = $query->orderBy('created_at', 'desc')->get();

            return response()->json([
                'success' => true,
                'data' => $registrations,
                'meta' => [
                    'total' => $registrations->count(),
                    'paginated' => false,
                ]
            ]);
        }

        // Paginate ตามปกติ
        $perPage = $request->input('per_page', 15);
        $registrations = $query->orderBy('created_at', 'desc')->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $registrations->items(),
            'meta' => [
                'current_page' => $registrations->currentPage(),
                'last_page' => $registrations->lastPage(),
                'per_page' => $registrations->perPage(),
                'total' => $registrations->total(),
                'paginated' => true,
            ]
        ]);
    }

    /**
     * Get single registration (with access control)
     */
    public function show(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        $registration = Registration::with(['competition', 'school'])->findOrFail($id);

        // ✅ Check access permission
        if ($this->shouldFilterBySchoolGroup($user)) {
            $schoolIds = $this->getSchoolIdsByGroup($user->school_group_id);
            if (!in_array($registration->school_id, $schoolIds)) {
                return response()->json([
                    'success' => false,
                    'message' => 'คุณไม่มีสิทธิ์เข้าถึงการลงทะเบียนนี้'
                ], 403);
            }
        }

        return response()->json([
            'success' => true,
            'data' => $registration
        ]);
    }

    /**
     * ✅ Create new registration
     * Permissions: School Admin, Group Admin, District Admin, Admin
     */
    public function store(Request $request): JsonResponse
    {
        $user = $request->user();

        // ✅ ตรวจสอบสิทธิ์การลงทะเบียน
        if (!$this->canRegister($user)) {
            return response()->json([
                'success' => false,
                'message' => 'คุณไม่มีสิทธิ์ลงทะเบียนการแข่งขัน'
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'competition_id' => 'required|exists:competitions,id',
            'school_id' => 'nullable|exists:schools,id',
            'team_name' => 'required|string|max:255',
            'student_names' => 'required|array|min:1',
            'teacher_names' => 'nullable|array',
            'notes' => 'nullable|string|max:1000',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'ข้อมูลไม่ถูกต้อง',
                'errors' => $validator->errors()
            ], 422);
        }

        // ✅ แปลง student_names และ teacher_names ให้เป็น array of strings (รองรับทั้ง 2 รูปแบบ)
        $studentNames = collect($request->student_names)->map(function($item) {
            return is_array($item) ? ($item['name'] ?? '') : $item;
        })->filter()->values()->toArray();

        $teacherNames = collect($request->teacher_names ?? [])->map(function($item) {
            return is_array($item) ? ($item['name'] ?? '') : $item;
        })->filter()->values()->toArray();

        // ✅ ถ้าไม่ส่ง school_id มา ให้ใช้ school_id ของ user
        $schoolId = $request->school_id ?? $user->school_id;
        if (!$schoolId) {
            return response()->json([
                'success' => false,
                'message' => 'กรุณาระบุโรงเรียน'
            ], 422);
        }

        // ✅ ตรวจสอบสิทธิ์การลงทะเบียนให้โรงเรียน
        // School Admin และ Teacher สามารถลงทะเบียนได้เฉพาะโรงเรียนตัวเอง
        if (in_array($user->role, ['school_admin', 'teacher'])) {
            if ($user->school_id && $schoolId != $user->school_id) {
                return response()->json([
                    'success' => false,
                    'message' => 'คุณสามารถลงทะเบียนได้เฉพาะโรงเรียนของตัวเองเท่านั้น'
                ], 403);
            }
        } elseif ($user->role === 'group_admin') {
            // Group Admin สามารถลงทะเบียนได้เฉพาะโรงเรียนในกลุ่ม
            $school = School::findOrFail($schoolId);
            if ($user->school_group_id && $school->school_group_id !== $user->school_group_id) {
                return response()->json([
                    'success' => false,
                    'message' => 'คุณสามารถลงทะเบียนได้เฉพาะโรงเรียนในกลุ่มของตัวเองเท่านั้น'
                ], 403);
            }
        }

        // ✅ ตรวจสอบการแข่งขันเปิดรับสมัครหรือไม่
        $competition = Competition::findOrFail($request->competition_id);
        if (method_exists($competition, 'isRegistrationOpen') && !$competition->isRegistrationOpen()) {
            // ข้ามการตรวจสอบถ้า competition ไม่มี registration_status หรือเปิดอยู่
            if ($competition->registration_status && $competition->registration_status !== 'open') {
                return response()->json([
                    'success' => false,
                    'message' => 'การแข่งขันนี้ไม่เปิดรับสมัครแล้ว'
                ], 422);
            }
        }

        // ✅ ตรวจสอบว่ากลุ่มโรงเรียนถูกยกเว้นจากการลงทะเบียนหรือไม่
        $school = School::findOrFail($schoolId);

        // ✅ Bypass: ถ้าเป็น district + skip_group_level → อนุญาตให้ลงทะเบียนตรง (ไม่ต้องเช็ค exclusion ของ group)
        $isSkipGroupLevel = $competition->competition_level === 'district' && $competition->skip_group_level;

        if (!$isSkipGroupLevel && $school->school_group_id && $competition->isSchoolGroupExcluded($school->school_group_id)) {
            return response()->json([
                'success' => false,
                'message' => 'กลุ่มโรงเรียนของคุณไม่สามารถลงทะเบียนกิจกรรมนี้ได้',
                'reason' => $competition->exclusion_reason ?? 'กิจกรรมนี้ไม่เปิดให้กลุ่มโรงเรียนของคุณลงทะเบียน'
            ], 403);
        }

        // ✅ ตรวจสอบการลงทะเบียนซ้ำ (รวมทุก status ยกเว้น cancelled และ rejected)
        $existingRegistration = Registration::where('competition_id', $request->competition_id)
            ->where('school_id', $schoolId)
            ->whereNotIn('status', ['cancelled', 'rejected'])
            ->first();

        if ($existingRegistration) {
            $statusText = $existingRegistration->status === 'approved' ? 'อนุมัติแล้ว' : 'รอการอนุมัติ';
            return response()->json([
                'success' => false,
                'message' => "โรงเรียนนี้ลงทะเบียนการแข่งขันนี้แล้ว (สถานะ: {$statusText})",
                'existing_registration_id' => $existingRegistration->id
            ], 422);
        }

        try {
            // ใช้ DB Transaction เพื่อป้องกัน race condition
            DB::beginTransaction();
            // ✅ Auto-approve สำหรับ District Admin
            $status = 'pending';
            if (in_array($user->role, ['admin', 'district_admin'])) {
                $status = 'approved';
            }

            $registration = Registration::create([
                'competition_id' => $request->competition_id,
                'school_id' => $schoolId,
                'teacher_id' => $user->id,
                'team_name' => $request->team_name,
                'student_names' => $studentNames,
                'student_count' => count($studentNames),
                'teacher_names' => $teacherNames,
                'teacher_count' => count($teacherNames),
                'status' => $status,
                'notes' => $request->notes,
                'registration_date' => now()->toDateString(),
                'approved_at' => $status === 'approved' ? now() : null,
                'approved_by' => $status === 'approved' ? $user->id : null,
            ]);

            DB::commit();

            Log::info('Registration created', [
                'registration_id' => $registration->id,
                'registered_by' => $user->id,
                'user_role' => $user->role
            ]);

            return response()->json([
                'success' => true,
                'message' => 'ลงทะเบียนสำเร็จ',
                'data' => $registration->load(['competition', 'school'])
            ], 201);

        } catch (\Illuminate\Database\QueryException $e) {
            DB::rollBack();

            // ตรวจสอบว่าเป็น duplicate entry error หรือไม่
            if ($e->errorInfo[1] == 1062) {
                return response()->json([
                    'success' => false,
                    'message' => 'โรงเรียนนี้ลงทะเบียนการแข่งขันนี้แล้ว'
                ], 422);
            }

            Log::error('Registration creation failed (QueryException)', [
                'error' => $e->getMessage(),
                'user_id' => $user->id
            ]);

            return response()->json([
                'success' => false,
                'message' => 'เกิดข้อผิดพลาดในการลงทะเบียน',
                'error' => $e->getMessage()
            ], 500);
        } catch (\Exception $e) {
            DB::rollBack();

            Log::error('Registration creation failed', [
                'error' => $e->getMessage(),
                'user_id' => $user->id
            ]);

            return response()->json([
                'success' => false,
                'message' => 'เกิดข้อผิดพลาดในการลงทะเบียน',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * ✅ Approve registration
     * Permissions: Group Admin (own group), District Admin, Admin
     */
    public function approve(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        $registration = Registration::with(['school'])->findOrFail($id);

        // ✅ ตรวจสอบสิทธิ์การอนุมัติ
        if (!$this->canApprove($user, $registration)) {
            return response()->json([
                'success' => false,
                'message' => 'คุณไม่มีสิทธิ์อนุมัติการลงทะเบียนนี้'
            ], 403);
        }

        if ($registration->status === 'approved') {
            return response()->json([
                'success' => false,
                'message' => 'การลงทะเบียนนี้อนุมัติแล้ว'
            ], 422);
        }

        try {
            $registration->update([
                'status' => 'approved',
                'approved_by' => $user->id,
                'approved_at' => now(),
            ]);

            Log::info('Registration approved', [
                'registration_id' => $id,
                'approved_by' => $user->id,
                'user_role' => $user->role
            ]);

            return response()->json([
                'success' => true,
                'message' => 'อนุมัติการลงทะเบียนสำเร็จ',
                'data' => $registration
            ]);

        } catch (\Exception $e) {
            Log::error('Registration approval failed', [
                'registration_id' => $id,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'เกิดข้อผิดพลาดในการอนุมัติ'
            ], 500);
        }
    }

    /**
     * ✅ Reject registration
     */
    public function reject(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        $registration = Registration::with(['school'])->findOrFail($id);

        if (!$this->canApprove($user, $registration)) {
            return response()->json([
                'success' => false,
                'message' => 'คุณไม่มีสิทธิ์ปฏิเสธการลงทะเบียนนี้'
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'admin_notes' => 'nullable|string|max:1000',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $registration->update([
                'status' => 'rejected',
                'admin_notes' => $request->admin_notes,
                'reviewed_by' => $user->id,
                'reviewed_at' => now(),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'ปฏิเสธการลงทะเบียนสำเร็จ',
                'data' => $registration
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'เกิดข้อผิดพลาดในการปฏิเสธ'
            ], 500);
        }
    }

    /**
     * ✅ Bulk approve registrations
     */
    public function bulkApprove(Request $request): JsonResponse
    {
        $user = $request->user();

        $validator = Validator::make($request->all(), [
            'registration_ids' => 'required|array|min:1',
            'registration_ids.*' => 'required|integer|exists:registrations,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $registrations = Registration::with(['school'])->whereIn('id', $request->registration_ids)->get();
            
            $approved = 0;
            $errors = [];

            foreach ($registrations as $registration) {
                if (!$this->canApprove($user, $registration)) {
                    $errors[] = "ไม่มีสิทธิ์อนุมัติการลงทะเบียน ID: {$registration->id}";
                    continue;
                }

                if ($registration->status !== 'pending') {
                    // skip เงียบๆ ถ้าไม่ใช่ pending (อาจถูกอนุมัติไปแล้วก่อนหน้า)
                    continue;
                }

                $registration->update([
                    'status' => 'approved',
                    'approved_by' => $user->id,
                    'approved_at' => now(),
                ]);

                $approved++;
            }

            return response()->json([
                'success' => true,
                'message' => "อนุมัติสำเร็จ {$approved} รายการ",
                'approved_count' => $approved,
                'errors' => $errors
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'เกิดข้อผิดพลาดในการอนุมัติ'
            ], 500);
        }
    }

    /**
     * ✅ Update registration
     * Permissions: Group Admin (own group), District Admin, Admin, School Admin (own registration)
     */
    public function update(Request $request, int $id): JsonResponse
    {
        try {
            $user = $request->user();
            $registration = Registration::with(['school'])->findOrFail($id);

            // ✅ ตรวจสอบสิทธิ์การแก้ไข
            if (!$this->canEdit($user, $registration)) {
                return response()->json([
                    'success' => false,
                    'message' => 'คุณไม่มีสิทธิ์แก้ไขการลงทะเบียนนี้'
                ], 403);
            }

            $validator = Validator::make($request->all(), [
                'team_name' => 'sometimes|string|max:255',
                'student_names' => 'sometimes|array|min:1',
                'student_names.*' => 'required|string|max:255',
                'teacher_names' => 'nullable|array',
                'teacher_names.*' => 'nullable|string|max:255',
                'notes' => 'nullable|string|max:1000',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'ข้อมูลไม่ถูกต้อง',
                    'errors' => $validator->errors()
                ], 422);
            }

            $updateData = [];

            // ✅ ตรวจสอบช่วงเวลาเปิดแก้ไข + การเปลี่ยนชื่อ - โรงเรียนแก้ได้แค่ typo
            if (!$this->isAdminRole($user)) {
                // ตรวจสอบช่วงเวลาเปิดแก้ไขรายชื่อ
                if (!SystemSetting::isEditNameAllowed()) {
                    return response()->json([
                        'success' => false,
                        'message' => 'ขณะนี้ไม่อยู่ในช่วงเวลาที่อนุญาตให้แก้ไขรายชื่อ กรุณาติดต่อผู้ดูแลระบบ'
                    ], 403);
                }
                $nameErrors = [];

                // ดึงชื่อเดิมจาก registration
                $oldStudentNames = is_string($registration->student_names)
                    ? json_decode($registration->student_names, true)
                    : ($registration->student_names ?? []);
                $oldTeacherNames = is_string($registration->teacher_names)
                    ? json_decode($registration->teacher_names, true)
                    : ($registration->teacher_names ?? []);

                // แปลง object array เป็น string array ถ้าจำเป็น
                $oldStudentNames = array_map(fn($s) => is_array($s) ? ($s['name'] ?? '') : $s, $oldStudentNames);
                $oldTeacherNames = array_map(fn($t) => is_array($t) ? ($t['name'] ?? '') : $t, $oldTeacherNames);

                if ($request->has('student_names')) {
                    $newStudentNames = $request->student_names;
                    $nameErrors = array_merge($nameErrors,
                        $this->validateNameChanges($oldStudentNames, $newStudentNames, 'นักเรียน'));
                }

                if ($request->has('teacher_names')) {
                    $newTeacherNames = $request->teacher_names ?? [];
                    $nameErrors = array_merge($nameErrors,
                        $this->validateNameChanges($oldTeacherNames, $newTeacherNames, 'ครูผู้ฝึกสอน'));
                }

                if (!empty($nameErrors)) {
                    return response()->json([
                        'success' => false,
                        'message' => 'การแก้ไขชื่อเปลี่ยนแปลงมากเกินไป',
                        'errors' => ['name_changes' => $nameErrors]
                    ], 422);
                }
            }

            if ($request->has('team_name')) {
                $updateData['team_name'] = $request->team_name;
            }

            if ($request->has('student_names')) {
                $updateData['student_names'] = $request->student_names;
                $updateData['student_count'] = count($request->student_names);
            }

            if ($request->has('teacher_names')) {
                $updateData['teacher_names'] = $request->teacher_names ?? [];
                $updateData['teacher_count'] = $request->teacher_names ? count($request->teacher_names) : 0;
            }

            if ($request->has('notes')) {
                $updateData['notes'] = $request->notes;
            }

            $registration->update($updateData);

            Log::info('Registration updated', [
                'registration_id' => $id,
                'updated_by' => $user->id,
                'user_role' => $user->role
            ]);

            return response()->json([
                'success' => true,
                'message' => 'อัพเดทการลงทะเบียนสำเร็จ',
                'data' => $registration->fresh()->load(['competition', 'school'])
            ]);

        } catch (\Exception $e) {
            Log::error('Registration update error', ['error' => $e->getMessage()]);

            return response()->json([
                'success' => false,
                'message' => 'เกิดข้อผิดพลาดในการอัพเดท',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * ✅ เปลี่ยนตัวผู้เข้าแข่งขัน (ระดับเขต)
     * เกณฑ์: 2-3 คน=1, 4-6=2, 7-10=3, 11-20=4, 21+=5
     */
    public function changeParticipant(Request $request, int $id): JsonResponse
    {
        try {
            $user = $request->user();
            $registration = Registration::with(['competition', 'school'])->findOrFail($id);

            // ตรวจสอบว่าเป็นระดับเขตและอนุมัติแล้ว
            if ($registration->competition->competition_level !== 'district') {
                return response()->json([
                    'success' => false,
                    'message' => 'การเปลี่ยนตัวใช้ได้เฉพาะการแข่งขันระดับเขตเท่านั้น'
                ], 422);
            }

            if ($registration->status !== 'approved') {
                return response()->json([
                    'success' => false,
                    'message' => 'สามารถเปลี่ยนตัวได้เฉพาะรายการที่อนุมัติแล้ว'
                ], 422);
            }

            // ตรวจสอบสิทธิ์ (ครูเจ้าของ, school_admin โรงเรียนเดียวกัน, admin)
            if (!$this->isAdminRole($user)) {
                if ($user->school_id !== $registration->school_id) {
                    return response()->json([
                        'success' => false,
                        'message' => 'คุณไม่มีสิทธิ์เปลี่ยนตัวผู้เข้าแข่งขันนี้'
                    ], 403);
                }
            }

            $validator = Validator::make($request->all(), [
                'old_name' => 'required|string',
                'new_name' => 'required|string|max:255',
                'reason' => 'nullable|string|max:500',
                'change_type' => 'sometimes|string|in:student,teacher',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'ข้อมูลไม่ถูกต้อง',
                    'errors' => $validator->errors()
                ], 422);
            }

            $changeType = $request->input('change_type', 'student');
            $oldName = $request->old_name;
            $newName = $request->new_name;

            if ($changeType === 'teacher') {
                // ===== เปลี่ยนครูผู้ฝึกสอน (ไม่จำกัดโควตา) =====
                $teacherNames = $registration->teacher_names ?? [];
                $found = false;

                foreach ($teacherNames as $index => $teacher) {
                    $name = is_array($teacher) ? ($teacher['name'] ?? '') : $teacher;
                    if ($name === $oldName) {
                        if (is_array($teacher)) {
                            $teacherNames[$index]['name'] = $newName;
                        } else {
                            $teacherNames[$index] = $newName;
                        }
                        $found = true;
                        break;
                    }
                }

                if (!$found) {
                    return response()->json([
                        'success' => false,
                        'message' => "ไม่พบชื่อ \"{$oldName}\" ในรายชื่อครูผู้ฝึกสอน"
                    ], 422);
                }

                $registration->teacher_names = $teacherNames;
                $registration->save();

                Log::info('Teacher changed', [
                    'registration_id' => $id,
                    'old_name' => $oldName,
                    'new_name' => $newName,
                    'reason' => $request->reason,
                    'changed_by' => $user->id,
                ]);

                return response()->json([
                    'success' => true,
                    'message' => "เปลี่ยนครูสำเร็จ: \"{$oldName}\" → \"{$newName}\"",
                    'data' => $registration->fresh()->load(['competition', 'school'])
                ]);
            }

            // ===== เปลี่ยนนักเรียน (มีโควตา) =====

            // ตั้ง original_student_names ครั้งแรก (ถ้ายังไม่มี)
            if (empty($registration->original_student_names)) {
                $registration->original_student_names = $registration->student_names;
                $studentCount = is_array($registration->student_names) ? count($registration->student_names) : 0;
                $registration->max_changes_allowed = Registration::calculateMaxChanges($studentCount);
                $registration->change_count = 0;
            }

            // ตรวจสอบโควตา
            if (!$registration->canChangeParticipant()) {
                return response()->json([
                    'success' => false,
                    'message' => "ไม่สามารถเปลี่ยนตัวได้อีก (เปลี่ยนครบ {$registration->max_changes_allowed} คนแล้ว)"
                ], 422);
            }

            // หาชื่อเดิมใน student_names
            $studentNames = $registration->student_names ?? [];
            $found = false;

            foreach ($studentNames as $index => $student) {
                $name = is_array($student) ? ($student['name'] ?? '') : $student;
                if ($name === $oldName) {
                    if (is_array($student)) {
                        $studentNames[$index]['name'] = $newName;
                    } else {
                        $studentNames[$index] = $newName;
                    }
                    $found = true;
                    break;
                }
            }

            if (!$found) {
                return response()->json([
                    'success' => false,
                    'message' => "ไม่พบชื่อ \"{$oldName}\" ในรายชื่อผู้เข้าแข่งขัน"
                ], 422);
            }

            // อัพเดท
            $registration->student_names = $studentNames;
            $registration->change_count = ($registration->change_count ?? 0) + 1;
            $registration->save();

            Log::info('Participant changed', [
                'registration_id' => $id,
                'old_name' => $oldName,
                'new_name' => $newName,
                'reason' => $request->reason,
                'change_count' => $registration->change_count,
                'max_allowed' => $registration->max_changes_allowed,
                'changed_by' => $user->id,
            ]);

            return response()->json([
                'success' => true,
                'message' => "เปลี่ยนตัวสำเร็จ: \"{$oldName}\" → \"{$newName}\" (เปลี่ยนไปแล้ว {$registration->change_count}/{$registration->max_changes_allowed} คน)",
                'data' => $registration->fresh()->load(['competition', 'school'])
            ]);

        } catch (\Exception $e) {
            Log::error('Change participant error', ['error' => $e->getMessage()]);

            return response()->json([
                'success' => false,
                'message' => 'เกิดข้อผิดพลาดในการเปลี่ยนตัว',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * ✅ ตรวจสอบทีมที่ตกหล่น (สมัครระดับกลุ่มแต่ยังไม่สมัครระดับเขต)
     * สำหรับกิจกรรมที่ skip_group_level = true
     */
    public function checkMissedDistrict(Request $request): JsonResponse
    {
        try {
            $user = $request->user();

            // เฉพาะ admin/district_admin
            if (!in_array($user->role, ['admin', 'district_admin'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'ไม่มีสิทธิ์เข้าถึง'
                ], 403);
            }

            // 1. ดึง district competitions ที่ skip_group_level = true
            $skipDistrictComps = DB::table('competitions')
                ->where('competition_level', 'district')
                ->where('skip_group_level', true)
                ->select('id', 'name', 'code', 'category_id', 'level')
                ->get();

            if ($skipDistrictComps->isEmpty()) {
                return response()->json([
                    'success' => true,
                    'summary' => [
                        'total_skip_competitions' => 0,
                        'total_missed' => 0,
                        'total_already_registered' => 0,
                    ],
                    'missed' => [],
                ]);
            }

            $skipDistrictIds = $skipDistrictComps->pluck('id')->toArray();
            $skipDistrictNames = $skipDistrictComps->pluck('name')->toArray();

            // 2. หา group competitions ที่ตรงกับ district (ผ่าน parent_competition_id หรือ name matching)
            $groupComps = DB::table('competitions')
                ->where('competition_level', 'group')
                ->where(function ($q) use ($skipDistrictIds, $skipDistrictNames) {
                    $q->whereIn('parent_competition_id', $skipDistrictIds)
                      ->orWhereIn('name', $skipDistrictNames);
                })
                ->select('id', 'name', 'code', 'category_id', 'level', 'parent_competition_id', 'school_group_id')
                ->get();

            if ($groupComps->isEmpty()) {
                return response()->json([
                    'success' => true,
                    'summary' => [
                        'total_skip_competitions' => $skipDistrictComps->count(),
                        'total_missed' => 0,
                        'total_already_registered' => 0,
                    ],
                    'missed' => [],
                    'message' => 'ไม่พบกิจกรรมระดับกลุ่มที่ตรงกับกิจกรรม skip_group_level',
                ]);
            }

            $groupCompIds = $groupComps->pluck('id')->toArray();

            // สร้าง mapping: group_comp_id => district_comp
            $groupToDistrict = [];
            foreach ($groupComps as $gc) {
                // ลองหาจาก parent_competition_id ก่อน
                $matchedDistrict = $skipDistrictComps->firstWhere('id', $gc->parent_competition_id);
                // ถ้าไม่มี ลอง match ด้วยชื่อ
                if (!$matchedDistrict) {
                    $matchedDistrict = $skipDistrictComps->firstWhere('name', $gc->name);
                }
                if ($matchedDistrict) {
                    $groupToDistrict[$gc->id] = $matchedDistrict;
                }
            }

            // 3. ดึง registrations ระดับกลุ่มที่ไม่ใช่ cancelled
            $groupRegistrations = DB::table('registrations as r')
                ->join('competitions as c', 'r.competition_id', '=', 'c.id')
                ->join('schools as s', 'r.school_id', '=', 's.id')
                ->leftJoin('categories as cat', 'c.category_id', '=', 'cat.id')
                ->whereIn('r.competition_id', $groupCompIds)
                ->where('r.status', '!=', 'cancelled')
                ->select([
                    'r.id as registration_id',
                    'r.competition_id',
                    'r.school_id',
                    'r.team_name',
                    'r.student_names',
                    'r.teacher_names',
                    'r.status as group_status',
                    's.name as school_name',
                    'c.name as competition_name',
                    'c.code as competition_code',
                    'cat.name as category_name',
                ])
                ->get();

            // 4. ดึง registrations ระดับเขต (เพื่อเช็คว่าโรงเรียนสมัครเขตแล้วหรือยัง)
            $districtRegistrations = DB::table('registrations')
                ->whereIn('competition_id', $skipDistrictIds)
                ->where('status', '!=', 'cancelled')
                ->select('school_id', 'competition_id', 'status')
                ->get();

            // สร้าง set: "school_id-district_comp_id" => status
            $districtRegSet = [];
            foreach ($districtRegistrations as $dr) {
                $key = $dr->school_id . '-' . $dr->competition_id;
                $districtRegSet[$key] = $dr->status;
            }

            // 5. เปรียบเทียบ
            $missed = [];
            $alreadyRegistered = 0;

            foreach ($groupRegistrations as $gr) {
                $districtComp = $groupToDistrict[$gr->competition_id] ?? null;
                if (!$districtComp) continue;

                $key = $gr->school_id . '-' . $districtComp->id;

                if (isset($districtRegSet[$key])) {
                    $alreadyRegistered++;
                } else {
                    $studentNames = $gr->student_names;
                    if (is_string($studentNames)) {
                        $studentNames = json_decode($studentNames, true);
                    }
                    $teacherNames = $gr->teacher_names;
                    if (is_string($teacherNames)) {
                        $teacherNames = json_decode($teacherNames, true);
                    }

                    $missed[] = [
                        'school_name' => $gr->school_name,
                        'school_id' => $gr->school_id,
                        'competition_name' => $gr->competition_name,
                        'competition_code' => $gr->competition_code,
                        'category_name' => $gr->category_name,
                        'district_competition_id' => $districtComp->id,
                        'group_registration_id' => $gr->registration_id,
                        'group_status' => $gr->group_status,
                        'team_name' => $gr->team_name,
                        'student_names' => $studentNames,
                        'teacher_names' => $teacherNames,
                    ];
                }
            }

            // เรียงตามชื่อกิจกรรม แล้วโรงเรียน
            usort($missed, function ($a, $b) {
                $cmp = strcmp($a['competition_name'], $b['competition_name']);
                return $cmp !== 0 ? $cmp : strcmp($a['school_name'], $b['school_name']);
            });

            return response()->json([
                'success' => true,
                'summary' => [
                    'total_skip_competitions' => $skipDistrictComps->count(),
                    'total_group_registrations' => $groupRegistrations->count(),
                    'total_missed' => count($missed),
                    'total_already_registered' => $alreadyRegistered,
                ],
                'missed' => $missed,
            ]);

        } catch (\Exception $e) {
            Log::error('Check missed district error', ['error' => $e->getMessage()]);

            return response()->json([
                'success' => false,
                'message' => 'เกิดข้อผิดพลาด: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * ✅ ส่งทีมเข้าระดับเขต (สำหรับ admin ใหญ่เท่านั้น)
     * สร้างลงทะเบียนเขตจากข้อมูลลงทะเบียนกลุ่ม
     */
    public function promoteToDistrict(Request $request): JsonResponse
    {
        try {
            $user = $request->user();

            // เฉพาะ admin เท่านั้น
            if ($user->role !== 'admin') {
                return response()->json([
                    'success' => false,
                    'message' => 'เฉพาะ admin ใหญ่เท่านั้น'
                ], 403);
            }

            $validated = $request->validate([
                'group_registration_id' => 'required|integer|exists:registrations,id',
                'district_competition_id' => 'required|integer|exists:competitions,id',
            ]);

            $groupReg = Registration::with(['school', 'competition'])->findOrFail($validated['group_registration_id']);
            $districtComp = Competition::findOrFail($validated['district_competition_id']);

            // เช็คว่า district competition เป็น district + skip_group_level
            if ($districtComp->competition_level !== 'district') {
                return response()->json([
                    'success' => false,
                    'message' => 'กิจกรรมปลายทางต้องเป็นระดับเขต'
                ], 422);
            }

            // เช็คว่าซ้ำหรือไม่
            $existing = Registration::where('competition_id', $districtComp->id)
                ->where('school_id', $groupReg->school_id)
                ->where('status', '!=', 'cancelled')
                ->first();

            if ($existing) {
                return response()->json([
                    'success' => false,
                    'message' => 'โรงเรียนนี้สมัครระดับเขตกิจกรรมนี้แล้ว (ID: ' . $existing->id . ')'
                ], 422);
            }

            // สร้างลงทะเบียนเขตใหม่จากข้อมูลกลุ่ม
            $newReg = Registration::create([
                'competition_id' => $districtComp->id,
                'school_id' => $groupReg->school_id,
                'team_name' => $groupReg->team_name,
                'student_names' => $groupReg->student_names,
                'student_count' => $groupReg->student_count,
                'teacher_names' => $groupReg->teacher_names,
                'teacher_count' => $groupReg->teacher_count,
                'teacher_id' => $groupReg->teacher_id,
                'status' => 'approved',
                'notes' => 'ส่งเข้าระดับเขตโดย admin (จากลงทะเบียนกลุ่ม #' . $groupReg->id . ')',
                'registration_date' => now()->toDateString(),
                'approved_at' => now(),
                'approved_by' => $user->id,
            ]);

            return response()->json([
                'success' => true,
                'message' => "ส่ง \"{$groupReg->team_name}\" ({$groupReg->school->name}) เข้าระดับเขตสำเร็จ",
                'data' => $newReg->load(['competition', 'school']),
            ]);

        } catch (\Exception $e) {
            Log::error('Promote to district error', ['error' => $e->getMessage()]);

            return response()->json([
                'success' => false,
                'message' => 'เกิดข้อผิดพลาด: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * ✅ Delete registration
     * Permissions: Group Admin (own group), District Admin, Admin
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        try {
            $user = $request->user();
            $registration = Registration::with(['school'])->findOrFail($id);

            // ✅ ตรวจสอบสิทธิ์การลบ
            if (!$this->canDelete($user, $registration)) {
                return response()->json([
                    'success' => false,
                    'message' => 'คุณไม่มีสิทธิ์ลบการลงทะเบียนนี้'
                ], 403);
            }

            $registration->delete();

            Log::info('Registration deleted', [
                'registration_id' => $id,
                'deleted_by' => $user->id,
                'user_role' => $user->role
            ]);

            return response()->json([
                'success' => true,
                'message' => 'ลบการลงทะเบียนสำเร็จ'
            ]);

        } catch (\Exception $e) {
            Log::error('Registration delete error', ['error' => $e->getMessage()]);

            return response()->json([
                'success' => false,
                'message' => 'เกิดข้อผิดพลาดในการลบ',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // ============================================
    // 🔒 Helper Methods สำหรับ Role-based Access Control
    // ============================================

    /**
     * ตรวจสอบว่า user ควรถูกกรองข้อมูลตาม school_group หรือไม่
     */
    private function shouldFilterBySchoolGroup($user): bool
    {
        if (!$user) return false;
        
        return in_array($user->role, ['group_admin', 'school_admin', 'teacher']) 
               && $user->school_group_id;
    }

    /**
     * ตรวจสอบว่า user สามารถดูข้อมูลทุกโรงเรียนได้หรือไม่
     */
    private function canViewAllSchools($user): bool
    {
        if (!$user) return false;
        
        return in_array($user->role, ['admin', 'district_admin', 'committee']);
    }

    /**
     * ตรวจสอบว่า user สามารถลงทะเบียนได้หรือไม่
     */
    private function canRegister($user): bool
    {
        if (!$user) return false;
        
        return in_array($user->role, ['admin', 'district_admin', 'group_admin', 'school_admin', 'teacher']);
    }

    /**
     * ตรวจสอบว่า user สามารถอนุมัติการลงทะเบียนได้หรือไม่
     */
    private function canApprove($user, $registration): bool
    {
        if (!$user) return false;

        // Admin, District Admin สามารถอนุมัติได้ทั้งหมด
        if (in_array($user->role, ['admin', 'district_admin'])) {
            return true;
        }

        // Group Admin สามารถอนุมัติได้เฉพาะกลุ่มตัวเอง
        if ($user->role === 'group_admin') {
            return $registration->school->school_group_id === $user->school_group_id;
        }

        return false;
    }

    /**
     * รับ school IDs ตาม school_group_id
     */
    private function getSchoolIdsByGroup($schoolGroupId): array
    {
        return School::where('school_group_id', $schoolGroupId)->pluck('id')->toArray();
    }

    /**
     * ตรวจสอบว่า user สามารถแก้ไขการลงทะเบียนได้หรือไม่
     */
    private function canEdit($user, $registration): bool
    {
        if (!$user) return false;

        // Admin, District Admin สามารถแก้ไขได้ทั้งหมด
        if (in_array($user->role, ['admin', 'district_admin'])) {
            return true;
        }

        // Group Admin สามารถแก้ไขได้เฉพาะกลุ่มตัวเอง
        if ($user->role === 'group_admin') {
            return $registration->school->school_group_id === $user->school_group_id;
        }

        // School Admin/Teacher สามารถแก้ไขได้เฉพาะของโรงเรียนตัวเอง
        if (in_array($user->role, ['school_admin', 'teacher'])) {
            if ($registration->school_id !== $user->school_id) return false;
            // pending → แก้ได้ตามปกติ
            if ($registration->status === 'pending') return true;
            // approved → แก้ได้เฉพาะช่วงเปิดแก้ไขรายชื่อ (typo only, ตรวจใน update())
            if ($registration->status === 'approved' && SystemSetting::isEditNameAllowed()) return true;
            return false;
        }

        return false;
    }

    /**
     * ตรวจสอบว่า user เป็น admin level หรือไม่
     */
    private function isAdminRole($user): bool
    {
        return in_array($user->role, ['admin', 'district_admin']);
    }

    /**
     * Levenshtein distance ที่รองรับ multibyte (ภาษาไทย)
     * PHP 8.2 built-in levenshtein() ไม่รองรับ UTF-8
     */
    private function mbLevenshtein(string $s1, string $s2): int
    {
        $len1 = mb_strlen($s1);
        $len2 = mb_strlen($s2);

        if ($len1 === 0) return $len2;
        if ($len2 === 0) return $len1;

        $prev = range(0, $len2);
        for ($i = 1; $i <= $len1; $i++) {
            $curr = [$i];
            $c1 = mb_substr($s1, $i - 1, 1);
            for ($j = 1; $j <= $len2; $j++) {
                $c2 = mb_substr($s2, $j - 1, 1);
                $cost = ($c1 === $c2) ? 0 : 1;
                $curr[$j] = min(
                    $prev[$j] + 1,       // deletion
                    $curr[$j - 1] + 1,   // insertion
                    $prev[$j - 1] + $cost // substitution
                );
            }
            $prev = $curr;
        }

        return $prev[$len2];
    }

    /**
     * ตรวจสอบการเปลี่ยนแปลงชื่อ - อนุญาตแค่ typo (Levenshtein distance ≤ maxDistance)
     * คืนค่า array ของ error messages (ว่าง = ผ่าน)
     */
    private function validateNameChanges(array $oldNames, array $newNames, string $label, int $maxDistance = 5): array
    {
        $errors = [];

        // ตรวจจำนวนต้องเท่าเดิม
        if (count($oldNames) !== count($newNames)) {
            $errors[] = "ไม่สามารถเพิ่มหรือลบ{$label}ได้ กรุณาติดต่อผู้ดูแลระบบ";
            return $errors;
        }

        // ตรวจแต่ละชื่อว่าเปลี่ยนมากเกินไปหรือไม่
        for ($i = 0; $i < count($oldNames); $i++) {
            $old = trim($oldNames[$i]);
            $new = trim($newNames[$i]);

            if ($old === $new) continue;

            $distance = $this->mbLevenshtein($old, $new);

            if ($distance > $maxDistance) {
                $num = $i + 1;
                $errors[] = "{$label}คนที่ {$num}: ชื่อเปลี่ยนแปลงมากเกินไป (จาก \"{$old}\" เป็น \"{$new}\") กรุณาแก้เฉพาะตัวสะกด หากต้องการเปลี่ยนชื่อ กรุณาติดต่อผู้ดูแลระบบ";
            }
        }

        return $errors;
    }

    /**
     * ตรวจสอบว่า user สามารถลบการลงทะเบียนได้หรือไม่
     */
    private function canDelete($user, $registration): bool
    {
        if (!$user) return false;

        // Admin, District Admin สามารถลบได้ทั้งหมด
        if (in_array($user->role, ['admin', 'district_admin'])) {
            return true;
        }

        // Group Admin สามารถลบได้เฉพาะกลุ่มตัวเอง
        if ($user->role === 'group_admin') {
            return $registration->school->school_group_id === $user->school_group_id;
        }

        // ✅ School Admin และ Teacher สามารถลบได้เฉพาะการลงทะเบียนของโรงเรียนตัวเอง
        // และต้องยังไม่ได้รับการอนุมัติ (status = pending)
        if (in_array($user->role, ['school_admin', 'teacher'])) {
            // ต้องเป็นโรงเรียนตัวเอง
            if ($user->school_id && $registration->school_id === $user->school_id) {
                // ลบได้เฉพาะที่ยังรอการอนุมัติ หรือถูกปฏิเสธ
                return in_array($registration->status, ['pending', 'rejected']);
            }
        }

        return false;
    }

    /**
     * ✅ Get registration statistics
     */
    public function statistics(Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            $query = Registration::query();

            // ✅ ROLE-BASED ACCESS CONTROL
            if ($user) {
                if (in_array($user->role, ['school_admin', 'teacher'])) {
                    // School Admin/Teacher เห็นเฉพาะโรงเรียนตัวเอง
                    if ($user->school_id) {
                        $query->where('school_id', $user->school_id);
                    } else {
                        $schoolIds = $this->getSchoolIdsByGroup($user->school_group_id);
                        $query->whereIn('school_id', $schoolIds);
                    }
                } elseif ($user->role === 'group_admin') {
                    // Group Admin เห็นทั้งกลุ่ม
                    if ($user->school_group_id) {
                        $schoolIds = $this->getSchoolIdsByGroup($user->school_group_id);
                        $query->whereIn('school_id', $schoolIds);
                    }
                } elseif (in_array($user->role, ['category_admin', 'data_entry'])) {
                    // Category Admin/Data Entry เห็นเฉพาะหมวดหมู่ของตน (รวมทุกหมวดพิเศษเรียนรวม)
                    $categoryIds = $user->getCategoryIdsForScope();
                    if (!empty($categoryIds)) {
                        $query->whereHas('competition', function($q) use ($categoryIds, $user) {
                            $q->whereIn('category_id', $categoryIds);
                            if ($user->competition_name_filter) {
                                $filter = $user->competition_name_filter;
                                if (str_starts_with($filter, '!')) {
                                    $q->where('name', 'NOT LIKE', '%' . substr($filter, 1) . '%');
                                } else {
                                    $q->where('name', 'LIKE', '%' . $filter . '%');
                                }
                            }
                        });
                    }
                }
            }

            // ✅ Filter ตาม competition_level (district / group)
            if ($request->filled('competition_level')) {
                $query->whereHas('competition', function($q) use ($request) {
                    $q->where('competition_level', $request->competition_level);
                });
            }

            // ✅ Filter ตาม school_group_id ของ competition
            if ($request->has('school_group_id') && $request->school_group_id && $this->canViewAllSchools($user)) {
                $query->whereHas('competition', function($q) use ($request) {
                    $q->where('school_group_id', $request->school_group_id);
                });
            }

            $total = (clone $query)->count();
            $pending = (clone $query)->where('status', 'pending')->count();
            $approved = (clone $query)->where('status', 'approved')->count();
            $rejected = (clone $query)->where('status', 'rejected')->count();

            return response()->json([
                'success' => true,
                'data' => [
                    'total' => $total,
                    'pending' => $pending,
                    'approved' => $approved,
                    'rejected' => $rejected,
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Registration statistics error', ['error' => $e->getMessage()]);

            return response()->json([
                'success' => true,
                'data' => [
                    'total' => 0,
                    'pending' => 0,
                    'approved' => 0,
                    'rejected' => 0,
                ]
            ]);
        }
    }

    /**
     * ✅ Get registration status for current user's school group
     */
    public function status(Request $request): JsonResponse
    {
        try {
            $user = $request->user();

            // ถ้าไม่มี school_group_id ให้ return not_set
            if (!$user->school_group_id) {
                return response()->json([
                    'success' => true,
                    'data' => [
                        'status' => 'not_set',
                        'message' => 'ไม่พบข้อมูลกลุ่มโรงเรียน'
                    ]
                ]);
            }

            // ดึงข้อมูล school group
            $schoolGroup = \App\Models\SchoolGroup::find($user->school_group_id);

            if (!$schoolGroup) {
                return response()->json([
                    'success' => true,
                    'data' => [
                        'status' => 'not_set',
                        'message' => 'ไม่พบข้อมูลกลุ่มโรงเรียน'
                    ]
                ]);
            }

            // ตรวจสอบว่ามีการตั้งค่าช่วงเวลารับสมัครหรือไม่
            $now = now();
            $status = 'not_set';

            if ($schoolGroup->registration_start_date && $schoolGroup->registration_end_date) {
                $startDate = \Carbon\Carbon::parse($schoolGroup->registration_start_date);
                $endDate = \Carbon\Carbon::parse($schoolGroup->registration_end_date);

                if ($now->lt($startDate)) {
                    $status = 'upcoming';
                } elseif ($now->between($startDate, $endDate)) {
                    $status = 'open';
                } else {
                    $status = 'closed';
                }
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'status' => $status,
                    'registration_start_date' => $schoolGroup->registration_start_date,
                    'registration_end_date' => $schoolGroup->registration_end_date,
                    'registration_announcement' => $schoolGroup->registration_announcement ?? null,
                    'school_group' => [
                        'id' => $schoolGroup->id,
                        'name' => $schoolGroup->name,
                    ]
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Registration status error', ['error' => $e->getMessage()]);

            return response()->json([
                'success' => true,
                'data' => [
                    'status' => 'not_set',
                    'message' => 'เกิดข้อผิดพลาดในการโหลดสถานะ'
                ]
            ]);
        }
    }

    /**
     * ✅ Get registration settings for group admin / district admin
     */
    public function getSettings(Request $request): JsonResponse
    {
        try {
            $user = $request->user();

            // ตรวจสอบสิทธิ์ - เฉพาะ group_admin, district_admin, admin
            if (!in_array($user->role, ['group_admin', 'district_admin', 'admin'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'คุณไม่มีสิทธิ์เข้าถึงการตั้งค่านี้'
                ], 403);
            }

            // ✅ สำหรับ district_admin - ดึงข้อมูล competitions ระดับเขต
            if (in_array($user->role, ['district_admin', 'admin'])) {
                $districtCompetitions = Competition::where('competition_level', 'district')
                    ->where('is_active', true)
                    ->select('id', 'registration_status')
                    ->get();

                $totalDistrict = $districtCompetitions->count();
                $openDistrict = $districtCompetitions->where('registration_status', 'open')->count();
                $closedDistrict = $totalDistrict - $openDistrict;

                return response()->json([
                    'success' => true,
                    'data' => [
                        'is_district_admin' => true,
                        'district_stats' => [
                            'total' => $totalDistrict,
                            'open' => $openDistrict,
                            'closed' => $closedDistrict,
                        ],
                        'status' => [
                            'status' => $openDistrict > 0 ? 'open' : 'closed',
                            'is_open' => $openDistrict > 0,
                            'message' => $openDistrict > 0
                                ? "เปิดรับสมัคร {$openDistrict}/{$totalDistrict} กิจกรรม"
                                : 'ยังไม่เปิดรับสมัครระดับเขต',
                        ],
                        'school_group' => [
                            'id' => 0,
                            'name' => 'ระดับเขตพื้นที่',
                        ]
                    ]
                ]);
            }

            // ✅ สำหรับ group_admin - ดึงข้อมูลจาก school_group
            if (!$user->school_group_id) {
                return response()->json([
                    'success' => true,
                    'data' => [
                        'is_district_admin' => false,
                        'registration_start_date' => null,
                        'registration_end_date' => null,
                        'registration_announcement' => null,
                        'school_group' => null,
                        'message' => 'ไม่พบข้อมูลกลุ่มโรงเรียน'
                    ]
                ]);
            }

            $schoolGroup = \App\Models\SchoolGroup::find($user->school_group_id);

            if (!$schoolGroup) {
                return response()->json([
                    'success' => true,
                    'data' => [
                        'is_district_admin' => false,
                        'registration_start_date' => null,
                        'registration_end_date' => null,
                        'registration_announcement' => null,
                        'school_group' => null,
                        'message' => 'ไม่พบข้อมูลกลุ่มโรงเรียน'
                    ]
                ]);
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'is_district_admin' => false,
                    'registration_start_date' => $schoolGroup->registration_start_date,
                    'registration_end_date' => $schoolGroup->registration_end_date,
                    'registration_announcement' => $schoolGroup->registration_announcement,
                    'registration_configured_by' => $schoolGroup->registration_configured_by,
                    'registration_configured_at' => $schoolGroup->registration_configured_at,
                    'school_group' => [
                        'id' => $schoolGroup->id,
                        'name' => $schoolGroup->name,
                    ]
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Get registration settings error', ['error' => $e->getMessage()]);

            return response()->json([
                'success' => false,
                'message' => 'เกิดข้อผิดพลาดในการโหลดการตั้งค่า'
            ], 500);
        }
    }

    /**
     * ✅ Bulk open/close district competitions registration
     * สำหรับ district_admin เปิด/ปิดรับสมัครระดับเขตทั้งหมด
     */
    public function bulkUpdateDistrictRegistration(Request $request): JsonResponse
    {
        try {
            $user = $request->user();

            // ตรวจสอบสิทธิ์ - เฉพาะ district_admin, admin
            if (!in_array($user->role, ['district_admin', 'admin'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'คุณไม่มีสิทธิ์เปลี่ยนสถานะการลงทะเบียนระดับเขต'
                ], 403);
            }

            $validator = Validator::make($request->all(), [
                'action' => 'required|in:open,close',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'ข้อมูลไม่ถูกต้อง',
                    'errors' => $validator->errors()
                ], 422);
            }

            $newStatus = $request->action === 'open' ? 'open' : 'closed';

            // อัพเดทสถานะการลงทะเบียนของ competitions ระดับเขตทั้งหมด
            $updated = Competition::where('competition_level', 'district')
                ->where('is_active', true)
                ->update(['registration_status' => $newStatus]);

            $actionText = $request->action === 'open' ? 'เปิด' : 'ปิด';

            Log::info("District registration bulk updated", [
                'action' => $request->action,
                'updated_count' => $updated,
                'updated_by' => $user->id
            ]);

            return response()->json([
                'success' => true,
                'message' => "{$actionText}รับสมัครระดับเขตสำเร็จ ({$updated} กิจกรรม)",
                'updated_count' => $updated
            ]);

        } catch (\Exception $e) {
            Log::error('Bulk update district registration error', ['error' => $e->getMessage()]);

            return response()->json([
                'success' => false,
                'message' => 'เกิดข้อผิดพลาดในการอัพเดท'
            ], 500);
        }
    }

    /**
     * ✅ Reset/Delete all registrations
     * Permissions: Group Admin (own group), District Admin
     */
    public function reset(Request $request): JsonResponse
    {
        try {
            $user = $request->user();

            // ตรวจสอบสิทธิ์ - เฉพาะ group_admin, district_admin, admin
            if (!in_array($user->role, ['group_admin', 'district_admin', 'admin'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'คุณไม่มีสิทธิ์รีเซ็ตข้อมูลการลงทะเบียน'
                ], 403);
            }

            $validator = Validator::make($request->all(), [
                'competition_level' => 'nullable|in:group,district',
                'school_group_id' => 'nullable|integer|exists:school_groups,id',
                'confirm_text' => 'required|string',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'ข้อมูลไม่ถูกต้อง',
                    'errors' => $validator->errors()
                ], 422);
            }

            // ตรวจสอบคำยืนยัน
            if ($request->confirm_text !== 'RESET') {
                return response()->json([
                    'success' => false,
                    'message' => 'กรุณาพิมพ์ RESET เพื่อยืนยันการรีเซ็ต'
                ], 422);
            }

            $query = Registration::query();

            // Group Admin - รีเซ็ตได้เฉพาะ registration ของโรงเรียนในกลุ่มตัวเอง
            if ($user->role === 'group_admin') {
                if (!$user->school_group_id) {
                    return response()->json([
                        'success' => false,
                        'message' => 'ไม่พบข้อมูลกลุ่มโรงเรียนของคุณ'
                    ], 400);
                }

                // กรองเฉพาะโรงเรียนในกลุ่ม (ทุกระดับการแข่งขัน)
                $schoolIds = $this->getSchoolIdsByGroup($user->school_group_id);
                $query->whereIn('school_id', $schoolIds);
            }

            // District Admin - สามารถเลือกรีเซ็ตตาม level หรือ group ได้
            if (in_array($user->role, ['district_admin', 'admin'])) {
                // Filter ตาม competition_level
                if ($request->filled('competition_level')) {
                    $query->whereHas('competition', function($q) use ($request) {
                        $q->where('competition_level', $request->competition_level);
                    });
                }

                // Filter ตาม school_group_id
                if ($request->has('school_group_id') && $request->school_group_id) {
                    $query->whereHas('competition', function($q) use ($request) {
                        $q->where('school_group_id', $request->school_group_id);
                    });
                }
            }

            // นับจำนวนก่อนลบ
            $count = $query->count();

            if ($count === 0) {
                return response()->json([
                    'success' => false,
                    'message' => 'ไม่มีข้อมูลการลงทะเบียนที่จะรีเซ็ต'
                ], 404);
            }

            // ลบข้อมูล
            $deleted = $query->delete();

            Log::warning('Registrations reset', [
                'deleted_count' => $deleted,
                'reset_by' => $user->id,
                'user_role' => $user->role,
                'competition_level' => $request->competition_level,
                'school_group_id' => $request->school_group_id ?? $user->school_group_id,
            ]);

            return response()->json([
                'success' => true,
                'message' => "รีเซ็ตข้อมูลการลงทะเบียนสำเร็จ ({$deleted} รายการ)",
                'deleted_count' => $deleted
            ]);

        } catch (\Exception $e) {
            Log::error('Reset registrations error', ['error' => $e->getMessage()]);

            return response()->json([
                'success' => false,
                'message' => 'เกิดข้อผิดพลาดในการรีเซ็ตข้อมูล',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * ✅ Get reset preview (count of registrations to be deleted)
     */
    public function resetPreview(Request $request): JsonResponse
    {
        try {
            $user = $request->user();

            if (!in_array($user->role, ['group_admin', 'district_admin', 'admin'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'คุณไม่มีสิทธิ์เข้าถึงข้อมูลนี้'
                ], 403);
            }

            $query = Registration::query();

            // Group Admin - แสดง preview ของ registration ของโรงเรียนในกลุ่มตัวเอง
            if ($user->role === 'group_admin') {
                if ($user->school_group_id) {
                    $schoolIds = $this->getSchoolIdsByGroup($user->school_group_id);
                    $query->whereIn('school_id', $schoolIds);
                }
            }

            // District Admin filters
            if (in_array($user->role, ['district_admin', 'admin'])) {
                if ($request->filled('competition_level')) {
                    $query->whereHas('competition', function($q) use ($request) {
                        $q->where('competition_level', $request->competition_level);
                    });
                }

                if ($request->has('school_group_id') && $request->school_group_id) {
                    $query->whereHas('competition', function($q) use ($request) {
                        $q->where('school_group_id', $request->school_group_id);
                    });
                }
            }

            $total = (clone $query)->count();
            $pending = (clone $query)->where('status', 'pending')->count();
            $approved = (clone $query)->where('status', 'approved')->count();
            $rejected = (clone $query)->where('status', 'rejected')->count();

            return response()->json([
                'success' => true,
                'data' => [
                    'total' => $total,
                    'pending' => $pending,
                    'approved' => $approved,
                    'rejected' => $rejected,
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Reset preview error', ['error' => $e->getMessage()]);

            return response()->json([
                'success' => false,
                'message' => 'เกิดข้อผิดพลาด'
            ], 500);
        }
    }

    /**
     * ✅ Update registration settings for group admin
     */
    public function updateSettings(Request $request): JsonResponse
    {
        try {
            $user = $request->user();

            // ตรวจสอบสิทธิ์ - เฉพาะ group_admin, district_admin, admin
            if (!in_array($user->role, ['group_admin', 'district_admin', 'admin'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'คุณไม่มีสิทธิ์แก้ไขการตั้งค่านี้'
                ], 403);
            }

            // ถ้าไม่มี school_group_id
            if (!$user->school_group_id) {
                return response()->json([
                    'success' => false,
                    'message' => 'ไม่พบข้อมูลกลุ่มโรงเรียน'
                ], 400);
            }

            $validator = Validator::make($request->all(), [
                'registration_start_date' => 'required|date',
                'registration_end_date' => 'required|date|after:registration_start_date',
                'registration_announcement' => 'nullable|string|max:2000',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'ข้อมูลไม่ถูกต้อง',
                    'errors' => $validator->errors()
                ], 422);
            }

            $schoolGroup = \App\Models\SchoolGroup::find($user->school_group_id);

            if (!$schoolGroup) {
                return response()->json([
                    'success' => false,
                    'message' => 'ไม่พบข้อมูลกลุ่มโรงเรียน'
                ], 404);
            }

            $schoolGroup->update([
                'registration_start_date' => $request->registration_start_date,
                'registration_end_date' => $request->registration_end_date,
                'registration_announcement' => $request->registration_announcement,
                'registration_configured_by' => $user->id,
                'registration_configured_at' => now(),
            ]);

            Log::info('Registration settings updated', [
                'school_group_id' => $schoolGroup->id,
                'updated_by' => $user->id,
                'user_role' => $user->role
            ]);

            return response()->json([
                'success' => true,
                'message' => 'บันทึกการตั้งค่าสำเร็จ',
                'data' => [
                    'registration_start_date' => $schoolGroup->registration_start_date,
                    'registration_end_date' => $schoolGroup->registration_end_date,
                    'registration_announcement' => $schoolGroup->registration_announcement,
                    'school_group' => [
                        'id' => $schoolGroup->id,
                        'name' => $schoolGroup->name,
                    ]
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Update registration settings error', ['error' => $e->getMessage()]);

            return response()->json([
                'success' => false,
                'message' => 'เกิดข้อผิดพลาดในการบันทึกการตั้งค่า'
            ], 500);
        }
    }

    /**
     * ✅ ดูกิจกรรมที่ผ่านเข้าแข่งขันระดับเขต
     * - school_admin/teacher: เห็นเฉพาะกิจกรรมของโรงเรียนตนเองที่ผ่านเข้ารอบเขต
     * - group_admin: เห็นกิจกรรมทั้งหมดของกลุ่มที่ผ่านเข้ารอบเขต
     * Route: GET /registrations/district-competitions
     */
    public function districtCompetitions(Request $request): JsonResponse
    {
        try {
            $user = $request->user();

            if (!$user || !in_array($user->role, ['school_admin', 'teacher', 'group_admin', 'admin', 'district_admin', 'category_admin', 'data_entry'])) {
                return response()->json(['success' => false, 'message' => 'ไม่มีสิทธิ์เข้าถึง'], 403);
            }

            // ดึง competitions ระดับเขต ที่มี approved registrations
            $query = Competition::with(['category'])
                ->where('competition_level', 'district')
                ->where('is_active', true);

            // category_admin/data_entry: เฉพาะหมวดหมู่ของตน (รวมทุกหมวดพิเศษเรียนรวม)
            if (in_array($user->role, ['category_admin', 'data_entry']) && $user->category_id) {
                $query->whereIn('category_id', $user->getCategoryIdsForScope());
                if ($user->competition_name_filter) {
                    $filter = $user->competition_name_filter;
                    if (str_starts_with($filter, '!')) {
                        $query->where('name', 'NOT LIKE', '%' . substr($filter, 1) . '%');
                    } else {
                        $query->where('name', 'LIKE', '%' . $filter . '%');
                    }
                }
            }

            $competitions = $query->orderBy('category_id')->orderBy('name')->get();

            // ดึง approved registrations ของ district competitions
            $competitionIds = $competitions->pluck('id')->toArray();

            $regQuery = Registration::whereIn('competition_id', $competitionIds)
                ->whereIn('status', ['approved', 'pending'])
                ->with(['school.schoolGroup', 'score']);

            // ✅ กรองตาม role
            if (in_array($user->role, ['school_admin', 'teacher'])) {
                // School Admin/Teacher: เห็นเฉพาะ registration ของโรงเรียนตนเอง
                $schoolId = $user->school_id;
                if (!$schoolId) {
                    return response()->json([
                        'success' => true,
                        'data' => [],
                        'total_competitions' => 0,
                        'total_registrations' => 0,
                    ]);
                }
                $regQuery->where('school_id', $schoolId);
            } elseif ($user->role === 'group_admin') {
                // Group Admin: เห็นกิจกรรมทั้งหมดที่โรงเรียนในกลุ่มผ่านเข้ารอบ
                $schoolGroupId = $user->school_group_id;
                if ($schoolGroupId) {
                    $schoolIds = School::where('school_group_id', $schoolGroupId)->pluck('id')->toArray();
                    $regQuery->whereIn('school_id', $schoolIds);
                }
            }
            // admin/district_admin/category_admin/data_entry: เห็นทั้งหมด (ไม่กรอง registration)

            $registrations = $regQuery->get()->groupBy('competition_id');

            // กรองเฉพาะ competitions ที่มี registrations (ผ่านเข้ารอบจริง)
            $filteredCompetitions = $competitions->filter(function ($comp) use ($registrations) {
                return $registrations->has($comp->id) && $registrations->get($comp->id)->count() > 0;
            });

            // จัดกลุ่มตาม category
            $categories = [];
            $grouped = $filteredCompetitions->groupBy(function ($comp) {
                return $comp->category->name ?? 'อื่นๆ';
            });

            $totalRegs = 0;

            foreach ($grouped as $categoryName => $comps) {
                $categoryComps = [];
                foreach ($comps as $comp) {
                    $compRegs = $registrations->get($comp->id, collect());
                    $totalRegs += $compRegs->count();

                    $categoryComps[] = [
                        'id' => $comp->id,
                        'name' => $comp->name,
                        'code' => $comp->code,
                        'level' => $comp->level,
                        'competition_level' => $comp->competition_level,
                        'skip_group_level' => (bool) $comp->skip_group_level,
                        'registration_count' => $compRegs->count(),
                        'is_published' => (bool) $comp->is_published,
                        'is_finalized' => (bool) $comp->is_finalized,
                        'registrations' => $compRegs->map(function ($reg) {
                            // ✅ ดึงอันดับจาก notes (กรณี promote จากระดับกลุ่ม เช่น "อันดับที่ 1")
                            $groupRank = null;
                            if ($reg->notes && preg_match('/อันดับที่\s*(\d+)/', $reg->notes, $matches)) {
                                $groupRank = (int) $matches[1];
                            }

                            return [
                                'id' => $reg->id,
                                'team_name' => $reg->team_name,
                                'school_name' => $reg->school->name ?? '-',
                                'school_group_name' => $reg->school->schoolGroup->name ?? '-',
                                'student_count' => $reg->student_count,
                                'student_names' => $reg->student_names,
                                'teacher_names' => $reg->teacher_names,
                                'teacher_count' => $reg->teacher_count,
                                'status' => $reg->status,
                                'notes' => $reg->notes,
                                'score' => $reg->score ? number_format($reg->score->score, 2) : null,
                                'medal' => $reg->score->medal ?? null,
                                'rank' => $reg->score->rank ?? null,
                                'group_rank' => $groupRank, // ✅ อันดับจากระดับกลุ่ม
                                'is_finalized' => $reg->score ? (bool) $reg->score->is_finalized : false,
                            ];
                        })->sort(function ($a, $b) {
                            // ✅ เรียงตาม rank (district score) ก่อน → ถ้าไม่มีใช้ group_rank แทน
                            $rankA = $a['rank'] ?? $a['group_rank'] ?? PHP_INT_MAX;
                            $rankB = $b['rank'] ?? $b['group_rank'] ?? PHP_INT_MAX;
                            if ($rankA !== $rankB) return $rankA - $rankB;
                            // ถ้า rank เท่ากัน เรียงตาม score มากไปน้อย
                            $scoreA = $a['score'] ? (float) $a['score'] : 0;
                            $scoreB = $b['score'] ? (float) $b['score'] : 0;
                            return $scoreB <=> $scoreA;
                        })->values()->toArray(),
                    ];
                }

                $categories[] = [
                    'category' => $categoryName,
                    'competition_count' => count($categoryComps),
                    'competitions' => $categoryComps,
                ];
            }

            return response()->json([
                'success' => true,
                'data' => $categories,
                'total_competitions' => $filteredCompetitions->count(),
                'total_registrations' => $totalRegs,
            ]);

        } catch (\Exception $e) {
            Log::error('District competitions error: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'เกิดข้อผิดพลาด'], 500);
        }
    }

    /**
     * ดูกิจกรรมทั้งหมดของกลุ่มพร้อม approved registrations
     * สำหรับ school_admin/teacher ดูได้อย่างเดียว
     * Route: GET /registrations/group-overview
     */
    public function groupOverview(Request $request): JsonResponse
    {
        try {
            $user = $request->user();

            if (!$user || !in_array($user->role, ['school_admin', 'teacher', 'group_admin', 'admin', 'district_admin'])) {
                return response()->json(['success' => false, 'message' => 'ไม่มีสิทธิ์เข้าถึง'], 403);
            }

            // หา school_group_id ของ user
            $schoolGroupId = $user->school_group_id;
            if (!$schoolGroupId && $user->school_id) {
                $school = School::find($user->school_id);
                $schoolGroupId = $school ? $school->school_group_id : null;
            }

            if (!$schoolGroupId && !in_array($user->role, ['admin', 'district_admin'])) {
                return response()->json(['success' => false, 'message' => 'ไม่พบกลุ่มโรงเรียน'], 400);
            }

            // ดึง competitions ของกลุ่ม
            $query = Competition::with(['category', 'schoolGroup'])
                ->where('is_active', true);

            if (in_array($user->role, ['admin', 'district_admin'])) {
                // admin/district_admin ดูได้ทั้งหมด - อาจกรองด้วย school_group_id
                if ($request->has('school_group_id') && $request->school_group_id) {
                    $query->where('school_group_id', $request->school_group_id);
                }
            } else {
                $query->where('school_group_id', $schoolGroupId);
            }

            $competitions = $query->orderBy('category_id')->orderBy('name')->get();

            // ดึง approved registrations ของทุก competition
            $competitionIds = $competitions->pluck('id')->toArray();

            $registrations = Registration::whereIn('competition_id', $competitionIds)
                ->where('status', 'approved')
                ->with(['school', 'score'])
                ->get()
                ->groupBy('competition_id');

            // จัดกลุ่มตาม category
            $categories = [];
            $grouped = $competitions->groupBy(function ($comp) {
                return $comp->category->name ?? 'อื่นๆ';
            });

            foreach ($grouped as $categoryName => $comps) {
                $categoryComps = [];
                foreach ($comps as $comp) {
                    $compRegs = $registrations->get($comp->id, collect());

                    $categoryComps[] = [
                        'id' => $comp->id,
                        'name' => $comp->name,
                        'code' => $comp->code,
                        'level' => $comp->level,
                        'competition_level' => $comp->competition_level,
                        'school_group_name' => $comp->schoolGroup->name ?? null,
                        'registration_count' => $compRegs->count(),
                        'is_published' => (bool) $comp->is_published,
                        'registrations' => $compRegs->map(function ($reg) {
                            return [
                                'id' => $reg->id,
                                'team_name' => $reg->team_name,
                                'school_name' => $reg->school->name ?? '-',
                                'student_count' => $reg->student_count,
                                'teacher_count' => $reg->teacher_count,
                                'score' => $reg->score ? number_format($reg->score->score, 2) : null,
                                'medal' => $reg->score->medal ?? null,
                                'rank' => $reg->score->rank ?? null,
                                'is_finalized' => $reg->score ? (bool) $reg->score->is_finalized : false,
                            ];
                        })->sort(function ($a, $b) {
                            $rankA = $a['rank'] ?? PHP_INT_MAX;
                            $rankB = $b['rank'] ?? PHP_INT_MAX;
                            if ($rankA !== $rankB) return $rankA - $rankB;
                            $scoreA = $a['score'] ? (float) $a['score'] : 0;
                            $scoreB = $b['score'] ? (float) $b['score'] : 0;
                            return $scoreB <=> $scoreA;
                        })->values()->toArray(),
                    ];
                }

                $categories[] = [
                    'category' => $categoryName,
                    'competitions' => $categoryComps,
                ];
            }

            return response()->json([
                'success' => true,
                'data' => $categories,
                'total_competitions' => $competitions->count(),
                'total_registrations' => $registrations->flatten()->count(),
            ]);

        } catch (\Exception $e) {
            Log::error('Group overview error: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'เกิดข้อผิดพลาด'], 500);
        }
    }

    /**
     * ออกเอกสาร PDF รายชื่อตัวแทนระดับเขต/ระดับโรงเรียน
     * จัดกลุ่มตามโรงเรียน แสดงกิจกรรม ผู้แข่งขัน ครูผู้ฝึกสอน
     * Route: GET /registrations/district-representatives-pdf
     */
    public function districtRepresentativesPdf(Request $request)
    {
        try {
            $user = $request->user();

            if (!$user || !in_array($user->role, ['school_admin', 'teacher', 'group_admin', 'admin', 'district_admin', 'category_admin', 'data_entry'])) {
                return response()->json(['success' => false, 'message' => 'ไม่มีสิทธิ์เข้าถึง'], 403);
            }

            // ดึง district competitions ที่ active
            $compQuery = Competition::with(['category'])
                ->where('competition_level', 'district')
                ->where('is_active', true);

            // category_admin/data_entry: เฉพาะหมวดหมู่ของตน (รวมทุกหมวดพิเศษเรียนรวม)
            if (in_array($user->role, ['category_admin', 'data_entry']) && $user->category_id) {
                $compQuery->whereIn('category_id', $user->getCategoryIdsForScope());
                if ($user->competition_name_filter) {
                    $filter = $user->competition_name_filter;
                    if (str_starts_with($filter, '!')) {
                        $compQuery->where('name', 'NOT LIKE', '%' . substr($filter, 1) . '%');
                    } else {
                        $compQuery->where('name', 'LIKE', '%' . $filter . '%');
                    }
                }
            }

            $competitions = $compQuery->orderBy('category_id')
                ->orderBy('name')
                ->get();

            $competitionIds = $competitions->pluck('id')->toArray();

            // ดึง registrations ที่ approved/pending
            $regQuery = Registration::whereIn('competition_id', $competitionIds)
                ->whereIn('status', ['approved', 'pending'])
                ->with(['school.schoolGroup', 'competition.category']);

            // กรองตาม role
            if (in_array($user->role, ['school_admin', 'teacher'])) {
                $schoolId = $user->school_id;
                if (!$schoolId) {
                    return response()->json(['success' => false, 'message' => 'ไม่พบข้อมูลโรงเรียน'], 400);
                }
                $regQuery->where('school_id', $schoolId);
            } elseif ($user->role === 'group_admin') {
                $schoolGroupId = $user->school_group_id;
                if ($schoolGroupId) {
                    $schoolIds = School::where('school_group_id', $schoolGroupId)->pluck('id')->toArray();
                    $regQuery->whereIn('school_id', $schoolIds);
                }
            }
            // admin/district_admin/category_admin/data_entry: ไม่กรอง registration

            $registrations = $regQuery->get();

            if ($registrations->isEmpty()) {
                return response()->json(['success' => false, 'message' => 'ไม่มีข้อมูลตัวแทนที่ผ่านเข้ารอบ'], 404);
            }

            // จัดกลุ่มตามโรงเรียน
            $groupedBySchool = $registrations->groupBy('school_id');

            $schools = [];
            foreach ($groupedBySchool as $schoolId => $schoolRegs) {
                $firstReg = $schoolRegs->first();
                $schoolName = $firstReg->school->name ?? '-';
                $schoolGroupName = $firstReg->school->schoolGroup->name ?? '';

                $activities = [];
                // เรียงตาม category แล้วตาม competition name
                $sortedRegs = $schoolRegs->sortBy(function ($reg) {
                    $catName = $reg->competition->category->name ?? '';
                    $compName = $reg->competition->name ?? '';
                    return $catName . '_' . $compName;
                });

                foreach ($sortedRegs as $reg) {
                    $studentNames = $reg->student_names ?? [];
                    // handle both string array and object array
                    $students = collect($studentNames)->map(function ($s) {
                        return is_string($s) ? $s : ($s['name'] ?? $s->name ?? '-');
                    })->toArray();

                    $teacherNames = $reg->teacher_names ?? [];
                    $teachers = collect($teacherNames)->map(function ($t) {
                        return is_string($t) ? $t : ($t['name'] ?? $t->name ?? '-');
                    })->toArray();

                    $activities[] = [
                        'name' => $reg->competition->name ?? '-',
                        'level' => $reg->competition->level ?? '',
                        'category' => $reg->competition->category->name ?? '',
                        'skip_group_level' => (bool) ($reg->competition->skip_group_level ?? false),
                        'students' => $students,
                        'teachers' => $teachers,
                    ];
                }

                $schools[] = [
                    'school_name' => $schoolName,
                    'school_group_name' => $schoolGroupName,
                    'activities' => $activities,
                ];
            }

            // เรียงตามชื่อโรงเรียน
            usort($schools, function ($a, $b) {
                return strcmp($a['school_name'], $b['school_name']);
            });

            // กำหนด level label
            $levelLabel = 'เขตพื้นที่';

            // วันที่พิมพ์
            $thaiMonths = ['', 'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
                          'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
            $now = now();
            $rawYear = (int) $now->format('Y');
            $year = $rawYear > 2400 ? $rawYear : $rawYear + 543;
            $generatedAt = $now->format('d/m/') . $year . ' ' . $now->format('H:i:s');

            $data = [
                'schools' => $schools,
                'levelLabel' => $levelLabel,
                'venueAndDate' => '',
                'generated_at' => $generatedAt,
            ];

            $pdf = PDF::loadView('exports.district-representatives-pdf', $data);
            $pdf->setPaper('A4', 'portrait');

            $filename = 'รายชื่อตัวแทนระดับเขต_' . now()->format('Ymd_His') . '.pdf';

            return $pdf->download($filename);

        } catch (\Exception $e) {
            Log::error('District representatives PDF error: ' . $e->getMessage() . ' | ' . $e->getTraceAsString());
            return response()->json(['success' => false, 'message' => 'เกิดข้อผิดพลาด: ' . $e->getMessage()], 500);
        }
    }
}