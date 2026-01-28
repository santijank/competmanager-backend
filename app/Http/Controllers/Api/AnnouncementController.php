<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Announcement;
use App\Models\AnnouncementFile;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class AnnouncementController extends Controller
{
    /**
     * ดูรายการประกาศทั้งหมด (สำหรับ Admin และ Public)
     */
    public function index(Request $request)
    {
        $user = $request->user();
        
        $query = Announcement::with(['schoolGroup', 'competition', 'creator', 'files'])
            ->orderBy('is_pinned', 'desc')
            ->orderBy('published_at', 'desc');

        // Group Admin เห็นเฉพาะประกาศระดับเขต + ประกาศของกลุ่มตัวเอง
        if ($user && $user->role === 'group_admin' && $user->school_group_id) {
            $query->where(function($q) use ($user) {
                $q->where('scope', 'district')
                  ->orWhere(function($q2) use ($user) {
                      $q2->where('scope', 'group')
                         ->where('school_group_id', $user->school_group_id);
                  });
            });
        }
        // Filter by group (สำหรับ public หรือ admin อื่นๆ)
        elseif ($request->has('school_group_id')) {
            $query->where(function($q) use ($request) {
                $q->where('school_group_id', $request->school_group_id)
                  ->orWhere('scope', 'district');
            });
        }

        // Filter by type
        if ($request->has('type')) {
            $query->where('type', $request->type);
        }

        // Filter active only
        if ($request->boolean('active_only')) {
            $query->active();
        }

        // Limit (for public display)
        if ($request->has('limit')) {
            $limit = min((int)$request->input('limit'), 50); // Max 50
            $announcements = $query->limit($limit)->get();
            return response()->json(['data' => $announcements]);
        }

        $perPage = $request->input('per_page', 20);
        $announcements = $query->paginate($perPage);

        return response()->json($announcements);
    }

    /**
     * ดูประกาศเดียว
     */
    public function show($id)
    {
        $announcement = Announcement::with(['schoolGroup', 'competition', 'creator', 'files'])
            ->findOrFail($id);

        return response()->json($announcement);
    }

    /**
     * สร้างประกาศใหม่
     */
    public function store(Request $request)
    {
        $user = $request->user();
        
        // แปลง empty string เป็น null
        $data = $request->all();
        if (isset($data['school_group_id']) && ($data['school_group_id'] === '' || $data['school_group_id'] === 'null')) {
            $data['school_group_id'] = null;
        }
        if (isset($data['competition_id']) && ($data['competition_id'] === '' || $data['competition_id'] === 'null')) {
            $data['competition_id'] = null;
        }
        
        // ถ้าไม่มี scope ให้กำหนดตาม role
        if (!isset($data['scope']) || empty($data['scope'])) {
            if ($user->role === 'group_admin') {
                $data['scope'] = 'group';
            } else {
                $data['scope'] = 'district'; // default สำหรับ district_admin
            }
        }
        
        // ⭐ ถ้า scope เป็น district → school_group_id ต้องเป็น null เสมอ
        if ($data['scope'] === 'district') {
            $data['school_group_id'] = null;
        }
        
        // Group Admin ไม่สามารถสร้างประกาศระดับเขตได้
        if ($user->role === 'group_admin' && $data['scope'] === 'district') {
            return response()->json([
                'message' => 'Unauthorized',
                'errors' => ['scope' => ['Group Admin สามารถสร้างประกาศได้เฉพาะระดับกลุ่มเท่านั้น']]
            ], 403);
        }
        
        // ถ้าเป็น Group Admin และสร้างประกาศระดับกลุ่ม → auto-fill school_group_id
        if ($user->role === 'group_admin' && $data['scope'] === 'group') {
            if (!$data['school_group_id']) {
                $data['school_group_id'] = $user->school_group_id;
            }
            
            // Group Admin สร้างประกาศได้เฉพาะกลุ่มของตัวเอง
            if ($data['school_group_id'] != $user->school_group_id) {
                return response()->json([
                    'message' => 'Unauthorized',
                    'errors' => ['school_group_id' => ['คุณสามารถสร้างประกาศได้เฉพาะกลุ่มของคุณเท่านั้น']]
                ], 403);
            }
        }
        
        // District Admin: ถ้าสร้างประกาศระดับกลุ่ม ต้องระบุ school_group_id
        if (($user->role === 'district_admin' || $user->role === 'admin') && $data['scope'] === 'group') {
            if (!$data['school_group_id']) {
                return response()->json([
                    'message' => 'Validation failed',
                    'errors' => ['school_group_id' => ['กรุณาระบุกลุ่มโรงเรียนสำหรับประกาศระดับกลุ่ม']]
                ], 422);
            }
        }
        
        $validator = Validator::make($data, [
            'title' => 'required|string|max:255',
            'content' => 'required|string',
            'type' => 'required|in:general,competition,result,urgent',
            'scope' => 'required|in:district,group',
            'school_group_id' => 'nullable|exists:school_groups,id',
            'competition_id' => 'nullable|exists:competitions,id',
            'priority' => 'required|in:normal,high,urgent',
            'is_pinned' => 'boolean',
            'published_at' => 'nullable|date',
            'expired_at' => 'nullable|date|after:published_at',
            'files.*' => 'nullable|file|max:10240', // Max 10MB per file
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $announcement = Announcement::create([
            'title' => $data['title'],
            'content' => $data['content'],
            'type' => $data['type'],
            'scope' => $data['scope'],
            'school_group_id' => $data['school_group_id'],
            'competition_id' => $data['competition_id'] ?? null,
            'priority' => $data['priority'],
            'is_pinned' => $request->boolean('is_pinned', false),
            'published_at' => $data['published_at'] ?? now(),
            'expired_at' => $data['expired_at'] ?? null,
            'created_by' => $user->id,
        ]);

        // อัปโหลดไฟล์ (ถ้ามี)
        if ($request->hasFile('files')) {
            foreach ($request->file('files') as $file) {
                $this->uploadFile($announcement, $file);
            }
        }

        return response()->json([
            'message' => 'สร้างประกาศสำเร็จ',
            'announcement' => $announcement->load(['schoolGroup', 'competition', 'creator', 'files'])
        ], 201);
    }

    /**
     * แก้ไขประกาศ
     */
    public function update(Request $request, $id)
    {
        $user = $request->user();
        $announcement = Announcement::findOrFail($id);

        // ตรวจสอบสิทธิ์: Group Admin แก้ไขได้เฉพาะประกาศของกลุ่มตัวเอง
        if ($user->role === 'group_admin') {
            if ($announcement->scope === 'district') {
                return response()->json([
                    'message' => 'Unauthorized',
                    'error' => 'Group Admin ไม่สามารถแก้ไขประกาศระดับเขตได้'
                ], 403);
            }
            
            if ($announcement->school_group_id != $user->school_group_id) {
                return response()->json([
                    'message' => 'Unauthorized',
                    'error' => 'คุณสามารถแก้ไขได้เฉพาะประกาศของกลุ่มคุณเท่านั้น'
                ], 403);
            }
        }

        // แปลง empty string เป็น null
        $data = $request->all();
        if (isset($data['school_group_id']) && ($data['school_group_id'] === '' || $data['school_group_id'] === 'null')) {
            $data['school_group_id'] = null;
        }
        if (isset($data['competition_id']) && ($data['competition_id'] === '' || $data['competition_id'] === 'null')) {
            $data['competition_id'] = null;
        }

        // ⭐ ถ้า scope เป็น district → school_group_id ต้องเป็น null เสมอ
        if (isset($data['scope']) && $data['scope'] === 'district') {
            $data['school_group_id'] = null;
        }

        // Group Admin พยายามเปลี่ยน scope หรือ group
        if ($user->role === 'group_admin') {
            if (isset($data['scope']) && $data['scope'] === 'district') {
                return response()->json([
                    'message' => 'Unauthorized',
                    'errors' => ['scope' => ['Group Admin ไม่สามารถสร้างประกาศระดับเขตได้']]
                ], 403);
            }
            
            if (isset($data['school_group_id']) && $data['school_group_id'] != $user->school_group_id) {
                return response()->json([
                    'message' => 'Unauthorized',
                    'errors' => ['school_group_id' => ['คุณสามารถแก้ไขได้เฉพาะกลุ่มของคุณเท่านั้น']]
                ], 403);
            }
        }

        $validator = Validator::make($data, [
            'title' => 'sometimes|required|string|max:255',
            'content' => 'sometimes|required|string',
            'type' => 'sometimes|required|in:general,competition,result,urgent',
            'scope' => 'sometimes|required|in:district,group',
            'school_group_id' => 'nullable|exists:school_groups,id',
            'competition_id' => 'nullable|exists:competitions,id',
            'priority' => 'sometimes|required|in:normal,high,urgent',
            'is_pinned' => 'boolean',
            'published_at' => 'nullable|date',
            'expired_at' => 'nullable|date',
            'files.*' => 'nullable|file|max:10240', // Max 10MB per file
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        // เตรียมข้อมูลสำหรับ update
        $updateData = [];
        $fields = ['title', 'content', 'type', 'scope', 'school_group_id', 'competition_id', 'priority', 'is_pinned', 'published_at', 'expired_at'];
        
        foreach ($fields as $field) {
            if (array_key_exists($field, $data)) {
                $updateData[$field] = $data[$field];
            }
        }

        $announcement->update($updateData);

        // อัปโหลดไฟล์เพิ่มเติม (ถ้ามี)
        if ($request->hasFile('files')) {
            foreach ($request->file('files') as $file) {
                $this->uploadFile($announcement, $file);
            }
        }

        return response()->json([
            'message' => 'แก้ไขประกาศสำเร็จ',
            'announcement' => $announcement->load(['schoolGroup', 'competition', 'creator', 'files'])
        ]);
    }

    /**
     * ลบประกาศ
     */
    public function destroy(Request $request, $id)
    {
        $user = $request->user();
        $announcement = Announcement::findOrFail($id);

        // ตรวจสอบสิทธิ์: Group Admin ลบได้เฉพาะประกาศของกลุ่มตัวเอง
        if ($user->role === 'group_admin') {
            if ($announcement->scope === 'district') {
                return response()->json([
                    'message' => 'Unauthorized',
                    'error' => 'Group Admin ไม่สามารถลบประกาศระดับเขตได้'
                ], 403);
            }
            
            if ($announcement->school_group_id != $user->school_group_id) {
                return response()->json([
                    'message' => 'Unauthorized',
                    'error' => 'คุณสามารถลบได้เฉพาะประกาศของกลุ่มคุณเท่านั้น'
                ], 403);
            }
        }

        // ลบไฟล์ทั้งหมดที่เกี่ยวข้อง
        foreach ($announcement->files as $file) {
            Storage::disk('public')->delete($file->file_path);
        }

        $announcement->delete();

        return response()->json([
            'message' => 'ลบประกาศสำเร็จ'
        ]);
    }

    /**
     * ปักหมุด/ยกเลิกปักหมุด
     */
    public function togglePin(Request $request, $id)
    {
        $user = $request->user();
        $announcement = Announcement::findOrFail($id);

        // ตรวจสอบสิทธิ์: Group Admin แก้ไขได้เฉพาะประกาศของกลุ่มตัวเอง
        if ($user->role === 'group_admin') {
            if ($announcement->scope === 'district') {
                return response()->json([
                    'message' => 'Unauthorized',
                    'error' => 'Group Admin ไม่สามารถปักหมุดประกาศระดับเขตได้'
                ], 403);
            }
            
            if ($announcement->school_group_id != $user->school_group_id) {
                return response()->json([
                    'message' => 'Unauthorized',
                    'error' => 'คุณสามารถแก้ไขได้เฉพาะประกาศของกลุ่มคุณเท่านั้น'
                ], 403);
            }
        }

        $announcement->is_pinned = !$announcement->is_pinned;
        $announcement->save();

        return response()->json([
            'message' => $announcement->is_pinned ? 'ปักหมุดประกาศแล้ว' : 'ยกเลิกปักหมุดแล้ว',
            'announcement' => $announcement
        ]);
    }

    /**
     * ดาวน์โหลดไฟล์
     */
    public function downloadFile($announcementId, $fileId)
    {
        $file = AnnouncementFile::where('announcement_id', $announcementId)
            ->where('id', $fileId)
            ->firstOrFail();

        // เพิ่มจำนวนการดาวน์โหลด
        $file->incrementDownloadCount();

        // ดาวน์โหลดไฟล์
        return Storage::disk('public')->download($file->file_path, $file->original_name);
    }

    /**
     * ลบไฟล์
     */
    public function deleteFile(Request $request, $announcementId, $fileId)
    {
        $user = $request->user();
        $announcement = Announcement::findOrFail($announcementId);

        // ตรวจสอบสิทธิ์
        if ($user->role === 'group_admin') {
            if ($announcement->scope === 'district') {
                return response()->json([
                    'message' => 'Unauthorized',
                    'error' => 'Group Admin ไม่สามารถลบไฟล์ของประกาศระดับเขตได้'
                ], 403);
            }
            
            if ($announcement->school_group_id != $user->school_group_id) {
                return response()->json([
                    'message' => 'Unauthorized',
                    'error' => 'คุณสามารถลบได้เฉพาะไฟล์ของกลุ่มคุณเท่านั้น'
                ], 403);
            }
        }

        $file = AnnouncementFile::where('announcement_id', $announcementId)
            ->where('id', $fileId)
            ->firstOrFail();

        // ลบไฟล์จาก storage
        Storage::disk('public')->delete($file->file_path);

        // ลบ record จาก database
        $file->delete();

        return response()->json([
            'message' => 'ลบไฟล์สำเร็จ'
        ]);
    }

    /**
     * Helper: อัปโหลดไฟล์
     */
    private function uploadFile(Announcement $announcement, $file)
    {
        $originalName = $file->getClientOriginalName();
        $extension = $file->getClientOriginalExtension();
        $storedName = Str::random(40) . '.' . $extension;
        
        // เก็บไฟล์ใน storage/app/public/announcements
        $path = $file->storeAs('announcements', $storedName, 'public');

        // บันทึกข้อมูลไฟล์
        AnnouncementFile::create([
            'announcement_id' => $announcement->id,
            'original_name' => $originalName,
            'stored_name' => $storedName,
            'file_path' => $path,
            'file_type' => $file->getMimeType(),
            'file_size' => $file->getSize(),
        ]);
    }
}
