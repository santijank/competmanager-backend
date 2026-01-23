<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Registration;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

/**
 * ✅ Registration Controller - Updated for Scoring System
 * 
 * รองรับ:
 * - Registration System (เดิม)
 * - Scoring System (ใหม่)
 * 
 * Version: 2.0
 * Updated: 2026-01-20
 */
class RegistrationController extends Controller
{
    /**
     * Display a listing of registrations
     * 
     * ✅ Updated: เพิ่ม score relationship
     * 
     * Role-based filtering:
     * - District Admin: all registrations
     * - Group Admin: registrations in their school group
     * - School Admin: all registrations from their school
     */
    public function index(Request $request)
    {
        $user = Auth::user();
        
        // ✅ Build query with relationships (เพิ่ม score)
        $query = Registration::with([
            'competition.category',
            'school',
            'teacher',
            'approver',
            'score' // ✅ เพิ่มบรรทัดนี้ - สำหรับ Scoring System
        ]);

        // ⭐ Load nested relationship for group admin
        if ($user->role === 'group_admin') {
            $query->with(['school.schoolGroup']);
        }

        // Role-based filtering
        if ($user->role === 'school_admin') {
            // ✅ School Admin sees all registrations from their school
            $query->where('school_id', $user->school_id);
        } elseif ($user->role === 'group_admin') {
            // Group Admin sees registrations from schools in their group
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

        // ✅ NEW: Filter by score status (สำหรับ Scoring System)
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
     * ✅ Updated: เพิ่มสถิติคะแนน
     */
    public function statistics()
    {
        $user = Auth::user();
        
        $query = Registration::query();

        // Role-based filtering
        if ($user->role === 'school_admin') {
            // ✅ School Admin sees stats for their school
            $query->where('school_id', $user->school_id);
        } elseif ($user->role === 'group_admin') {
            $schoolIds = DB::table('schools')
                ->where('school_group_id', $user->school_group_id)
                ->pluck('id');
            $query->whereIn('school_id', $schoolIds);
        }

        // ✅ เพิ่มสถิติคะแนน
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
            // ✅ NEW: Scoring statistics
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
     * ✅ Updated: เพิ่ม score relationship
     */
    public function show($id)
    {
        $user = Auth::user();
        
        $registration = Registration::with([
            'competition.category',
            'school.schoolGroup',
            'teacher',
            'approver',
            'score' // ✅ เพิ่มบรรทัดนี้
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
     * 🔒 Registration Lock System
     * ========================================
     */
    
    /**
     * ตรวจสอบสถานะการรับสมัคร (สำหรับ School Admin)
     * 
     * Route: GET /api/registrations/status
     * 
     * @return \Illuminate\Http\JsonResponse
     */
    public function checkRegistrationStatus()
    {
        $user = Auth::user();
        
        // ต้องเป็น School Admin เท่านั้น
        if ($user->role !== 'school_admin') {
            return response()->json([
                'success' => false,
                'error' => 'Unauthorized',
                'message' => 'เฉพาะ School Admin เท่านั้น'
            ], 403);
        }
        
        // ดึงข้อมูล School Group
        $school = DB::table('schools')
            ->where('id', $user->school_id)
            ->first();
            
        if (!$school || !$school->school_group_id) {
            return response()->json([
                'success' => false,
                'error' => 'No school group assigned',
                'message' => 'โรงเรียนยังไม่ได้กำหนดกลุ่ม กรุณาติดต่อผู้ดูแลระบบ'
            ], 400);
        }
        
        $schoolGroup = \App\Models\SchoolGroup::find($school->school_group_id);
        
        if (!$schoolGroup) {
            return response()->json([
                'success' => false,
                'error' => 'School group not found',
                'message' => 'ไม่พบข้อมูลกลุ่มโรงเรียน'
            ], 404);
        }
        
        // ดึงสถานะการรับสมัคร
        $status = $schoolGroup->getRegistrationStatus();
        
        return response()->json([
            'success' => true,
            'is_open' => $schoolGroup->isRegistrationOpen(),
            'status' => $status,
            'school_group' => [
                'id' => $schoolGroup->id,
                'name' => $schoolGroup->name,
            ],
            'start_date' => $schoolGroup->registration_start_date,
            'end_date' => $schoolGroup->registration_end_date,
            'announcement' => $schoolGroup->registration_announcement,
        ]);
    }
    
    /**
     * ตั้งค่าช่วงเวลารับสมัคร (สำหรับ Group Admin)
     * 
     * Route: PUT /api/registrations/settings
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function updateRegistrationSettings(Request $request)
    {
        $user = Auth::user();
        
        // ต้องเป็น Group Admin เท่านั้น
        if ($user->role !== 'group_admin') {
            return response()->json([
                'success' => false,
                'error' => 'Unauthorized',
                'message' => 'เฉพาะ Group Admin เท่านั้น'
            ], 403);
        }
        
        if (!$user->school_group_id) {
            return response()->json([
                'success' => false,
                'error' => 'No school group assigned',
                'message' => 'คุณยังไม่ได้กำหนดกลุ่มโรงเรียน'
            ], 400);
        }
        
        $validated = $request->validate([
            'registration_start_date' => 'required|date',
            'registration_end_date' => 'required|date|after:registration_start_date',
            'registration_announcement' => 'nullable|string|max:1000',
        ]);
        
        $schoolGroup = \App\Models\SchoolGroup::findOrFail($user->school_group_id);
        
        // อัพเดตข้อมูล
        $schoolGroup->update([
            'registration_start_date' => $validated['registration_start_date'],
            'registration_end_date' => $validated['registration_end_date'],
            'registration_announcement' => $validated['registration_announcement'] ?? null,
            'registration_configured_by' => $user->id,
            'registration_configured_at' => now(),
        ]);
        
        return response()->json([
            'success' => true,
            'message' => 'บันทึกการตั้งค่าสำเร็จ',
            'data' => [
                'school_group' => $schoolGroup,
                'status' => $schoolGroup->getRegistrationStatus(),
            ]
        ]);
    }
    
    /**
     * ดูการตั้งค่าช่วงเวลารับสมัคร (สำหรับ Group Admin)
     * 
     * Route: GET /api/registrations/settings
     * 
     * @return \Illuminate\Http\JsonResponse
     */
    public function getRegistrationSettings()
    {
        $user = Auth::user();
        
        // ต้องเป็น Group Admin เท่านั้น
        if ($user->role !== 'group_admin') {
            return response()->json([
                'success' => false,
                'error' => 'Unauthorized',
                'message' => 'เฉพาะ Group Admin เท่านั้น'
            ], 403);
        }
        
        if (!$user->school_group_id) {
            return response()->json([
                'success' => false,
                'error' => 'No school group assigned',
                'message' => 'คุณยังไม่ได้กำหนดกลุ่มโรงเรียน'
            ], 400);
        }
        
        $schoolGroup = \App\Models\SchoolGroup::findOrFail($user->school_group_id);
        
        return response()->json([
            'success' => true,
            'data' => [
                'school_group' => [
                    'id' => $schoolGroup->id,
                    'name' => $schoolGroup->name,
                ],
                'registration_start_date' => $schoolGroup->registration_start_date,
                'registration_end_date' => $schoolGroup->registration_end_date,
                'registration_announcement' => $schoolGroup->registration_announcement,
                'configured_by' => $schoolGroup->registration_configured_by,
                'configured_at' => $schoolGroup->registration_configured_at,
                'status' => $schoolGroup->getRegistrationStatus(),
            ]
        ]);
    }

    /**
     * ========================================
     * 📝 Registration CRUD
     * ========================================
     */

    /**
     * Store a newly created registration
     * 
     * ✅ Updated: เพิ่มการตรวจสอบช่วงเวลารับสมัคร
     */
    public function store(Request $request)
    {
        $user = Auth::user();

        $validated = $request->validate([
            'competition_id' => 'required|exists:competitions,id',
            'team_name' => 'required|string|max:255',
            'student_names' => 'required|array',
            'student_names.*.name' => 'required|string|max:255',
            'student_names.*.student_id' => 'nullable|string|max:50',
            'notes' => 'nullable|string|max:1000',
        ]);

        // Get competition
        $competition = DB::table('competitions')->find($validated['competition_id']);
        
        if (!$competition) {
            return response()->json([
                'success' => false,
                'message' => 'Competition not found'
            ], 404);
        }

        // Check if competition is open for registration
        if ($competition->registration_status !== 'open') {
            return response()->json([
                'success' => false,
                'message' => 'Competition registration is not open'
            ], 422);
        }

        // ✅ NEW: ตรวจสอบช่วงเวลารับสมัคร (Registration Lock System)
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

        // Check student count
        $studentCount = count($validated['student_names']);
        if ($studentCount > $competition->max_students) {
            return response()->json([
                'success' => false,
                'message' => "Maximum {$competition->max_students} students allowed"
            ], 422);
        }

        // Check for duplicate registration from this school
        $exists = Registration::where('competition_id', $validated['competition_id'])
            ->where('school_id', $user->school_id)
            ->where('status', '!=', 'cancelled')
            ->exists();

        if ($exists) {
            return response()->json([
                'success' => false,
                'message' => 'Your school has already registered for this competition'
            ], 422);
        }

        // Create registration
        $registration = Registration::create([
            'competition_id' => $validated['competition_id'],
            'school_id' => $user->school_id,
            'teacher_id' => $user->id,
            'team_name' => $validated['team_name'],
            'student_names' => $validated['student_names'], // ✅ Will be cast to array by Model
            'student_count' => $studentCount,
            'status' => 'pending',
            'registration_date' => now(),
            'notes' => $validated['notes'] ?? null,
        ]);

        // Increment participants count
        DB::table('competitions')
            ->where('id', $validated['competition_id'])
            ->increment('participants_count');

        return response()->json([
            'success' => true,
            'message' => 'Registration created successfully',
            'data' => $registration->load(['competition', 'school', 'teacher'])
        ], 201);
    }

    /**
     * Update the specified registration
     * 
     * ✅ Updated: ป้องกันการแก้ไขถ้ามีคะแนนแล้ว
     */
    public function update(Request $request, $id)
    {
        $user = Auth::user();
        $registration = Registration::with('score')->findOrFail($id);

        // Permission check - School Admin can edit their school's registrations
        if ($user->role === 'school_admin' && $registration->school_id !== $user->school_id) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized access'
            ], 403);
        }

        // ✅ NEW: Cannot edit if already has score
        if ($registration->score && $registration->score->score !== null) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot edit registration that already has a score'
            ], 422);
        }

        // Can only edit pending or rejected registrations
        if (!in_array($registration->status, ['pending', 'rejected'])) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot edit registration with status: ' . $registration->status
            ], 422);
        }

        // ✅ NEW: ตรวจสอบช่วงเวลารับสมัคร (Registration Lock System)
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

        $validated = $request->validate([
            'team_name' => 'sometimes|required|string|max:255',
            'student_names' => 'sometimes|required|array',
            'student_names.*.name' => 'required_with:student_names|string|max:255',
            'student_names.*.student_id' => 'nullable|string|max:50',
            'notes' => 'nullable|string|max:1000',
        ]);

        // Update student count if student_names changed
        if (isset($validated['student_names'])) {
            $validated['student_count'] = count($validated['student_names']);
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
     * ✅ Updated: ป้องกันการลบถ้ามีคะแนนแล้ว
     */
    public function destroy($id)
    {
        $user = Auth::user();
        $registration = Registration::with('score')->findOrFail($id);

        // Permission check - School Admin can cancel their school's registrations
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

        // ✅ NEW: Cannot cancel if already has score
        if ($registration->score && $registration->score->score !== null) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot cancel registration that already has a score'
            ], 422);
        }

        // Update status to cancelled
        $registration->update(['status' => 'cancelled']);

        // Decrement participants count if not already cancelled
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
     * Approve a registration (Group Admin/District Admin only)
     * 
     * ✅ No changes needed - works with Scoring System
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
     * Reject a registration (Group Admin/District Admin only)
     * 
     * ✅ No changes needed - works with Scoring System
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
     * Bulk approve registrations (Group Admin/District Admin only)
     * 
     * ✅ No changes needed - works with Scoring System
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