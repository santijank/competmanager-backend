<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class StatisticsController extends Controller
{
    /**
     * 📊 ภาพรวมสถิติ
     */
    public function overview(Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            
            $stats = [
                'competitions' => [
                    'total' => DB::table('competitions')->count(),
                    'active' => DB::table('competitions')->where('is_active', true)->count(),
                    'by_level' => DB::table('competitions')
                        ->select('competition_level', DB::raw('count(*) as count'))
                        ->groupBy('competition_level')
                        ->get()
                ],
                'registrations' => [
                    'total' => DB::table('registrations')->count(),
                    'approved' => DB::table('registrations')->where('status', 'approved')->count(),
                    'pending' => DB::table('registrations')->where('status', 'pending')->count()
                ],
                'schools' => [
                    'total' => DB::table('schools')->where('is_active', true)->count(),
                    'by_group' => DB::table('schools as s')
                        ->join('school_groups as sg', 's.school_group_id', '=', 'sg.id')
                        ->select('sg.name as group_name', DB::raw('count(*) as count'))
                        ->groupBy('sg.id', 'sg.name')
                        ->get()
                ],
                'categories' => [
                    'total' => DB::table('categories')->where('is_active', true)->count(),
                    'with_competitions' => DB::table('categories as c')
                        ->join('competitions as comp', 'c.id', '=', 'comp.category_id')
                        ->select('c.name', DB::raw('count(*) as competition_count'))
                        ->groupBy('c.id', 'c.name')
                        ->get()
                ],
                'participants' => $this->getParticipantStats()
            ];

            return response()->json([
                'success' => true,
                'data' => $stats
            ]);
        } catch (\Exception $e) {
            Log::error('Statistics overview error', ['error' => $e->getMessage()]);
            
            return response()->json([
                'success' => false,
                'message' => 'ไม่สามารถโหลดสถิติได้'
            ], 500);
        }
    }

    /**
     * 🏆 สถิติการแข่งขัน
     */
    public function competitions(Request $request): JsonResponse
    {
        try {
            $stats = DB::table('competitions as c')
                ->leftJoin('categories as cat', 'c.category_id', '=', 'cat.id')
                ->leftJoin('school_groups as sg', 'c.school_group_id', '=', 'sg.id')
                ->select(
                    'cat.name as category_name',
                    'sg.name as group_name',
                    'c.competition_level',
                    DB::raw('count(*) as count')
                )
                ->groupBy('cat.name', 'sg.name', 'c.competition_level')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $stats
            ]);
        } catch (\Exception $e) {
            Log::error('Competition statistics error', ['error' => $e->getMessage()]);
            
            return response()->json([
                'success' => false,
                'message' => 'ไม่สามารถโหลดสถิติการแข่งขันได้'
            ], 500);
        }
    }

    /**
     * 📝 สถิติการลงทะเบียน
     */
    public function registrations(Request $request): JsonResponse
    {
        try {
            $stats = DB::table('registrations as r')
                ->join('competitions as c', 'r.competition_id', '=', 'c.id')
                ->join('schools as s', 'r.school_id', '=', 's.id')
                ->join('school_groups as sg', 's.school_group_id', '=', 'sg.id')
                ->select(
                    'sg.name as group_name',
                    'r.status',
                    DB::raw('count(*) as count')
                )
                ->groupBy('sg.name', 'r.status')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $stats
            ]);
        } catch (\Exception $e) {
            Log::error('Registration statistics error', ['error' => $e->getMessage()]);
            
            return response()->json([
                'success' => false,
                'message' => 'ไม่สามารถโหลดสถิติการลงทะเบียนได้'
            ], 500);
        }
    }

    /**
     * 🏫 สถิติโรงเรียน
     */
    public function schools(Request $request): JsonResponse
    {
        try {
            $stats = DB::table('schools as s')
                ->join('school_groups as sg', 's.school_group_id', '=', 'sg.id')
                ->leftJoin('registrations as r', 's.id', '=', 'r.school_id')
                ->select(
                    'sg.name as group_name',
                    's.name as school_name',
                    DB::raw('count(r.id) as registration_count')
                )
                ->groupBy('sg.name', 's.name', 's.id')
                ->orderBy('registration_count', 'desc')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $stats
            ]);
        } catch (\Exception $e) {
            Log::error('School statistics error', ['error' => $e->getMessage()]);
            
            return response()->json([
                'success' => false,
                'message' => 'ไม่สามารถโหลดสถิติโรงเรียนได้'
            ], 500);
        }
    }

    /**
     * 👥 สถิตินักเรียน/ครูแยกตามระดับการแข่งขัน
     */
    private function getParticipantStats(): array
    {
        // ระดับเขต - เฉพาะ approved
        $district = DB::table('registrations as r')
            ->join('competitions as c', 'r.competition_id', '=', 'c.id')
            ->where('c.competition_level', 'district')
            ->where('r.status', 'approved')
            ->select(
                DB::raw('COALESCE(SUM(r.student_count), 0) as students'),
                DB::raw('COALESCE(SUM(r.teacher_count), 0) as teachers'),
                DB::raw('COUNT(DISTINCT r.school_id) as schools'),
                DB::raw('COUNT(*) as registrations')
            )
            ->first();

        // ระดับกลุ่ม - เฉพาะ approved
        $group = DB::table('registrations as r')
            ->join('competitions as c', 'r.competition_id', '=', 'c.id')
            ->where('c.competition_level', 'group')
            ->where('r.status', 'approved')
            ->select(
                DB::raw('COALESCE(SUM(r.student_count), 0) as students'),
                DB::raw('COALESCE(SUM(r.teacher_count), 0) as teachers'),
                DB::raw('COUNT(DISTINCT r.school_id) as schools'),
                DB::raw('COUNT(*) as registrations')
            )
            ->first();

        // รวมทั้งหมด
        $total = DB::table('registrations as r')
            ->where('r.status', 'approved')
            ->select(
                DB::raw('COALESCE(SUM(r.student_count), 0) as students'),
                DB::raw('COALESCE(SUM(r.teacher_count), 0) as teachers'),
                DB::raw('COUNT(DISTINCT r.school_id) as schools'),
                DB::raw('COUNT(*) as registrations')
            )
            ->first();

        return [
            'district' => [
                'students' => (int)$district->students,
                'teachers' => (int)$district->teachers,
                'schools' => (int)$district->schools,
                'registrations' => (int)$district->registrations,
            ],
            'group' => [
                'students' => (int)$group->students,
                'teachers' => (int)$group->teachers,
                'schools' => (int)$group->schools,
                'registrations' => (int)$group->registrations,
            ],
            'total' => [
                'students' => (int)$total->students,
                'teachers' => (int)$total->teachers,
                'schools' => (int)$total->schools,
                'registrations' => (int)$total->registrations,
            ],
        ];
    }
}
