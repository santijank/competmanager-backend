<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class ActivityLogController extends Controller
{
    /**
     * แสดงรายการ Activity Logs
     * เฉพาะ District Admin เท่านั้น
     */
    public function index(Request $request): JsonResponse
    {
        // ตรวจสอบสิทธิ์ - เฉพาะ district_admin เท่านั้น
        $user = $request->user();
        if (!in_array($user->role, ['district_admin', 'admin'])) {
            return response()->json([
                'success' => false,
                'message' => 'คุณไม่มีสิทธิ์เข้าถึงข้อมูลนี้'
            ], 403);
        }

        $query = ActivityLog::with('user:id,name,email,role')
            ->orderBy('created_at', 'desc');

        // Filter by user
        if ($request->has('user_id') && $request->user_id) {
            $query->where('user_id', $request->user_id);
        }

        // Filter by action
        if ($request->has('action') && $request->action) {
            $query->where('action', $request->action);
        }

        // Filter by module
        if ($request->has('module') && $request->module) {
            $query->where('module', $request->module);
        }

        // Filter by role
        if ($request->has('role') && $request->role) {
            $query->where('user_role', $request->role);
        }

        // Filter by date range
        if ($request->has('start_date') && $request->start_date) {
            $query->whereDate('created_at', '>=', $request->start_date);
        }
        if ($request->has('end_date') && $request->end_date) {
            $query->whereDate('created_at', '<=', $request->end_date);
        }

        // Search by user name or email
        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('user_name', 'like', "%{$search}%")
                  ->orWhere('user_email', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        // Pagination
        $perPage = $request->get('per_page', 50);
        $logs = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $logs->items(),
            'meta' => [
                'current_page' => $logs->currentPage(),
                'last_page' => $logs->lastPage(),
                'per_page' => $logs->perPage(),
                'total' => $logs->total(),
            ]
        ]);
    }

    /**
     * แสดงสถิติ Activity Logs
     */
    public function stats(Request $request): JsonResponse
    {
        // ตรวจสอบสิทธิ์
        $user = $request->user();
        if (!in_array($user->role, ['district_admin', 'admin'])) {
            return response()->json([
                'success' => false,
                'message' => 'คุณไม่มีสิทธิ์เข้าถึงข้อมูลนี้'
            ], 403);
        }

        // สถิติวันนี้
        $todayLogins = ActivityLog::where('action', 'login')
            ->whereDate('created_at', today())
            ->count();

        $todayActiveUsers = ActivityLog::whereDate('created_at', today())
            ->distinct('user_id')
            ->count('user_id');

        // สถิติทั้งหมด
        $totalLogs = ActivityLog::count();
        $totalLogins = ActivityLog::where('action', 'login')->count();

        // สถิติตาม action
        $actionStats = ActivityLog::select('action', DB::raw('count(*) as count'))
            ->groupBy('action')
            ->orderByDesc('count')
            ->get();

        // สถิติตาม module
        $moduleStats = ActivityLog::select('module', DB::raw('count(*) as count'))
            ->whereNotNull('module')
            ->groupBy('module')
            ->orderByDesc('count')
            ->get();

        // สถิติตาม role
        $roleStats = ActivityLog::select('user_role', DB::raw('count(*) as count'))
            ->whereNotNull('user_role')
            ->groupBy('user_role')
            ->orderByDesc('count')
            ->get();

        // ผู้ใช้ที่ใช้งานมากที่สุด (7 วันล่าสุด)
        $topUsers = ActivityLog::select('user_id', 'user_name', 'user_email', 'user_role', DB::raw('count(*) as count'))
            ->where('created_at', '>=', now()->subDays(7))
            ->whereNotNull('user_id')
            ->groupBy('user_id', 'user_name', 'user_email', 'user_role')
            ->orderByDesc('count')
            ->limit(10)
            ->get();

        // กราฟการใช้งานรายวัน (7 วันล่าสุด)
        $dailyStats = ActivityLog::select(
                DB::raw('DATE(created_at) as date'),
                DB::raw('count(*) as total'),
                DB::raw('count(distinct user_id) as unique_users')
            )
            ->where('created_at', '>=', now()->subDays(7))
            ->groupBy(DB::raw('DATE(created_at)'))
            ->orderBy('date')
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'today' => [
                    'logins' => $todayLogins,
                    'active_users' => $todayActiveUsers,
                ],
                'total' => [
                    'logs' => $totalLogs,
                    'logins' => $totalLogins,
                ],
                'by_action' => $actionStats,
                'by_module' => $moduleStats,
                'by_role' => $roleStats,
                'top_users' => $topUsers,
                'daily_stats' => $dailyStats,
            ]
        ]);
    }

    /**
     * แสดง Activity Log ของ User คนเดียว
     */
    public function userLogs(Request $request, int $userId): JsonResponse
    {
        // ตรวจสอบสิทธิ์
        $user = $request->user();
        if (!in_array($user->role, ['district_admin', 'admin'])) {
            return response()->json([
                'success' => false,
                'message' => 'คุณไม่มีสิทธิ์เข้าถึงข้อมูลนี้'
            ], 403);
        }

        $perPage = $request->get('per_page', 50);
        $logs = ActivityLog::where('user_id', $userId)
            ->orderBy('created_at', 'desc')
            ->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $logs->items(),
            'meta' => [
                'current_page' => $logs->currentPage(),
                'last_page' => $logs->lastPage(),
                'per_page' => $logs->perPage(),
                'total' => $logs->total(),
            ]
        ]);
    }

    /**
     * ลบ Logs เก่า (เก็บไว้ 90 วัน)
     */
    public function cleanup(Request $request): JsonResponse
    {
        // ตรวจสอบสิทธิ์
        $user = $request->user();
        if ($user->role !== 'district_admin') {
            return response()->json([
                'success' => false,
                'message' => 'คุณไม่มีสิทธิ์ทำรายการนี้'
            ], 403);
        }

        $days = $request->get('days', 90);
        $deleted = ActivityLog::where('created_at', '<', now()->subDays($days))->delete();

        ActivityLog::log('cleanup', 'activity_logs', "ลบ logs เก่ากว่า {$days} วัน จำนวน {$deleted} รายการ");

        return response()->json([
            'success' => true,
            'message' => "ลบ logs เก่ากว่า {$days} วัน จำนวน {$deleted} รายการ",
            'deleted_count' => $deleted
        ]);
    }

    /**
     * Export logs to CSV
     */
    public function export(Request $request): JsonResponse
    {
        // ตรวจสอบสิทธิ์
        $user = $request->user();
        if (!in_array($user->role, ['district_admin', 'admin'])) {
            return response()->json([
                'success' => false,
                'message' => 'คุณไม่มีสิทธิ์ทำรายการนี้'
            ], 403);
        }

        $query = ActivityLog::orderBy('created_at', 'desc');

        // Apply filters
        if ($request->has('start_date')) {
            $query->whereDate('created_at', '>=', $request->start_date);
        }
        if ($request->has('end_date')) {
            $query->whereDate('created_at', '<=', $request->end_date);
        }

        $logs = $query->limit(10000)->get();

        // Log the export action
        ActivityLog::log('export', 'activity_logs', 'ส่งออกข้อมูล Activity Logs');

        return response()->json([
            'success' => true,
            'data' => $logs,
            'count' => $logs->count()
        ]);
    }
}
