<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CompetitionSchedule;
use App\Models\Competition;
use App\Models\Registration;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class CompetitionScheduleController extends Controller
{
    /**
     * ดึงรายการการแข่งขันที่มีผู้ลงทะเบียน approved แล้ว (สำหรับจัดตารางแข่งขัน)
     */
    public function getApprovedCompetitions(Request $request): JsonResponse
    {
        try {
            $user = $request->user();

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'ไม่พบข้อมูลผู้ใช้'
                ], 401);
            }

            Log::info('getApprovedCompetitions - User: ' . $user->id . ', Role: ' . $user->role);

            // ดึง competition ที่มี registration approved
            $query = Competition::whereHas('registrations', function ($q) {
                $q->where('status', 'approved');
            })->with(['category', 'schoolGroup']);

            // กรองตาม role
            if ($user->role === 'group_admin') {
                $query->where('school_group_id', $user->school_group_id)
                      ->where('competition_level', 'group');
            } elseif (in_array($user->role, ['category_admin', 'data_entry'])) {
                // category_admin/data_entry: เฉพาะหมวดของตน ระดับเขต
                $query->where('competition_level', 'district');
                if ($user->category_id) {
                    $query->whereIn('category_id', $user->getCategoryIdsForScope());
                    if ($user->competition_name_filter) {
                        $filter = $user->competition_name_filter;
                        if (str_starts_with($filter, '!')) {
                            $query->where('name', 'NOT LIKE', '%' . substr($filter, 1) . '%');
                        } else {
                            $query->where('name', 'LIKE', '%' . $filter . '%');
                        }
                    }
                }
            } elseif (!in_array($user->role, ['admin', 'district_admin'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'คุณไม่มีสิทธิ์เข้าถึงข้อมูลนี้'
                ], 403);
            }

            $competitions = $query->orderBy('name')->get();

            // เพิ่มข้อมูล schedule ถ้ามี - ตรวจสอบว่า table มีอยู่ก่อน
            $hasScheduleTable = Schema::hasTable('competition_schedules');

            $competitions->each(function ($competition) use ($user, $hasScheduleTable) {
                $competition->schedule = null;

                if ($hasScheduleTable) {
                    $scheduleQuery = CompetitionSchedule::where('competition_id', $competition->id);

                    if ($user->role === 'group_admin') {
                        $scheduleQuery->where('school_group_id', $user->school_group_id)
                                      ->where('level', 'group');
                    } elseif (in_array($user->role, ['category_admin', 'data_entry'])) {
                        // category_admin/data_entry: ดู schedule ระดับ district
                        $scheduleQuery->where('level', 'district');
                    } elseif (in_array($user->role, ['admin', 'district_admin'])) {
                        // Admin/District admin สามารถดูทั้ง group และ district level
                        if ($competition->competition_level === 'district') {
                            $scheduleQuery->where('level', 'district');
                        } else {
                            $scheduleQuery->where('school_group_id', $competition->school_group_id)
                                          ->where('level', 'group');
                        }
                    }

                    $competition->schedule = $scheduleQuery->first();
                }

                $competition->approved_count = $competition->registrations()
                    ->where('status', 'approved')
                    ->count();
            });

            return response()->json([
                'success' => true,
                'data' => $competitions
            ]);

        } catch (\Exception $e) {
            Log::error('Get approved competitions error: ' . $e->getMessage());
            Log::error('Stack trace: ' . $e->getTraceAsString());
            return response()->json([
                'success' => false,
                'message' => 'เกิดข้อผิดพลาด: ' . $e->getMessage(),
                'data' => []
            ], 500);
        }
    }

    /**
     * บันทึก/อัพเดท ตารางแข่งขัน
     */
    public function store(Request $request): JsonResponse
    {
        try {
            // ตรวจสอบว่า table มีอยู่หรือไม่
            if (!Schema::hasTable('competition_schedules')) {
                return response()->json([
                    'success' => false,
                    'message' => 'กรุณารัน migration ก่อน: php artisan migrate'
                ], 500);
            }

            $user = $request->user();

            $validator = Validator::make($request->all(), [
                'competition_id' => 'required|exists:competitions,id',
                'venue' => 'nullable|string|max:255',
                'room' => 'nullable|string|max:255',
                'competition_date' => 'nullable|date',
                'start_time' => 'nullable|date_format:H:i',
                'end_time' => 'nullable|date_format:H:i|after:start_time',
                'notes' => 'nullable|string|max:1000',
                'is_published' => 'boolean',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'ข้อมูลไม่ถูกต้อง',
                    'errors' => $validator->errors()
                ], 422);
            }

            $competition = Competition::findOrFail($request->competition_id);

            // ตรวจสอบสิทธิ์
            $level = 'group';
            $schoolGroupId = null;

            if ($user->role === 'group_admin') {
                if ($competition->school_group_id !== $user->school_group_id) {
                    return response()->json([
                        'success' => false,
                        'message' => 'คุณไม่มีสิทธิ์จัดการการแข่งขันนี้'
                    ], 403);
                }
                $schoolGroupId = $user->school_group_id;
                $level = 'group';
            } elseif (in_array($user->role, ['category_admin', 'data_entry'])) {
                // category_admin/data_entry: จัดการเฉพาะระดับเขต ในหมวดของตน
                if ($competition->competition_level !== 'district') {
                    return response()->json([
                        'success' => false,
                        'message' => 'คุณจัดการได้เฉพาะการแข่งขันระดับเขต'
                    ], 403);
                }
                if ($user->category_id && !$user->canAccessCompetition($competition)) {
                    return response()->json([
                        'success' => false,
                        'message' => 'คุณไม่มีสิทธิ์จัดการการแข่งขันนี้'
                    ], 403);
                }
                $level = 'district';
                $schoolGroupId = null;
            } elseif (in_array($user->role, ['admin', 'district_admin'])) {
                if ($competition->competition_level === 'district') {
                    $level = 'district';
                    $schoolGroupId = null;
                } else {
                    $level = 'group';
                    $schoolGroupId = $competition->school_group_id;
                }
            } else {
                return response()->json([
                    'success' => false,
                    'message' => 'คุณไม่มีสิทธิ์'
                ], 403);
            }

            // หา schedule ที่มีอยู่หรือสร้างใหม่
            $schedule = CompetitionSchedule::updateOrCreate(
                [
                    'competition_id' => $request->competition_id,
                    'school_group_id' => $schoolGroupId,
                    'level' => $level,
                ],
                [
                    'venue' => $request->venue,
                    'room' => $request->room,
                    'competition_date' => $request->competition_date,
                    'start_time' => $request->start_time,
                    'end_time' => $request->end_time,
                    'notes' => $request->notes,
                    'is_published' => $request->is_published ?? false,
                    'published_at' => $request->is_published ? now() : null,
                    'updated_by' => $user->id,
                    'created_by' => DB::raw('COALESCE(created_by, ' . $user->id . ')'),
                ]
            );

            Log::info('Schedule saved', [
                'schedule_id' => $schedule->id,
                'competition_id' => $request->competition_id,
                'user_id' => $user->id
            ]);

            return response()->json([
                'success' => true,
                'message' => 'บันทึกตารางแข่งขันสำเร็จ',
                'data' => $schedule->load(['competition', 'schoolGroup'])
            ]);

        } catch (\Exception $e) {
            Log::error('Save schedule error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'เกิดข้อผิดพลาดในการบันทึก',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Bulk save schedules
     */
    public function bulkSave(Request $request): JsonResponse
    {
        try {
            // ตรวจสอบว่า table มีอยู่หรือไม่
            if (!Schema::hasTable('competition_schedules')) {
                return response()->json([
                    'success' => false,
                    'message' => 'กรุณารัน migration ก่อน: php artisan migrate'
                ], 500);
            }

            $user = $request->user();

            $validator = Validator::make($request->all(), [
                'schedules' => 'required|array|min:1',
                'schedules.*.competition_id' => 'required|exists:competitions,id',
                'schedules.*.venue' => 'nullable|string|max:255',
                'schedules.*.room' => 'nullable|string|max:255',
                'schedules.*.competition_date' => 'nullable|date',
                'schedules.*.start_time' => 'nullable|date_format:H:i',
                'schedules.*.end_time' => 'nullable|date_format:H:i',
                'schedules.*.notes' => 'nullable|string|max:1000',
                'schedules.*.is_published' => 'boolean',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'errors' => $validator->errors()
                ], 422);
            }

            $saved = 0;
            foreach ($request->schedules as $scheduleData) {
                $competition = Competition::find($scheduleData['competition_id']);
                if (!$competition) continue;

                // ตรวจสอบสิทธิ์
                $level = 'group';
                $schoolGroupId = null;

                if ($user->role === 'group_admin') {
                    if ($competition->school_group_id !== $user->school_group_id) continue;
                    $schoolGroupId = $user->school_group_id;
                    $level = 'group';
                } elseif (in_array($user->role, ['category_admin', 'data_entry'])) {
                    if ($competition->competition_level !== 'district') continue;
                    if ($user->category_id && !$user->canAccessCompetition($competition)) continue;
                    $level = 'district';
                    $schoolGroupId = null;
                } elseif (in_array($user->role, ['admin', 'district_admin'])) {
                    if ($competition->competition_level === 'district') {
                        $level = 'district';
                    } else {
                        $level = 'group';
                        $schoolGroupId = $competition->school_group_id;
                    }
                }

                CompetitionSchedule::updateOrCreate(
                    [
                        'competition_id' => $scheduleData['competition_id'],
                        'school_group_id' => $schoolGroupId,
                        'level' => $level,
                    ],
                    [
                        'venue' => $scheduleData['venue'] ?? null,
                        'room' => $scheduleData['room'] ?? null,
                        'competition_date' => $scheduleData['competition_date'] ?? null,
                        'start_time' => $scheduleData['start_time'] ?? null,
                        'end_time' => $scheduleData['end_time'] ?? null,
                        'notes' => $scheduleData['notes'] ?? null,
                        'is_published' => $scheduleData['is_published'] ?? false,
                        'published_at' => ($scheduleData['is_published'] ?? false) ? now() : null,
                        'updated_by' => $user->id,
                    ]
                );

                $saved++;
            }

            return response()->json([
                'success' => true,
                'message' => "บันทึกตารางแข่งขันสำเร็จ {$saved} รายการ",
                'saved_count' => $saved
            ]);

        } catch (\Exception $e) {
            Log::error('Bulk save schedules error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'เกิดข้อผิดพลาด'
            ], 500);
        }
    }

    /**
     * ดึงตารางแข่งขันที่เผยแพร่แล้ว (สำหรับ Public Dashboard)
     */
    public function getPublishedSchedules(Request $request): JsonResponse
    {
        try {
            // ตรวจสอบว่า table มีอยู่หรือไม่
            if (!Schema::hasTable('competition_schedules')) {
                return response()->json([
                    'success' => true,
                    'data' => [],
                    'grouped' => []
                ]);
            }

            $groupId = $request->query('school_group_id');

            $query = CompetitionSchedule::where('is_published', true)
                ->with(['competition.category', 'schoolGroup'])
                ->orderBy('competition_date')
                ->orderBy('start_time');

            if ($groupId) {
                $query->where(function ($q) use ($groupId) {
                    $q->where('school_group_id', $groupId)
                      ->orWhere('level', 'district');
                });
            }

            $schedules = $query->get();

            // จัดกลุ่มตามวันที่
            $grouped = $schedules->groupBy(function ($schedule) {
                return $schedule->competition_date?->format('Y-m-d') ?? 'no_date';
            });

            return response()->json([
                'success' => true,
                'data' => $schedules,
                'grouped' => $grouped
            ]);

        } catch (\Exception $e) {
            Log::error('Get published schedules error: ' . $e->getMessage());
            return response()->json([
                'success' => true,
                'data' => [],
                'grouped' => []
            ]);
        }
    }

    /**
     * Publish/Unpublish schedule
     */
    public function togglePublish(Request $request, int $id): JsonResponse
    {
        try {
            $user = $request->user();
            $schedule = CompetitionSchedule::findOrFail($id);

            // ตรวจสอบสิทธิ์
            if ($user->role === 'group_admin') {
                if ($schedule->school_group_id !== $user->school_group_id) {
                    return response()->json([
                        'success' => false,
                        'message' => 'คุณไม่มีสิทธิ์'
                    ], 403);
                }
            } elseif (in_array($user->role, ['category_admin', 'data_entry'])) {
                // category_admin/data_entry: ต้องเป็น schedule ระดับ district + หมวดของตน
                if ($schedule->level !== 'district') {
                    return response()->json([
                        'success' => false,
                        'message' => 'คุณจัดการได้เฉพาะระดับเขต'
                    ], 403);
                }
                $competition = Competition::find($schedule->competition_id);
                if ($competition && $user->category_id && !$user->canAccessCompetition($competition)) {
                    return response()->json([
                        'success' => false,
                        'message' => 'คุณไม่มีสิทธิ์จัดการการแข่งขันนี้'
                    ], 403);
                }
            } elseif (!in_array($user->role, ['admin', 'district_admin'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'คุณไม่มีสิทธิ์'
                ], 403);
            }

            $schedule->is_published = !$schedule->is_published;
            $schedule->published_at = $schedule->is_published ? now() : null;
            $schedule->updated_by = $user->id;
            $schedule->save();

            return response()->json([
                'success' => true,
                'message' => $schedule->is_published ? 'เผยแพร่แล้ว' : 'ยกเลิกการเผยแพร่แล้ว',
                'data' => $schedule
            ]);

        } catch (\Exception $e) {
            Log::error('Toggle publish error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'เกิดข้อผิดพลาด'
            ], 500);
        }
    }

    /**
     * Delete schedule
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        try {
            $user = $request->user();
            $schedule = CompetitionSchedule::findOrFail($id);

            // ตรวจสอบสิทธิ์
            if ($user->role === 'group_admin') {
                if ($schedule->school_group_id !== $user->school_group_id) {
                    return response()->json([
                        'success' => false,
                        'message' => 'คุณไม่มีสิทธิ์'
                    ], 403);
                }
            } elseif (!in_array($user->role, ['admin', 'district_admin'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'คุณไม่มีสิทธิ์'
                ], 403);
            }

            $schedule->delete();

            return response()->json([
                'success' => true,
                'message' => 'ลบตารางแข่งขันสำเร็จ'
            ]);

        } catch (\Exception $e) {
            Log::error('Delete schedule error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'เกิดข้อผิดพลาด'
            ], 500);
        }
    }
}
