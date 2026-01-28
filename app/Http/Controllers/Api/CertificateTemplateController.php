<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CertificateTemplate;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class CertificateTemplateController extends Controller
{
    /**
     * Get all templates
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $query = CertificateTemplate::query();

            if ($request->has('active_only') && $request->active_only) {
                $query->where('is_active', true);
            }

            $templates = $query->orderBy('created_at', 'desc')->get();

            return response()->json([
                'success' => true,
                'data' => $templates
            ]);
        } catch (\Exception $e) {
            Log::error('Template index error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'ไม่สามารถโหลดเทมเพลตได้'
            ], 500);
        }
    }

    /**
     * Get single template
     */
    public function show(int $id): JsonResponse
    {
        try {
            $template = CertificateTemplate::findOrFail($id);

            return response()->json([
                'success' => true,
                'data' => $template
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'ไม่พบเทมเพลต'
            ], 404);
        }
    }

    /**
     * Create new template
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'layout' => 'nullable|array',
            'settings' => 'nullable|array',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            // Generate unique code
            $code = Str::slug($request->name) . '-' . time();

            $template = CertificateTemplate::create([
                'name' => $request->name,
                'code' => $code,
                'description' => $request->description,
                'layout' => $request->layout ?? [],
                'settings' => $request->settings ?? [
                    'width' => 842,
                    'height' => 595,
                    'orientation' => 'landscape',
                    'font_family' => 'THSarabunNew',
                ],
                'is_active' => true,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'สร้างเทมเพลตสำเร็จ',
                'data' => $template
            ], 201);

        } catch (\Exception $e) {
            Log::error('Template store error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'ไม่สามารถสร้างเทมเพลตได้',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update template
     */
    public function update(int $id, Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'layout' => 'nullable|array',
            'settings' => 'nullable|array',
            'is_active' => 'sometimes|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $template = CertificateTemplate::findOrFail($id);
            $template->update($request->all());

            return response()->json([
                'success' => true,
                'message' => 'แก้ไขเทมเพลตสำเร็จ',
                'data' => $template->fresh()
            ]);

        } catch (\Exception $e) {
            Log::error('Template update error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'ไม่สามารถแก้ไขเทมเพลตได้',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete template
     */
    public function destroy(int $id): JsonResponse
    {
        try {
            $template = CertificateTemplate::findOrFail($id);

            // Check if template is default
            if ($template->code === 'default') {
                return response()->json([
                    'success' => false,
                    'message' => 'ไม่สามารถลบเทมเพลตเริ่มต้นได้'
                ], 400);
            }

            // Delete background image if exists
            if ($template->background_image) {
                Storage::delete($template->background_image);
            }

            $template->delete();

            return response()->json([
                'success' => true,
                'message' => 'ลบเทมเพลตสำเร็จ'
            ]);

        } catch (\Exception $e) {
            Log::error('Template delete error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'ไม่สามารถลบเทมเพลตได้',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Upload background image
     */
    public function uploadBackground(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'template_id' => 'required|exists:certificate_templates,id',
            'background' => 'required|image|mimes:jpeg,png,jpg|max:5120', // 5MB max
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $template = CertificateTemplate::findOrFail($request->template_id);

            // Delete old background if exists
            if ($template->background_image) {
                Storage::delete($template->background_image);
            }

            // Store new background
            $file = $request->file('background');
            $fileName = 'cert_bg_' . time() . '.' . $file->getClientOriginalExtension();
            $filePath = $file->storeAs('public/certificates/backgrounds', $fileName);

            // Update template
            $template->update([
                'background_image' => str_replace('public/', '', $filePath)
            ]);

            return response()->json([
                'success' => true,
                'message' => 'อัพโหลดรูปพื้นหลังสำเร็จ',
                'data' => [
                    'template' => $template->fresh(),
                    'background_url' => $template->fresh()->background_url
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Upload background error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'ไม่สามารถอัพโหลดรูปพื้นหลังได้',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
