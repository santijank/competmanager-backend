<?php

namespace App\Http\Middleware;

use App\Models\ActivityLog;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

class LogActivity
{
    /**
     * Actions ที่ต้องการบันทึก
     */
    protected array $loggedActions = [
        'POST' => 'create',
        'PUT' => 'update',
        'PATCH' => 'update',
        'DELETE' => 'delete',
    ];

    /**
     * Routes ที่ไม่ต้องการบันทึก
     */
    protected array $excludedRoutes = [
        'api/activity-logs',
        'api/sanctum/csrf-cookie',
        'api/online-users',
    ];

    /**
     * Mapping: URL segment → [Model class, fields to capture]
     */
    protected array $modelMapping = [
        'registrations' => [\App\Models\Registration::class, ['id', 'competition_id', 'school_id', 'team_name', 'student_names', 'student_count'], ['competition:id,name,code', 'school:id,name']],
        'competitions' => [\App\Models\Competition::class, ['id', 'name', 'code', 'level', 'competition_level', 'school_group_id', 'category_id'], []],
        'users' => [\App\Models\User::class, ['id', 'name', 'email', 'role'], []],
        'schools' => [\App\Models\School::class, ['id', 'name', 'school_group_id'], []],
        'announcements' => [\App\Models\Announcement::class, ['id', 'title'], []],
        'scores' => [\App\Models\Score::class, ['id', 'registration_id', 'competition_id', 'judge_id'], []],
    ];

    /**
     * เก็บข้อมูล resource ก่อนลบ
     */
    protected ?array $deleteResourceDetails = null;

    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        // สำหรับ DELETE: จับข้อมูล resource ก่อนที่จะถูกลบ
        if ($request->method() === 'DELETE') {
            $this->captureDeleteDetails($request);
        }

        $response = $next($request);

        // บันทึก log หลังจาก response
        $this->logActivity($request, $response);

