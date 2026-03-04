<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
       $middleware->redirectGuestsTo('/api/auth/login');

        // Trust all proxies (Railway reverse proxy)
        $middleware->trustProxies(at: '*');

        // Add custom CORS middleware as first middleware (handles preflight)
        $middleware->prepend(\App\Http\Middleware\CorsMiddleware::class);

        // Register middleware aliases
        $middleware->alias([
            'role' => \App\Http\Middleware\RoleMiddleware::class,
            'log.activity' => \App\Http\Middleware\LogActivity::class,
        ]);

        // Append middleware to api group
        // TokenFromQuery ต้องอยู่ก่อน auth:sanctum เพื่อ copy ?token= → Authorization header
        $middleware->api(append: [
            \App\Http\Middleware\TokenFromQuery::class,
            \App\Http\Middleware\LogActivity::class,
            \App\Http\Middleware\TrackUserActivity::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        // เพิ่ม CORS headers ใน error responses ด้วย
        $exceptions->respond(function (\Symfony\Component\HttpFoundation\Response $response) {
            $allowedOrigins = [
                'https://competmanager.web.app',
                'http://localhost:5173',
                'http://localhost:3000',
            ];
            $origin = request()->header('Origin');
            $allowedOrigin = in_array($origin, $allowedOrigins) ? $origin : $allowedOrigins[0];

            $response->headers->set('Access-Control-Allow-Origin', $allowedOrigin);
            $response->headers->set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
            $response->headers->set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin, X-XSRF-TOKEN');
            $response->headers->set('Access-Control-Allow-Credentials', 'true');

            return $response;
        });
    })->create();
