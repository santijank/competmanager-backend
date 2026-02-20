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
     * ดึงภาพรวมทั้งเขตสำหรับ Public Dashboard
     * GET /api/public/dashboard/overview
     */
    public function getDashboardOverview()
    {
        try {
            $data = Cache::remember('public_dashboard_overview', 300, function () {
                // Query 1: นับ competitions, registrations, groups ใน query เดียว
                $counts = DB::selectOne("
                    SELECT
                        (SELECT COUNT(*) FROM competitions) as total_competitions,
                        (SELECT COUNT(*) FROM registrations) as total_registrations,
                        (SELECT COUNT(DISTINCT competition_id) FROM scores) as completed_competitions,
                        (SELECT COUNT(*) FROM school_groups WHERE is_active = 1) as total_groups
                ");

                // Query 2: นับเหรียญรางวัลทั้งหมด (1 query)
                $medals = $this->calculateTotalMedals();

                return [
                    'total_competitions' => (int) $counts->total_competitions,
                    'total_registrations' => (int) $counts->total_registrations,
                    'completed_competitions' => (int) $counts->completed_competitions,
                    'total_groups' => (int) $counts->total_groups,
                    'total_gold' => $medals['gold'],
                    'total_silver' => $medals['silver'],
                    'total_bronze' => $medals['bronze'],
                    'total_participant' => $medals['participant'],
                ];
            });

            return response()->json($data);
        } catch (\Exception $e) {
            Log::error('PublicApiController::getDashboardOverview Error: ' . $e->getMessage());

            return response()->json([
                'total_competitions' => 0,
                'total_registrations' => 0,
                'completed_competitions' => 0,
                'total_groups' => 0,
                'total_gold' => 0,
                'total_silver' => 0,
                'total_bronze' => 0,
                'total_participant' => 0,
            ]);
        }
    }

    /**
     * ดึงข้อมูลกลุ่มโรงเรียนสำหรับ Public Dashboard
     * GET /api/public/dashboard/groups
     */
    public function getDashboardGroups()
    {
        try {
            $groups = Cache::remember('public_dashboard_groups', 300, function () {
                return SchoolGroup::where('is_active', true)
                    ->orderBy('display_order')
                    ->get()
                    ->map(function ($group) {
                        $stats = $this->calculateGroupStatsSafe($group->id);
                        $medals = $this->calculateGroupMedals($group->id);

                        return [
                            'id' => $group->id,
                            'code' => $group->code,
                            'name' => $group->name,
                            'color' => $group->color,
                            'stats' => [
                                'competitions' => $stats['open_competitions'] + $stats['completed_competitions'],
                                'registrations' => $stats['registered_competitions'],
                                'completed' => $stats['completed_competitions'],
                                'schools' => $stats['total_schools'],
                            ],
                            'medals' => $medals,
                        ];
                    });
            });

            return response()->json($groups);
        } catch (\Exception $e) {
            Log::error('PublicApiController::getDashboardGroups Error: ' . $e->getMessage());

            return response()->json([]);
        }
    }

    /**
     * คำนวณเหรียญรางวัลทั้งหมด (ใช้ medal field) - 1 query แทน 4
     */
    private function calculateTotalMedals()
    {
        try {
            $medals = Score::where('is_finalized', true)
                ->whereIn('medal', ['gold', 'silver', 'bronze', 'participant'])
                ->select('medal', DB::raw('count(*) as count'))
                ->groupBy('medal')
                ->pluck('count', 'medal');

            return [
                'gold' => $medals['gold'] ?? 0,
                'silver' => $medals['silver'] ?? 0,
                'bronze' => $medals['bronze'] ?? 0,
                'participant' => $medals['participant'] ?? 0,
            ];
        } catch (\Exception $e) {
            return ['gold' => 0, 'silver' => 0, 'bronze' => 0, 'participant' => 0];
        }
    }

    /**
     * คำนวณเหรียญรางวัลของกลุ่ม (ใช้ medal field) - 1 query แทน 4
     */
    private function calculateGroupMedals($groupId)
    {
        try {
            $medals = DB::table('scores')
                ->join('registrations', 'scores.registration_id', '=', 'registrations.id')
                ->join('schools', 'registrations.school_id', '=', 'schools.id')
                ->where('schools.school_group_id', $groupId)
                ->where('scores.is_finalized', true)
                ->whereIn('scores.medal', ['gold', 'silver', 'bronze', 'participant'])
                ->select('scores.medal', DB::raw('count(*) as count'))
                ->groupBy('scores.medal')
                ->pluck('count', 'medal');

            return [
                'gold' => $medals['gold'] ?? 0,
                'silver' => $medals['silver'] ?? 0,
                'bronze' => $medals['bronze'] ?? 0,
                'participant' => $medals['participant'] ?? 0,
            ];
        } catch (\Exception $e) {
            return ['gold' => 0, 'silver' => 0, 'bronze' => 0, 'participant' => 0];
        }
    }

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
     * คำนวณสถิติของกลุ่ม - Optimized
     * ลดจาก 5 queries เหลือ 3 queries ที่เสถียร
     */
    private function calculateGroupStatsSafe($groupId)
    {
        try {
            // Query 1: นับโรงเรียนและ registrations
            $totalSchools = School::where('school_group_id', $groupId)->count();

            $totalStudents = DB::table('registrations')
                ->join('schools', 'registrations.school_id', '=', 'schools.id')
                ->where('schools.school_group_id', $groupId)
                ->count();

            // Query 2: นับ competitions ที่เปิดลงทะเบียน
            $openCompetitions = Competition::where('school_group_id', $groupId)
                ->where('competition_level', 'group')
                ->where('registration_status', 'open')
                ->count();

            // Query 3: นับ registered + completed competitions ใน query เดียว
            $registeredCompetitions = DB::table('registrations')
                ->join('schools', 'registrations.school_id', '=', 'schools.id')
                ->join('competitions', 'registrations.competition_id', '=', 'competitions.id')
                ->where('schools.school_group_id', $groupId)
                ->where('competitions.school_group_id', $groupId)
                ->distinct('registrations.competition_id')
                ->count('registrations.competition_id');

            $completedCompetitions = DB::table('scores')
                ->join('registrations', 'scores.registration_id', '=', 'registrations.id')
                ->join('schools', 'registrations.school_id', '=', 'schools.id')
                ->join('competitions', 'scores.competition_id', '=', 'competitions.id')
                ->where('schools.school_group_id', $groupId)
                ->where('competitions.school_group_id', $groupId)
                ->distinct('scores.competition_id')
                ->count('scores.competition_id');

            return [
                'total_schools' => $totalSchools,
                'total_students' => $totalStudents,
                'open_competitions' => $openCompetitions,
                'registered_competitions' => $registeredCompetitions,
                'completed_competitions' => $completedCompetitions,
            ];
        } catch (\Exception $e) {
            Log::error("calculateGroupStatsSafe Error for group {$groupId}: " . $e->getMessage());

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
     * ✅ ดึงรายการกิจกรรมสำหรับ Public Dashboard
     * GET /api/public/competitions
     */
    public function getPublicCompetitions(Request $request)
    {
        try {
            $level = $request->get('level'); // 'group' หรือ 'district'
            $groupId = $request->get('school_group_id');
            $categoryId = $request->get('category_id');

            $cacheKey = "public_competitions_{$level}_{$groupId}_{$categoryId}";

            $data = Cache::remember($cacheKey, 300, function () use ($level, $groupId, $categoryId) {
                $query = Competition::with(['category:id,name', 'schoolGroup:id,name,code'])
                    ->where('is_active', true)
                    ->orderBy('category_id')
                    ->orderBy('name');

                // Filter by level
                if ($level) {
                    $query->where('competition_level', $level);
                }

                // Filter by school_group_id (for group level)
                if ($groupId) {
                    $query->where('school_group_id', $groupId);
                }

                // Filter by category
                if ($categoryId) {
                    $query->where('category_id', $categoryId);
                }

                $competitions = $query->get();

                // จัดกลุ่มตามหมวดหมู่
                $grouped = $competitions->groupBy(function ($comp) {
                    return $comp->category->name ?? 'อื่นๆ';
                })->map(function ($comps, $categoryName) {
                    return [
                        'category' => $categoryName,
                        'count' => $comps->count(),
                        'competitions' => $comps->map(function ($comp) {
                            return [
                                'id' => $comp->id,
                                'code' => $comp->code,
                                'name' => $comp->name,
                                'level' => $comp->level,
                                'competition_level' => $comp->competition_level,
                                'min_students' => $comp->min_students ?? 1,
                                'max_students' => $comp->max_students ?? 1,
                                'min_teachers' => $comp->min_teachers ?? 1,
                                'max_teachers' => $comp->max_teachers ?? 1,
                                'school_group' => $comp->schoolGroup ? [
                                    'id' => $comp->schoolGroup->id,
                                    'name' => $comp->schoolGroup->name,
                                    'code' => $comp->schoolGroup->code,
                                ] : null,
                                'registration_status' => $comp->registration_status,
                            ];
                        })->values()
                    ];
                })->values();

                // Summary stats
                $totalCompetitions = $competitions->count();
                $totalCategories = $grouped->count();

                return [
                    'summary' => [
                        'total_competitions' => $totalCompetitions,
                        'total_categories' => $totalCategories,
                    ],
                    'categories' => $grouped,
                ];
            });

            return response()->json([
                'success' => true,
                'data' => $data
            ]);

        } catch (\Exception $e) {
            Log::error('PublicApiController::getPublicCompetitions Error: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'เกิดข้อผิดพลาด: ' . $e->getMessage(),
                'data' => [
                    'summary' => ['total_competitions' => 0, 'total_categories' => 0],
                    'categories' => []
                ]
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

    /**
     * ดึงรายชื่อตัวแทนระดับเขต (Public - ไม่ต้อง login)
     * GET /api/public/district-registrations
     */
    public function getDistrictRegistrations()
    {
        try {
            $data = Cache::remember('public_district_registrations', 300, function () {
                // ดึง competitions ระดับเขตที่ active
                $competitions = Competition::with(['category'])
                    ->where('competition_level', 'district')
                    ->where('is_active', true)
                    ->orderBy('category_id')
                    ->orderBy('name')
                    ->get();

                $competitionIds = $competitions->pluck('id')->toArray();

                // ดึงเฉพาะ approved registrations
                $registrations = Registration::whereIn('competition_id', $competitionIds)
                    ->where('status', 'approved')
                    ->with(['school.schoolGroup', 'score'])
                    ->get()
                    ->groupBy('competition_id');

                // กรองเฉพาะ competitions ที่มี registrations
                $filteredCompetitions = $competitions->filter(function ($comp) use ($registrations) {
                    return $registrations->has($comp->id) && $registrations->get($comp->id)->count() > 0;
                });

                // จัดกลุ่มตาม category
                $categories = [];
                $totalRegs = 0;
                $grouped = $filteredCompetitions->groupBy(fn($comp) => $comp->category->name ?? 'อื่นๆ');

                foreach ($grouped as $categoryName => $comps) {
                    $categoryComps = [];
                    foreach ($comps as $comp) {
                        $compRegs = $registrations->get($comp->id, collect());
                        $totalRegs += $compRegs->count();

                        $categoryComps[] = [
                            'id' => $comp->id,
                            'name' => $comp->name,
                            'code' => $comp->code,
                            'level' => $comp->level,
                            'competition_level' => $comp->competition_level,
                            'skip_group_level' => (bool) $comp->skip_group_level,
                            'registration_count' => $compRegs->count(),
                            'is_published' => (bool) $comp->is_published,
                            'is_finalized' => (bool) $comp->is_finalized,
                            'registrations' => $compRegs->map(function ($reg) {
                                $groupRank = null;
                                if ($reg->notes && preg_match('/อันดับที่\s*(\d+)/', $reg->notes, $matches)) {
                                    $groupRank = (int) $matches[1];
                                }
                                return [
                                    'id' => $reg->id,
                                    'team_name' => $reg->team_name,
                                    'school_name' => $reg->school->name ?? '-',
                                    'school_group_name' => $reg->school->schoolGroup->name ?? '-',
                                    'student_count' => $reg->student_count,
                                    'student_names' => $reg->student_names,
                                    'teacher_names' => $reg->teacher_names,
                                    'teacher_count' => $reg->teacher_count,
                                    'status' => $reg->status,
                                    'notes' => $reg->notes,
                                    'score' => $reg->score ? number_format($reg->score->score, 2) : null,
                                    'medal' => $reg->score->medal ?? null,
                                    'rank' => $reg->score->rank ?? null,
                                    'group_rank' => $groupRank,
                                    'is_finalized' => $reg->score ? (bool) $reg->score->is_finalized : false,
                                ];
                            })->sort(function ($a, $b) {
                                $rankA = $a['rank'] ?? $a['group_rank'] ?? PHP_INT_MAX;
                                $rankB = $b['rank'] ?? $b['group_rank'] ?? PHP_INT_MAX;
                                if ($rankA !== $rankB) return $rankA - $rankB;
                                $scoreA = $a['score'] ? (float) $a['score'] : 0;
                                $scoreB = $b['score'] ? (float) $b['score'] : 0;
                                return $scoreB <=> $scoreA;
                            })->values()->toArray(),
                        ];
                    }

                    $categories[] = [
                        'category' => $categoryName,
                        'competition_count' => count($categoryComps),
                        'competitions' => $categoryComps,
                    ];
                }

                return [
                    'data' => $categories,
                    'total_competitions' => $filteredCompetitions->count(),
                    'total_registrations' => $totalRegs,
                ];
            });

            return response()->json(array_merge(['success' => true], $data));

        } catch (\Exception $e) {
            Log::error('PublicApiController::getDistrictRegistrations Error: ' . $e->getMessage());
            return response()->json([
                'success' => true,
                'data' => [],
                'total_competitions' => 0,
                'total_registrations' => 0,
            ]);
        }
    }
}