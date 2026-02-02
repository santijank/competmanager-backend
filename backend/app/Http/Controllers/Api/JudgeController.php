<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Competition;
use App\Models\CompetitionJudge;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

/**
 * JudgeController
 * 
 * จัดการกรรมการตัดสินในแต่ละการแข่งขัน
 * - เฉพาะ Group Admin เท่านั้นที่สามารถจัดการได้
 * - ต้องมีทีมลงทะเบียนก่อนถึงจะเพิ่มกรรมการได้
 */
class JudgeController extends Controller
{
    /**
     * GET /api/competitions/{id}/judges
     * ดูรายชื่อกรรมการทั้งหมด
     */
    public function index($competitionId)
    {
        try {
            $competition = Competition::findOrFail($competitionId);
            $user = Auth::user();
            
            // เช็ค permission: ต้องเป็น Group Admin
            if ($user->role !== 'group_admin') {
                return response()->json([
                    'success' => false,
                    'message' => 'คุณไม่มีสิทธิ์เข้าถึงหน้านี้'
                ], 403);
            }
            
            // เช็คว่า Group Admin คนนี้ดูแลกลุ่มนี้หรือไม่
            if ($user->group_id !== $competition->group_id) {
                return response()->json([
                    'success' => false,
                    'message' => 'คุณไม่มีสิทธิ์จัดการการแข่งขันนี้'
                ], 403);
            }
            
            // ✅ เช็คว่ามีทีมลงทะเบียนหรือไม่
            $registrationsCount = $competition->registrations()
                ->where('status', 'approved')
                ->count();
            
            // ❌ ถ้าไม่มีผู้สมัคร ไม่ให้ดูกรรมการ
            if ($registrationsCount === 0) {
                return response()->json([
                    'success' => false,
                    'message' => 'ยังไม่มีทีมลงทะเบียน ไม่สามารถเพิ่มกรรมการได้',
                    'has_registrations' => false,
                    'registrations_count' => 0,
                    'judges' => []
                ]);
            }
            
            // ✅ มีผู้สมัครแล้ว แสดงกรรมการ
            $judges = $competition->judges()
                ->with('creator:id,name')
                ->orderBy('created_at')
                ->get();
            
            return response()->json([
                'success' => true,
                'has_registrations' => true,
                'registrations_count' => $registrationsCount,
                'judges' => $judges,
                'min_judges' => $competition->min_judges,
                'max_judges' => $competition->max_judges,
                'current_count' => $judges->count()
            ]);
            
        } catch (\Exception $e) {
            Log::error('Error fetching judges: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'เกิดข้อผิดพลาดในการดึงข้อมูลกรรมการ'
            ], 500);
        }
    }
    
    /**
     * POST /api/competitions/{id}/judges
     * เพิ่มกรรมการใหม่
     */
    public function store(Request $request, $competitionId)
    {
        try {
            $competition = Competition::findOrFail($competitionId);
            $user = Auth::user();
            
            // เช็ค permission
            if ($user->role !== 'group_admin') {
                return response()->json([
                    'success' => false,
                    'message' => 'คุณไม่มีสิทธิ์ทำรายการนี้'
                ], 403);
            }
            
            if ($user->group_id !== $competition->group_id) {
                return response()->json([
                    'success' => false,
                    'message' => 'คุณไม่มีสิทธิ์จัดการการแข่งขันนี้'
                ], 403);
            }
            
            // ✅ เช็คว่ามีทีมลงทะเบียนหรือไม่
            $registrationsCount = $competition->registrations()
                ->where('status', 'approved')
                ->count();
            
            if ($registrationsCount === 0) {
                return response()->json([
                    'success' => false,
                    'message' => 'ยังไม่มีทีมลงทะเบียน ไม่สามารถเพิ่มกรรมการได้'
                ], 400);
            }
            
            // ✅ เช็คจำนวนกรรมการไม่เกิน max_judges
            $currentCount = $competition->judges()->count();
            if ($currentCount >= $competition->max_judges) {
                return response()->json([
                    'success' => false,
                    'message' => "เพิ่มกรรมการไม่ได้ ครบจำนวน {$competition->max_judges} คนแล้ว"
                ], 400);
            }
            
            // Validation
            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'school_name' => 'nullable|string|max:255'
            ], [
                'name.required' => 'กรุณากรอกชื่อ-นามสกุลกรรมการ',
                'name.max' => 'ชื่อ-นามสกุลต้องไม่เกิน 255 ตัวอักษร',
                'school_name.max' => 'ชื่อโรงเรียน/หน่วยงานต้องไม่เกิน 255 ตัวอักษร'
            ]);
            
            // สร้างกรรมการ
            $judge = $competition->judges()->create([
                'name' => $validated['name'],
                'school_name' => $validated['school_name'] ?? null,
                'created_by' => $user->id
            ]);
            
            // โหลด relationship
            $judge->load('creator:id,name');
            
            Log::info("Judge added: {$judge->name} for competition {$competition->name} by user {$user->id}");
            
            return response()->json([
                'success' => true,
                'message' => 'เพิ่มกรรมการสำเร็จ',
                'judge' => $judge
            ], 201);
            
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'ข้อมูลไม่ถูกต้อง',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            Log::error('Error adding judge: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'เกิดข้อผิดพลาดในการเพิ่มกรรมการ'
            ], 500);
        }
    }
    
    /**
     * PUT /api/competitions/{id}/judges/{judgeId}
     * แก้ไขข้อมูลกรรมการ
     */
    public function update(Request $request, $competitionId, $judgeId)
    {
        try {
            $competition = Competition::findOrFail($competitionId);
            $judge = CompetitionJudge::findOrFail($judgeId);
            $user = Auth::user();
            
            // เช็ค permission
            if ($user->role !== 'group_admin') {
                return response()->json([
                    'success' => false,
                    'message' => 'คุณไม่มีสิทธิ์ทำรายการนี้'
                ], 403);
            }
            
            if ($user->group_id !== $competition->group_id) {
                return response()->json([
                    'success' => false,
                    'message' => 'คุณไม่มีสิทธิ์จัดการการแข่งขันนี้'
                ], 403);
            }
            
            // เช็คว่ากรรมการนี้เป็นของการแข่งขันนี้จริง
            if ($judge->competition_id !== $competition->id) {
                return response()->json([
                    'success' => false,
                    'message' => 'ไม่พบกรรมการในการแข่งขันนี้'
                ], 404);
            }
            
            // Validation
            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'school_name' => 'nullable|string|max:255'
            ], [
                'name.required' => 'กรุณากรอกชื่อ-นามสกุลกรรมการ',
                'name.max' => 'ชื่อ-นามสกุลต้องไม่เกิน 255 ตัวอักษร',
                'school_name.max' => 'ชื่อโรงเรียน/หน่วยงานต้องไม่เกิน 255 ตัวอักษร'
            ]);
            
            // อัปเดตข้อมูล
            $judge->update([
                'name' => $validated['name'],
                'school_name' => $validated['school_name'] ?? null
            ]);
            
            $judge->load('creator:id,name');
            
            Log::info("Judge updated: {$judge->name} by user {$user->id}");
            
            return response()->json([
                'success' => true,
                'message' => 'แก้ไขข้อมูลกรรมการสำเร็จ',
                'judge' => $judge
            ]);
            
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'ข้อมูลไม่ถูกต้อง',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            Log::error('Error updating judge: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'เกิดข้อผิดพลาดในการแก้ไขข้อมูลกรรมการ'
            ], 500);
        }
    }
    
    /**
     * DELETE /api/competitions/{id}/judges/{judgeId}
     * ลบกรรมการ
     */
    public function destroy($competitionId, $judgeId)
    {
        try {
            $competition = Competition::findOrFail($competitionId);
            $judge = CompetitionJudge::findOrFail($judgeId);
            $user = Auth::user();
            
            // เช็ค permission
            if ($user->role !== 'group_admin') {
                return response()->json([
                    'success' => false,
                    'message' => 'คุณไม่มีสิทธิ์ทำรายการนี้'
                ], 403);
            }
            
            if ($user->group_id !== $competition->group_id) {
                return response()->json([
                    'success' => false,
                    'message' => 'คุณไม่มีสิทธิ์จัดการการแข่งขันนี้'
                ], 403);
            }
            
            // เช็คว่ากรรมการนี้เป็นของการแข่งขันนี้จริง
            if ($judge->competition_id !== $competition->id) {
                return response()->json([
                    'success' => false,
                    'message' => 'ไม่พบกรรมการในการแข่งขันนี้'
                ], 404);
            }
            
            $judgeName = $judge->name;
            $judge->delete();
            
            Log::info("Judge deleted: {$judgeName} from competition {$competition->name} by user {$user->id}");
            
            return response()->json([
                'success' => true,
                'message' => 'ลบกรรมการสำเร็จ'
            ]);
            
        } catch (\Exception $e) {
            Log::error('Error deleting judge: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'เกิดข้อผิดพลาดในการลบกรรมการ'
            ], 500);
        }
    }
}
