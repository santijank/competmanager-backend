<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Exception;

class UserController extends Controller
{
    /**
     * Get all users with filters and pagination
     */
    public function index(Request $request): JsonResponse
    {
        try {
            Log::info('UserController@index called with request: ' . json_encode($request->all()));

            // เริ่มต้นด้วยการ query users พร้อม relationships
            $query = User::with(['school', 'school_group']);
            
            Log::info('Initial query created successfully');

            // Apply filters
            if ($request->has('search') && $request->search) {
                $search = $request->search;
                $query->where(function($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                      ->orWhere('email', 'like', "%{$search}%");
                });
                Log::info('Search filter applied: ' . $search);
            }

            if ($request->has('role') && $request->role) {
                $query->where('role', $request->role);
                Log::info('Role filter applied: ' . $request->role);
            }

            if ($request->has('school_id') && $request->school_id) {
                $query->where('school_id', $request->school_id);
                Log::info('School ID filter applied: ' . $request->school_id);
            }

            if ($request->has('school_group_id') && $request->school_group_id) {
                $query->where('school_group_id', $request->school_group_id);
                Log::info('School Group ID filter applied: ' . $request->school_group_id);
            }

            // Pagination
            $perPage = $request->input('per_page', 15);
            Log::info('Pagination set to: ' . $perPage);

            try {
                $users = $query->orderBy('created_at', 'desc')->paginate($perPage);
                Log::info('Query executed successfully. Total users: ' . $users->total());
            } catch (Exception $e) {
                Log::error('Error executing paginate query: ' . $e->getMessage());
                Log::error('Query SQL: ' . $query->toSql());
                throw $e;
            }

            $response = [
                'success' => true,
                'data' => $users->items(),
                'meta' => [
                    'current_page' => $users->currentPage(),
                    'last_page' => $users->lastPage(),
                    'per_page' => $users->perPage(),
                    'total' => $users->total(),
                ]
            ];

            Log::info('UserController@index completed successfully');
            return response()->json($response);
            
        } catch (Exception $e) {
            Log::error('UserController@index failed: ' . $e->getMessage());
            Log::error('Stack trace: ' . $e->getTraceAsString());
            
            return response()->json([
                'success' => false,
                'message' => 'เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal Server Error',
                'debug_info' => config('app.debug') ? [
                    'file' => $e->getFile(),
                    'line' => $e->getLine(),
                ] : null
            ], 500);
        }
    }

