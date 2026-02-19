<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SystemSetting;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class SystemSettingController extends Controller
{
    /**
     * ดึงการตั้งค่าช่วงเวลาเปิดแก้ไขรายชื่อ
     */
    public function getEditNameSettings(Request $request): JsonResponse
    {
        $user = $request->user();

        $startDate = SystemSetting::getValue('edit_name_start_date');
        $endDate = SystemSetting::getValue('edit_name_end_date');
        $isAllowed = SystemSetting::isEditNameAllowed();

        return response()->json([
            'success' => true,
            'data' => [
                'edit_name_start_date' => $startDate,
                'edit_name_end_date' => $endDate,
                'is_edit_allowed' => $isAllowed,
            ]
        ]);
    }

    /**
     * อัปเดตการตั้งค่าช่วงเวลาเปิดแก้ไขรายชื่อ
     * เฉพาะ admin/district_admin
     */
    public function updateEditNameSettings(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!in_array($user->role, ['admin', 'district_admin'])) {
            return response()->json([
                'success' => false,
                'message' => 'คุณไม่มีสิทธิ์แก้ไขการตั้งค่านี้'
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'edit_name_start_date' => 'required|date',
            'edit_name_end_date' => 'required|date|after:edit_name_start_date',
        ], [
            'edit_name_start_date.required' => 'กรุณาระบุวันเริ่มต้น',
            'edit_name_end_date.required' => 'กรุณาระบุวันสิ้นสุด',
            'edit_name_end_date.after' => 'วันสิ้นสุดต้องหลังวันเริ่มต้น',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'ข้อมูลไม่ถูกต้อง',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            SystemSetting::setValue('edit_name_start_date', $request->edit_name_start_date);
            SystemSetting::setValue('edit_name_end_date', $request->edit_name_end_date);

            Log::info('Edit name settings updated', [
                'updated_by' => $user->id,
                'start' => $request->edit_name_start_date,
                'end' => $request->edit_name_end_date,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'บันทึกการตั้งค่าช่วงเวลาแก้ไขรายชื่อสำเร็จ',
                'data' => [
                    'edit_name_start_date' => $request->edit_name_start_date,
                    'edit_name_end_date' => $request->edit_name_end_date,
                    'is_edit_allowed' => SystemSetting::isEditNameAllowed(),
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Update edit name settings error', ['error' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'message' => 'เกิดข้อผิดพลาดในการบันทึก'
            ], 500);
        }
    }
}
