<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class OnlineUsersController extends Controller
{
    /**
     * จำนวนนาทีที่ถือว่า user ยัง active อยู่
     */
    protected int $activeMinutes = 5;

    /**
     * ดึงจำนวน active users (ใช้ last_activity_at ภายใน 5 นาที)
     * Cache ผลลัพธ์ 30 วินาที เพื่อลด DB load
     */
    public function index(Request $request): JsonResponse
    {
        $data = Cache::remember('online_users_data', 30, function () {
            $threshold = now()->subMinutes($this->activeMinutes);

            // ใช้ query เดียว ดึง users ที่ online ทั้งหมด
            $onlineUsers = DB::table('users')
                ->select('id', 'name', 'role', 'last_activity_at')
                ->where('is_active', true)
                ->where('last_activity_at', '>=', $threshold)
                ->orderBy('last_activity_at', 'desc')
                ->get();

            // คำนวณ total และ byRole จาก collection (ไม่ต้อง query DB เพิ่ม)
            $totalOnline = $onlineUsers->count();
            $byRole = $onlineUsers->groupBy('role')->map->count();

            $users = $onlineUsers->map(function ($user) {
                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'role' => $user->role,
                    'role_label' => $this->getRoleLabel($user->role),
                    'last_activity' => $user->last_activity_at,
                ];
            });

            return [
                'total_online' => $totalOnline,
                'by_role' => $byRole,
                'users' => $users,
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $data,
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
