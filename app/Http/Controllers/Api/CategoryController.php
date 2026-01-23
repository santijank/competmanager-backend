<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;

class CategoryController extends Controller
{
    /**
     * Get all categories
     */
    public function index(): JsonResponse
    {
        $categories = Category::orderBy('name')->get();

        return response()->json([
            'success' => true,
            'data' => $categories
        ]);
    }

    /**
     * Get single category
     */
    public function show(int $id): JsonResponse
    {
        $category = Category::findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $category
        ]);
    }

    /**
     * ⭐ Get competition templates for a category
     * ดึงรายการกิจกรรม/แข่งขันมาตรฐานตามหมวดหมู่
     */
    public function getTemplates(int $id): JsonResponse
    {
        $category = Category::findOrFail($id);

        // Templates สำหรับแต่ละหมวด
        $templates = $this->getCategoryTemplates($category->code);

        return response()->json([
            'success' => true,
            'data' => [
                'category' => $category,
                'templates' => $templates,
            ]
        ]);
    }

    /**
     * Create category
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'code' => 'required|string|unique:categories,code',
            'description' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }

        $category = Category::create($request->all());

        return response()->json([
            'success' => true,
            'message' => 'สร้างหมวดหมู่สำเร็จ',
            'data' => $category
        ], 201);
    }

    /**
     * Update category
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $category = Category::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|string|max:255',
            'code' => 'sometimes|string|unique:categories,code,' . $id,
            'description' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }

        $category->update($request->all());

        return response()->json([
            'success' => true,
            'message' => 'แก้ไขหมวดหมู่สำเร็จ',
            'data' => $category
        ]);
    }

    /**
     * Delete category
     */
    public function destroy(int $id): JsonResponse
    {
        $category = Category::findOrFail($id);
        $category->delete();

        return response()->json([
            'success' => true,
            'message' => 'ลบหมวดหมู่สำเร็จ'
        ]);
    }

    /**
     * ⭐ Get templates based on category code
     */
    private function getCategoryTemplates(string $categoryCode): array
    {
        // Templates for each category
        $templates = [
            'THAI' => [ // ภาษาไทย
                ['name' => 'การแข่งขันการอ่าน', 'code' => 'THAI-READ', 'level' => 'ป.1-3'],
                ['name' => 'การแข่งขันการอ่าน', 'code' => 'THAI-READ-46', 'level' => 'ป.4-6'],
                ['name' => 'การแข่งขันการเขียนเรียงความ', 'code' => 'THAI-WRITE', 'level' => 'ป.1-3'],
                ['name' => 'การแข่งขันการเขียนเรียงความ', 'code' => 'THAI-WRITE-46', 'level' => 'ป.4-6'],
                ['name' => 'การแข่งขันคัดลายมือ', 'code' => 'THAI-HAND', 'level' => 'ป.1-3'],
            ],
            'MATH' => [ // คณิตศาสตร์
                ['name' => 'การแข่งขันคิดเลขเร็ว', 'code' => 'MATH-FAST', 'level' => 'ป.1-3'],
                ['name' => 'การแข่งขันคิดเลขเร็ว', 'code' => 'MATH-FAST-46', 'level' => 'ป.4-6'],
                ['name' => 'การแข่งขันซูโดกุ', 'code' => 'MATH-SUDOKU', 'level' => 'ป.4-6'],
                ['name' => 'การประกวดโครงงานคณิตศาสตร์', 'code' => 'MATH-PROJECT', 'level' => 'ป.4-6'],
            ],
            'SCI' => [ // วิทยาศาสตร์
                ['name' => 'การประกวดโครงงานวิทยาศาสตร์', 'code' => 'SCI-PROJECT', 'level' => 'ป.4-6'],
                ['name' => 'การแข่งขันเครื่องร่อนกระดาษ', 'code' => 'SCI-GLIDER', 'level' => 'ป.1-3'],
                ['name' => 'การแข่งขันเครื่องบินพลังยาง', 'code' => 'SCI-PLANE', 'level' => 'ป.4-6'],
            ],
            'ART' => [ // ศิลปะ-ดนตรี
                ['name' => 'การแข่งขันวาดภาพระบายสี', 'code' => 'ART-PAINT', 'level' => 'ป.1-3'],
                ['name' => 'การแข่งขันวาดภาพระบายสี', 'code' => 'ART-PAINT-46', 'level' => 'ป.4-6'],
                ['name' => 'การแข่งขันวาดภาพลายเส้น', 'code' => 'ART-LINE', 'level' => 'ป.1-3'],
                ['name' => 'การแข่งขันปั้นดินน้ำมัน', 'code' => 'ART-CLAY', 'level' => 'ป.1-3'],
                ['name' => 'การแข่งขันขับร้องเพลงไทยลูกทุ่ง', 'code' => 'MUS-THAI', 'level' => 'ป.1-3'],
                ['name' => 'การแข่งขันขับร้องเพลงสากล', 'code' => 'MUS-POP', 'level' => 'ป.1-3'],
            ],
            'ROBOT' => [ // หุ่นยนต์
                ['name' => 'การแข่งขันหุ่นยนต์บังคับมือ', 'code' => 'ROBOT-MANUAL', 'level' => 'ป.4-6'],
                ['name' => 'การแข่งขันหุ่นยนต์ระบบอัตโนมัติ', 'code' => 'ROBOT-AUTO', 'level' => 'ป.4-6'],
            ],
            'COMP' => [ // คอมพิวเตอร์
                ['name' => 'การแข่งขันการพิมพ์ดีด', 'code' => 'COMP-TYPE', 'level' => 'ป.4-6'],
                ['name' => 'การแข่งขันการสร้างเกมคอมพิวเตอร์', 'code' => 'COMP-GAME', 'level' => 'ป.4-6'],
                ['name' => 'การแข่งขันการออกแบบสิ่งของเครื่องใช้ด้วยโปรแกรมคอมพิวเตอร์', 'code' => 'COMP-DESIGN', 'level' => 'ป.4-6'],
            ],
            'LANG' => [ // ภาษาต่างประเทศ
                ['name' => 'การแข่งขันการพูดภาษาอังกฤษ (Impromptu Speech)', 'code' => 'LANG-SPEECH', 'level' => 'ป.4-6'],
                ['name' => 'การแข่งขันการเล่านิทาน (Story Telling)', 'code' => 'LANG-STORY', 'level' => 'ป.1-3'],
                ['name' => 'การแข่งขันละครสั้นภาษาอังกฤษ (Skit)', 'code' => 'LANG-SKIT', 'level' => 'ป.4-6'],
            ],
            'CAREER' => [ // การงานอาชีพ
                ['name' => 'การแข่งขันประดิษฐ์ของใช้จากเศษวัสดุ', 'code' => 'CAREER-RECYCLE', 'level' => 'ป.1-3'],
                ['name' => 'การแข่งขันการจัดสวนถาดแบบชื้น', 'code' => 'CAREER-GARDEN', 'level' => 'ป.4-6'],
                ['name' => 'การแข่งขันทำอาหาร', 'code' => 'CAREER-COOK', 'level' => 'ป.4-6'],
            ],
            'SOCIAL' => [ // สังคมศึกษา ศาสนา และวัฒนธรรม
                ['name' => 'การประกวดมารยาทไทย', 'code' => 'SOCIAL-MANNER', 'level' => 'ป.1-3'],
                ['name' => 'การประกวดมารยาทไทย', 'code' => 'SOCIAL-MANNER-46', 'level' => 'ป.4-6'],
                ['name' => 'การประกวดสวดมนต์แปล', 'code' => 'SOCIAL-CHANT', 'level' => 'ป.4-6'],
            ],
            'HEALTH' => [ // สุขศึกษาและพลศึกษา
                ['name' => 'การแข่งขันวิ่ง 100 เมตร', 'code' => 'HEALTH-RUN100', 'level' => 'ป.1-3'],
                ['name' => 'การแข่งขันวิ่ง 100 เมตร', 'code' => 'HEALTH-RUN100-46', 'level' => 'ป.4-6'],
                ['name' => 'การแข่งขันกระโดดไกล', 'code' => 'HEALTH-JUMP', 'level' => 'ป.1-3'],
                ['name' => 'การแข่งขันฟุตบอล', 'code' => 'HEALTH-SOCCER', 'level' => 'ป.4-6'],
            ],
        ];

        // Return template for the category
        return $templates[$categoryCode] ?? [];
    }
}
