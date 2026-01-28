<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CommitteeMember;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class CommitteeMemberController extends Controller
{
    /**
     * Display a listing of committee members
     */
    public function index(Request $request)
    {
        $user = Auth::user();
        
        $query = CommitteeMember::with(['schoolGroup', 'competition', 'creator'])
            ->orderBy('created_at', 'desc');

        // Role-based filtering
        if ($user->role === 'group_admin') {
            // Group admin เห็นเฉพาะกลุ่มของตัวเอง
            $query->where('school_group_id', $user->school_group_id);
        }
        // Admin และ District Admin เห็นทั้งหมด

        // Apply filters
        if ($request->has('member_type') && $request->member_type !== '') {
            $query->where('member_type', $request->member_type);
        }

        if ($request->has('is_active') && $request->is_active !== '') {
            $query->where('is_active', $request->boolean('is_active'));
        }

        if ($request->has('competition_id') && $request->competition_id !== '') {
            $query->where('competition_id', $request->competition_id);
        }

        if ($request->has('search') && $request->search !== '') {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('position', 'like', "%{$search}%")
                  ->orWhere('organization', 'like', "%{$search}%");
            });
        }

        if ($request->has('school_group_id') && $request->school_group_id !== '') {
            $query->where('school_group_id', $request->school_group_id);
        }

        // Pagination
        if ($request->get('paginate', true)) {
            $perPage = $request->get('per_page', 15);
            $members = $query->paginate($perPage);
        } else {
            $members = $query->get();
        }

        return response()->json([
            'success' => true,
            'data' => $members
        ]);
    }

    /**
     * Store a newly created committee member
     */
    public function store(Request $request)
    {
        $user = Auth::user();

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'position' => 'nullable|string|max:255',
            'organization' => 'nullable|string|max:255',
            'member_type' => 'required|in:committee,staff,volunteer',
            'note' => 'nullable|string',
            'school_group_id' => 'nullable|exists:school_groups,id',
            'competition_id' => 'nullable|exists:competitions,id',
            'is_active' => 'boolean',
        ], [
            'name.required' => 'กรุณากรอกชื่อ-นามสกุล',
            'member_type.required' => 'กรุณาเลือกประเภทคณะทำงาน',
            'member_type.in' => 'ประเภทคณะทำงานไม่ถูกต้อง',
            'competition_id.exists' => 'ไม่พบการแข่งขันที่เลือก',
        ]);

        // ✅ Group admin สามารถเพิ่มได้เฉพาะในกลุ่มของตัวเอง
        if ($user->role === 'group_admin') {
            $validated['school_group_id'] = $user->school_group_id;
        }

        $validated['created_by'] = $user->id;

        $member = CommitteeMember::create($validated);

        Log::info("Committee member created", [
            'member_id' => $member->id,
            'created_by' => $user->id
        ]);

        return response()->json([
            'success' => true,
            'message' => 'เพิ่มคณะทำงานสำเร็จ',
            'data' => $member->load(['schoolGroup', 'competition', 'creator'])
        ], 201);
    }

    /**
     * Display the specified committee member
     */
    public function show($id)
    {
        $user = Auth::user();
        
        $member = CommitteeMember::with(['schoolGroup', 'creator'])->findOrFail($id);

        // Permission check for group_admin
        if ($user->role === 'group_admin' && $member->school_group_id !== $user->school_group_id) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized access'
            ], 403);
        }

        return response()->json([
            'success' => true,
            'data' => $member
        ]);
    }

    /**
     * Update the specified committee member
     */
    public function update(Request $request, $id)
    {
        $user = Auth::user();
        
        $member = CommitteeMember::findOrFail($id);

        // Permission check for group_admin
        if ($user->role === 'group_admin' && $member->school_group_id !== $user->school_group_id) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized access'
            ], 403);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'position' => 'nullable|string|max:255',
            'organization' => 'nullable|string|max:255',
            'member_type' => 'required|in:committee,staff,volunteer',
            'note' => 'nullable|string',
            'school_group_id' => 'nullable|exists:school_groups,id',
            'competition_id' => 'nullable|exists:competitions,id',
            'is_active' => 'boolean',
        ], [
            'name.required' => 'กรุณากรอกชื่อ-นามสกุล',
            'member_type.required' => 'กรุณาเลือกประเภทคณะทำงาน',
            'member_type.in' => 'ประเภทคณะทำงานไม่ถูกต้อง',
            'competition_id.exists' => 'ไม่พบการแข่งขันที่เลือก',
        ]);

        // ✅ Group admin ไม่สามารถเปลี่ยน school_group_id
        if ($user->role === 'group_admin') {
            unset($validated['school_group_id']);
        }

        $member->update($validated);

        Log::info("Committee member updated", [
            'member_id' => $member->id,
            'updated_by' => $user->id
        ]);

        return response()->json([
            'success' => true,
            'message' => 'แก้ไขข้อมูลสำเร็จ',
            'data' => $member->load(['schoolGroup', 'competition', 'creator'])
        ]);
    }

    /**
     * Remove the specified committee member
     */
    public function destroy($id)
    {
        $user = Auth::user();
        
        $member = CommitteeMember::findOrFail($id);

        // Permission check for group_admin
        if ($user->role === 'group_admin' && $member->school_group_id !== $user->school_group_id) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized access'
            ], 403);
        }

        $memberName = $member->name;
        $member->delete();

        Log::info("Committee member deleted", [
            'member_id' => $id,
            'member_name' => $memberName,
            'deleted_by' => $user->id
        ]);

        return response()->json([
            'success' => true,
            'message' => 'ลบคณะทำงานสำเร็จ'
        ]);
    }

    /**
     * Get statistics
     */
    public function statistics()
    {
        $user = Auth::user();

        $query = CommitteeMember::query();

        // Role-based filtering
        if ($user->role === 'group_admin') {
            $query->where('school_group_id', $user->school_group_id);
        }

        $total = $query->count();
        $active = $query->where('is_active', true)->count();
        $inactive = $query->where('is_active', false)->count();

        $byType = CommitteeMember::select('member_type', DB::raw('count(*) as count'))
            ->when($user->role === 'group_admin', function($q) use ($user) {
                return $q->where('school_group_id', $user->school_group_id);
            })
            ->groupBy('member_type')
            ->get()
            ->pluck('count', 'member_type');

        return response()->json([
            'success' => true,
            'data' => [
                'total' => $total,
                'active' => $active,
                'inactive' => $inactive,
                'by_type' => $byType,
            ]
        ]);
    }
}
