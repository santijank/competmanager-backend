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
    /**
     * ดึงสถานะเปิด/ปิดเมนูเปลี่ยนตัว
     */
    public function getParticipantChange(Request $request): JsonResponse
    {
        $enabled = SystemSetting::getValue('enable_participant_change', 'false');

        return response()->json([
            'success' => true,
            'data' => [
                'enable_participant_change' => $enabled === 'true',
            ]
        ]);
    }

    /**
     * เปิด/ปิดเมนูเปลี่ยนตัว (admin/district_admin เท่านั้น)
     */
    public function updateParticipantChange(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!in_array($user->role, ['admin', 'district_admin'])) {
            return response()->json([
                'success' => false,
                'message' => 'คุณไม่มีสิทธิ์แก้ไขการตั้งค่านี้'
            ], 403);
        }

        $enabled = $request->boolean('enable_participant_change');
        SystemSetting::setValue('enable_participant_change', $enabled ? 'true' : 'false');

        Log::info('Participant change setting updated', [
            'updated_by' => $user->id,
            'enabled' => $enabled,
        ]);

        return response()->json([
            'success' => true,
            'message' => $enabled ? 'เปิดเมนูเปลี่ยนตัวแล้ว' : 'ปิดเมนูเปลี่ยนตัวแล้ว',
            'data' => [
                'enable_participant_change' => $enabled,
            ]
        ]);
    }

    /**
     * สร้าง prefix key ตาม level + group_id
     * district → cert_district_
     * group 5 → cert_group_5_
     */
    private function certPrefix(Request $request): string
    {
        $level = $request->input('level', 'district');
        if ($level === 'group' && $request->filled('group_id')) {
            return 'cert_group_' . $request->input('group_id') . '_';
        }
        return 'cert_district_';
    }

    /**
     * ดึงการตั้งค่าเกียรติบัตร (พื้นหลัง + ผู้ลงนาม)
     * ?level=district หรือ ?level=group&group_id=5
     */
    public function getCertificateSettings(Request $request): JsonResponse
    {
        $prefix = $this->certPrefix($request);

        $backgroundValue = SystemSetting::getValue("{$prefix}background_image");
        // ถ้าเป็น URL (ไม่ใช่ base64) ส่ง URL กลับให้ frontend แสดง preview ได้
        $backgroundUrl = null;
        if ($backgroundValue && !str_starts_with($backgroundValue, 'data:')) {
            $backgroundUrl = $backgroundValue;
        }

        $signers = [];
        for ($i = 1; $i <= 2; $i++) {
            $sigValue = SystemSetting::getValue("{$prefix}signer_signature_{$i}");
            $sigUrl = null;
            if ($sigValue && !str_starts_with($sigValue, 'data:')) {
                $sigUrl = $sigValue;
            }
            $signers[] = [
                'name' => SystemSetting::getValue("{$prefix}signer_name_{$i}", ''),
                'position' => SystemSetting::getValue("{$prefix}signer_position_{$i}", ''),
                'has_signature' => !empty($sigValue),
                'signature_url' => $sigUrl,
            ];
        }

        return response()->json([
            'success' => true,
            'data' => [
                'has_background' => !empty($backgroundValue),
                'background_url' => $backgroundUrl,
                'signers' => $signers,
            ]
        ]);
    }

    /**
     * อัปเดตการตั้งค่าเกียรติบัตร (admin/district_admin)
     * POST level=district หรือ level=group&group_id=5
     */
    public function updateCertificateSettings(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!in_array($user->role, ['admin', 'district_admin'])) {
            return response()->json([
                'success' => false,
                'message' => 'คุณไม่มีสิทธิ์แก้ไขการตั้งค่านี้'
            ], 403);
        }

        try {
            $prefix = $this->certPrefix($request);

            // ภาพพื้นหลัง — รับ URL จาก Firebase Storage (หรือ file upload สำหรับ backward compat)
            if ($request->filled('background_image_url')) {
                $url = $request->input('background_image_url');
                if ($this->isValidStorageUrl($url)) {
                    SystemSetting::setValue("{$prefix}background_image", $url);
                    Log::info('Certificate background saved', ['url' => substr($url, 0, 100)]);
                } else {
                    Log::warning('Certificate background URL rejected', ['url' => substr($url, 0, 200)]);
                    return response()->json([
                        'success' => false,
                        'message' => 'URL ไม่ถูกต้อง กรุณาอัปโหลดผ่าน Firebase Storage เท่านั้น'
                    ], 422);
                }
            } elseif ($request->hasFile('background_image')) {
                // Backward compatibility: ยังรับ file upload ได้
                $file = $request->file('background_image');
                $base64 = 'data:' . $file->getMimeType() . ';base64,' . base64_encode(file_get_contents($file->getRealPath()));
                SystemSetting::setValue("{$prefix}background_image", $base64);
            }
            if ($request->boolean('remove_background')) {
                SystemSetting::setValue("{$prefix}background_image", null);
            }

            // ผู้ลงนาม 1-2
            for ($i = 1; $i <= 2; $i++) {
                if ($request->has("signer_name_{$i}")) {
                    SystemSetting::setValue("{$prefix}signer_name_{$i}", $request->input("signer_name_{$i}"));
                }
                if ($request->has("signer_position_{$i}")) {
                    SystemSetting::setValue("{$prefix}signer_position_{$i}", $request->input("signer_position_{$i}"));
                }
                // ลายเซ็น — รับ URL จาก Firebase Storage (หรือ file upload)
                if ($request->filled("signer_signature_url_{$i}")) {
                    $url = $request->input("signer_signature_url_{$i}");
                    if ($this->isValidStorageUrl($url)) {
                        SystemSetting::setValue("{$prefix}signer_signature_{$i}", $url);
                    }
                } elseif ($request->hasFile("signer_signature_{$i}")) {
                    $file = $request->file("signer_signature_{$i}");
                    $base64 = 'data:' . $file->getMimeType() . ';base64,' . base64_encode(file_get_contents($file->getRealPath()));
                    SystemSetting::setValue("{$prefix}signer_signature_{$i}", $base64);
                }
                if ($request->boolean("remove_signature_{$i}")) {
                    SystemSetting::setValue("{$prefix}signer_signature_{$i}", null);
                }
            }

            Log::info('Certificate settings updated', [
                'updated_by' => $user->id,
                'prefix' => $prefix,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'บันทึกการตั้งค่าเกียรติบัตรสำเร็จ',
            ]);
        } catch (\Exception $e) {
            Log::error('Update certificate settings error', ['error' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'message' => 'เกิดข้อผิดพลาดในการบันทึก'
            ], 500);
        }
    }

    /**
     * ตรวจสอบว่า URL เป็น Firebase Storage หรือ cloud storage ที่อนุญาต
     */
    private function isValidStorageUrl(string $url): bool
    {
        $parsed = parse_url($url);
        $host = $parsed['host'] ?? '';

        $allowedHosts = [
            'firebasestorage.googleapis.com',
            'storage.googleapis.com',
            'firebasestorage.app',
        ];

        foreach ($allowedHosts as $allowed) {
            if (str_contains($host, $allowed)) {
                return true;
            }
        }

        Log::debug('Storage URL validation failed', ['host' => $host, 'url' => substr($url, 0, 150)]);
        return false;
    }

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
