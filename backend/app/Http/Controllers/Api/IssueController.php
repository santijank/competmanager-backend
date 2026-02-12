<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Issue;
use App\Models\IssueReply;
use App\Models\IssueAttachment;
use App\Models\ActivityLog;
use App\Models\School;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class IssueController extends Controller
{
    /**
     * รายการแจ้งปัญหา — กรองตาม role
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            $perPage = (int) ($request->input('per_page', 15));

            $query = Issue::with(['creator:id,name,role', 'assignee:id,name,role', 'schoolGroup:id,name'])
                ->withCount('replies');

            // Role-based visibility
            if (in_array($user->role, ['admin', 'district_admin'])) {
                // เห็นทั้งหมด
            } elseif ($user->role === 'group_admin') {
                // เห็น issues จาก users ในกลุ่มเดียวกัน + ของตัวเอง
                $schoolIds = School::where('school_group_id', $user->school_group_id)->pluck('id')->toArray();
                $query->where(function ($q) use ($user, $schoolIds) {
                    $q->where('created_by', $user->id)
                      ->orWhere('school_group_id', $user->school_group_id);
                });
            } else {
                // school_admin, teacher, judge, committee: เห็นเฉพาะของตัวเอง
                $query->where('created_by', $user->id);
            }

            // Filters
            if ($request->filled('status')) {
                $query->where('status', $request->input('status'));
            }
            if ($request->filled('type')) {
                $query->where('type', $request->input('type'));
            }
            if ($request->filled('priority')) {
                $query->where('priority', $request->input('priority'));
            }
            if ($request->filled('search')) {
                $search = $request->input('search');
                $query->where(function ($q) use ($search) {
                    $q->where('title', 'LIKE', "%{$search}%")
                      ->orWhere('ticket_number', 'LIKE', "%{$search}%");
                });
            }

            $query->orderByRaw("FIELD(priority, 'urgent', 'high', 'normal', 'low')")
                  ->orderBy('created_at', 'desc');

            $issues = $query->paginate($perPage);

            return response()->json([
                'success' => true,
                'data' => $issues->items(),
                'meta' => [
                    'current_page' => $issues->currentPage(),
                    'last_page' => $issues->lastPage(),
                    'per_page' => $issues->perPage(),
                    'total' => $issues->total(),
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('Issue index error: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'เกิดข้อผิดพลาด'], 500);
        }
    }

    /**
     * สร้างแจ้งปัญหาใหม่
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $user = $request->user();

            $validator = Validator::make($request->all(), [
                'title' => 'required|string|max:255',
                'description' => 'required|string',
                'type' => 'required|in:system_bug,data_issue,feature_request,inquiry,complaint,other',
                'priority' => 'required|in:urgent,high,normal,low',
                'attachments' => 'nullable|array|max:5',
                'attachments.*' => 'file|max:10240|mimes:jpeg,jpg,png,gif,webp,pdf,doc,docx,xls,xlsx,zip',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'ข้อมูลไม่ถูกต้อง',
                    'errors' => $validator->errors(),
                ], 422);
            }

            DB::beginTransaction();

            $issue = Issue::create([
                'ticket_number' => Issue::generateTicketNumber(),
                'title' => $request->input('title'),
                'description' => $request->input('description'),
                'type' => $request->input('type'),
                'priority' => $request->input('priority'),
                'status' => 'open',
                'created_by' => $user->id,
                'school_group_id' => $user->school_group_id,
            ]);

            // Handle attachments
            if ($request->hasFile('attachments')) {
                foreach ($request->file('attachments') as $file) {
                    $path = $file->store('issues', 'public');
                    IssueAttachment::create([
                        'issue_id' => $issue->id,
                        'original_name' => $file->getClientOriginalName(),
                        'file_path' => '/storage/' . $path,
                        'file_type' => $file->getMimeType(),
                        'file_size' => $file->getSize(),
                        'uploaded_by' => $user->id,
                    ]);
                }
            }

            DB::commit();

            // Log activity
            try {
                ActivityLog::log(
                    action: 'create',
                    module: 'issues',
                    description: "สร้างแจ้งปัญหา: {$issue->ticket_number} - {$issue->title}",
                    details: ['issue_id' => $issue->id, 'type' => $issue->type, 'priority' => $issue->priority]
                );
            } catch (\Exception $e) {
                // ไม่ block ถ้า log ไม่ได้
            }

            $issue->load(['creator:id,name,role', 'attachments']);

            return response()->json([
                'success' => true,
                'message' => 'แจ้งปัญหาสำเร็จ',
                'data' => $issue,
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Issue store error: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'เกิดข้อผิดพลาด: ' . $e->getMessage()], 500);
        }
    }

    /**
     * แสดงรายละเอียดปัญหา + replies
     */
    public function show(Request $request, $id): JsonResponse
    {
        try {
            $user = $request->user();
            $issue = Issue::with([
                'creator:id,name,role,school_id,school_group_id',
                'assignee:id,name,role',
                'schoolGroup:id,name',
                'attachments',
            ])->findOrFail($id);

            // Check permission
            if (!$this->canView($user, $issue)) {
                return response()->json(['success' => false, 'message' => 'ไม่มีสิทธิ์เข้าถึง'], 403);
            }

            // Load replies (filter internal notes for non-admin)
            $repliesQuery = $issue->replies()
                ->with(['user:id,name,role', 'attachments']);

            if (!in_array($user->role, ['admin', 'district_admin'])) {
                $repliesQuery->where('is_internal_note', false);
            }

            $replies = $repliesQuery->get();

            return response()->json([
                'success' => true,
                'data' => [
                    'issue' => $issue,
                    'replies' => $replies,
                ],
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json(['success' => false, 'message' => 'ไม่พบข้อมูล'], 404);
        } catch (\Exception $e) {
            Log::error('Issue show error: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'เกิดข้อผิดพลาด'], 500);
        }
    }

    /**
     * แก้ไขปัญหา (ผู้แจ้ง + admin)
     */
    public function update(Request $request, $id): JsonResponse
    {
        try {
            $user = $request->user();
            $issue = Issue::findOrFail($id);

            // ผู้แจ้งแก้ได้เฉพาะตอน open, admin แก้ได้เสมอ
            if ($issue->created_by === $user->id && $issue->status !== 'open') {
                return response()->json(['success' => false, 'message' => 'ไม่สามารถแก้ไขได้เนื่องจากสถานะไม่ใช่ เปิด'], 400);
            }

            if ($issue->created_by !== $user->id && !in_array($user->role, ['admin', 'district_admin'])) {
                return response()->json(['success' => false, 'message' => 'ไม่มีสิทธิ์แก้ไข'], 403);
            }

            $validator = Validator::make($request->all(), [
                'title' => 'sometimes|string|max:255',
                'description' => 'sometimes|string',
                'type' => 'sometimes|in:system_bug,data_issue,feature_request,inquiry,complaint,other',
                'priority' => 'sometimes|in:urgent,high,normal,low',
            ]);

            if ($validator->fails()) {
                return response()->json(['success' => false, 'message' => 'ข้อมูลไม่ถูกต้อง', 'errors' => $validator->errors()], 422);
            }

            $issue->update($validator->validated());
            $issue->load(['creator:id,name,role', 'assignee:id,name,role']);

            return response()->json([
                'success' => true,
                'message' => 'แก้ไขสำเร็จ',
                'data' => $issue,
            ]);
        } catch (\Exception $e) {
            Log::error('Issue update error: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'เกิดข้อผิดพลาด'], 500);
        }
    }

    /**
     * เปลี่ยนสถานะ (admin/district_admin เท่านั้น)
     */
    public function updateStatus(Request $request, $id): JsonResponse
    {
        try {
            $user = $request->user();

            if (!in_array($user->role, ['admin', 'district_admin'])) {
                return response()->json(['success' => false, 'message' => 'ไม่มีสิทธิ์เปลี่ยนสถานะ'], 403);
            }

            $validator = Validator::make($request->all(), [
                'status' => 'required|in:open,in_progress,resolved,closed',
            ]);

            if ($validator->fails()) {
                return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
            }

            $issue = Issue::findOrFail($id);
            $oldStatus = $issue->status;
            $newStatus = $request->input('status');

            $updateData = ['status' => $newStatus];

            if ($newStatus === 'resolved') {
                $updateData['resolved_at'] = now();
            } elseif ($newStatus === 'closed') {
                $updateData['closed_at'] = now();
                if (!$issue->resolved_at) {
                    $updateData['resolved_at'] = now();
                }
            } elseif ($newStatus === 'open') {
                // Reopen
                $updateData['resolved_at'] = null;
                $updateData['closed_at'] = null;
            }

            $issue->update($updateData);

            // Auto-create a system reply for status change
            IssueReply::create([
                'issue_id' => $issue->id,
                'user_id' => $user->id,
                'content' => 'เปลี่ยนสถานะจาก "' . Issue::getStatusLabels()[$oldStatus] . '" เป็น "' . Issue::getStatusLabels()[$newStatus] . '"',
                'is_internal_note' => false,
            ]);

            try {
                ActivityLog::log(
                    action: 'update',
                    module: 'issues',
                    description: "เปลี่ยนสถานะปัญหา {$issue->ticket_number}: {$oldStatus} → {$newStatus}",
                    details: ['issue_id' => $issue->id, 'old_status' => $oldStatus, 'new_status' => $newStatus]
                );
            } catch (\Exception $e) {}

            return response()->json([
                'success' => true,
                'message' => 'เปลี่ยนสถานะสำเร็จ',
                'data' => $issue->fresh(['creator:id,name,role', 'assignee:id,name,role']),
            ]);
        } catch (\Exception $e) {
            Log::error('Issue updateStatus error: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'เกิดข้อผิดพลาด'], 500);
        }
    }

    /**
     * มอบหมายผู้รับผิดชอบ (admin/district_admin)
     */
    public function assign(Request $request, $id): JsonResponse
    {
        try {
            $user = $request->user();

            if (!in_array($user->role, ['admin', 'district_admin'])) {
                return response()->json(['success' => false, 'message' => 'ไม่มีสิทธิ์มอบหมาย'], 403);
            }

            $validator = Validator::make($request->all(), [
                'assigned_to' => 'required|exists:users,id',
            ]);

            if ($validator->fails()) {
                return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
            }

            $issue = Issue::findOrFail($id);
            $issue->update([
                'assigned_to' => $request->input('assigned_to'),
                'status' => $issue->status === 'open' ? 'in_progress' : $issue->status,
            ]);

            $issue->load('assignee:id,name,role');

            // Auto-reply
            IssueReply::create([
                'issue_id' => $issue->id,
                'user_id' => $user->id,
                'content' => 'มอบหมายให้ ' . ($issue->assignee->name ?? 'N/A') . ' รับผิดชอบ',
                'is_internal_note' => false,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'มอบหมายสำเร็จ',
                'data' => $issue,
            ]);
        } catch (\Exception $e) {
            Log::error('Issue assign error: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'เกิดข้อผิดพลาด'], 500);
        }
    }

    /**
     * เพิ่มความคิดเห็น/ตอบกลับ
     */
    public function addReply(Request $request, $id): JsonResponse
    {
        try {
            $user = $request->user();
            $issue = Issue::findOrFail($id);

            // ตรวจสิทธิ์: ผู้แจ้ง, ผู้รับผิดชอบ, admin, group_admin ในกลุ่ม
            if (!$this->canView($user, $issue)) {
                return response()->json(['success' => false, 'message' => 'ไม่มีสิทธิ์ตอบกลับ'], 403);
            }

            $validator = Validator::make($request->all(), [
                'content' => 'required|string',
                'is_internal_note' => 'nullable|boolean',
                'attachments' => 'nullable|array|max:5',
                'attachments.*' => 'file|max:10240|mimes:jpeg,jpg,png,gif,webp,pdf,doc,docx,xls,xlsx,zip',
            ]);

            if ($validator->fails()) {
                return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
            }

            DB::beginTransaction();

            $isInternalNote = false;
            if (in_array($user->role, ['admin', 'district_admin']) && $request->boolean('is_internal_note')) {
                $isInternalNote = true;
            }

            $reply = IssueReply::create([
                'issue_id' => $issue->id,
                'user_id' => $user->id,
                'content' => $request->input('content'),
                'is_internal_note' => $isInternalNote,
            ]);

            // Handle attachments
            if ($request->hasFile('attachments')) {
                foreach ($request->file('attachments') as $file) {
                    $path = $file->store('issue-replies', 'public');
                    IssueAttachment::create([
                        'issue_id' => $issue->id,
                        'issue_reply_id' => $reply->id,
                        'original_name' => $file->getClientOriginalName(),
                        'file_path' => '/storage/' . $path,
                        'file_type' => $file->getMimeType(),
                        'file_size' => $file->getSize(),
                        'uploaded_by' => $user->id,
                    ]);
                }
            }

            DB::commit();

            $reply->load(['user:id,name,role', 'attachments']);

            return response()->json([
                'success' => true,
                'message' => 'ตอบกลับสำเร็จ',
                'data' => $reply,
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Issue addReply error: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'เกิดข้อผิดพลาด'], 500);
        }
    }

    /**
     * สถิติปัญหา
     */
    public function statistics(Request $request): JsonResponse
    {
        try {
            $user = $request->user();

            $query = Issue::query();

            // Role-based scope (same as index)
            if (in_array($user->role, ['admin', 'district_admin'])) {
                // ดูทั้งหมด
            } elseif ($user->role === 'group_admin') {
                $query->where(function ($q) use ($user) {
                    $q->where('created_by', $user->id)
                      ->orWhere('school_group_id', $user->school_group_id);
                });
            } else {
                $query->where('created_by', $user->id);
            }

            $total = (clone $query)->count();
            $byStatus = (clone $query)->selectRaw('status, COUNT(*) as count')->groupBy('status')->pluck('count', 'status')->toArray();
            $byType = (clone $query)->selectRaw('type, COUNT(*) as count')->groupBy('type')->pluck('count', 'type')->toArray();
            $byPriority = (clone $query)->selectRaw('priority, COUNT(*) as count')->groupBy('priority')->pluck('count', 'priority')->toArray();

            return response()->json([
                'success' => true,
                'data' => [
                    'total' => $total,
                    'by_status' => $byStatus,
                    'by_type' => $byType,
                    'by_priority' => $byPriority,
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('Issue statistics error: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'เกิดข้อผิดพลาด'], 500);
        }
    }

    // === Private Helpers ===

    private function canView($user, $issue): bool
    {
        // Admin/District Admin: ดูได้ทั้งหมด
        if (in_array($user->role, ['admin', 'district_admin'])) {
            return true;
        }

        // ผู้แจ้งเอง
        if ($issue->created_by === $user->id) {
            return true;
        }

        // ผู้รับผิดชอบ
        if ($issue->assigned_to === $user->id) {
            return true;
        }

        // Group Admin ดู issues ในกลุ่มตัวเอง
        if ($user->role === 'group_admin' && $issue->school_group_id === $user->school_group_id) {
            return true;
        }

        return false;
    }
}
