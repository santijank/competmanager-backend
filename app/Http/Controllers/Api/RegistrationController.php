<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Registration;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * ✅ Registration Controller - Phase 2 Complete
 * 
 * รองรับ:
 * - Registration System (เดิม)
 * - Registration Lock System (Phase 1)
 * - Multi-Participant System (Phase 2) ← NEW
 * - Scoring System (เดิม)
 * 
 * Version: 2.1
 * Updated: 2025-01-22
 */
class RegistrationController extends Controller
{
    /**
     * Display a listing of registrations
     * 
     * ✅ Phase 2: No changes needed
     */
    public function index(Request $request)
    {
        $user = Auth::user();
        
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
            $query->where('school_id', $user->school_id);
        } elseif ($user->role === 'group_admin') {
            $schoolIds = DB::table('schools')
                ->where('school_group_id', $user->school_group_id)
                ->pluck('id');
            $query->whereIn('school_id', $schoolIds);
        }

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

        // Filter by score status
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
        if ($request->get('paginate', true)) {
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
    }

    /**
     * Get registration statistics
     * 
     * ✅ Phase 2: อัพเดตเพิ่ม teacher_count statistics
     */
    public function statistics()
    {
        $user = Auth::user();
        
        $query = Registration::query();

        // Role-based filtering
        if ($user->role === 'school_admin') {
            $query->where('school_id', $user->school_id);
        } elseif ($user->role === 'group_admin') {
            $schoolIds = DB::table('schools')
                ->where('school_group_id', $user->school_group_id)
                ->pluck('id');
            $query->whereIn('school_id', $schoolIds);
        }

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
            'total_teachers' => $query->sum('teacher_count'), // ✅ Phase 2: เพิ่ม
            'scored' => $scoredCount,
            'unscored' => $unscoredCount,
        ];

