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

        // Append LogActivity and TrackUserActivity to api middleware group
        $middleware->api(append: [
            \App\Http\Middleware\LogActivity::class,
            \App\Http\Middleware\TrackUserActivity::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        //
    })->create();
