<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\SchoolGroup;

class UpdateSchoolGroupsCorrectSeeder extends Seeder
{
    /**
     * อัพเดทชื่อกลุ่มโรงเรียนที่ถูกต้อง
     * 12 กลุ่ม สพป. นครปฐม เขต 1
     */
    public function run(): void
    {
        $groups = [
            ['id' => 25, 'code' => 'G01', 'name' => 'กลุ่มโรงเรียนบูรพาศึกษา', 'color' => 'blue', 'icon' => '🏫', 'display_order' => 1],
            ['id' => 26, 'code' => 'G02', 'name' => 'กลุ่มโรงเรียนเมืองนครปฐม', 'color' => 'purple', 'icon' => '🏫', 'display_order' => 2],
            ['id' => 27, 'code' => 'G03', 'name' => 'กลุ่มโรงเรียนปฐมนคร', 'color' => 'green', 'icon' => '🏫', 'display_order' => 3],
            ['id' => 28, 'code' => 'G04', 'name' => 'กลุ่มโรงเรียนพระปฐมเจดีย์', 'color' => 'yellow', 'icon' => '🏫', 'display_order' => 4],
            ['id' => 29, 'code' => 'G05', 'name' => 'กลุ่มโรงเรียนกำแพงแสน 4', 'color' => 'red', 'icon' => '🏫', 'display_order' => 5],
            ['id' => 30, 'code' => 'G06', 'name' => 'กลุ่มโรงเรียนกำแพงแสน 1', 'color' => 'indigo', 'icon' => '🏫', 'display_order' => 6],
            ['id' => 31, 'code' => 'G07', 'name' => 'กลุ่มโรงเรียนกำแพงแสน 2', 'color' => 'pink', 'icon' => '🏫', 'display_order' => 7],
            ['id' => 32, 'code' => 'G08', 'name' => 'กลุ่มโรงเรียนกำแพงแสน 3', 'color' => 'orange', 'icon' => '🏫', 'display_order' => 8],
            ['id' => 33, 'code' => 'G09', 'name' => 'กลุ่มโรงเรียนบ้านหลวง', 'color' => 'teal', 'icon' => '🏫', 'display_order' => 9],
            ['id' => 34, 'code' => 'G10', 'name' => 'กลุ่มโรงเรียนดอนตูม', 'color' => 'cyan', 'icon' => '🏫', 'display_order' => 10],
            ['id' => 35, 'code' => 'G11', 'name' => 'กลุ่มโรงเรียนขยายโอกาส', 'color' => 'emerald', 'icon' => '🏫', 'display_order' => 11],
            ['id' => 36, 'code' => 'G12', 'name' => 'กลุ่มโรงเรียนเอกชน', 'color' => 'violet', 'icon' => '🏫', 'display_order' => 12]
        ];

        foreach ($groups as $data) {
            $group = SchoolGroup::find($data['id']);
            if ($group) {
                $group->update([
                    'code' => $data['code'],
                    'name' => $data['name'],
                    'color' => $data['color'],
                    'icon' => $data['icon'],
                    'display_order' => $data['display_order'],
                ]);
                $this->command->info("✅ อัพเดท: {$group->name}");
            } else {
                $this->command->warn("⚠️ ไม่พบกลุ่ม ID: {$data['id']}");
            }
        }

        $this->command->info("\n🎉 อัพเดทชื่อกลุ่ม 12 กลุ่มเรียบร้อย!");
    }
}
