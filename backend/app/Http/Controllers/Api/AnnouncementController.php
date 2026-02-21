<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class AnnouncementController extends Controller
{
    /**
     * 🌐 แสดงรายการประกาศสาธารณะ (ไม่ต้อง login)
     */
    public function publicIndex(Request $request): JsonResponse
    {
        try {
            $query = DB::table('announcements as a')
                ->leftJoin('school_groups as sg', 'a.school_group_id', '=', 'sg.id')
                ->leftJoin('competitions as c', 'a.competition_id', '=', 'c.id')
                ->select([
                    'a.id',
                    'a.title',
                    'a.content',
                    'a.type',
                    'a.scope',
                    'a.school_group_id',
                    'a.priority',
                    'a.is_pinned',
                    'a.published_at',
                    'a.expired_at',
                    'a.link_url',
                    'a.link_title',
                    'a.image_url',
                    'sg.name as school_group_name',
                    'c.name as competition_name',
                    'a.created_at'
                ])
                ->where('a.published_at', '<=', now())
                ->where(function($q) {
                    $q->whereNull('a.expired_at')
                      ->orWhere('a.expired_at', '>', now());
                });

            $limit = $request->get('limit', 50);

            $announcements = $query
                ->orderBy('a.is_pinned', 'desc')
                ->orderBy('a.priority', 'desc')
                ->orderBy('a.published_at', 'desc')
                ->limit($limit)
                ->get();

            return response()->json([
                'success' => true,
                'data' => $announcements
            ]);
        } catch (\Exception $e) {
            Log::error('Public announcement index error', ['error' => $e->getMessage()]);

            return response()->json([
                'success' => true,
                'data' => []
            ]);
        }
    }

    /**
     * 📋 แสดงรายการประกาศ (สำหรับ admin)
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $user = $request->user();

            $query = DB::table('announcements as a')
                ->leftJoin('school_groups as sg', 'a.school_group_id', '=', 'sg.id')
                ->leftJoin('competitions as c', 'a.competition_id', '=', 'c.id')
                ->leftJoin('users as u', 'a.created_by', '=', 'u.id')
                ->select([
                    'a.id',
                    'a.title',
                    'a.content',
                    'a.type',
                    'a.scope',
                    'a.school_group_id',
                    'a.priority',
                    'a.is_pinned',
                    'a.published_at',
                    'a.expired_at',
                    'a.link_url',
                    'a.link_title',
                    'a.image_url',
                    'a.created_by',
                    'sg.name as school_group_name',
                    'c.name as competition_name',
                    'u.name as created_by_name',
                    'a.created_at'
                ]);

            // กรองตาม role
            // category_admin / data_entry เห็นเฉพาะประกาศที่ตัวเองสร้าง + ประกาศระดับเขต
            if (in_array($user->role, ['category_admin', 'data_entry'])) {
                $query->where(function($q) use ($user) {
                    $q->where('a.scope', 'district')
                      ->orWhere('a.created_by', $user->id);
                });
            } elseif ($user->role === 'group_admin') {
                // Group admin เห็นเฉพาะประกาศของกลุ่มตัวเอง + ประกาศระดับเขต
                $query->where(function($q) use ($user) {
                    $q->where('a.scope', 'district')
                      ->orWhere('a.school_group_id', $user->school_group_id);
                });
            } elseif ($user->role === 'school_admin') {
                // School admin เห็นเฉพาะประกาศของกลุ่มตัวเอง + ประกาศระดับเขต
                $query->where(function($q) use ($user) {
                    $q->where('a.scope', 'district')
                      ->orWhere('a.school_group_id', $user->school_group_id);
                });
            }
            // district_admin และ admin เห็นทั้งหมด

            $announcements = $query
                ->orderBy('a.is_pinned', 'desc')
                ->orderBy('a.priority', 'desc')
                ->orderBy('a.published_at', 'desc')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $announcements
            ]);
        } catch (\Exception $e) {
            Log::error('Announcement index error', ['error' => $e->getMessage()]);

            return response()->json([
                'success' => false,
                'message' => 'ไม่สามารถโหลดประกาศได้: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * 📝 สร้างประกาศใหม่
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $user = $request->user();

            // ตรวจสอบสิทธิ์
            if (!in_array($user->role, ['district_admin', 'admin', 'group_admin', 'category_admin', 'data_entry'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'คุณไม่มีสิทธิ์สร้างประกาศ'
                ], 403);
            }

            // ตรวจสอบว่าเป็นการส่งไปทุกกลุ่มหรือไม่
            $sendToAllGroups = $request->school_group_id === 'all';

            // Validate - ถ้าส่งทุกกลุ่ม ให้ข้าม school_group_id validation
            $rules = [
                'title' => 'required|string|max:255',
                'content' => 'required|string',
                'type' => 'required|in:general,competition,result,urgent',
                'scope' => 'required|in:district,group',
                'competition_id' => 'nullable|exists:competitions,id',
                'priority' => 'required|in:normal,high,urgent',
                'is_pinned' => 'nullable',
                'published_at' => 'nullable|date',
                'expired_at' => 'nullable|date',
                'link_url' => 'nullable|url|max:500',
                'link_title' => 'nullable|string|max:255',
            ];

            if (!$sendToAllGroups) {
                $rules['school_group_id'] = 'nullable|exists:school_groups,id';
            }

            $data = $request->validate($rules);

            // จัดการอัปโหลดรูปภาพ
            if ($request->hasFile('image')) {
                $request->validate(['image' => 'image|mimes:jpeg,jpg,png,gif,webp|max:5120']);
                $path = $request->file('image')->store('announcements', 'public');
                $data['image_url'] = '/storage/' . $path;
            }

            // Group Admin สามารถสร้างได้เฉพาะกลุ่มตนเอง
            if ($user->role === 'group_admin') {
                $data['school_group_id'] = $user->school_group_id;
                $data['scope'] = 'group';
                $sendToAllGroups = false; // Group admin ไม่สามารถส่งทุกกลุ่ม
            }

            // Category Admin / Data Entry สร้างประกาศระดับเขต (ครอบคลุมทุกกลุ่ม)
            if (in_array($user->role, ['category_admin', 'data_entry'])) {
                $data['scope'] = 'district';
                $data['school_group_id'] = null;
                $sendToAllGroups = false;
            }

            // ถ้าเป็น district scope ให้ล้าง school_group_id
            if ($data['scope'] === 'district') {
                $data['school_group_id'] = null;
                $sendToAllGroups = false;
            }

            $data['created_by'] = $user->id;
            $data['published_at'] = $data['published_at'] ?? now();
            $data['is_pinned'] = filter_var($data['is_pinned'] ?? false, FILTER_VALIDATE_BOOLEAN) ? 1 : 0;
            $data['created_at'] = now();
            $data['updated_at'] = now();

            // ส่งประกาศไปทุกกลุ่ม (เฉพาะ district_admin/admin)
            if ($sendToAllGroups && in_array($user->role, ['district_admin', 'admin'])) {
                $schoolGroups = DB::table('school_groups')->pluck('id');
                $createdIds = [];

                // ลบ school_group_id ออกจาก data เพราะจะใส่ทีละกลุ่ม
                unset($data['school_group_id']);

                foreach ($schoolGroups as $groupId) {
                    $insertData = array_merge($data, [
                        'school_group_id' => $groupId,
                        'scope' => 'group',
                    ]);
                    $createdIds[] = DB::table('announcements')->insertGetId($insertData);
                }

                return response()->json([
                    'success' => true,
                    'message' => "สร้างประกาศไปยังทุกกลุ่มสำเร็จ ({$schoolGroups->count()} กลุ่ม)",
                    'data' => ['ids' => $createdIds, 'count' => count($createdIds)]
                ]);
            }

            // สร้างประกาศปกติ (กลุ่มเดียว)
            if (isset($data['school_group_id']) && $data['school_group_id'] === 'all') {
                unset($data['school_group_id']);
            }

            $announcementId = DB::table('announcements')->insertGetId($data);

            return response()->json([
                'success' => true,
                'message' => 'สร้างประกาศสำเร็จ',
                'data' => ['id' => $announcementId]
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'ข้อมูลไม่ถูกต้อง',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            Log::error('Announcement store error', ['error' => $e->getMessage()]);

            return response()->json([
                'success' => false,
                'message' => 'ไม่สามารถสร้างประกาศได้: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * 👁️ แสดงประกาศ
     */
    public function show(Request $request, $id): JsonResponse
    {
        try {
            $user = $request->user();

            $announcement = DB::table('announcements as a')
                ->leftJoin('school_groups as sg', 'a.school_group_id', '=', 'sg.id')
                ->leftJoin('competitions as c', 'a.competition_id', '=', 'c.id')
                ->leftJoin('users as u', 'a.created_by', '=', 'u.id')
                ->select([
                    'a.*',
                    'sg.name as school_group_name',
                    'c.name as competition_name',
                    'u.name as created_by_name'
                ])
                ->where('a.id', $id)
                ->first();

            if (!$announcement) {
                return response()->json([
                    'success' => false,
                    'message' => 'ไม่พบประกาศ'
                ], 404);
            }

            // ตรวจสอบสิทธิ์ในการเข้าถึง
            if (!in_array($user->role, ['district_admin', 'admin', 'category_admin', 'data_entry'])) {
                if ($announcement->school_group_id && $announcement->school_group_id !== $user->school_group_id) {
                    return response()->json([
                        'success' => false,
                        'message' => 'คุณไม่มีสิทธิ์เข้าถึงประกาศนี้'
                    ], 403);
                }
            }

            return response()->json($announcement);
        } catch (\Exception $e) {
            Log::error('Announcement show error', ['error' => $e->getMessage()]);

            return response()->json([
                'success' => false,
                'message' => 'ไม่สามารถโหลดประกาศได้'
            ], 500);
        }
    }

    /**
     * ✏️ อัปเดตประกาศ
     */
    public function update(Request $request, $id): JsonResponse
    {
        try {
            $user = $request->user();

            // ตรวจสอบว่าประกาศมีอยู่
            $announcement = DB::table('announcements')->where('id', $id)->first();
            if (!$announcement) {
                return response()->json([
                    'success' => false,
                    'message' => 'ไม่พบประกาศ'
                ], 404);
            }

            // ตรวจสอบสิทธิ์
            if (!in_array($user->role, ['district_admin', 'admin'])) {
                if ($user->role === 'group_admin') {
                    // Group admin แก้ไขได้เฉพาะประกาศของกลุ่มตัวเอง
                    if ($announcement->school_group_id !== $user->school_group_id) {
                        return response()->json([
                            'success' => false,
                            'message' => 'คุณไม่มีสิทธิ์แก้ไขประกาศนี้'
                        ], 403);
                    }
                } elseif (in_array($user->role, ['category_admin', 'data_entry'])) {
                    // แก้ไขได้เฉพาะประกาศที่ตัวเองสร้าง
                    if ($announcement->created_by !== $user->id) {
                        return response()->json([
                            'success' => false,
                            'message' => 'คุณแก้ไขได้เฉพาะประกาศที่ตัวเองสร้าง'
                        ], 403);
                    }
                } else {
                    return response()->json([
                        'success' => false,
                        'message' => 'คุณไม่มีสิทธิ์แก้ไขประกาศ'
                    ], 403);
                }
            }

            $data = $request->validate([
                'title' => 'nullable|string|max:255',
                'content' => 'nullable|string',
                'type' => 'nullable|in:general,competition,result,urgent',
                'scope' => 'nullable|in:district,group',
                'school_group_id' => 'nullable|exists:school_groups,id',
                'priority' => 'nullable|in:normal,high,urgent',
                'is_pinned' => 'nullable',
                'published_at' => 'nullable|date',
                'expired_at' => 'nullable|date',
                'link_url' => 'nullable|url|max:500',
                'link_title' => 'nullable|string|max:255',
            ]);

            // จัดการอัปโหลดรูปภาพ
            if ($request->hasFile('image')) {
                $request->validate(['image' => 'image|mimes:jpeg,jpg,png,gif,webp|max:5120']);

                // ลบรูปเก่า
                if ($announcement->image_url) {
                    $oldPath = str_replace('/storage/', '', $announcement->image_url);
                    Storage::disk('public')->delete($oldPath);
                }

                $path = $request->file('image')->store('announcements', 'public');
                $data['image_url'] = '/storage/' . $path;
            }

            // ลบรูปภาพ ถ้าส่ง remove_image=1
            if ($request->boolean('remove_image')) {
                if ($announcement->image_url) {
                    $oldPath = str_replace('/storage/', '', $announcement->image_url);
                    Storage::disk('public')->delete($oldPath);
                }
                $data['image_url'] = null;
            }

            // กรองเฉพาะข้อมูลที่ส่งมา
            $updateData = array_filter($data, fn($v) => $v !== null);

            // ถ้าลบรูปภาพ ต้องใส่ null กลับ
            if ($request->boolean('remove_image')) {
                $updateData['image_url'] = null;
            }

            // แปลง is_pinned
            if (isset($updateData['is_pinned'])) {
                $updateData['is_pinned'] = filter_var($updateData['is_pinned'], FILTER_VALIDATE_BOOLEAN) ? 1 : 0;
            }

            // ถ้าเป็น district scope ให้ล้าง school_group_id
            if (isset($updateData['scope']) && $updateData['scope'] === 'district') {
                $updateData['school_group_id'] = null;
            }

            $updateData['updated_at'] = now();

            DB::table('announcements')
                ->where('id', $id)
                ->update($updateData);

            return response()->json([
                'success' => true,
                'message' => 'อัปเดตประกาศสำเร็จ'
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'ข้อมูลไม่ถูกต้อง',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            Log::error('Announcement update error', ['error' => $e->getMessage()]);

            return response()->json([
                'success' => false,
                'message' => 'ไม่สามารถอัปเดตประกาศได้: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * 🗑️ ลบประกาศ
     */
    public function destroy(Request $request, $id): JsonResponse
    {
        try {
            $user = $request->user();

            // ตรวจสอบว่าประกาศมีอยู่
            $announcement = DB::table('announcements')->where('id', $id)->first();
            if (!$announcement) {
                return response()->json([
                    'success' => false,
                    'message' => 'ไม่พบประกาศ'
                ], 404);
            }

            // ตรวจสอบสิทธิ์
            if (!in_array($user->role, ['district_admin', 'admin'])) {
                if ($user->role === 'group_admin') {
                    // Group admin ลบได้เฉพาะประกาศของกลุ่มตัวเอง
                    if ($announcement->school_group_id !== $user->school_group_id) {
                        return response()->json([
                            'success' => false,
                            'message' => 'คุณไม่มีสิทธิ์ลบประกาศนี้'
                        ], 403);
                    }
                } elseif ($user->role === 'category_admin') {
                    // Category admin ลบได้เฉพาะประกาศที่ตัวเองสร้าง
                    if ($announcement->created_by !== $user->id) {
                        return response()->json([
                            'success' => false,
                            'message' => 'คุณลบได้เฉพาะประกาศที่ตัวเองสร้าง'
                        ], 403);
                    }
                } else {
                    // data_entry และ role อื่นลบไม่ได้
                    return response()->json([
                        'success' => false,
                        'message' => 'คุณไม่มีสิทธิ์ลบประกาศ'
                    ], 403);
                }
            }

            DB::table('announcements')->where('id', $id)->delete();

            return response()->json([
                'success' => true,
                'message' => 'ลบประกาศสำเร็จ'
            ]);
        } catch (\Exception $e) {
            Log::error('Announcement destroy error', ['error' => $e->getMessage()]);

            return response()->json([
                'success' => false,
                'message' => 'ไม่สามารถลบประกาศได้'
            ], 500);
        }
    }

    /**
     * 📌 Toggle pin status
     */
    public function togglePin(Request $request, $id): JsonResponse
    {
        try {
            $user = $request->user();

            // ตรวจสอบว่าประกาศมีอยู่
            $announcement = DB::table('announcements')->where('id', $id)->first();
            if (!$announcement) {
                return response()->json([
                    'success' => false,
                    'message' => 'ไม่พบประกาศ'
                ], 404);
            }

            // ตรวจสอบสิทธิ์
            if (!in_array($user->role, ['district_admin', 'admin'])) {
                if ($user->role === 'group_admin') {
                    if ($announcement->school_group_id !== $user->school_group_id) {
                        return response()->json([
                            'success' => false,
                            'message' => 'คุณไม่มีสิทธิ์แก้ไขประกาศนี้'
                        ], 403);
                    }
                } elseif (in_array($user->role, ['category_admin', 'data_entry'])) {
                    if ($announcement->created_by !== $user->id) {
                        return response()->json([
                            'success' => false,
                            'message' => 'คุณแก้ไขได้เฉพาะประกาศที่ตัวเองสร้าง'
                        ], 403);
                    }
                } else {
                    return response()->json([
                        'success' => false,
                        'message' => 'คุณไม่มีสิทธิ์แก้ไขประกาศ'
                    ], 403);
                }
            }

            $newPinStatus = !$announcement->is_pinned;

            DB::table('announcements')
                ->where('id', $id)
                ->update([
                    'is_pinned' => $newPinStatus,
                    'updated_at' => now()
                ]);

            return response()->json([
                'success' => true,
                'message' => $newPinStatus ? 'ปักหมุดประกาศสำเร็จ' : 'ยกเลิกปักหมุดสำเร็จ',
                'is_pinned' => $newPinStatus
            ]);
        } catch (\Exception $e) {
            Log::error('Announcement togglePin error', ['error' => $e->getMessage()]);

            return response()->json([
                'success' => false,
                'message' => 'ไม่สามารถเปลี่ยนสถานะปักหมุดได้'
            ], 500);
        }
    }
}
