<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class OnlineUsersController extends Controller
{
    /**
     * จำนวนนาทีที่ถือว่า user ยัง active อยู่
     */
    protected int $activeMinutes = 5;

    /**
     * ดึงจำนวน active users (ใช้ last_activity_at ภายใน 5 นาที)
     */
    public function index(Request $request): JsonResponse
    {
        $threshold = now()->subMinutes($this->activeMinutes);

        // นับรวมทั้งหมด
        $totalOnline = DB::table('users')
            ->where('is_active', true)
            ->where('last_activity_at', '>=', $threshold)
            ->count();

        // นับแยกตาม role
        $byRole = DB::table('users')
            ->select('role', DB::raw('count(*) as count'))
            ->where('is_active', true)
            ->where('last_activity_at', '>=', $threshold)
            ->groupBy('role')
            ->pluck('count', 'role');

        // รายชื่อ user ที่ online (สำหรับแสดงใน Dashboard)
        $onlineUsers = DB::table('users')
            ->select('id', 'name', 'role', 'last_activity_at')
            ->where('is_active', true)
            ->where('last_activity_at', '>=', $threshold)
            ->orderBy('last_activity_at', 'desc')
            ->get()
            ->map(function ($user) {
                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'role' => $user->role,
                    'role_label' => $this->getRoleLabel($user->role),
                    'last_activity' => $user->last_activity_at,
                ];
            });

        return response()->json([
            'success' => true,
            'data' => [
                'total_online' => $totalOnline,
                'by_role' => $byRole,
                'users' => $onlineUsers,
            ]
        ]);
    }

    /**
     * แปลง role เป็นภาษาไทย
     */
    protected function getRoleLabel(string $role): string
    {
        $labels = [
            'admin' => 'ผู้ดูแลระบบ',
            'district_admin' => 'ผู้ดูแลเขต',
            'group_admin' => 'ผู้ดูแลกลุ่ม',
            'school_admin' => 'ผู้ดูแลโรงเรียน',
            'teacher' => 'ครู',
            'committee' => 'คณะกรรมการ',
            'judge' => 'กรรมการตัดสิน',
        ];

        return $labels[$role] ?? $role;
    }
}
