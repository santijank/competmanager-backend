<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Competition;
use App\Models\Category;
use App\Models\SchoolGroup;
use Carbon\Carbon;

class TestCompetitionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        echo "🌱 เริ่มสร้างข้อมูลทดสอบ...\n\n";

        // ตรวจสอบว่ามี categories และ school_groups หรือยัง
        $categoriesCount = Category::count();
        $schoolGroupsCount = SchoolGroup::count();

        echo "Categories: {$categoriesCount}\n";
        echo "School Groups: {$schoolGroupsCount}\n\n";

        if ($categoriesCount == 0) {
            echo "⚠️  ไม่มี Categories! กำลังสร้าง...\n";
            $this->createCategories();
        }

        if ($schoolGroupsCount == 0) {
            echo "⚠️  ไม่มี School Groups! กำลังสร้าง...\n";
            $this->createSchoolGroups();
        }

        // สร้าง competitions
        echo "\n📦 กำลังสร้าง Competitions...\n";
        $this->createCompetitions();

        echo "\n✅ สร้างข้อมูลทดสอบเสร็จสิ้น!\n";
    }

    private function createCategories()
    {
        $categories = [
            ['name' => 'ภาษาไทย', 'code' => 'TH'],
            ['name' => 'คณิตศาสตร์', 'code' => 'MA'],
            ['name' => 'วิทยาศาสตร์', 'code' => 'SC'],
            ['name' => 'ภาษาอังกฤษ', 'code' => 'EN'],
            ['name' => 'ศิลปะ-ดนตรี', 'code' => 'AR'],
        ];

        foreach ($categories as $category) {
            Category::create($category);
        }

        echo "✅ สร้าง " . count($categories) . " Categories\n";
    }

    private function createSchoolGroups()
    {
        $groups = [
            ['name' => 'กลุ่มโรงเรียนที่ 1', 'code' => 'G1'],
            ['name' => 'กลุ่มโรงเรียนที่ 2', 'code' => 'G2'],
            ['name' => 'กลุ่มโรงเรียนที่ 3', 'code' => 'G3'],
            ['name' => 'กลุ่มโรงเรียนที่ 4', 'code' => 'G4'],
            ['name' => 'กลุ่มโรงเรียนที่ 5', 'code' => 'G5'],
        ];

        foreach ($groups as $group) {
            SchoolGroup::create($group);
        }

        echo "✅ สร้าง " . count($groups) . " School Groups\n";
    }

    private function createCompetitions()
    {
        $categories = Category::all();
        $schoolGroups = SchoolGroup::all();

        if ($categories->isEmpty() || $schoolGroups->isEmpty()) {
            echo "❌ ไม่สามารถสร้าง Competitions ได้ เพราะไม่มี Categories หรือ School Groups\n";
            return;
        }

        $competitions = [
            'การแข่งขันการอ่าน',
            'การแข่งขันการเขียน',
            'การแข่งขันการพูด',
            'การแข่งขันคิดเลขเร็ว',
            'การแข่งขันแก้โจทย์ปัญหา',
        ];

        $count = 0;

        foreach ($schoolGroups as $group) {
            foreach ($categories->take(3) as $category) {
                foreach ($competitions as $index => $compName) {
                    $code = sprintf('%s-%s-%03d', 
                        $category->code, 
                        $group->code, 
                        $index + 1
                    );

                    Competition::create([
                        'name' => $compName . ' (' . $category->name . ')',
                        'code' => $code,
                        'description' => 'รายการแข่งขัน' . $compName,
                        'category_id' => $category->id,
                        'school_group_id' => $group->id,
                        'level' => 'group', // ⭐ สำคัญ!
                        'max_students' => 2,
                        'max_teachers' => 1,
                        'status' => 'draft',
                        'is_active' => true,
                        'registration_status' => 'upcoming',
                        'registration_start_date' => Carbon::now()->addDays(1),
                        'registration_end_date' => Carbon::now()->addDays(7),
                        'competition_date' => null,
                        'competition_start_time' => null,
                        'competition_end_time' => null,
                        'venue' => null,
                        'participants_count' => 0,
                    ]);

                    $count++;
                }
            }
        }

        echo "✅ สร้าง {$count} Competitions สำเร็จ!\n";
        echo "   - School Groups: " . $schoolGroups->count() . "\n";
        echo "   - Categories per Group: 3\n";
        echo "   - Competitions per Category: " . count($competitions) . "\n";
    }
}
