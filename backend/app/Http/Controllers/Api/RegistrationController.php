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
        if ($request->has('competition_level') && $request->competition_level) {
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
        if ($school->school_group_id && $competition->isSchoolGroupExcluded($school->school_group_id)) {
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
                    $errors[] = "การลงทะเบียน ID: {$registration->id} ไม่อยู่ในสถานะรอการอนุมัติ";
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

        // School Admin/Teacher สามารถแก้ไขได้เฉพาะของโรงเรียนตัวเอง และ status = pending
        if (in_array($user->role, ['school_admin', 'teacher'])) {
            return $registration->school_id === $user->school_id
                   && $registration->status === 'pending';
        }

        return false;
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
                }
            }

            // ✅ Filter ตาม competition_level (district / group)
            if ($request->has('competition_level') && $request->competition_level) {
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
                if ($request->has('competition_level') && $request->competition_level) {
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
                if ($request->has('competition_level') && $request->competition_level) {
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
                        })->sortBy('rank')->values()->toArray(),
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
}