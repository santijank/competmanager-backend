<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SchoolGroup;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class RegistrationSettingsController extends Controller
{
    public function index(Request $request)
    {
        try {
            $user = auth()->user();
            
            if ($user->role !== 'group_admin') {
                return response()->json([
                    'success' => false,
                    'error' => 'Unauthorized',
                    'message' => 'เฉพาะผู้ดูแลกลุ่มเท่านั้นที่สามารถดูการตั้งค่าได้'
                ], 403);
            }
            
            $schoolGroup = SchoolGroup::find($user->school_group_id);
            
            if (!$schoolGroup) {
                return response()->json([
                    'success' => false,
                    'error' => 'Not found',
                    'message' => 'ไม่พบข้อมูลกลุ่มโรงเรียน'
                ], 404);
            }
            
            return response()->json([
                'success' => true,
                'data' => [
                    'id' => $schoolGroup->id,
                    'name' => $schoolGroup->name,
                    'registration_start_date' => $schoolGroup->registration_start_date,
                    'registration_end_date' => $schoolGroup->registration_end_date,
                    'registration_announcement' => $schoolGroup->registration_announcement,
                    'updated_at' => $schoolGroup->updated_at,
                ]
            ]);
            
        } catch (\Exception $e) {
            Log::error('Get registration settings error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'error' => 'Server error',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    public function update(Request $request)
    {
        try {
            $user = auth()->user();
            
            if ($user->role !== 'group_admin') {
                return response()->json([
                    'success' => false,
                    'error' => 'Unauthorized',
                    'message' => 'เฉพาะผู้ดูแลกลุ่มเท่านั้นที่สามารถแก้ไขการตั้งค่าได้'
                ], 403);
            }
            
            $validator = Validator::make($request->all(), [
                'registration_start_date' => 'required|date',
                'registration_end_date' => 'required|date|after:registration_start_date',
                'registration_announcement' => 'nullable|string|max:1000',
            ], [
                'registration_start_date.required' => 'กรุณาระบุวันเริ่มรับสมัคร',
                'registration_start_date.date' => 'รูปแบบวันที่ไม่ถูกต้อง',
                'registration_end_date.required' => 'กรุณาระบุวันปิดรับสมัคร',
                'registration_end_date.date' => 'รูปแบบวันที่ไม่ถูกต้อง',
                'registration_end_date.after' => 'วันปิดรับสมัครต้องหลังจากวันเริ่มรับสมัคร',
                'registration_announcement.max' => 'ประกาศยาวเกินไป (สูงสุด 1000 ตัวอักษร)',
            ]);
            
            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'errors' => $validator->errors(),
                    'message' => 'ข้อมูลไม่ถูกต้อง'
                ], 422);
            }
            
            $validated = $validator->validated();
            
            $schoolGroup = SchoolGroup::find($user->school_group_id);
            
            if (!$schoolGroup) {
                return response()->json([
                    'success' => false,
                    'error' => 'Not found',
                    'message' => 'ไม่พบข้อมูลกลุ่มโรงเรียน'
                ], 404);
            }
            
            $schoolGroup->update([
                'registration_start_date' => $validated['registration_start_date'],
                'registration_end_date' => $validated['registration_end_date'],
                'registration_announcement' => $validated['registration_announcement'] ?? null,
            ]);
            
            Log::info('Registration settings updated', [
                'school_group_id' => $schoolGroup->id,
                'user_id' => $user->id,
                'start_date' => $validated['registration_start_date'],
                'end_date' => $validated['registration_end_date'],
            ]);
            
            return response()->json([
                'success' => true,
                'message' => 'บันทึกการตั้งค่าสำเร็จ',
                'data' => [
                    'id' => $schoolGroup->id,
                    'name' => $schoolGroup->name,
                    'registration_start_date' => $schoolGroup->registration_start_date,
                    'registration_end_date' => $schoolGroup->registration_end_date,
                    'registration_announcement' => $schoolGroup->registration_announcement,
                    'updated_at' => $schoolGroup->updated_at,
                ]
            ]);
            
        } catch (\Exception $e) {
            Log::error('Update registration settings error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'error' => 'Server error',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    public function status(Request $request)
    {
        try {
            $user = auth()->user();
            
            // ✅ Get school_group_id based on user role
            $schoolGroupId = null;
            
            if ($user->role === 'group_admin' || $user->role === 'district_admin') {
                // Group admin และ district admin มี school_group_id โดยตรง
                $schoolGroupId = $user->school_group_id;
            } elseif ($user->school_id) {
                // School admin, teacher ต้องดึงจาก school
                $school = \App\Models\School::find($user->school_id);
                if ($school) {
                    $schoolGroupId = $school->school_group_id;
                }
            }
            
            if (!$schoolGroupId) {
                return response()->json([
                    'success' => true,
                    'data' => [
                        'status' => 'not_set',
                        'school_group' => null,
                        'registration_start_date' => null,
                        'registration_end_date' => null,
                        'registration_announcement' => null,
                    ]
                ]);
            }
            
            $schoolGroup = SchoolGroup::find($schoolGroupId);
            
            if (!$schoolGroup) {
                return response()->json([
                    'success' => true,
                    'data' => [
                        'status' => 'not_set',
                        'school_group' => null,
                        'registration_start_date' => null,
                        'registration_end_date' => null,
                        'registration_announcement' => null,
                    ]
                ]);
            }
            
            $now = now();
            $status = 'not_set';
            
            if ($schoolGroup->registration_start_date && $schoolGroup->registration_end_date) {
                $startDate = \Carbon\Carbon::parse($schoolGroup->registration_start_date);
                $endDate = \Carbon\Carbon::parse($schoolGroup->registration_end_date);
                
                if ($now->lt($startDate)) {
                    $status = 'upcoming';
                } elseif ($now->between($startDate, $endDate)) {
                    $status = 'open';
                } else {
                    $status = 'closed';
                }
            }
            
            return response()->json([
                'success' => true,
                'data' => [
                    'status' => $status,
                    'school_group' => [
                        'id' => $schoolGroup->id,
                        'name' => $schoolGroup->name,
                    ],
                    'registration_start_date' => $schoolGroup->registration_start_date,
                    'registration_end_date' => $schoolGroup->registration_end_date,
                    'registration_announcement' => $schoolGroup->registration_announcement,
                ]
            ]);
            
        } catch (\Exception $e) {
            Log::error('Get registration status error: ' . $e->getMessage(), [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'success' => false,
                'error' => 'Server error',
                'message' => $e->getMessage()
            ], 500);
        }
    }
}
