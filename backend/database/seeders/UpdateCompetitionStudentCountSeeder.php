<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Competition;
use Illuminate\Support\Facades\DB;

class UpdateCompetitionStudentCountSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * อัพเดทจำนวนนักเรียนสำหรับกิจกรรมที่ระบุ:
     * 1. หุ่นยนต์ผสม (ป.1-6) → เปลี่ยนเป็น 4 คน
     * 2. การร้อยมาลัยดอกไม้สด (บกพร่องทางการเรียนรู้) (ป.1-6) → เปลี่ยนเป็น 2 คน
     * 3. การร้อยมาลัยดอกไม้สด (บกพร่องทางสติปัญญา) (ป.1-6) → เปลี่ยนเป็น 2 คน
     * 4. การเต้นหางเครื่องประกอบเพลง (บกพร่องทางการเรียนรู้) (ป.1-6) → เปลี่ยนเป็น 3-7 คน
     */
    public function run(): void
    {
        $updates = [
            // 1. หุ่นยนต์ผสม (ป.1-6) - รหัส ROBOT_D_ป1_6_7_G2 → 4 คน
            [
                'code' => 'ROBOT_D_ป1_6_7_G2',
                'name_pattern' => '%หุ่นยนต์ผสม%ป.1-6%',
                'min_students' => 4,
                'max_students' => 4,
            ],

            // 2. การร้อยมาลัยดอกไม้สด (บกพร่องทางการเรียนรู้) (ป.1-6) - รหัส ART_SP_D_ป1_6_8_G8 → 2 คน
            [
                'code' => 'ART_SP_D_ป1_6_8_G8',
                'name_pattern' => '%ร้อยมาลัยดอกไม้สด%บกพร่องทางการเรียนรู้%ป.1-6%',
                'min_students' => 2,
                'max_students' => 2,
            ],

            // 3. การร้อยมาลัยดอกไม้สด (บกพร่องทางสติปัญญา) (ป.1-6) - รหัส ART_SP_D_ป1_6_7_G8 → 2 คน
            [
                'code' => 'ART_SP_D_ป1_6_7_G8',
                'name_pattern' => '%ร้อยมาลัยดอกไม้สด%บกพร่องทางสติปัญญา%ป.1-6%',
                'min_students' => 2,
                'max_students' => 2,
            ],

            // 4. การเต้นหางเครื่องประกอบเพลง (บกพร่องทางการเรียนรู้) (ป.1-6) - รหัส DANCE_SP_D_ป1_6_1_G8 → 3-7 คน
            [
                'code' => 'DANCE_SP_D_ป1_6_1_G8',
                'name_pattern' => '%เต้นหางเครื่อง%บกพร่องทางการเรียนรู้%ป.1-6%',
                'min_students' => 3,
                'max_students' => 7,
            ],
        ];

        foreach ($updates as $update) {
            // ลองค้นหาด้วย code ก่อน
            $competition = Competition::where('code', $update['code'])->first();

            // ถ้าไม่พบ ลองค้นหาด้วยชื่อ
            if (!$competition) {
                $competition = Competition::where('name', 'LIKE', $update['name_pattern'])->first();
            }

            if ($competition) {
                $oldMin = $competition->min_students;
                $oldMax = $competition->max_students;

                $competition->update([
                    'min_students' => $update['min_students'],
                    'max_students' => $update['max_students'],
                ]);

                echo "✅ อัพเดท: {$competition->name}\n";
                echo "   - จำนวนนักเรียน: {$oldMin}-{$oldMax} → {$update['min_students']}-{$update['max_students']} คน\n";
            } else {
                // ถ้าไม่พบเลย ลองค้นหาด้วย pattern ที่หลวมกว่า
                echo "⚠️ ไม่พบกิจกรรม: {$update['code']}\n";
                echo "   กำลังค้นหาด้วย pattern: {$update['name_pattern']}\n";

                // แสดงกิจกรรมที่คล้ายกัน
                $similar = Competition::where('name', 'LIKE', '%' . explode('%', $update['name_pattern'])[1] . '%')
                    ->take(5)
                    ->get(['id', 'code', 'name', 'min_students', 'max_students']);

                if ($similar->isNotEmpty()) {
                    echo "   พบกิจกรรมที่คล้ายกัน:\n";
                    foreach ($similar as $comp) {
                        echo "   - [{$comp->code}] {$comp->name} (นักเรียน: {$comp->min_students}-{$comp->max_students})\n";
                    }
                }
            }
        }

        echo "\n✅ อัพเดทจำนวนนักเรียนเสร็จสิ้น!\n";
    }
}
