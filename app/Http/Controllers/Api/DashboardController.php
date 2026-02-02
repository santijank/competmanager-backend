<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class DashboardController extends Controller
{
    /**
     * 📊 Dashboard index - รองรับทุก role
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            
            // ส่งข้อมูลไปยัง method ที่เหมาะสมตาม role
            switch ($user->role) {
                case 'district_admin':
                case 'admin':
                    return $this->districtAdmin($request);
                case 'group_admin':
                    return $this->groupAdmin($request);
                case 'school_admin':
                case 'teacher':
                    return $this->schoolAdmin($request);
                default:
                    return $this->basicDashboard($user);
            }
        } catch (\Exception $e) {
            Log::error('Dashboard index error', [
                'error' => $e->getMessage(),
                'user_id' => $request->user()->id ?? null
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'ไม่สามารถโหลดข้อมูล Dashboard ได้'
            ], 500);
        }
    }

    /**
     * 📈 Dashboard stats - ข้อมูลสถิติแบบเร็ว
     * ส่งข้อมูลในโครงสร้าง nested ที่ Frontend ต้องการ
     */
    public function stats(Request $request): JsonResponse
    {
        try {
            $user = $request->user();

            // เพิ่มข้อมูลตาม role
            switch ($user->role) {
                case 'district_admin':
                case 'admin':
                    return $this->districtAdminStats();

                case 'group_admin':
                    return $this->groupAdminStats($user);

                case 'school_admin':
                case 'teacher':
                    return $this->schoolAdminStats($user);

                default:
                    return response()->json([
                        'competitions' => ['total' => 0],
                        'registrations' => ['total' => 0, 'pending' => 0, 'approved' => 0],
                    ]);
            }

        } catch (\Exception $e) {
            Log::error('Dashboard stats error', [
                'error' => $e->getMessage(),
                'user_id' => $request->user()->id ?? null
            ]);

            return response()->json([
                'competitions' => ['total' => 0, 'district' => 0, 'group' => 0, 'open' => 0],
                'registrations' => ['total' => 0, 'pending' => 0, 'approved' => 0],
                'schools' => ['total' => 0, 'active' => 0],
                'groups' => 0,
                'users' => ['school_admins' => 0, 'group_admins' => 0],
            ]);
        }
    }

    /**
     * 📊 District Admin Stats - โครงสร้างที่ Frontend ต้องการ
     */
    private function districtAdminStats(): JsonResponse
    {
        // นับการแข่งขันตามระดับ
        $totalCompetitions = DB::table('competitions')->where('is_active', true)->count();
        $districtCompetitions = DB::table('competitions')
            ->where('is_active', true)
            ->where('competition_level', 'district')
            ->count();
        $groupCompetitions = DB::table('competitions')
            ->where('is_active', true)
            ->where('competition_level', 'group')
            ->count();
        $openCompetitions = DB::table('competitions')
            ->where('is_active', true)
            ->where('status', 'open')
            ->count();

        // นับการลงทะเบียน
        $totalRegistrations = DB::table('registrations')->count();
        $pendingRegistrations = DB::table('registrations')->where('status', 'pending')->count();
        $approvedRegistrations = DB::table('registrations')->where('status', 'approved')->count();

        // นับโรงเรียน
        $totalSchools = DB::table('schools')->count();
        $activeSchools = DB::table('schools')
            ->whereIn('id', function($query) {
                $query->select('school_id')->from('registrations')->distinct();
            })
            ->count();

        // นับกลุ่มโรงเรียน
        $totalGroups = DB::table('school_groups')->where('is_active', true)->count();

        // นับผู้ใช้ตาม role
        $schoolAdmins = DB::table('users')->where('role', 'school_admin')->count();
        $groupAdmins = DB::table('users')->where('role', 'group_admin')->count();

        // นับนักเรียน (จาก student_count ใน registrations)
        $totalStudents = DB::table('registrations')->sum('student_count') ?? 0;

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
                'school_admins' => $schoolAdmins,
                'group_admins' => $groupAdmins,
            ],
            'students' => $totalStudents,
        ]);
    }

    /**
     * 📊 Group Admin Stats - โครงสร้างที่ Frontend ต้องการ
     */
    private function groupAdminStats($user): JsonResponse
    {
        $groupId = $user->school_group_id;

        // ถ้าไม่มี school_group_id ให้ return ค่าว่าง
        if (!$groupId) {
            return response()->json([
                'competitions' => ['total' => 0, 'open' => 0, 'ongoing' => 0],
                'registrations' => ['total' => 0, 'pending' => 0, 'approved' => 0],
                'schools' => 0,
                'students' => 0,
            ]);
        }

        // นับการแข่งขันของกลุ่ม (เฉพาะกิจกรรมระดับกลุ่มของตัวเอง)
        $totalCompetitions = DB::table('competitions')
            ->where('is_active', true)
            ->where('school_group_id', $groupId)
            ->count();

        $openCompetitions = DB::table('competitions')
            ->where('is_active', true)
            ->where('status', 'open')
            ->where('school_group_id', $groupId)
            ->count();

        $ongoingCompetitions = DB::table('competitions')
            ->where('is_active', true)
            ->where('status', 'ongoing')
            ->where('school_group_id', $groupId)
            ->count();

        // นับการลงทะเบียนของโรงเรียนในกลุ่ม
        $totalRegistrations = DB::table('registrations as r')
            ->join('schools as s', 'r.school_id', '=', 's.id')
            ->where('s.school_group_id', $groupId)
            ->count();

        $pendingRegistrations = DB::table('registrations as r')
            ->join('schools as s', 'r.school_id', '=', 's.id')
            ->where('s.school_group_id', $groupId)
            ->where('r.status', 'pending')
            ->count();

        $approvedRegistrations = DB::table('registrations as r')
            ->join('schools as s', 'r.school_id', '=', 's.id')
            ->where('s.school_group_id', $groupId)
            ->where('r.status', 'approved')
            ->count();

        // นับโรงเรียนในกลุ่ม
        $totalSchools = DB::table('schools')
            ->where('school_group_id', $groupId)
            ->where('is_active', true)
            ->count();

        // นับนักเรียนในกลุ่ม (จาก student_count ใน registrations)
        $totalStudents = DB::table('registrations as r')
            ->join('schools as s', 'r.school_id', '=', 's.id')
            ->where('s.school_group_id', $groupId)
            ->sum('r.student_count') ?? 0;

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
     * 📊 School Admin Stats - โครงสร้างที่ Frontend ต้องการ
     */
    private function schoolAdminStats($user): JsonResponse
    {
        $schoolId = $user->school_id;

        // ถ้าไม่มี school_id ให้ return ค่าว่าง
        if (!$schoolId) {
            return response()->json([
                'registrations' => ['total' => 0, 'pending' => 0, 'approved' => 0],
                'students' => 0,
                'competitions' => ['available' => 0, 'participating' => 0],
            ]);
        }

        // ดึง school_group_id ของโรงเรียน
        $school = DB::table('schools')->where('id', $schoolId)->first();
        $groupId = $school->school_group_id ?? null;

        // นับการลงทะเบียนของโรงเรียน
        $totalRegistrations = DB::table('registrations')
            ->where('school_id', $schoolId)
            ->count();

        $pendingRegistrations = DB::table('registrations')
            ->where('school_id', $schoolId)
            ->where('status', 'pending')
            ->count();

        $approvedRegistrations = DB::table('registrations')
            ->where('school_id', $schoolId)
            ->where('status', 'approved')
            ->count();

        // นับนักเรียนที่ลงทะเบียน (จาก student_count ใน registrations)
        $totalStudents = DB::table('registrations')
            ->where('school_id', $schoolId)
            ->sum('student_count') ?? 0;

        // นับการแข่งขันที่เปิดรับสมัคร (ที่โรงเรียนสามารถเข้าร่วมได้)
        $availableCompetitions = DB::table('competitions')
            ->where('is_active', true)
            ->where('status', 'open')
            ->where(function($query) use ($groupId) {
                $query->whereNull('school_group_id') // ระดับเขต
                      ->orWhere('school_group_id', $groupId); // ระดับกลุ่มของโรงเรียน
            })
            ->count();

        // นับการแข่งขันที่เข้าร่วมแล้ว
        $participatingCompetitions = DB::table('registrations')
            ->where('school_id', $schoolId)
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
     * 🏛️ District Admin Dashboard
     */
    public function districtAdmin(Request $request): JsonResponse
    {
        try {
            $stats = [
                'total_competitions' => DB::table('competitions')->count(),
                'active_competitions' => DB::table('competitions')->where('status', 'active')->count(),
                'total_schools' => DB::table('schools')->count(),
                'total_users' => DB::table('users')->count(),
                'total_registrations' => DB::table('registrations')->count(),
                'pending_approvals' => DB::table('registrations')->where('status', 'pending')->count(),
                'competitions_by_level' => DB::table('competitions')
                    ->select('competition_level', DB::raw('count(*) as count'))
                    ->groupBy('competition_level')
                    ->get(),
                'recent_registrations' => DB::table('registrations as r')
                    ->join('competitions as c', 'r.competition_id', '=', 'c.id')
                    ->join('schools as s', 'r.school_id', '=', 's.id')
                    ->select('r.*', 'c.name as competition_name', 's.name as school_name')
                    ->orderBy('r.created_at', 'desc')
                    ->limit(10)
                    ->get()
            ];

            return response()->json([
                'success' => true,
                'data' => $stats
            ]);
        } catch (\Exception $e) {
            Log::error('District admin dashboard error', ['error' => $e->getMessage()]);
            return response()->json(['success' => false, 'message' => 'Dashboard error'], 500);
        }
    }

    /**
     * 👥 Group Admin Dashboard
     */
    public function groupAdmin(Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            $groupId = $user->school_group_id;

            $stats = [
                'group_competitions' => DB::table('competitions')
                    ->where('school_group_id', $groupId)
                    ->count(),
                'group_schools' => DB::table('schools')
                    ->where('school_group_id', $groupId)
                    ->count(),
                'group_registrations' => DB::table('registrations as r')
                    ->join('schools as s', 'r.school_id', '=', 's.id')
                    ->where('s.school_group_id', $groupId)
                    ->count(),
                'pending_approvals' => DB::table('registrations as r')
                    ->join('schools as s', 'r.school_id', '=', 's.id')
                    ->where('s.school_group_id', $groupId)
                    ->where('r.status', 'pending')
                    ->count(),
                'recent_registrations' => DB::table('registrations as r')
                    ->join('competitions as c', 'r.competition_id', '=', 'c.id')
                    ->join('schools as s', 'r.school_id', '=', 's.id')
                    ->where('s.school_group_id', $groupId)
                    ->select('r.*', 'c.name as competition_name', 's.name as school_name')
                    ->orderBy('r.created_at', 'desc')
                    ->limit(10)
                    ->get()
            ];

            return response()->json([
                'success' => true,
                'data' => $stats
            ]);
        } catch (\Exception $e) {
            Log::error('Group admin dashboard error', ['error' => $e->getMessage()]);
            return response()->json(['success' => false, 'message' => 'Dashboard error'], 500);
        }
    }

    /**
     * 🏫 School Admin Dashboard
     */
    public function schoolAdmin(Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            $schoolId = $user->school_id;

            $stats = [
                'school_registrations' => DB::table('registrations')
                    ->where('school_id', $schoolId)
                    ->count(),
                'approved_registrations' => DB::table('registrations')
                    ->where('school_id', $schoolId)
                    ->where('status', 'approved')
                    ->count(),
                'pending_registrations' => DB::table('registrations')
                    ->where('school_id', $schoolId)
                    ->where('status', 'pending')
                    ->count(),
                'available_competitions' => DB::table('competitions as c')
                    ->leftJoin('schools as s', 's.id', '=', $schoolId)
                    ->where(function($query) use ($schoolId) {
                        $query->whereNull('c.school_group_id') // District competitions
                              ->orWhere('c.school_group_id', DB::raw('(SELECT school_group_id FROM schools WHERE id = ' . $schoolId . ')'));
                    })
                    ->where('c.is_active', true)
                    ->count(),
                'recent_registrations' => DB::table('registrations as r')
                    ->join('competitions as c', 'r.competition_id', '=', 'c.id')
                    ->where('r.school_id', $schoolId)
                    ->select('r.*', 'c.name as competition_name')
                    ->orderBy('r.created_at', 'desc')
                    ->limit(10)
                    ->get()
            ];

            return response()->json([
                'success' => true,
                'data' => $stats
            ]);
        } catch (\Exception $e) {
            Log::error('School admin dashboard error', ['error' => $e->getMessage()]);
            return response()->json(['success' => false, 'message' => 'Dashboard error'], 500);
        }
    }

    /**
     * 👤 Basic Dashboard สำหรับ role อื่นๆ
     */
    private function basicDashboard($user): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => [
                'message' => 'ยินดีต้อนรับเข้าสู่ระบบ CompetManager',
                'user_name' => $user->name,
                'user_role' => $user->role,
                'total_competitions' => DB::table('competitions')->where('is_active', true)->count()
            ]
        ]);
    }
}
