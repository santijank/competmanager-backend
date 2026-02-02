<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Registration;
use App\Models\Competition;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * ✅ Registration Controller - Fixed Version
 * 
 * Fixed:
 * - Handle users without school_id
 * - Better error handling
 * - Clear error messages
 * 
 * Version: 2.1
 */
class RegistrationController extends Controller
{
    /**
     * Display a listing of registrations
     */
    public function index(Request $request)
    {
        try {
            $user = Auth::user();
            
            // ✅ LOGGING: User info
            Log::info('=== Registration Index Called ===', [
                'user_id' => $user->id,
                'user_email' => $user->email,
                'user_role' => $user->role,
                'user_school_id' => $user->school_id,
                'user_school_group_id' => $user->school_group_id,
                'request_params' => $request->all()
            ]);
            
            // ✅ Build query with relationships
            $query = Registration::with([
                'competition.category',
                'school',
                'teacher',
                'approver',
                'score'
            ]);

            // ⭐ Load nested relationship for group admin
            if ($user->role === 'group_admin') {
                $query->with(['school.schoolGroup']);
            }

            // Role-based filtering
            if ($user->role === 'school_admin') {
                // ✅ Check if user has school_id
                if (!$user->school_id) {
                    return response()->json([
                        'success' => false,
                        'message' => 'ไม่พบข้อมูลโรงเรียนของคุณ กรุณาติดต่อผู้ดูแลระบบ'
                    ], 400);
                }
                $query->where('school_id', $user->school_id);
            } elseif ($user->role === 'group_admin') {
                // Group Admin sees registrations from schools in their group
                if (!$user->school_group_id) {
                    return response()->json([
                        'success' => false,
                        'message' => 'ไม่พบข้อมูลกลุ่มโรงเรียนของคุณ กรุณาติดต่อผู้ดูแลระบบ'
                    ], 400);
                }
                
                $schoolIds = DB::table('schools')
                    ->where('school_group_id', $user->school_group_id)
                    ->pluck('id');
                $query->whereIn('school_id', $schoolIds);
            }
            // District Admin sees all registrations (no filter)

            // Apply filters
            if ($request->has('status') && $request->status !== '') {
                $query->where('status', $request->status);
            }

            if ($request->has('competition_id')) {
                $query->where('competition_id', $request->competition_id);
            }

            if ($request->has('school_id')) {
                $query->where('school_id', $request->school_id);
            }

            if ($request->has('search')) {
                $search = $request->search;
                $query->where(function($q) use ($search) {
                    $q->where('team_name', 'like', "%{$search}%")
                      ->orWhereHas('teacher', function($q) use ($search) {
                          $q->where('name', 'like', "%{$search}%");
                      });
                });
            }

            // ✅ Filter by score status
            if ($request->has('has_score')) {
                if ($request->boolean('has_score')) {
                    $query->whereHas('score');
                } else {
                    $query->whereDoesntHave('score');
                }
            }

            // Sorting
            $query->orderBy('created_at', 'desc');

            // Pagination
            if ($request->get('paginate', 'true') !== 'false') {
                $perPage = $request->get('per_page', 15);
                return response()->json([
                    'success' => true,
                    'data' => $query->paginate($perPage)
                ]);
            }

            return response()->json([
                'success' => true,
                'data' => $query->get()
            ]);
        } catch (\Exception $e) {
            Log::error('Error in RegistrationController@index: ' . $e->getMessage(), [
                'user_id' => Auth::id(),
                'request' => $request->all(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'เกิดข้อผิดพลาดในการดึงข้อมูลการลงทะเบียน',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get registration statistics
     */
    public function statistics()
    {
        try {
            $user = Auth::user();
            
            $query = Registration::query();

            // Role-based filtering
            if ($user->role === 'school_admin') {
                if (!$user->school_id) {
                    return response()->json([
                        'success' => false,
                        'message' => 'ไม่พบข้อมูลโรงเรียนของคุณ'
                    ], 400);
                }
                $query->where('school_id', $user->school_id);
            } elseif ($user->role === 'group_admin') {
                if (!$user->school_group_id) {
                    return response()->json([
                        'success' => false,
                        'message' => 'ไม่พบข้อมูลกลุ่มโรงเรียนของคุณ'
                    ], 400);
                }
                
                $schoolIds = DB::table('schools')
                    ->where('school_group_id', $user->school_group_id)
                    ->pluck('id');
                $query->whereIn('school_id', $schoolIds);
            }

            // Statistics
            $scoredCount = (clone $query)->whereHas('score')->count();
            $unscoredCount = (clone $query)
                ->where('status', 'approved')
                ->whereDoesntHave('score')
                ->count();

            $statistics = [
                'total' => $query->count(),
                'pending' => (clone $query)->where('status', 'pending')->count(),
                'approved' => (clone $query)->where('status', 'approved')->count(),
                'rejected' => (clone $query)->where('status', 'rejected')->count(),
                'cancelled' => (clone $query)->where('status', 'cancelled')->count(),
                'total_students' => $query->sum('student_count'),
                'scored' => $scoredCount,
                'unscored' => $unscoredCount,
            ];

            return response()->json([
                'success' => true,
                'data' => $statistics
            ]);
        } catch (\Exception $e) {
            Log::error('Error in RegistrationController@statistics: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'เกิดข้อผิดพลาดในการดึงสถิติ',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified registration
     */
    public function show($id)
    {
        try {
            $user = Auth::user();
            
            $registration = Registration::with([
                'competition.category',
                'school.schoolGroup',
                'teacher',
                'approver',
                'score'
            ])->findOrFail($id);

            // Permission check
            if ($user->role === 'school_admin' && $registration->school_id !== $user->school_id) {
                return response()->json([
                    'success' => false,
                    'message' => 'คุณไม่มีสิทธิ์เข้าถึงข้อมูลนี้'
                ], 403);
            }

            if ($user->role === 'group_admin' && $registration->school->school_group_id !== $user->school_group_id) {
                return response()->json([
                    'success' => false,
                    'message' => 'คุณไม่มีสิทธิ์เข้าถึงข้อมูลนี้'
                ], 403);
            }

            return response()->json([
                'success' => true,
                'data' => $registration
            ]);
        } catch (\Exception $e) {
            Log::error('Error in RegistrationController@show: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'ไม่พบข้อมูลการลงทะเบียน',
                'error' => $e->getMessage()
            ], 404);
        }
    }

    /**
     * Store a newly created registration
     */
    public function store(Request $request)
    {
        try {
            $user = Auth::user();

            // ✅ LOGGING: Start
            Log::info('=== Registration Store Called ===', [
                'user_id' => $user->id,
                'user_email' => $user->email,
                'user_role' => $user->role,
                'user_school_id' => $user->school_id,
                'user_school_group_id' => $user->school_group_id,
                'request_data' => $request->all()
            ]);

            // ✅ Check if user has school_id
            if (!$user->school_id) {
                Log::error('User has no school_id', [
                    'user_id' => $user->id,
                    'user_email' => $user->email
                ]);
                
                return response()->json([
                    'success' => false,
                    'message' => 'ไม่พบข้อมูลโรงเรียนของคุณ กรุณาติดต่อผู้ดูแลระบบเพื่อตั้งค่าโรงเรียน',
                    'error_code' => 'NO_SCHOOL_ID'
                ], 400);
            }

            $validated = $request->validate([
                'competition_id' => 'required|exists:competitions,id',
                'team_name' => 'required|string|max:255',
                'student_names' => 'required|array|min:1',
                'student_names.*.name' => 'required|string|max:255',
                'student_names.*.student_id' => 'nullable|string|max:50',
                'notes' => 'nullable|string|max:1000',
            ], [
                'competition_id.required' => 'กรุณาเลือกการแข่งขัน',
                'competition_id.exists' => 'ไม่พบการแข่งขันที่เลือก',
                'team_name.required' => 'กรุณากรอกชื่อทีม',
                'student_names.required' => 'กรุณาเพิ่มนักเรียนอย่างน้อย 1 คน',
                'student_names.min' => 'ต้องมีนักเรียนอย่างน้อย 1 คน',
                'student_names.*.name.required' => 'กรุณากรอกชื่อนักเรียน',
            ]);

            // ✅ LOGGING: Validation passed
            Log::info('Validation passed', [
                'validated_data' => $validated
            ]);

            // Get competition
            $competition = Competition::find($validated['competition_id']);
            
            // ✅ LOGGING: Competition info
            Log::info('Competition found', [
                'competition_id' => $competition->id ?? null,
                'competition_name' => $competition->name ?? null,
                'registration_status' => $competition->registration_status ?? null,
                'max_students' => $competition->max_students ?? null
            ]);
            
            if (!$competition) {
                Log::error('Competition not found', [
                    'competition_id' => $validated['competition_id']
                ]);
                
                return response()->json([
                    'success' => false,
                    'message' => 'ไม่พบการแข่งขัน'
                ], 404);
            }

            // Check if competition is open for registration
            if ($competition->registration_status !== 'open') {
                return response()->json([
                    'success' => false,
                    'message' => 'การแข่งขันนี้ยังไม่เปิดรับสมัคร หรือปิดรับสมัครแล้ว',
                    'error_code' => 'REGISTRATION_CLOSED'
                ], 422);
            }

            // Check student count
            $studentCount = count($validated['student_names']);
            if ($studentCount > $competition->max_students) {
                return response()->json([
                    'success' => false,
                    'message' => "สามารถลงทะเบียนได้สูงสุด {$competition->max_students} คน",
                    'error_code' => 'EXCEEDS_MAX_STUDENTS'
                ], 422);
            }

            // ✅ Check for duplicate registration from this school
            Log::info('Checking duplicate registration', [
                'competition_id' => $validated['competition_id'],
                'school_id' => $user->school_id
            ]);
            
            $exists = Registration::where('competition_id', $validated['competition_id'])
                ->where('school_id', $user->school_id)
                ->whereNotIn('status', ['cancelled', 'rejected'])
                ->exists();

            Log::info('Duplicate check result', [
                'exists' => $exists,
                'query_sql' => Registration::where('competition_id', $validated['competition_id'])
                    ->where('school_id', $user->school_id)
                    ->whereNotIn('status', ['cancelled', 'rejected'])
                    ->toSql()
            ]);

            if ($exists) {
                Log::warning('Duplicate registration detected', [
                    'competition_id' => $validated['competition_id'],
                    'school_id' => $user->school_id
                ]);
                
                return response()->json([
                    'success' => false,
                    'message' => 'โรงเรียนของคุณได้ลงทะเบียนการแข่งขันนี้แล้ว',
                    'error_code' => 'DUPLICATE_REGISTRATION'
                ], 422);
            }

            // Create registration
            Log::info('Creating registration', [
                'competition_id' => $validated['competition_id'],
                'school_id' => $user->school_id,
                'teacher_id' => $user->id,
                'team_name' => $validated['team_name'],
                'student_count' => $studentCount
            ]);
            
            $registration = Registration::create([
                'competition_id' => $validated['competition_id'],
                'school_id' => $user->school_id,
                'teacher_id' => $user->id,
                'team_name' => $validated['team_name'],
                'student_names' => $validated['student_names'],
                'student_count' => $studentCount,
                'status' => 'pending',
                'registration_date' => now(),
                'notes' => $validated['notes'] ?? null,
            ]);

            Log::info('Registration created successfully', [
                'registration_id' => $registration->id
            ]);

            // Increment participants count
            $competition->increment('participants_count');

            return response()->json([
                'success' => true,
                'message' => 'ลงทะเบียนสำเร็จ รอการอนุมัติจากเจ้าหน้าที่',
                'data' => $registration->load(['competition', 'school', 'teacher'])
            ], 201);
            
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'ข้อมูลไม่ถูกต้อง',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            Log::error('Error in RegistrationController@store: ' . $e->getMessage(), [
                'user_id' => Auth::id(),
                'request' => $request->all(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'เกิดข้อผิดพลาดในการลงทะเบียน กรุณาลองใหม่อีกครั้ง',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update the specified registration
     */
    public function update(Request $request, $id)
    {
        try {
            $user = Auth::user();
            $registration = Registration::with('score')->findOrFail($id);

            // Permission check
            if ($user->role === 'school_admin' && $registration->school_id !== $user->school_id) {
                return response()->json([
                    'success' => false,
                    'message' => 'คุณไม่มีสิทธิ์แก้ไขข้อมูลนี้'
                ], 403);
            }

            // ✅ Cannot edit if already has score
            if ($registration->score) {
                return response()->json([
                    'success' => false,
                    'message' => 'ไม่สามารถแก้ไขได้ เนื่องจากมีการบันทึกคะแนนแล้ว',
                    'error_code' => 'HAS_SCORE'
                ], 422);
            }

            // Cannot edit if approved or rejected
            if (in_array($registration->status, ['approved', 'rejected'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'ไม่สามารถแก้ไขได้ เนื่องจากอยู่ในสถานะ ' . $registration->status,
                    'error_code' => 'INVALID_STATUS'
                ], 422);
            }

            $validated = $request->validate([
                'team_name' => 'sometimes|required|string|max:255',
                'student_names' => 'sometimes|required|array|min:1',
                'student_names.*.name' => 'required|string|max:255',
                'student_names.*.student_id' => 'nullable|string|max:50',
                'notes' => 'nullable|string|max:1000',
            ]);

            // Check student count if updated
            if (isset($validated['student_names'])) {
                $studentCount = count($validated['student_names']);
                $competition = $registration->competition;
                
                if ($studentCount > $competition->max_students) {
                    return response()->json([
                        'success' => false,
                        'message' => "สามารถลงทะเบียนได้สูงสุด {$competition->max_students} คน"
                    ], 422);
                }
                
                $validated['student_count'] = $studentCount;
            }

            $registration->update($validated);

            return response()->json([
                'success' => true,
                'message' => 'แก้ไขข้อมูลสำเร็จ',
                'data' => $registration->load(['competition', 'school', 'teacher'])
            ]);
            
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'ข้อมูลไม่ถูกต้อง',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            Log::error('Error in RegistrationController@update: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'เกิดข้อผิดพลาดในการแก้ไขข้อมูล',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified registration
     */
    public function destroy($id)
    {
        try {
            $user = Auth::user();
            $registration = Registration::with('score')->findOrFail($id);

            // Permission check
            if ($user->role === 'school_admin' && $registration->school_id !== $user->school_id) {
                return response()->json([
                    'success' => false,
                    'message' => 'คุณไม่มีสิทธิ์ลบข้อมูลนี้'
                ], 403);
            }

            // ✅ Cannot delete if already has score
            if ($registration->score) {
                return response()->json([
                    'success' => false,
                    'message' => 'ไม่สามารถลบได้ เนื่องจากมีการบันทึกคะแนนแล้ว'
                ], 422);
            }

            // Soft delete (change status to cancelled)
            $registration->update(['status' => 'cancelled']);

            // Decrement participants count
            $registration->competition->decrement('participants_count');

            return response()->json([
                'success' => true,
                'message' => 'ยกเลิกการลงทะเบียนสำเร็จ'
            ]);
        } catch (\Exception $e) {
            Log::error('Error in RegistrationController@destroy: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'เกิดข้อผิดพลาดในการลบข้อมูล',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Approve registration (Group Admin, District Admin)
     */
    public function approve(Request $request, $id)
    {
        try {
            $user = Auth::user();
            
            if (!in_array($user->role, ['group_admin', 'district_admin', 'admin'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'คุณไม่มีสิทธิ์อนุมัติการลงทะเบียน'
                ], 403);
            }

            $registration = Registration::findOrFail($id);

            // Group Admin can only approve registrations in their group
            if ($user->role === 'group_admin') {
                $school = DB::table('schools')->find($registration->school_id);
                if (!$school || $school->school_group_id !== $user->school_group_id) {
                    return response()->json([
                        'success' => false,
                        'message' => 'คุณไม่มีสิทธิ์อนุมัติการลงทะเบียนนี้'
                    ], 403);
                }
            }

            $registration->update([
                'status' => 'approved',
                'approved_by' => $user->id,
                'approved_at' => now()
            ]);

            return response()->json([
                'success' => true,
                'message' => 'อนุมัติการลงทะเบียนสำเร็จ',
                'data' => $registration
            ]);
        } catch (\Exception $e) {
            Log::error('Error in RegistrationController@approve: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'เกิดข้อผิดพลาดในการอนุมัติ',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Reject registration (Group Admin, District Admin)
     */
    public function reject(Request $request, $id)
    {
        try {
            $user = Auth::user();
            
            if (!in_array($user->role, ['group_admin', 'district_admin', 'admin'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'คุณไม่มีสิทธิ์ปฏิเสธการลงทะเบียน'
                ], 403);
            }

            $validated = $request->validate([
                'rejection_reason' => 'required|string|max:500'
            ], [
                'rejection_reason.required' => 'กรุณาระบุเหตุผลในการปฏิเสธ'
            ]);

            $registration = Registration::findOrFail($id);

            // Group Admin can only reject registrations in their group
            if ($user->role === 'group_admin') {
                $school = DB::table('schools')->find($registration->school_id);
                if (!$school || $school->school_group_id !== $user->school_group_id) {
                    return response()->json([
                        'success' => false,
                        'message' => 'คุณไม่มีสิทธิ์ปฏิเสธการลงทะเบียนนี้'
                    ], 403);
                }
            }

            $registration->update([
                'status' => 'rejected',
                'approved_by' => $user->id,
                'approved_at' => now(),
                'rejection_reason' => $validated['rejection_reason']
            ]);

            return response()->json([
                'success' => true,
                'message' => 'ปฏิเสธการลงทะเบียนสำเร็จ',
                'data' => $registration
            ]);
        } catch (\Exception $e) {
            Log::error('Error in RegistrationController@reject: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'เกิดข้อผิดพลาดในการปฏิเสธ',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Bulk approve registrations
     */
    public function bulkApprove(Request $request)
    {
        try {
            $user = Auth::user();
            
            if (!in_array($user->role, ['group_admin', 'district_admin', 'admin'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'คุณไม่มีสิทธิ์อนุมัติการลงทะเบียน'
                ], 403);
            }

            $validated = $request->validate([
                'registration_ids' => 'required|array|min:1',
                'registration_ids.*' => 'required|exists:registrations,id'
            ]);

            $query = Registration::whereIn('id', $validated['registration_ids'])
                ->where('status', 'pending');

            // Group Admin can only approve registrations in their group
            if ($user->role === 'group_admin') {
                $schoolIds = DB::table('schools')
                    ->where('school_group_id', $user->school_group_id)
                    ->pluck('id');
                $query->whereIn('school_id', $schoolIds);
            }

            $updated = $query->update([
                'status' => 'approved',
                'approved_by' => $user->id,
                'approved_at' => now()
            ]);

            return response()->json([
                'success' => true,
                'message' => "อนุมัติสำเร็จ {$updated} รายการ",
                'data' => ['updated_count' => $updated]
            ]);
        } catch (\Exception $e) {
            Log::error('Error in RegistrationController@bulkApprove: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'เกิดข้อผิดพลาดในการอนุมัติ',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}