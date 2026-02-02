protected $middlewareAliases = [
    // ... อื่นๆ
    'role' => \App\Http\Middleware\RoleMiddleware::class,
    // หรือ
    'role' => \App\Http\Middleware\CheckRole::class,
];