        return $response;
    }

    /**
     * บันทึก Activity Log
     * ใช้ throttle เพื่อลด DB writes - ไม่ log ซ้ำสำหรับ user/action เดิมภายใน 10 วินาที
     */
    protected function logActivity(Request $request, Response $response): void
    {
        // ข้าม routes ที่ไม่ต้องการบันทึก
        if ($this->shouldExclude($request)) {
            return;
        }

        // ข้าม GET requests (ยกเว้น export)
        $method = $request->method();
        if ($method === 'GET' && !str_contains($request->path(), 'export')) {
            return;
        }

        // ต้องมี user login
        $user = $request->user();
        if (!$user) {
            return;
        }

        // Throttle: ไม่ log ซ้ำสำหรับ user + path เดิมภายใน 10 วินาที
        $throttleKey = 'activity_log_' . $user->id . '_' . md5($method . $request->path());
        if (Cache::has($throttleKey)) {
            return;
        }
        Cache::put($throttleKey, true, 10);

        // กำหนด action และ module
        $action = $this->determineAction($request, $method);
        $module = $this->determineModule($request);
        $description = $this->generateDescription($request, $action, $module);

        ActivityLog::create([
            'user_id' => $user->id,
            'user_name' => $user->name,
            'user_email' => $user->email,
            'user_role' => $user->role,
            'action' => $action,
            'module' => $module,
            'description' => $description,
            'details' => $this->getRequestDetails($request),
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'method' => $method,
            'url' => $request->fullUrl(),
            'status_code' => $response->getStatusCode(),
        ]);
    }

    /**
     * ตรวจสอบว่าควรข้าม route นี้หรือไม่
     */
    protected function shouldExclude(Request $request): bool
    {
        $path = $request->path();

        foreach ($this->excludedRoutes as $excluded) {
            if (str_contains($path, $excluded)) {
                return true;
            }
        }

        return false;
    }

    /**
     * กำหนด action จาก request
     */
    protected function determineAction(Request $request, string $method): string
    {
        $path = $request->path();

        // ตรวจสอบ action พิเศษ
        if (str_contains($path, 'toggle-pin')) {
            return 'toggle_pin';
        }
        if (str_contains($path, 'export')) {
            return 'export';
        }
        if (str_contains($path, 'import')) {
            return 'import';
        }
        if (str_contains($path, 'approve')) {
            return 'approve';
        }
        if (str_contains($path, 'reject')) {
            return 'reject';
        }

        return $this->loggedActions[$method] ?? 'unknown';
    }

    /**
     * กำหนด module จาก request path
     */
    protected function determineModule(Request $request): ?string
    {
        $path = $request->path();

        // ดึง module จาก path
        $modules = [
            'competitions' => 'competitions',
            'registrations' => 'registrations',
            'users' => 'users',
            'schools' => 'schools',
            'school-groups' => 'school_groups',
            'announcements' => 'announcements',
            'categories' => 'categories',
            'sub-categories' => 'sub_categories',
            'levels' => 'levels',
            'judges' => 'judges',
            'scores' => 'scores',
            'results' => 'results',
        ];

        foreach ($modules as $key => $value) {
            if (str_contains($path, $key)) {
                return $value;
            }
        }

        return null;
    }

    /**
     * สร้างคำอธิบาย
     */
    protected function generateDescription(Request $request, string $action, ?string $module): string
    {
        $actionLabels = [
            'create' => 'สร้าง',
            'update' => 'แก้ไข',
            'delete' => 'ลบ',
            'export' => 'ส่งออก',
            'import' => 'นำเข้า',
            'approve' => 'อนุมัติ',
            'reject' => 'ปฏิเสธ',
            'toggle_pin' => 'ปักหมุด/เลิกปักหมุด',
        ];

        $moduleLabels = [
            'competitions' => 'การแข่งขัน',
            'registrations' => 'การลงทะเบียน',
            'users' => 'ผู้ใช้',
            'schools' => 'โรงเรียน',
            'school_groups' => 'กลุ่มโรงเรียน',
            'announcements' => 'ประกาศ',
            'categories' => 'หมวดหมู่',
            'sub_categories' => 'หมวดหมู่ย่อย',
            'levels' => 'ระดับชั้น',
            'judges' => 'กรรมการ',
            'scores' => 'คะแนน',
            'results' => 'ผลการแข่งขัน',
        ];

        $actionLabel = $actionLabels[$action] ?? $action;
        $moduleLabel = $moduleLabels[$module] ?? $module ?? 'ข้อมูล';

        $desc = "{$actionLabel}{$moduleLabel}";

        // สำหรับ DELETE: เพิ่มชื่อ resource ที่ถูกลบ
        if ($action === 'delete' && $this->deleteResourceDetails) {
            $details = $this->deleteResourceDetails;
            if ($module === 'registrations' && isset($details['_competition'])) {
                $compName = $details['_competition']['name'] ?? '';
                $schoolName = $details['_school']['name'] ?? '';
                if ($compName) {
                    $desc .= " - {$compName}";
                }
                if ($schoolName) {
                    $desc .= " ({$schoolName})";
                }
            } elseif ($module === 'competitions' && isset($details['name'])) {
                $desc .= " - {$details['name']}";
            } elseif (isset($details['name'])) {
                $desc .= " - {$details['name']}";
            } elseif (isset($details['title'])) {
                $desc .= " - {$details['title']}";
            }
        }

        return $desc;
    }

    /**
     * ดึงรายละเอียดจาก request
     */
    protected function getRequestDetails(Request $request): ?array
    {
        $method = $request->method();

        if (in_array($method, ['POST', 'PUT', 'PATCH'])) {
            // กรองข้อมูลที่ sensitive
            $data = $request->except(['password', 'password_confirmation', 'token']);

            // จำกัดขนาดข้อมูล
            if (count($data) > 20) {
                $data = array_slice($data, 0, 20);
                $data['_truncated'] = true;
            }

            return !empty($data) ? $data : null;
        }

        // สำหรับ DELETE: ใช้ข้อมูลที่จับไว้ก่อนลบ
        if ($method === 'DELETE' && $this->deleteResourceDetails) {
            return $this->deleteResourceDetails;
        }

        return null;
    }

    /**
     * จับข้อมูล resource ก่อนที่จะถูกลบ (เรียกก่อน $next)
     */
    protected function captureDeleteDetails(Request $request): void
    {
        try {
            $path = $request->path();

            foreach ($this->modelMapping as $segment => [$modelClass, $fields, $relations]) {
                // ตรวจสอบ URL pattern เช่น api/registrations/123
                if (preg_match("#(?:api/)?{$segment}/(\d+)#", $path, $matches)) {
                    $id = (int) $matches[1];

                    $query = $modelClass::select($fields);
                    if (!empty($relations)) {
                        $query->with($relations);
                    }
                    $resource = $query->find($id);

                    if ($resource) {
                        $details = ['_deleted_resource' => $segment, '_resource_id' => $id];

                        // เพิ่มข้อมูลหลักของ resource
                        foreach ($fields as $field) {
                            $value = $resource->$field;
                            if ($value !== null) {
                                $details[$field] = $value;
                            }
                        }

                        // เพิ่มข้อมูล relations
                        foreach ($relations as $relation) {
                            $relationName = explode(':', $relation)[0];
                            $related = $resource->$relationName;
                            if ($related) {
                                $details["_{$relationName}"] = $related->toArray();
                            }
                        }

                        $this->deleteResourceDetails = $details;
                    }

                    break;
                }
            }
        } catch (\Exception $e) {
            Log::warning('Failed to capture delete details', ['error' => $e->getMessage()]);
        }
    }
}
