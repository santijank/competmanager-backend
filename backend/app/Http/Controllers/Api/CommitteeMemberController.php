<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CommitteeMember;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Barryvdh\DomPDF\Facade\Pdf;
use App\Models\SchoolGroup;

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

        // group_admin เห็นเฉพาะกลุ่มตัวเอง
        if ($user->role === 'group_admin' && $user->school_group_id) {
            $groupId = $user->school_group_id;
            $query->where(function($q) use ($groupId) {
                $q->where('committee_members.school_group_id', $groupId)
                  ->orWhereIn('committee_members.competition_id', function($sub) use ($groupId) {
                      $sub->select('id')
                          ->from('competitions')
                          ->where('school_group_id', $groupId);
                  });
            });
        }

        // Apply filters
        if ($request->filled('member_type')) {
            $query->where('member_type', $request->member_type);
        }

        if ($request->filled('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        if ($request->filled('competition_id')) {
            if ($request->competition_id === 'null') {
                $query->whereNull('competition_id');
            } else {
                $query->where('competition_id', $request->competition_id);
            }
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('position', 'like', "%{$search}%")
                  ->orWhere('organization', 'like', "%{$search}%");
            });
        }

        if ($request->filled('school_group_id')) {
            $query->where('school_group_id', $request->school_group_id);
        }

        // Filter by level (group/district)
        if ($request->filled('level')) {
            $query->where('level', $request->level);
        }

        // Pagination - รองรับ string "false" จาก query param
        $shouldPaginate = filter_var($request->get('paginate', true), FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE) ?? true;
        if ($shouldPaginate) {
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
            'responsibility' => 'nullable|string|max:500',
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

        // ✅ Group admin และ School admin สามารถเพิ่มได้เฉพาะในกลุ่มของตัวเอง และระดับกลุ่มเท่านั้น
        if ($user->role === 'group_admin' || $user->role === 'school_admin') {
            $validated['school_group_id'] = $user->school_group_id;
            $validated['level'] = 'group'; // Group admin และ School admin เพิ่มได้เฉพาะระดับกลุ่ม
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
     * Store multiple committee members at once (batch create)
     */
    public function storeBatch(Request $request)
    {
        $user = Auth::user();

        $validated = $request->validate([
            'members' => 'required|array|min:1|max:20',
            'members.*.name' => 'required|string|max:255',
            'members.*.position' => 'nullable|string|max:255',
            'members.*.organization' => 'nullable|string|max:255',
            'members.*.responsibility' => 'nullable|string|max:500',
            'member_type' => 'required|in:committee,staff,volunteer',
            'level' => 'required|in:group,district',
            'competition_id' => 'nullable|exists:competitions,id',
            'note' => 'nullable|string',
        ], [
            'members.required' => 'กรุณากรอกรายชื่อคณะทำงานอย่างน้อย 1 คน',
            'members.*.name.required' => 'กรุณากรอกชื่อ-นามสกุล',
            'member_type.required' => 'กรุณาเลือกประเภทคณะทำงาน',
            'level.required' => 'กรุณาเลือกระดับ',
            'competition_id.exists' => 'ไม่พบการแข่งขันที่เลือก',
        ]);

        // Group admin/School admin restrictions
        $schoolGroupId = null;
        $level = $validated['level'];
        if (in_array($user->role, ['group_admin', 'school_admin'])) {
            $schoolGroupId = $user->school_group_id;
            $level = 'group';
        }

        $created = [];
        DB::beginTransaction();
        try {
            foreach ($validated['members'] as $memberData) {
                // ข้ามแถวที่ชื่อว่างเปล่า
                if (empty(trim($memberData['name']))) continue;

                $member = CommitteeMember::create([
                    'name' => $memberData['name'],
                    'position' => $memberData['position'] ?? null,
                    'organization' => $memberData['organization'] ?? null,
                    'responsibility' => $memberData['responsibility'] ?? null,
                    'member_type' => $validated['member_type'],
                    'level' => $level,
                    'competition_id' => $validated['competition_id'] ?? null,
                    'note' => $validated['note'] ?? null,
                    'school_group_id' => $schoolGroupId,
                    'is_active' => true,
                    'created_by' => $user->id,
                ]);
                $created[] = $member;
            }
            DB::commit();

            Log::info("Committee members batch created", [
                'count' => count($created),
                'created_by' => $user->id
            ]);

            return response()->json([
                'success' => true,
                'message' => 'เพิ่มคณะทำงาน ' . count($created) . ' คนสำเร็จ',
                'data' => $created
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error("Committee batch create error: " . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'เกิดข้อผิดพลาดในการบันทึก',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified committee member
     */
    public function show($id)
    {
        $user = Auth::user();
        
        $member = CommitteeMember::with(['schoolGroup', 'creator'])->findOrFail($id);

        // Permission check for group_admin และ school_admin
        if (in_array($user->role, ['group_admin', 'school_admin']) && $member->school_group_id !== $user->school_group_id) {
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

        // Permission check for group_admin และ school_admin
        if (in_array($user->role, ['group_admin', 'school_admin']) && $member->school_group_id !== $user->school_group_id) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized access'
            ], 403);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'position' => 'nullable|string|max:255',
            'organization' => 'nullable|string|max:255',
            'responsibility' => 'nullable|string|max:500',
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

        // ✅ Group admin และ School admin ไม่สามารถเปลี่ยน school_group_id และ level
        if (in_array($user->role, ['group_admin', 'school_admin'])) {
            unset($validated['school_group_id']);
            $validated['level'] = 'group'; // Group admin และ School admin แก้ไขได้เฉพาะระดับกลุ่ม
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

        // School admin ไม่มีสิทธิ์ลบ
        if ($user->role === 'school_admin') {
            return response()->json([
                'success' => false,
                'message' => 'คุณไม่มีสิทธิ์ลบคณะทำงาน'
            ], 403);
        }

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

        // group_admin เห็นเฉพาะกิจกรรมในกลุ่มตัวเอง
        if ($user->role === 'group_admin' && $user->school_group_id) {
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
        if (!in_array($user->role, ['admin', 'district_admin', 'group_admin', 'school_admin'])) {
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

        // Group admin และ School admin สามารถดูได้เฉพาะกลุ่มตัวเอง
        if (in_array($user->role, ['group_admin', 'school_admin']) && $competition->school_group_id !== $user->school_group_id) {
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

        $baseQuery = function() use ($request, $user) {
            $query = CommitteeMember::query();

            // group_admin เห็นเฉพาะกลุ่มตัวเอง - ใช้ logic เดียวกับ index
            if ($user->role === 'group_admin' && $user->school_group_id) {
                $groupId = $user->school_group_id;
                $query->where(function($q) use ($groupId) {
                    $q->where('committee_members.school_group_id', $groupId)
                      ->orWhereIn('committee_members.competition_id', function($sub) use ($groupId) {
                          $sub->select('id')
                              ->from('competitions')
                              ->where('school_group_id', $groupId);
                      });
                });
            }

            // Filter by level if specified
            if ($request->filled('level')) {
                $query->where('level', $request->level);
            }

            return $query;
        };

        // ดึงข้อมูลทั้งหมดใน 1 query แล้วคำนวณใน PHP
        $allMembers = $baseQuery()->select('is_active', 'member_type', 'level')->get();

        $total = $allMembers->count();
        $active = $allMembers->where('is_active', true)->count();
        $inactive = $total - $active;

        $byType = $allMembers->groupBy('member_type')->map->count();
        $byLevel = $allMembers->groupBy('level')->map->count();

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

    /**
     * Generate PDF for staff members (คณะกรรมการดำเนินงาน)
     * ดึงรายชื่อคณะกรรมการดำเนินงานทั้งหมดในกลุ่ม
     */
    public function generateStaffPdf(Request $request)
    {
        $user = Auth::user();

        if (!in_array($user->role, ['admin', 'district_admin', 'group_admin'])) {
            return response()->json([
                'success' => false,
                'message' => 'คุณไม่มีสิทธิ์ดาวน์โหลดเอกสารนี้'
            ], 403);
        }

        try {
            // ดึง school_group ของ user
            $schoolGroupId = $request->get('school_group_id', $user->school_group_id);

            // group_admin ใช้ได้เฉพาะกลุ่มตัวเอง
            if ($user->role === 'group_admin') {
                $schoolGroupId = $user->school_group_id;
            }

            $schoolGroup = SchoolGroup::find($schoolGroupId);
            $groupName = $schoolGroup->name ?? 'กลุ่มโรงเรียน';

            // ดึงคณะกรรมการดำเนินงานทั้งหมดในกลุ่ม
            $query = CommitteeMember::where('is_active', true)
                ->where('member_type', 'staff');

            if ($schoolGroupId) {
                $query->where('school_group_id', $schoolGroupId);
            }

            $committees = $query->orderByRaw("CASE WHEN position LIKE '%ประธาน%' THEN 1 ELSE 2 END")
                ->orderBy('name')
                ->get();

            // ข้อมูลสำหรับ PDF
            $data = [
                'competition' => (object)[
                    'name' => 'คณะกรรมการดำเนินงานทั้งหมด',
                    'code' => 'STAFF',
                    'schoolGroup' => $schoolGroup,
                    'venue' => null,
                    'competition_date' => null,
                ],
                'schedule' => null,
                'committees' => $committees,
                'documentTitle' => 'แบบลงทะเบียนคณะกรรมการดำเนินงาน',
                'documentCode' => 'DC.05',
                'generated_at' => now()->locale('th')->translatedFormat('j F Y เวลา H:i น.'),
            ];

            $pdf = Pdf::loadView('exports.committee-checkin-pdf', $data)
                ->setPaper('a4', 'landscape')
                ->setOption('defaultFont', 'THSarabunNew');

            $filename = 'DOC5-แบบลงทะเบียนคณะกรรมการดำเนินงาน-' . ($groupName) . '-' . now()->format('YmdHis') . '.pdf';

            return $pdf->download($filename);

        } catch (\Exception $e) {
            Log::error("GenerateStaffPdf Error: " . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
            return response()->json([
                'success' => false,
                'message' => 'เกิดข้อผิดพลาดในการสร้างเอกสาร',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
