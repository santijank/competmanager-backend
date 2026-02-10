<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\Response;

class TrackUserActivity
{
    /**
     * Handle an incoming request.
     * อัพเดท last_activity_at ทุกครั้งที่ user ทำ request
     * ใช้ Cache เพื่อลดการ update database (update ทุก 60 วินาที)
     */
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        $user = Auth::user();

        if ($user) {
            $cacheKey = 'user_activity_' . $user->id;

            // อัพเดทเฉพาะเมื่อเวลาผ่านไป 60 วินาที (ลด DB load)
            if (!Cache::has($cacheKey)) {
                DB::table('users')
                    ->where('id', $user->id)
                    ->update(['last_activity_at' => now()]);

                // Cache 60 วินาที เพื่อไม่ให้ update ทุก request
                Cache::put($cacheKey, true, 60);
            }
        }

        return $response;
    }
}
