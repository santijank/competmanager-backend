<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * อ่าน token จาก query string (?token=xxx) แล้วใส่เป็น Authorization: Bearer header
 * สำหรับกรณีที่ใช้ window.open() ซึ่งไม่สามารถตั้ง header ได้
 * เช่น download PDF, preview PDF
 */
class TokenFromQuery
{
    public function handle(Request $request, Closure $next): Response
    {
        // ถ้าไม่มี Authorization header แต่มี ?token= ใน query string
        if (!$request->bearerToken() && $request->has('token')) {
            $request->headers->set('Authorization', 'Bearer ' . $request->query('token'));
        }

        return $next($request);
    }
}
