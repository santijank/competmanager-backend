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
        
        $query = CommitteeMember::with(['schoolGroup', 'competition.category', 'creator'])
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

        // Filter by level (group/district)
        if ($request->has('level') && $request->level !== '') {
            $query->where('level', $request->level);
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
            'level' => 'required|in:group,district',
            'note' => 'nullable|string',
            'school_group_id' => 'nullable|exists:school_groups,id',
            'competition_id' => 'nullable|exists:competitions,id',
            'is_active' => 'boolean',
        ], [
            'name.required' => 'กรุณากรอกชื่อ-นามสกุล',
            'member_type.required' => 'กรุณาเลือกประเภทคณะทำงาน',
            'member_type.in' => 'ประเภทคณะทำงานไม่ถูกต้อง',
            'level.required' => 'กรุณาเลือกระดับ',
            'level.in' => 'ระดับไม่ถูกต้อง',
            'competition_id.exists' => 'ไม่พบการแข่งขันที่เลือก',
        ]);

        // ✅ Group admin สามารถเพิ่มได้เฉพาะในกลุ่มของตัวเอง และระดับกลุ่มเท่านั้น
        if ($user->role === 'group_admin') {
            $validated['school_group_id'] = $user->school_group_id;
            $validated['level'] = 'group'; // Group admin เพิ่มได้เฉพาะระดับกลุ่ม
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
            'level' => 'required|in:group,district',
            'note' => 'nullable|string',
            'school_group_id' => 'nullable|exists:school_groups,id',
            'competition_id' => 'nullable|exists:competitions,id',
            'is_active' => 'boolean',
        ], [
            'name.required' => 'กรุณากรอกชื่อ-นามสกุล',
            'member_type.required' => 'กรุณาเลือกประเภทคณะทำงาน',
            'member_type.in' => 'ประเภทคณะทำงานไม่ถูกต้อง',
            'level.required' => 'กรุณาเลือกระดับ',
            'level.in' => 'ระดับไม่ถูกต้อง',
            'competition_id.exists' => 'ไม่พบการแข่งขันที่เลือก',
        ]);

        // ✅ Group admin ไม่สามารถเปลี่ยน school_group_id และ level
        if ($user->role === 'group_admin') {
            unset($validated['school_group_id']);
            $validated['level'] = 'group'; // Group admin แก้ไขได้เฉพาะระดับกลุ่ม
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
     * Get all competitions for committee assignment
     * ดึงเฉพาะกิจกรรมที่มี registration อนุมัติแล้วเท่านั้น
     */
    public function getAllCompetitions(Request $request)
    {
        $user = Auth::user();

        // ดึงเฉพาะ competition ที่มี registration อนุมัติแล้ว (approved)
        $query = DB::table('competitions')
            ->join('registrations', 'competitions.id', '=', 'registrations.competition_id')
            ->leftJoin('categories', 'competitions.category_id', '=', 'categories.id')
            ->leftJoin('school_groups', 'competitions.school_group_id', '=', 'school_groups.id')
            ->where('competitions.is_active', true)
            ->where('registrations.status', 'approved')
            ->select(
                'competitions.id',
                'competitions.name',
                'competitions.code',
                'competitions.level',
                'competitions.competition_level',
                'competitions.school_group_id',
                'categories.id as category_id',
                'categories.name as category_name',
                'school_groups.name as school_group_name'
            )
            ->distinct();

        // Admin และ District Admin เห็นทั้งหมด, Group Admin เห็นเฉพาะกลุ่มตัวเอง
        if ($user->role === 'group_admin') {
            $query->where('competitions.school_group_id', $user->school_group_id);
        }

        $competitions = $query->orderBy('categories.name')
            ->orderBy('competitions.code')
            ->get()
            ->map(function ($comp) {
                return [
                    'id' => (int) $comp->id,
                    'name' => $comp->name,
                    'code' => $comp->code,
                    'level' => $comp->level,
                    'competition_level' => $comp->competition_level ?? 'group',
                    'school_group_id' => $comp->school_group_id ? (int) $comp->school_group_id : null,
                    'category' => [
                        'id' => (int) $comp->category_id,
                        'name' => $comp->category_name
                    ],
                    'school_group' => $comp->school_group_id ? [
                        'id' => (int) $comp->school_group_id,
                        'name' => $comp->school_group_name
                    ] : null,
                ];
            });

        return response()->json([
            'success' => true,
            'data' => $competitions
        ]);
    }

    /**
     * Generate PDF for committee sign-in sheet
     * สร้างเอกสาร PDF สำหรับกรรมการเซ็นชื่อ
     */
    public function generateSignInPdf(Request $request, $competitionId)
    {
        $user = Auth::user();

        // ตรวจสอบสิทธิ์
        if (!in_array($user->role, ['admin', 'district_admin', 'group_admin'])) {
            return response()->json([
                'success' => false,
                'message' => 'คุณไม่มีสิทธิ์ดาวน์โหลดเอกสารนี้'
            ], 403);
        }

        $competition = DB::table('competitions')
            ->leftJoin('categories', 'competitions.category_id', '=', 'categories.id')
            ->leftJoin('school_groups', 'competitions.school_group_id', '=', 'school_groups.id')
            ->where('competitions.id', $competitionId)
            ->select(
                'competitions.*',
                'categories.name as category_name',
                'school_groups.name as school_group_name'
            )
            ->first();

        if (!$competition) {
            return response()->json([
                'success' => false,
                'message' => 'ไม่พบการแข่งขัน'
            ], 404);
        }

        // Group admin สามารถดูได้เฉพาะกลุ่มตัวเอง
        if ($user->role === 'group_admin' && $competition->school_group_id !== $user->school_group_id) {
            return response()->json([
                'success' => false,
                'message' => 'คุณไม่มีสิทธิ์เข้าถึงการแข่งขันนี้'
            ], 403);
        }

        // ดึงรายชื่อคณะกรรมการของการแข่งขันนี้
        $members = CommitteeMember::where('competition_id', $competitionId)
            ->where('is_active', true)
            ->orderByRaw("CASE WHEN position LIKE '%ประธาน%' THEN 1 ELSE 2 END")
            ->orderBy('name')
            ->get();

        // กำหนดระดับการแข่งขัน
        $competitionLevel = $competition->competition_level ?? 'group';
        $levelText = $competitionLevel === 'district' ? 'ระดับเขตพื้นที่' : 'ระดับกลุ่มโรงเรียน';

        $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('pdf.committee-signin', [
            'competition' => $competition,
            'members' => $members,
            'levelText' => $levelText,
            'generatedAt' => now()->format('d/m/Y H:i'),
        ]);

        $pdf->setPaper('a4', 'portrait');

        $filename = 'committee_signin_' . $competition->code . '_' . date('Ymd') . '.pdf';

        return $pdf->download($filename);
    }

    /**
     * Get statistics
     */
    public function statistics(Request $request)
    {
        $user = Auth::user();

        $baseQuery = function() use ($user, $request) {
            $query = CommitteeMember::query();

            // Role-based filtering
            if ($user->role === 'group_admin') {
                $query->where('school_group_id', $user->school_group_id);
            }

            // Filter by level if specified
            if ($request->has('level') && $request->level !== '') {
                $query->where('level', $request->level);
            }

            return $query;
        };

        $total = $baseQuery()->count();
        $active = $baseQuery()->where('is_active', true)->count();
        $inactive = $baseQuery()->where('is_active', false)->count();

        $byType = CommitteeMember::select('member_type', DB::raw('count(*) as count'))
            ->when($user->role === 'group_admin', function($q) use ($user) {
                return $q->where('school_group_id', $user->school_group_id);
            })
            ->when($request->has('level') && $request->level !== '', function($q) use ($request) {
                return $q->where('level', $request->level);
            })
            ->groupBy('member_type')
            ->get()
            ->pluck('count', 'member_type');

        $byLevel = CommitteeMember::select('level', DB::raw('count(*) as count'))
            ->when($user->role === 'group_admin', function($q) use ($user) {
                return $q->where('school_group_id', $user->school_group_id);
            })
            ->groupBy('level')
            ->get()
            ->pluck('count', 'level');

        return response()->json([
            'success' => true,
            'data' => [
                'total' => $total,
                'active' => $active,
                'inactive' => $inactive,
                'by_type' => $byType,
                'by_level' => $byLevel,
            ]
        ]);
    }
}
