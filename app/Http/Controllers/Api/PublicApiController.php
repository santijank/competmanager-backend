<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SchoolGroup;
use App\Models\School;
use App\Models\Registration;
use App\Models\Score;
use App\Models\Competition;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Log;

/**
 * Public API Controller - Safe Version
 * ป้องกัน Error จาก Column ที่ไม่มี
 */
class PublicApiController extends Controller
{
    /**
     * ดึงข้อมูลกลุ่มโรงเรียนทั้งหมด
     * GET /api/public/groups
     */
    public function getGroups()
    {
        try {
            // Cache 5 นาที
            $groups = Cache::remember('public_groups_v2', 300, function () {
                return SchoolGroup::where('is_active', true)
                    ->orderBy('display_order')
                    ->get()
                    ->map(function ($group) {
                        // คำนวณสถิติแบบ Safe
                        $stats = $this->calculateGroupStatsSafe($group->id);
                        
                        return [
                            'id' => $group->id,
                            'code' => $group->code,
                            'name' => $group->name,
                            'color' => $group->color,
                            'icon' => $group->icon,
                            'description' => $group->description,
                            'display_order' => $group->display_order,
                            
                            // สถิติ 5 ตัว
                            'total_schools' => $stats['total_schools'],
                            'total_students' => $stats['total_students'],
                            'open_competitions' => $stats['open_competitions'],
                            'registered_competitions' => $stats['registered_competitions'],
                            'completed_competitions' => $stats['completed_competitions'],
                            
                            // ประกาศล่าสุด
                            'latest_announcement' => $this->getLatestAnnouncement($group->id),
                        ];
                    });
            });

            return response()->json([
                'success' => true,
                'data' => $groups
            ]);
        } catch (\Exception $e) {
            Log::error('PublicApiController::getGroups Error: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'เกิดข้อผิดพลาด: ' . $e->getMessage(),
                'data' => []
            ], 500);
        }
    }

    /**
     * คำนวณสถิติของกลุ่ม (Safe Version)
     * ป้องกัน Error จาก Column ที่ไม่มี
     */
    private function calculateGroupStatsSafe($groupId)
    {
        try {
            // 1. นับโรงเรียน
            $totalSchools = School::where('school_group_id', $groupId)->count();
            
            // 2. นับนักเรียน (จาก registrations)
            $totalStudents = 0;
            try {
                $totalStudents = Registration::whereHas('school', function ($query) use ($groupId) {
                    $query->where('school_group_id', $groupId);
                })->count();
            } catch (\Exception $e) {
                Log::warning("Error counting students: " . $e->getMessage());
            }
            
            // 3. กิจกรรมที่เปิดลงทะเบียน (Safe)
            $openCompetitions = 0;
            try {
                $query = Competition::where('competition_level', 'group')
                    ->where('school_group_id', $groupId);
                
                // เช็คว่ามี column registration_open หรือไม่
                if (Schema::hasColumn('competitions', 'registration_open')) {
                    $query->where('registration_open', true);
                } elseif (Schema::hasColumn('competitions', 'registration_start_date') && 
                          Schema::hasColumn('competitions', 'registration_end_date')) {
                    $query->where('registration_start_date', '<=', now())
                          ->where('registration_end_date', '>=', now());
                }
                
                $openCompetitions = $query->count();
            } catch (\Exception $e) {
                Log::warning("Error counting open competitions: " . $e->getMessage());
            }
            
            // 4. กิจกรรมที่มีการลงทะเบียนแล้ว (Safe)
            $registeredCompetitions = 0;
            try {
                $registeredCompetitions = DB::table('registrations')
                    ->join('schools', 'registrations.school_id', '=', 'schools.id')
                    ->join('competitions', 'registrations.competition_id', '=', 'competitions.id')
                    ->where('schools.school_group_id', $groupId)
                    ->where('competitions.school_group_id', $groupId)
                    ->distinct('registrations.competition_id')
                    ->count('registrations.competition_id');
            } catch (\Exception $e) {
                Log::warning("Error counting registered competitions: " . $e->getMessage());
            }
            
            // 5. กิจกรรมที่แข่งขันแล้ว (มีคะแนนแล้ว) (Safe)
            $completedCompetitions = 0;
            try {
                $completedCompetitions = DB::table('scores')
                    ->join('registrations', 'scores.registration_id', '=', 'registrations.id')
                    ->join('schools', 'registrations.school_id', '=', 'schools.id')
                    ->join('competitions', 'scores.competition_id', '=', 'competitions.id')
                    ->where('schools.school_group_id', $groupId)
                    ->where('competitions.school_group_id', $groupId)
                    ->distinct('scores.competition_id')
                    ->count('scores.competition_id');
            } catch (\Exception $e) {
                Log::warning("Error counting completed competitions: " . $e->getMessage());
            }

            return [
                'total_schools' => $totalSchools,
                'total_students' => $totalStudents,
                'open_competitions' => $openCompetitions,
                'registered_competitions' => $registeredCompetitions,
                'completed_competitions' => $completedCompetitions,
            ];
        } catch (\Exception $e) {
            Log::error("calculateGroupStatsSafe Error: " . $e->getMessage());
            
            return [
                'total_schools' => 0,
                'total_students' => 0,
                'open_competitions' => 0,
                'registered_competitions' => 0,
                'completed_competitions' => 0,
            ];
        }
    }

    /**
     * ดึงประกาศล่าสุดของกลุ่ม (Safe)
     */
    private function getLatestAnnouncement($groupId)
    {
        try {
            // ตรวจสอบว่าตาราง announcements มีหรือไม่
            if (!Schema::hasTable('announcements')) {
                return null;
            }

            $announcement = DB::table('announcements')
                ->where('school_group_id', $groupId)
                ->where('is_published', true)
                ->where(function ($query) {
                    $query->whereNull('expired_at')
                        ->orWhere('expired_at', '>', now());
                })
                ->orderBy('published_at', 'desc')
                ->first();

            if (!$announcement) {
                return null;
            }

            return [
                'id' => $announcement->id,
                'title' => $announcement->title,
                'content' => substr($announcement->content, 0, 100) . '...',
                'date' => date('d/m/Y', strtotime($announcement->published_at))
            ];
        } catch (\Exception $e) {
            Log::warning("Error getting announcement: " . $e->getMessage());
            return null;
        }
    }

    /**
     * ดึงข้อมูลกลุ่มเดี่ยว (Safe)
     */
    public function getGroupDetail($id)
    {
        try {
            $group = SchoolGroup::where('is_active', true)->findOrFail($id);
            
            $stats = $this->calculateGroupStatsSafe($id);
            
            return response()->json([
                'success' => true,
                'data' => [
                    'id' => $group->id,
                    'code' => $group->code,
                    'name' => $group->name,
                    'color' => $group->color,
                    'icon' => $group->icon,
                    'description' => $group->description,
                    'stats' => $stats,
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('PublicApiController::getGroupDetail Error: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'เกิดข้อผิดพลาด: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * ดึงผลการแข่งขันของกลุ่ม (Safe)
     */
    public function getGroupResults($id, Request $request)
    {
        try {
            $categoryId = $request->get('category_id');
            
            $results = Score::whereHas('registration.school', function ($query) use ($id) {
                $query->where('school_group_id', $id);
            })
                ->when($categoryId, function ($query) use ($categoryId) {
                    $query->whereHas('competition', function ($q) use ($categoryId) {
                        $q->where('category_id', $categoryId);
                    });
                })
                ->with([
                    'registration.school',
                    'competition.category'
                ])
                ->orderBy('rank')
                ->get()
                ->groupBy('competition.category.name');

            return response()->json([
                'success' => true,
                'data' => $results
            ]);
        } catch (\Exception $e) {
            Log::error('PublicApiController::getGroupResults Error: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'เกิดข้อผิดพลาด: ' . $e->getMessage(),
                'data' => []
            ], 500);
        }
    }

    /**
     * อัพเดทสถิติของกลุ่มทั้งหมด
     */
    public function updateAllGroupStatistics()
    {
        try {
            $groups = SchoolGroup::all();
            
            foreach ($groups as $group) {
                $stats = $this->calculateGroupStatsSafe($group->id);
                
                // อัพเดทข้อมูลในตาราง (ถ้ามี columns)
                $updateData = [];
                if (Schema::hasColumn('school_groups', 'total_schools')) {
                    $updateData['total_schools'] = $stats['total_schools'];
                }
                if (Schema::hasColumn('school_groups', 'total_students')) {
                    $updateData['total_students'] = $stats['total_students'];
                }
                
                if (!empty($updateData)) {
                    $group->update($updateData);
                }
            }

            // Clear cache
            Cache::forget('public_groups_v2');

            return response()->json([
                'success' => true,
                'message' => 'อัพเดทสถิติทั้งหมดเรียบร้อย'
            ]);
        } catch (\Exception $e) {
            Log::error('PublicApiController::updateAllGroupStatistics Error: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'เกิดข้อผิดพลาด: ' . $e->getMessage()
            ], 500);
        }
    }
}