        return response()->json([
            'success' => true,
            'data' => $statistics
        ]);
    }

    /**
     * Display the specified registration
     * 
     * ✅ Phase 2: No changes needed
     */
    public function show($id)
    {
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
                'message' => 'Unauthorized access'
            ], 403);
        }

        if ($user->role === 'group_admin' && $registration->school->school_group_id !== $user->school_group_id) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized access'
            ], 403);
        }

        return response()->json([
            'success' => true,
            'data' => $registration
        ]);
    }

    /**
     * ========================================
     * ✅ Phase 2: STORE METHOD - รองรับ teacher_names
     * ========================================
     */
    public function store(Request $request)
    {
        $user = Auth::user();

        // Permission check
        if (!in_array($user->role, ['school_admin', 'teacher', 'group_admin', 'district_admin', 'admin'])) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized access'
            ], 403);
        }

        // Get school_id
        $school_id = $user->school_id;
        if (!$school_id) {
            return response()->json([
                'success' => false,
                'message' => 'No school associated with user'
            ], 400);
        }

        // ✅ Phase 1: Registration Lock System
        if ($user->role === 'school_admin') {
            $school = DB::table('schools')->where('id', $school_id)->first();
            
            if ($school && $school->school_group_id) {
                $schoolGroup = \App\Models\SchoolGroup::find($school->school_group_id);
                
                if ($schoolGroup && !$schoolGroup->isRegistrationOpen()) {
                    $status = $schoolGroup->getRegistrationStatus();
                    
                    return response()->json([
                        'success' => false,
                        'error' => 'Registration not open',
                        'message' => $status['message'],
                        'status' => $status['status']
                    ], 403);
                }
            }
        }

        // ✅ Phase 2: Get competition for validation
        $competition = \App\Models\Competition::findOrFail($request->competition_id);

        $minStudents = $competition->min_students ?? 1;
        $maxStudents = $competition->max_students ?? 10;
        $minTeachers = $competition->min_teachers ?? 1;
        $maxTeachers = $competition->max_teachers ?? 5;

        // ✅ Phase 2: Validation with dynamic min/max
        $validated = $request->validate([
            'competition_id' => 'required|exists:competitions,id',
            'team_name' => 'required|string|max:255',
            
            // Student validation
            'student_names' => "required|array|min:{$minStudents}|max:{$maxStudents}",
            'student_names.*.name' => 'required|string|max:255',
            'student_names.*.student_id' => 'nullable|string|max:50',
            
            // Teacher validation - Phase 2
            'teacher_names' => "required|array|min:{$minTeachers}|max:{$maxTeachers}",
            'teacher_names.*.name' => 'required|string|max:255',
            'teacher_names.*.teacher_id' => 'nullable|string|max:50',
            
            'notes' => 'nullable|string|max:1000',
        ], [
            'student_names.required' => 'กรุณากรอกรายชื่อนักเรียน',
            'student_names.min' => "ต้องมีนักเรียนอย่างน้อย {$minStudents} คน",
            'student_names.max' => "มีนักเรียนได้สูงสุด {$maxStudents} คน",
            'student_names.*.name.required' => 'กรุณากรอกชื่อนักเรียนให้ครบทุกคน',
            
            'teacher_names.required' => 'กรุณากรอกรายชื่อครู',
            'teacher_names.min' => "ต้องมีครูอย่างน้อย {$minTeachers} คน",
            'teacher_names.max' => "มีครูได้สูงสุด {$maxTeachers} คน",
            'teacher_names.*.name.required' => 'กรุณากรอกชื่อครูให้ครบทุกคน',
        ]);

        // ✅ Phase 2: Count participants
        $studentCount = count($validated['student_names']);
        $teacherCount = count($validated['teacher_names']);

        // Double-check using Competition helper methods
        if (!$competition->isValidStudentCount($studentCount)) {
            return response()->json([
                'success' => false,
                'message' => "จำนวนนักเรียนไม่ถูกต้อง ต้องมี {$minStudents}-{$maxStudents} คน"
            ], 422);
        }

        if (!$competition->isValidTeacherCount($teacherCount)) {
            return response()->json([
                'success' => false,
                'message' => "จำนวนครูไม่ถูกต้อง ต้องมี {$minTeachers}-{$maxTeachers} คน"
            ], 422);
        }

        // Check for duplicate registration
        $existingRegistration = Registration::where('competition_id', $request->competition_id)
            ->where('school_id', $school_id)
            ->where('status', '!=', 'cancelled')
            ->first();

        if ($existingRegistration) {
            return response()->json([
                'success' => false,
                'message' => 'โรงเรียนของคุณได้ลงทะเบียนการแข่งขันนี้แล้ว',
                'existing_registration' => $existingRegistration
            ], 422);
        }

        // ✅ Phase 2: Create registration with teacher_names
        $registration = Registration::create([
            'competition_id' => $validated['competition_id'],
            'school_id' => $school_id,
            'team_name' => $validated['team_name'],
            'student_names' => $validated['student_names'],
            'student_count' => $studentCount,
            'teacher_names' => $validated['teacher_names'], // ✅ Phase 2
            'teacher_count' => $teacherCount,                // ✅ Phase 2
            'teacher_id' => $user->id,
            'notes' => $validated['notes'] ?? null,
            'status' => 'pending',         
            'registration_date' => now(),
        ]);

        // Increment participants count
        DB::table('competitions')
            ->where('id', $request->competition_id)
            ->increment('participants_count');

        return response()->json([
            'success' => true,
            'message' => 'Registration created successfully',
            'data' => $registration->load(['competition', 'school', 'teacher'])
        ], 201);
    }

    /**
     * ========================================
     * ✅ Phase 2: UPDATE METHOD - รองรับ teacher_names
     * ========================================
     */
    public function update(Request $request, $id)
    {
        $user = Auth::user();
        $registration = Registration::with('competition')->findOrFail($id);

        // Permission check
        if ($user->role === 'school_admin' && $registration->school_id !== $user->school_id) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized access'
            ], 403);
        }

        // Can only edit pending or rejected registrations
        if (!in_array($registration->status, ['pending', 'rejected'])) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot edit registration with status: ' . $registration->status
            ], 422);
        }

        // ✅ Phase 1: Registration Lock System
        if ($user->role === 'school_admin') {
            $school = DB::table('schools')->where('id', $user->school_id)->first();
            
            if ($school && $school->school_group_id) {
                $schoolGroup = \App\Models\SchoolGroup::find($school->school_group_id);
                
                if ($schoolGroup && !$schoolGroup->isRegistrationOpen()) {
                    $status = $schoolGroup->getRegistrationStatus();
                    
                    return response()->json([
                        'success' => false,
                        'error' => 'Registration not open',
                        'message' => $status['message'],
                        'status' => $status['status']
                    ], 403);
                }
            }
        }

        // ✅ Phase 2: Get competition for validation
        $competition = $registration->competition;
        
        $minStudents = $competition->min_students ?? 1;
        $maxStudents = $competition->max_students ?? 10;
        $minTeachers = $competition->min_teachers ?? 1;
        $maxTeachers = $competition->max_teachers ?? 5;

        // ✅ Phase 2: Validation with dynamic min/max
        $validated = $request->validate([
            'team_name' => 'sometimes|required|string|max:255',
            
            'student_names' => "sometimes|required|array|min:{$minStudents}|max:{$maxStudents}",
            'student_names.*.name' => 'required_with:student_names|string|max:255',
            'student_names.*.student_id' => 'nullable|string|max:50',
            
            'teacher_names' => "sometimes|required|array|min:{$minTeachers}|max:{$maxTeachers}",
            'teacher_names.*.name' => 'required_with:teacher_names|string|max:255',
            'teacher_names.*.teacher_id' => 'nullable|string|max:50',
            
            'notes' => 'nullable|string|max:1000',
        ], [
            'student_names.min' => "ต้องมีนักเรียนอย่างน้อย {$minStudents} คน",
            'student_names.max' => "มีนักเรียนได้สูงสุด {$maxStudents} คน",
            'student_names.*.name.required_with' => 'กรุณากรอกชื่อนักเรียนให้ครบทุกคน',
            
            'teacher_names.min' => "ต้องมีครูอย่างน้อย {$minTeachers} คน",
            'teacher_names.max' => "มีครูได้สูงสุด {$maxTeachers} คน",
            'teacher_names.*.name.required_with' => 'กรุณากรอกชื่อครูให้ครบทุกคน',
        ]);

        // ✅ Phase 2: Update counts if arrays changed
        if (isset($validated['student_names'])) {
            $studentCount = count($validated['student_names']);
            
            if (!$competition->isValidStudentCount($studentCount)) {
                return response()->json([
                    'success' => false,
                    'message' => "จำนวนนักเรียนไม่ถูกต้อง ต้องมี {$minStudents}-{$maxStudents} คน"
                ], 422);
            }
            
            $validated['student_count'] = $studentCount;
        }

        if (isset($validated['teacher_names'])) {
            $teacherCount = count($validated['teacher_names']);
            
            if (!$competition->isValidTeacherCount($teacherCount)) {
                return response()->json([
                    'success' => false,
                    'message' => "จำนวนครูไม่ถูกต้อง ต้องมี {$minTeachers}-{$maxTeachers} คน"
                ], 422);
            }
            
            $validated['teacher_count'] = $teacherCount;
        }

        // Reset status to pending if was rejected
        if ($registration->status === 'rejected') {
            $validated['status'] = 'pending';
            $validated['rejection_reason'] = null;
        }

        $registration->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Registration updated successfully',
            'data' => $registration->load(['competition', 'school', 'teacher'])
        ]);
    }

    /**
     * Cancel/Delete the specified registration
     * 
     * ✅ Phase 2: No changes needed
     */
    public function destroy($id)
    {
        $user = Auth::user();
        $registration = Registration::with('score')->findOrFail($id);

        // Permission check
        if ($user->role === 'school_admin' && $registration->school_id !== $user->school_id) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized access'
            ], 403);
        }

        // Cannot cancel approved registrations
        if ($registration->status === 'approved') {
            return response()->json([
                'success' => false,
                'message' => 'Cannot cancel approved registration'
            ], 422);
        }

        // Cannot cancel if already has score
        if ($registration->score && $registration->score->score !== null) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot cancel registration that already has a score'
            ], 422);
        }

        // Update status to cancelled
        $registration->update(['status' => 'cancelled']);

        // Decrement participants count
        if ($registration->status !== 'cancelled') {
            DB::table('competitions')
                ->where('id', $registration->competition_id)
                ->decrement('participants_count');
        }

        return response()->json([
            'success' => true,
            'message' => 'Registration cancelled successfully'
        ]);
    }

    /**
     * Approve a registration
     * 
     * ✅ Phase 2: No changes needed
     */
    public function approve($id)
    {
        $user = Auth::user();
        $registration = Registration::with('school')->findOrFail($id);

        // Permission check for group admin
        if ($user->role === 'group_admin' && $registration->school->school_group_id !== $user->school_group_id) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized access'
            ], 403);
        }

        if ($registration->status !== 'pending') {
            return response()->json([
                'success' => false,
                'message' => 'Can only approve pending registrations'
            ], 422);
        }

        $registration->update([
            'status' => 'approved',
            'approved_by' => $user->id,
            'approved_at' => now(),
            'rejection_reason' => null,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Registration approved successfully',
            'data' => $registration->load(['competition', 'school', 'teacher', 'approver'])
        ]);
    }

    /**
     * Reject a registration
     * 
     * ✅ Phase 2: No changes needed
     */
    public function reject(Request $request, $id)
    {
        $user = Auth::user();
        $registration = Registration::with('school')->findOrFail($id);

        // Permission check for group admin
        if ($user->role === 'group_admin' && $registration->school->school_group_id !== $user->school_group_id) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized access'
            ], 403);
        }

        $validated = $request->validate([
            'rejection_reason' => 'required|string|max:1000',
        ]);

        if ($registration->status !== 'pending') {
            return response()->json([
                'success' => false,
                'message' => 'Can only reject pending registrations'
            ], 422);
        }

        $registration->update([
            'status' => 'rejected',
            'rejection_reason' => $validated['rejection_reason'],
        ]);

        // Decrement participants count
        DB::table('competitions')
            ->where('id', $registration->competition_id)
            ->decrement('participants_count');

        return response()->json([
            'success' => true,
            'message' => 'Registration rejected successfully',
            'data' => $registration->load(['competition', 'school', 'teacher'])
        ]);
    }

    /**
     * Bulk approve registrations
     * 
     * ✅ Phase 2: No changes needed
     */
    public function bulkApprove(Request $request)
    {
        $user = Auth::user();

        $validated = $request->validate([
            'registration_ids' => 'required|array',
            'registration_ids.*' => 'required|exists:registrations,id',
        ]);

        $registrations = Registration::with('school')
            ->whereIn('id', $validated['registration_ids'])
            ->where('status', 'pending')
            ->get();

        // Permission check for group admin
        if ($user->role === 'group_admin') {
            $unauthorizedCount = $registrations->filter(function($registration) use ($user) {
                return $registration->school->school_group_id !== $user->school_group_id;
            })->count();

            if ($unauthorizedCount > 0) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized access to some registrations'
                ], 403);
            }
        }

        $updated = $registrations->each(function($registration) use ($user) {
            $registration->update([
                'status' => 'approved',
                'approved_by' => $user->id,
                'approved_at' => now(),
            ]);
        });

        return response()->json([
            'success' => true,
            'message' => "{$updated->count()} registrations approved successfully",
            'data' => [
                'approved_count' => $updated->count()
            ]
        ]);
    }
}
