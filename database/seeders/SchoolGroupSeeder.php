<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\SchoolGroup;

class SchoolGroupSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $groups = [
            [
                'code' => 'G01',  // เพิ่ม code
                'name' => 'กลุ่มกำแพงแสน',
                'color' => 'blue',
                'icon' => '🏫',
                'description' => 'กลุ่มโรงเรียนในเขตอำเภอกำแพงแสน',
                'display_order' => 1
            ],
            [
                'code' => 'G02',
                'name' => 'กลุ่มบูรา',
                'color' => 'purple',
                'icon' => '📚',
                'description' => 'กลุ่มโรงเรียนในเขตพื้นที่บูรา',
                'display_order' => 2
            ],
            [
                'code' => 'G03',
                'name' => 'กลุ่มท่าตะเกียบ',
                'color' => 'green',
                'icon' => '🎓',
                'description' => 'กลุ่มโรงเรียนในเขตอำเภอท่าตะเกียบ',
                'display_order' => 3
            ],
            [
                'code' => 'G04',
                'name' => 'กลุ่มนครชัยศรี',
                'color' => 'yellow',
                'icon' => '🏛️',
                'description' => 'กลุ่มโรงเรียนในเขตอำเภอนครชัยศรี',
                'display_order' => 4
            ],
            [
                'code' => 'G05',
                'name' => 'กลุ่มบางเลน',
                'color' => 'red',
                'icon' => '🎨',
                'description' => 'กลุ่มโรงเรียนในเขตอำเภอบางเลน',
                'display_order' => 5
            ],
            [
                'code' => 'G06',
                'name' => 'กลุ่มพุทธมณฑล',
                'color' => 'indigo',
                'icon' => '🌟',
                'description' => 'กลุ่มโรงเรียนในเขตอำเภอพุทธมณฑล',
                'display_order' => 6
            ],
            [
                'code' => 'G07',
                'name' => 'กลุ่มสามพราน',
                'color' => 'pink',
                'icon' => '🎭',
                'description' => 'กลุ่มโรงเรียนในเขตอำเภอสามพราน',
                'display_order' => 7
            ],
            [
                'code' => 'G08',
                'name' => 'กลุ่มดอนตูม',
                'color' => 'orange',
                'icon' => '🏆',
                'description' => 'กลุ่มโรงเรียนในเขตอำเภอดอนตูม',
                'display_order' => 8
            ],
            [
                'code' => 'G09',
                'name' => 'กลุ่มนครปฐม',
                'color' => 'teal',
                'icon' => '📖',
                'description' => 'กลุ่มโรงเรียนในเขตอำเภอเมืองนครปฐม',
                'display_order' => 9
            ],
            [
                'code' => 'G10',
                'name' => 'กลุ่มบางแขม',
                'color' => 'cyan',
                'icon' => '🎪',
                'description' => 'กลุ่มโรงเรียนในเขตพื้นที่บางแขม',
                'display_order' => 10
            ],
            [
                'code' => 'G11',
                'name' => 'กลุ่มที่ 11',
                'color' => 'emerald',
                'icon' => '🎯',
                'description' => 'กลุ่มโรงเรียนที่ 11',
                'display_order' => 11
            ],
            [
                'code' => 'G12',
                'name' => 'กลุ่มที่ 12',
                'color' => 'violet',
                'icon' => '🎪',
                'description' => 'กลุ่มโรงเรียนที่ 12',
                'display_order' => 12
            ]
        ];

        foreach ($groups as $groupData) {
            SchoolGroup::updateOrCreate(
                ['code' => $groupData['code']], // เช็คจาก code
                $groupData
            );
        }

        $this->command->info('✅ เพิ่มข้อมูล 12 กลุ่มโรงเรียนเรียบร้อย');
    }
}
