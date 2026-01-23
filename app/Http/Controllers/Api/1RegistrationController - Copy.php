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
     * Store a newly created registration
     * 
     * ✅ No changes needed - works with Scoring System
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