    /**
     * Create new user
     */
    public function store(Request $request): JsonResponse
    {
        try {
            Log::info('UserController@store called');

            $validator = Validator::make($request->all(), [
                'name' => 'required|string|max:255',
                'email' => 'required|email|unique:users,email',
                'password' => 'required|string|min:6|confirmed',
                'role' => 'required|in:admin,district_admin,committee,group_admin,school_admin,teacher',
                'school_id' => 'nullable|exists:schools,id',
                'school_group_id' => 'nullable|exists:school_groups,id',
                'is_active' => 'boolean',
                'committee_level' => 'nullable|in:group,district',
            ]);

            if ($validator->fails()) {
                Log::warning('Validation failed in UserController@store', $validator->errors()->toArray());
                return response()->json([
                    'success' => false,
                    'message' => 'ข้อมูลไม่ถูกต้อง',
                    'errors' => $validator->errors()
                ], 422);
            }

            $user = User::create([
                'name' => $request->name,
                'email' => $request->email,
                'password' => Hash::make($request->password),
                'role' => $request->role,
                'school_id' => $request->school_id,
                'school_group_id' => $request->school_group_id,
                'is_active' => $request->is_active ?? true,
                'committee_level' => $request->committee_level,
            ]);

            Log::info('User created successfully: ' . $user->id);

            return response()->json([
                'success' => true,
                'message' => 'เพิ่มผู้ใช้สำเร็จ',
                'data' => $user->load(['school', 'school_group'])
            ], 201);
            
        } catch (Exception $e) {
            Log::error('UserController@store failed: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'เกิดข้อผิดพลาดในการเพิ่มผู้ใช้',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal Server Error'
            ], 500);
        }
    }

    /**
     * Update user
     */
    public function update(Request $request, int $id): JsonResponse
    {
        try {
            Log::info('UserController@update called for user ID: ' . $id);

            $user = User::findOrFail($id);

            $validator = Validator::make($request->all(), [
                'name' => 'required|string|max:255',
                'email' => [
                    'required',
                    'email',
                    Rule::unique('users')->ignore($user->id)
                ],
                'password' => 'nullable|string|min:6|confirmed',
                'role' => 'required|in:admin,district_admin,committee,group_admin,school_admin,teacher',
                'school_id' => 'nullable|exists:schools,id',
                'school_group_id' => 'nullable|exists:school_groups,id',
                'is_active' => 'boolean',
                'committee_level' => 'nullable|in:group,district',
            ]);

            if ($validator->fails()) {
                Log::warning('Validation failed in UserController@update', $validator->errors()->toArray());
                return response()->json([
                    'success' => false,
                    'message' => 'ข้อมูลไม่ถูกต้อง',
                    'errors' => $validator->errors()
                ], 422);
            }

            $user->name = $request->name;
            $user->email = $request->email;
            $user->role = $request->role;
            $user->school_id = $request->school_id;
            $user->school_group_id = $request->school_group_id;
            $user->is_active = $request->is_active ?? $user->is_active;
            $user->committee_level = $request->committee_level;

            // Only update password if provided
            if ($request->filled('password')) {
                $user->password = Hash::make($request->password);
            }

            $user->save();
            Log::info('User updated successfully: ' . $user->id);

            return response()->json([
                'success' => true,
                'message' => 'แก้ไขผู้ใช้สำเร็จ',
                'data' => $user->load(['school', 'school_group'])
            ]);
            
        } catch (Exception $e) {
            Log::error('UserController@update failed: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'เกิดข้อผิดพลาดในการแก้ไขผู้ใช้',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal Server Error'
            ], 500);
        }
    }

    /**
     * Delete user
     */
    public function destroy(int $id): JsonResponse
    {
        try {
            Log::info('UserController@destroy called for user ID: ' . $id);

            $user = User::findOrFail($id);

            // Prevent deleting yourself
            if ($user->id === auth()->id()) {
                return response()->json([
                    'success' => false,
                    'message' => 'ไม่สามารถลบบัญชีของตัวเองได้'
                ], 403);
            }

            $user->delete();
            Log::info('User deleted successfully: ' . $id);

            return response()->json([
                'success' => true,
                'message' => 'ลบผู้ใช้สำเร็จ'
            ]);
            
        } catch (Exception $e) {
            Log::error('UserController@destroy failed: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'เกิดข้อผิดพลาดในการลบผู้ใช้',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal Server Error'
            ], 500);
        }
    }

    /**
     * Reset user password
     */
    public function resetPassword(Request $request, int $id): JsonResponse
    {
        try {
            Log::info('UserController@resetPassword called for user ID: ' . $id);

            $user = User::findOrFail($id);

            // Generate random password
            $newPassword = Str::random(10);

            $user->password = Hash::make($newPassword);
            $user->save();

            Log::info('Password reset successfully for user: ' . $user->id);

            return response()->json([
                'success' => true,
                'message' => 'Reset รหัสผ่านสำเร็จ',
                'data' => [
                    'new_password' => $newPassword
                ]
            ]);
            
        } catch (Exception $e) {
            Log::error('UserController@resetPassword failed: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'เกิดข้อผิดพลาดในการ Reset รหัสผ่าน',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal Server Error'
            ], 500);
        }
    }

    /**
     * Generate random password
     */
    public function generatePassword(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'password' => Str::random(10)
        ]);
    }

    /**
     * Bulk reset passwords
     */
    public function bulkResetPassword(Request $request): JsonResponse
    {
        try {
            Log::info('UserController@bulkResetPassword called');

            $validator = Validator::make($request->all(), [
                'user_ids' => 'required|array',
                'user_ids.*' => 'exists:users,id'
            ]);

            if ($validator->fails()) {
                Log::warning('Validation failed in UserController@bulkResetPassword', $validator->errors()->toArray());
                return response()->json([
                    'success' => false,
                    'message' => 'ข้อมูลไม่ถูกต้อง',
                    'errors' => $validator->errors()
                ], 422);
            }

            $results = [];
            foreach ($request->user_ids as $userId) {
                $user = User::find($userId);
                if ($user) {
                    $newPassword = Str::random(10);
                    $user->password = Hash::make($newPassword);
                    $user->save();

                    $results[] = [
                        'user_id' => $user->id,
                        'name' => $user->name,
                        'email' => $user->email,
                        'new_password' => $newPassword
                    ];
                }
            }

            Log::info('Bulk password reset completed for ' . count($results) . ' users');

            return response()->json([
                'success' => true,
                'message' => 'Reset รหัสผ่านสำเร็จ',
                'data' => $results
            ]);
            
        } catch (Exception $e) {
            Log::error('UserController@bulkResetPassword failed: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'เกิดข้อผิดพลาดในการ Reset รหัสผ่าน',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal Server Error'
            ], 500);
        }
    }

    /**
     * Get user stats for dashboard
     */
    public function stats(): JsonResponse
    {
        try {
            $stats = [
                'total_users' => User::count(),
                'active_users' => User::where('is_active', true)->count(),
                'inactive_users' => User::where('is_active', false)->count(),
                'by_role' => [
                    'admin' => User::where('role', 'admin')->count(),
                    'district_admin' => User::where('role', 'district_admin')->count(),
                    'group_admin' => User::where('role', 'group_admin')->count(),
                    'school_admin' => User::where('role', 'school_admin')->count(),
                    'teacher' => User::where('role', 'teacher')->count(),
                    'committee' => User::where('role', 'committee')->count(),
                ]
            ];

            return response()->json([
                'success' => true,
                'data' => $stats
            ]);
            
        } catch (Exception $e) {
            Log::error('UserController@stats failed: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'เกิดข้อผิดพลาดในการดึงสถิติผู้ใช้',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal Server Error'
            ], 500);
        }
    }
}
