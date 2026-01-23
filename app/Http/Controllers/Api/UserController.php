<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    /**
     * Get all users with filters and pagination
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $query = User::with(['school', 'school_group']);

            // Apply filters
            if ($request->has('search') && $request->search) {
                $search = $request->search;
                $query->where(function($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                      ->orWhere('email', 'like', "%{$search}%");
                });
            }

            if ($request->has('role') && $request->role) {
                $query->where('role', $request->role);
            }

            if ($request->has('school_id') && $request->school_id) {
                $query->where('school_id', $request->school_id);
            }

            if ($request->has('school_group_id') && $request->school_group_id) {
                $query->where('school_group_id', $request->school_group_id);
            }

            // Pagination
            $perPage = $request->input('per_page', 15);
            $users = $query->orderBy('created_at', 'desc')->paginate($perPage);

            return response()->json([
                'success' => true,
                'data' => $users->items(),
                'meta' => [
                    'current_page' => $users->currentPage(),
                    'last_page' => $users->lastPage(),
                    'per_page' => $users->perPage(),
                    'total' => $users->total(),
                ]
            ]);
        } catch (\Exception $e) {
            \Log::error('Error fetching users: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Create new user
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'name' => 'required|string|max:255',
                'email' => 'required|email|unique:users,email',
                'password' => 'required|string|min:6|confirmed',
                'role' => 'required|in:admin,district_admin,committee,group_admin,school_admin,teacher',
                'school_id' => 'nullable|exists:schools,id',
                'school_group_id' => 'nullable|exists:school_groups,id',
                'is_active' => 'boolean',
            ]);

            if ($validator->fails()) {
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
            ]);

            return response()->json([
                'success' => true,
                'message' => 'เพิ่มผู้ใช้สำเร็จ',
                'data' => $user->load(['school', 'school_group'])
            ], 201);
        } catch (\Exception $e) {
            \Log::error('Error creating user: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'เกิดข้อผิดพลาดในการเพิ่มผู้ใช้',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update user
     */
    public function update(Request $request, int $id): JsonResponse
    {
        try {
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
            ]);

            if ($validator->fails()) {
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

            // Only update password if provided
            if ($request->filled('password')) {
                $user->password = Hash::make($request->password);
            }

            $user->save();

            return response()->json([
                'success' => true,
                'message' => 'แก้ไขผู้ใช้สำเร็จ',
                'data' => $user->load(['school', 'school_group'])
            ]);
        } catch (\Exception $e) {
            \Log::error('Error updating user: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'เกิดข้อผิดพลาดในการแก้ไขผู้ใช้',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete user
     */
    public function destroy(int $id): JsonResponse
    {
        try {
            $user = User::findOrFail($id);

            // Prevent deleting yourself
            if ($user->id === auth()->id()) {
                return response()->json([
                    'success' => false,
                    'message' => 'ไม่สามารถลบบัญชีของตัวเองได้'
                ], 403);
            }

            $user->delete();

            return response()->json([
                'success' => true,
                'message' => 'ลบผู้ใช้สำเร็จ'
            ]);
        } catch (\Exception $e) {
            \Log::error('Error deleting user: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'เกิดข้อผิดพลาดในการลบผู้ใช้',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Reset user password
     */
    public function resetPassword(Request $request, int $id): JsonResponse
    {
        try {
            $user = User::findOrFail($id);

            // Generate random password
            $newPassword = Str::random(10);

            $user->password = Hash::make($newPassword);
            $user->save();

            return response()->json([
                'success' => true,
                'message' => 'Reset รหัสผ่านสำเร็จ',
                'data' => [
                    'new_password' => $newPassword
                ]
            ]);
        } catch (\Exception $e) {
            \Log::error('Error resetting password: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'เกิดข้อผิดพลาดในการ Reset รหัสผ่าน',
                'error' => $e->getMessage()
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
            $validator = Validator::make($request->all(), [
                'user_ids' => 'required|array',
                'user_ids.*' => 'exists:users,id'
            ]);

            if ($validator->fails()) {
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

            return response()->json([
                'success' => true,
                'message' => 'Reset รหัสผ่านสำเร็จ',
                'data' => $results
            ]);
        } catch (\Exception $e) {
            \Log::error('Error bulk resetting passwords: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'เกิดข้อผิดพลาดในการ Reset รหัสผ่าน',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}