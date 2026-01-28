<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Competition;
use App\Models\Registration;
use App\Models\School;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class DashboardController extends Controller
{
    /**
     * Get dashboard stats based on user role
     */
    public function stats(Request $request)
    {
        $user = $request->user();
        
        switch ($user->role) {
            case 'district_admin':
                return $this->districtAdminStats($request);
            case 'group_admin':
                return $this->groupAdminStats($request);
            case 'school_admin':
                return $this->schoolAdminStats($request);
            default:
                return response()->json(['error' => 'Unauthorized'], 403);
        }
    }
    
    /**
     * Check if registration_participants table exists
     */
    private function hasParticipantsTable()
    {
        return Schema::hasTable('registration_participants');
    }
    
    /**
     * Get total students count (safe method)
     */
    private function getTotalStudents($conditions)
    {
        if (!$this->hasParticipantsTable()) {
            return 0;
        }
        
        try {
            return DB::table('registration_participants')
                ->join('registrations', 'registration_participants.registration_id', '=', 'registrations.id')
                ->where($conditions)
                ->count();
        } catch (\Exception $e) {
            return 0;
        }
    }
    
    /**
     * Dashboard Stats for District Admin
     */
    public function districtAdminStats(Request $request)
    {
        $user = $request->user();
        
        if ($user->role !== 'district_admin') {
            return response()->json(['error' => 'Unauthorized'], 403);
        }
        
        // 1. การแข่งขันทั้งหมด (แยกตาม competition_level)
        $totalCompetitions = Competition::where('status', 'active')->count();
        // ✅ แก้ไข: ใช้ competition_level แทน level และแก้สะกดคำที่ผิด
        $districtCompetitions = Competition::where('competition_level', 'district')
            ->where('status', 'active')
            ->count();
        $groupCompetitions = Competition::where('competition_level', 'group')
            ->where('status', 'active')
            ->count();
        
        // 2. การแข่งขันที่เปิดรับสมัคร
        $openCompetitions = Competition::where('status', 'active')
            ->where('registration_status', 'open')
            ->whereDate('registration_end_date', '>=', now())
            ->count();
        
        // 3. การลงทะเบียนทั้งหมด
        $totalRegistrations = Registration::count();
        $pendingRegistrations = Registration::where('status', 'pending')->count();
        $approvedRegistrations = Registration::where('status', 'approved')->count();
        
        // 4. โรงเรียนทั้งหมด
        $totalSchools = School::count();
        
        // 5. กลุ่มโรงเรียน
        $totalGroups = DB::table('school_groups')->count();
        
        // 6. ผู้ใช้งานในระบบ
        $totalUsers = User::count();
        $schoolAdmins = User::where('role', 'school_admin')->count();
        $groupAdmins = User::where('role', 'group_admin')->count();
        
        // 7. โรงเรียนที่มีการลงทะเบียน (ถ้ามี)
        $activeSchools = Registration::distinct('school_id')->count('school_id');
        
        return response()->json([
            'competitions' => [
                'total' => $totalCompetitions,
                'district' => $districtCompetitions,
                'group' => $groupCompetitions,
                'open' => $openCompetitions,
            ],
            'registrations' => [
                'total' => $totalRegistrations,
                'pending' => $pendingRegistrations,
                'approved' => $approvedRegistrations,
            ],
            'schools' => [
                'total' => $totalSchools,
                'active' => $activeSchools,
            ],
            'groups' => $totalGroups,
            'users' => [
                'total' => $totalUsers,
                'school_admins' => $schoolAdmins,
                'group_admins' => $groupAdmins,
            ],
        ]);
    }
    
    /**
     * Dashboard Stats for Group Admin
     */
    public function groupAdminStats(Request $request)
    {
        $user = $request->user();
        
        if ($user->role !== 'group_admin') {
            return response()->json(['error' => 'Unauthorized'], 403);
        }
        
        $groupId = $user->school_group_id;
        
        if (!$groupId) {
            return response()->json([
                'error' => 'No group assigned',
                'message' => 'กรุณาติดต่อผู้ดูแลระบบ'
            ], 400);
        }
        
        // 1. การแข่งขันทั้งหมดในกลุ่ม + District
        $totalCompetitions = Competition::where(function($q) use ($groupId) {
            $q->where('school_group_id', $groupId)
              ->orWhere('competition_level', 'district');
        })
            ->where('status', 'active')
            ->count();
        
        // 2. การแข่งขันที่เปิดรับสมัคร
        $openCompetitions = Competition::where(function($q) use ($groupId) {
            $q->where('school_group_id', $groupId)
              ->orWhere('competition_level', 'district');
        })
            ->where('status', 'active')
            ->where('registration_status', 'open')
            ->whereDate('registration_end_date', '>=', now())
            ->count();
        
        // 3. การแข่งขันที่กำลังดำเนินการ
        $ongoingCompetitions = Competition::where(function($q) use ($groupId) {
            $q->where('school_group_id', $groupId)
              ->orWhere('competition_level', 'district');
        })
            ->where('status', 'active')
            ->where('registration_status', 'closed')
            ->whereNull('competition_date')
            ->orWhere(function($q) use ($groupId) {
                $q->where(function($subQ) use ($groupId) {
                    $subQ->where('school_group_id', $groupId)
                         ->orWhere('competition_level', 'district');
                })
                  ->where('status', 'active')
                  ->whereDate('competition_date', '>=', now());
            })
            ->count();
        
        // 4. การลงทะเบียนในกลุ่ม + District
        $totalRegistrations = Registration::whereHas('competition', function($q) use ($groupId) {
            $q->where('school_group_id', $groupId)
              ->orWhere('competition_level', 'district');
        })->count();
        
        $pendingRegistrations = Registration::whereHas('competition', function($q) use ($groupId) {
            $q->where('school_group_id', $groupId)
              ->orWhere('competition_level', 'district');
        })->where('status', 'pending')->count();
        
        $approvedRegistrations = Registration::whereHas('competition', function($q) use ($groupId) {
            $q->where('school_group_id', $groupId)
              ->orWhere('competition_level', 'district');
        })->where('status', 'approved')->count();
        
        // 5. โรงเรียนในกลุ่ม
        $totalSchools = School::where('school_group_id', $groupId)->count();
        
        // 6. นักเรียนที่ลงทะเบียน (safe)
        $totalStudents = $this->getTotalStudents([
            ['competitions.school_group_id', '=', $groupId],
            ['registrations.status', '=', 'approved']
        ]);
        
        return response()->json([
            'competitions' => [
                'total' => $totalCompetitions,
                'open' => $openCompetitions,
                'ongoing' => $ongoingCompetitions,
            ],
            'registrations' => [
                'total' => $totalRegistrations,
                'pending' => $pendingRegistrations,
                'approved' => $approvedRegistrations,
            ],
            'schools' => $totalSchools,
            'students' => $totalStudents,
        ]);
    }
    
    /**
     * Dashboard Stats for School Admin
     */
    public function schoolAdminStats(Request $request)
    {
        $user = $request->user();
        
        if ($user->role !== 'school_admin') {
            return response()->json(['error' => 'Unauthorized'], 403);
        }
        
        $schoolId = $user->school_id;
        
        if (!$schoolId) {
            // ส่งข้อมูลเปล่าแทนที่จะ error
            return response()->json([
                'registrations' => [
                    'total' => 0,
                    'pending' => 0,
                    'approved' => 0,
                ],
                'students' => 0,
                'competitions' => [
                    'available' => 0,
                    'participating' => 0,
                ],
                'error' => 'No school assigned',
                'message' => 'กรุณาติดต่อผู้ดูแลระบบเพื่อกำหนดโรงเรียน'
            ]);
        }
        
        // 1. การลงทะเบียนของโรงเรียน
        $totalRegistrations = Registration::where('school_id', $schoolId)->count();
        $pendingRegistrations = Registration::where('school_id', $schoolId)
            ->where('status', 'pending')
            ->count();
        $approvedRegistrations = Registration::where('school_id', $schoolId)
            ->where('status', 'approved')
            ->count();
        
        // 2. นักเรียนที่เข้าแข่งขัน (safe)
        $totalStudents = $this->getTotalStudents([
            ['registrations.school_id', '=', $schoolId],
            ['registrations.status', '=', 'approved']
        ]);
        
        // 3. การแข่งขันที่เปิดรับสมัคร
        $school = School::find($schoolId);
        $groupId = $school ? $school->school_group_id : null;
        
        // ✅ แก้ไข: ใช้ competition_level แทน level
        $availableCompetitions = Competition::where(function($q) use ($groupId) {
            if ($groupId) {
                $q->where('school_group_id', $groupId)
                  ->orWhere('competition_level', 'district');
            } else {
                $q->where('competition_level', 'district');
            }
        })
        ->where('status', 'active')
        ->where('registration_status', 'open')
        ->whereDate('registration_end_date', '>=', now())
        ->count();
        
        // 4. การแข่งขันที่โรงเรียนเข้าร่วม
        $participatingCompetitions = Registration::where('school_id', $schoolId)
            ->where('status', 'approved')
            ->distinct('competition_id')
            ->count('competition_id');
        
        return response()->json([
            'registrations' => [
                'total' => $totalRegistrations,
                'pending' => $pendingRegistrations,
                'approved' => $approvedRegistrations,
            ],
            'students' => $totalStudents,
            'competitions' => [
                'available' => $availableCompetitions,
                'participating' => $participatingCompetitions,
            ],
        ]);
    }

    /**
     * Public API - System Overview (ไม่ต้อง auth)
     */
    public function publicOverview()
    {
        $totalDistrict = Competition::where('competition_level', 'district')->count();
        $totalGroup = Competition::where('competition_level', 'group')->count();
        $totalRegistrations = Registration::where('status', 'approved')->count();
        $totalSchools = School::count();
        
        // นับการแข่งขันที่มีคะแนนแล้ว
        $completedCompetitions = Competition::whereHas('scores', function($q) {
            $q->where('is_finalized', true);
        })->count();
        
        return response()->json([
            'competitions' => [
                'district' => $totalDistrict,
                'group' => $totalGroup,
                'total' => $totalDistrict + $totalGroup,
            ],
            'registrations' => $totalRegistrations,
            'schools' => $totalSchools,
            'completed' => $completedCompetitions,
        ]);
    }

    /**
     * Public API - All Groups Dashboard (ไม่ต้อง auth)
     */
    public function publicAllGroups()
    {
        $schoolGroups = DB::table('school_groups')
            ->orderBy('id')
            ->get();
        
        $groupsData = [];
        
        foreach ($schoolGroups as $group) {
            // สถิติการแข่งขัน
            $totalCompetitions = Competition::where('competition_level', 'group')
                ->where('school_group_id', $group->id)
                ->count();
            
            // สถิติการลงทะเบียน
            $totalRegistrations = Registration::whereHas('competition', function($q) use ($group) {
                $q->where('competition_level', 'group')
                  ->where('school_group_id', $group->id);
            })->where('status', 'approved')->count();
            
            // สถิติเหรียญ
            $medals = DB::table('scores')
                ->join('registrations', 'scores.registration_id', '=', 'registrations.id')
                ->join('competitions', 'registrations.competition_id', '=', 'competitions.id')
                ->where('competitions.school_group_id', $group->id)
                ->where('competitions.competition_level', 'group')
                ->where('scores.is_finalized', true)
                ->select('scores.medal', DB::raw('count(*) as count'))
                ->groupBy('scores.medal')
                ->get();
            
            $medalCounts = [
                'gold' => 0,
                'silver' => 0,
                'bronze' => 0,
                'participant' => 0,
            ];
            
            foreach ($medals as $medal) {
                if (isset($medalCounts[$medal->medal])) {
                    $medalCounts[$medal->medal] = $medal->count;
                }
            }
            
            // การแข่งขันที่เสร็จแล้ว
            $completedCompetitions = Competition::where('competition_level', 'group')
                ->where('school_group_id', $group->id)
                ->whereHas('scores', function($q) {
                    $q->where('is_finalized', true);
                })
                ->count();
            
            // โรงเรียนในกลุ่ม
            $schoolsCount = School::where('school_group_id', $group->id)->count();
            
            // ✅ ประกาศล่าสุด 3 รายการ - Filter ถูกต้องตาม scope
            $announcements = [];
            if (Schema::hasTable('announcements')) {
                $announcements = DB::table('announcements')
                    ->where(function($q) use ($group) {
                        // ประกาศระดับเขต (district) - แสดงทุกกลุ่ม
                        $q->where('scope', 'district')
                          // หรือประกาศระดับกลุ่ม (group) ของกลุ่มนี้เท่านั้น
                          ->orWhere(function($subQ) use ($group) {
                              $subQ->where('scope', 'group')
                                   ->where('school_group_id', $group->id);
                          });
                    })
                    ->where('published_at', '<=', now())
                    ->where(function($q) {
                        $q->whereNull('expired_at')
                          ->orWhere('expired_at', '>', now());
                    })
                    ->orderBy('is_pinned', 'desc')
                    ->orderBy('published_at', 'desc')
                    ->limit(3)
                    ->select('id', 'title', 'content', 'type', 'scope', 'school_group_id', 'priority', 'is_pinned', 'published_at', 'created_at')
                    ->get()
                    ->map(function($a) {
                        return [
                            'id' => $a->id,
                            'title' => $a->title,
                            'content' => $a->content,
                            'type' => $a->type,
                            'scope' => $a->scope,
                            'school_group_id' => $a->school_group_id,
                            'priority' => $a->priority,
                            'is_pinned' => (bool)$a->is_pinned,
                            'published_at' => $a->published_at,
                            'created_at' => $a->created_at,
                        ];
                    })
                    ->toArray();
            }
            
            $groupsData[] = [
                'id' => $group->id,
                'name' => $group->name,
                'stats' => [
                    'competitions' => $totalCompetitions,
                    'registrations' => $totalRegistrations,
                    'completed' => $completedCompetitions,
                    'schools' => $schoolsCount,
                ],
                'medals' => $medalCounts,
                'announcements' => $announcements,
            ];
        }
        
        return response()->json($groupsData);
    }
}