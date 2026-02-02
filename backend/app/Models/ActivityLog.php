<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Request;

class ActivityLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'user_name',
        'user_email',
        'user_role',
        'action',
        'module',
        'description',
        'details',
        'ip_address',
        'user_agent',
        'method',
        'url',
        'status_code',
    ];

    protected $casts = [
        'details' => 'array',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Get the user that performed the activity
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * บันทึก Activity Log
     */
    public static function log(
        string $action,
        ?string $module = null,
        ?string $description = null,
        ?array $details = null,
        ?int $statusCode = null
    ): self {
        $user = Auth::user();
        $request = Request::instance();

        return self::create([
            'user_id' => $user?->id,
            'user_name' => $user?->name,
            'user_email' => $user?->email,
            'user_role' => $user?->role,
            'action' => $action,
            'module' => $module,
            'description' => $description,
            'details' => $details,
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'method' => $request->method(),
            'url' => $request->fullUrl(),
            'status_code' => $statusCode,
        ]);
    }

    /**
     * บันทึก Login
     */
    public static function logLogin(User $user): self
    {
        $request = Request::instance();

        return self::create([
            'user_id' => $user->id,
            'user_name' => $user->name,
            'user_email' => $user->email,
            'user_role' => $user->role,
            'action' => 'login',
            'module' => 'auth',
            'description' => 'เข้าสู่ระบบ',
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'method' => 'POST',
            'url' => $request->fullUrl(),
            'status_code' => 200,
        ]);
    }

    /**
     * บันทึก Logout
     */
    public static function logLogout(User $user): self
    {
        $request = Request::instance();

        return self::create([
            'user_id' => $user->id,
            'user_name' => $user->name,
            'user_email' => $user->email,
            'user_role' => $user->role,
            'action' => 'logout',
            'module' => 'auth',
            'description' => 'ออกจากระบบ',
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'method' => 'POST',
            'url' => $request->fullUrl(),
            'status_code' => 200,
        ]);
    }

    /**
     * Scope: Filter by user
     */
    public function scopeForUser($query, int $userId)
    {
        return $query->where('user_id', $userId);
    }

    /**
     * Scope: Filter by action
     */
    public function scopeByAction($query, string $action)
    {
        return $query->where('action', $action);
    }

    /**
     * Scope: Filter by module
     */
    public function scopeByModule($query, string $module)
    {
        return $query->where('module', $module);
    }

    /**
     * Scope: Filter by date range
     */
    public function scopeDateRange($query, $startDate, $endDate)
    {
        return $query->whereBetween('created_at', [$startDate, $endDate]);
    }

    /**
     * Scope: Today's logs
     */
    public function scopeToday($query)
    {
        return $query->whereDate('created_at', today());
    }

    /**
     * Get action label in Thai
     */
    public function getActionLabelAttribute(): string
    {
        $labels = [
            'login' => 'เข้าสู่ระบบ',
            'logout' => 'ออกจากระบบ',
            'create' => 'สร้าง',
            'update' => 'แก้ไข',
            'delete' => 'ลบ',
            'view' => 'ดู',
            'export' => 'ส่งออก',
            'import' => 'นำเข้า',
            'approve' => 'อนุมัติ',
            'reject' => 'ปฏิเสธ',
        ];

        return $labels[$this->action] ?? $this->action;
    }

    /**
     * Get role label in Thai
     */
    public function getRoleLabelAttribute(): string
    {
        $labels = [
            'district_admin' => 'ผู้ดูแลระดับเขต',
            'admin' => 'ผู้ดูแลระบบ',
            'group_admin' => 'ผู้ดูแลกลุ่ม',
            'school_admin' => 'ผู้ดูแลโรงเรียน',
            'judge' => 'กรรมการ',
            'teacher' => 'ครู',
        ];

        return $labels[$this->user_role] ?? $this->user_role ?? 'ไม่ระบุ';
    }
}
