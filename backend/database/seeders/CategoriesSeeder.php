<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class CategoriesSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $now = Carbon::now();

        $categories = [
            ['id' => 1, 'name' => '1. ภาษาไทย', 'code' => 'THAI', 'description' => '', 'order' => 1, 'is_active' => 1, 'created_at' => $now, 'updated_at' => $now],
            ['id' => 2, 'name' => '2. คณิตศาสตร์', 'code' => 'MATH', 'description' => '', 'order' => 2, 'is_active' => 1, 'created_at' => $now, 'updated_at' => $now],
            ['id' => 3, 'name' => '3. วิทยาศาสตร์และเทคโนโลยี (วิทยาศาสตร์)', 'code' => 'SCI', 'description' => '', 'order' => 3, 'is_active' => 1, 'created_at' => $now, 'updated_at' => $now],
            ['id' => 4, 'name' => '4. กิจกรรมการแข่งขันนักบินน้อย สพฐ.', 'code' => 'PILOT', 'description' => '', 'order' => 4, 'is_active' => 1, 'created_at' => $now, 'updated_at' => $now],
            ['id' => 5, 'name' => '5. วิทยาศาสตร์และเทคโนโลยี (กิจกรรมคอมพิวเตอร์)', 'code' => 'COMP', 'description' => '', 'order' => 5, 'is_active' => 1, 'created_at' => $now, 'updated_at' => $now],
            ['id' => 6, 'name' => '6. กิจกรรมการแข่งขันหุ่นยนต์ สพฐ.', 'code' => 'ROBOT', 'description' => '', 'order' => 6, 'is_active' => 1, 'created_at' => $now, 'updated_at' => $now],
            ['id' => 7, 'name' => '7. ภาษาต่างประเทศ', 'code' => 'LANG', 'description' => '', 'order' => 7, 'is_active' => 1, 'created_at' => $now, 'updated_at' => $now],
            ['id' => 8, 'name' => '8. การงานอาชีพ', 'code' => 'CAREER', 'description' => '', 'order' => 8, 'is_active' => 1, 'created_at' => $now, 'updated_at' => $now],
            ['id' => 9, 'name' => '9. สังคมศึกษา ศาสนา และวัฒนธรรม', 'code' => 'SOCIAL', 'description' => '', 'order' => 9, 'is_active' => 1, 'created_at' => $now, 'updated_at' => $now],
            ['id' => 10, 'name' => '10. สุขศึกษาและพลศึกษา', 'code' => 'HEALTH', 'description' => '', 'order' => 10, 'is_active' => 1, 'created_at' => $now, 'updated_at' => $now],
            ['id' => 11, 'name' => '11. ศิลปะ-ทัศนศิลป์', 'code' => 'ART', 'description' => '', 'order' => 11, 'is_active' => 1, 'created_at' => $now, 'updated_at' => $now],
            ['id' => 12, 'name' => '12. ศิลปะ-ดนตรี', 'code' => 'MUSIC', 'description' => '', 'order' => 12, 'is_active' => 1, 'created_at' => $now, 'updated_at' => $now],
            ['id' => 13, 'name' => '13. ศิลปะ-นาฏศิลป์', 'code' => 'DANCE', 'description' => '', 'order' => 13, 'is_active' => 1, 'created_at' => $now, 'updated_at' => $now],
            ['id' => 14, 'name' => '14. การศึกษาปฐมวัย', 'code' => 'EARLY', 'description' => '', 'order' => 14, 'is_active' => 1, 'created_at' => $now, 'updated_at' => $now],
            ['id' => 15, 'name' => '15. กิจกรรมพัฒนาผู้เรียน', 'code' => 'STUDENT', 'description' => '', 'order' => 15, 'is_active' => 1, 'created_at' => $now, 'updated_at' => $now],
            ['id' => 16, 'name' => '4. กลุ่ม Soft Power', 'code' => 'SOFTPOWER', 'description' => '', 'order' => 16, 'is_active' => 1, 'created_at' => $now, 'updated_at' => $now],
            ['id' => 17, 'name' => '1. กลุ่มดนตรี', 'code' => 'MUSIC_SP', 'description' => '', 'order' => 17, 'is_active' => 1, 'created_at' => $now, 'updated_at' => $now],
            ['id' => 18, 'name' => '2. กลุ่มนาฏศิลป์', 'code' => 'DANCE_SP', 'description' => '', 'order' => 18, 'is_active' => 1, 'created_at' => $now, 'updated_at' => $now],
            ['id' => 19, 'name' => '4. กลุ่ม Soft Power', 'code' => 'DRAMA', 'description' => '', 'order' => 19, 'is_active' => 1, 'created_at' => $now, 'updated_at' => $now],
        ];

        DB::table('categories')->insert($categories);

        $this->command->info('✅ สร้างหมวดหมู่ 19 หมวดเรียบร้อย');
    }
}
