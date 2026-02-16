<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\SchoolGroup;
use App\Models\Competition;
use Illuminate\Support\Facades\DB;

class UpdateMunicipalGroupSeeder extends Seeder
{
    public function run(): void
    {
        // 1. แก้ชื่อกลุ่มเป็น กลุ่มโรงเรียนเทศบาล/ท้องถิ่น
        $group = SchoolGroup::where('code', 'G13')->first();

        if (!$group) {
            $this->command->warn('⚠️ ไม่พบกลุ่ม G13');
            return;
        }

        $group->update([
            'name' => 'กลุ่มโรงเรียนเทศบาล/ท้องถิ่น',
            'description' => 'กลุ่มโรงเรียนสังกัดเทศบาลและท้องถิ่น',
        ]);

        $this->command->info("✅ แก้ชื่อกลุ่ม → กลุ่มโรงเรียนเทศบาล/ท้องถิ่น");

        // 2. สร้างกิจกรรมระดับกลุ่มสำหรับ G13
        // ตรวจสอบว่ามีกิจกรรมของ G13 อยู่แล้วหรือไม่
        $existingCount = Competition::where('school_group_id', $group->id)
            ->where('competition_level', 'group')
            ->count();

        if ($existingCount > 0) {
            $this->command->info("ℹ️ กลุ่ม G13 มีกิจกรรมอยู่แล้ว {$existingCount} รายการ - ข้าม");
            return;
        }

        // หากลุ่มต้นแบบ (G01) ที่มีกิจกรรมอยู่แล้ว
        $sourceGroup = SchoolGroup::where('code', 'G01')->first();

        if (!$sourceGroup) {
            // fallback: หากลุ่มแรกที่มีกิจกรรม
            $sourceGroupId = Competition::where('competition_level', 'group')
                ->whereNotNull('school_group_id')
                ->value('school_group_id');

            if (!$sourceGroupId) {
                $this->command->warn('⚠️ ไม่พบกลุ่มต้นแบบที่มีกิจกรรม');
                return;
            }
            $sourceGroup = SchoolGroup::find($sourceGroupId);
        }

        // ดึงกิจกรรมจากกลุ่มต้นแบบ
        $sourceCompetitions = Competition::where('school_group_id', $sourceGroup->id)
            ->where('competition_level', 'group')
            ->get();

        if ($sourceCompetitions->isEmpty()) {
            $this->command->warn("⚠️ กลุ่ม {$sourceGroup->code} ไม่มีกิจกรรม");
            return;
        }

        $count = 0;
        foreach ($sourceCompetitions as $source) {
            // สร้างกิจกรรมใหม่โดย copy จากต้นแบบ
            $newComp = $source->replicate();
            $newComp->school_group_id = $group->id;
            $newComp->code = $source->code . '_G13';
            $newComp->parent_competition_id = $source->parent_competition_id;
            $newComp->total_registrations = 0;
            $newComp->submitted_to_district = false;
            $newComp->submitted_at = null;
            $newComp->created_at = now();
            $newComp->updated_at = now();
            $newComp->save();
            $count++;
        }

        $this->command->info("✅ สร้างกิจกรรม {$count} รายการ สำหรับกลุ่ม G13 (copy จาก {$sourceGroup->code})");
        $this->command->info("\n🎉 อัพเดทกลุ่มโรงเรียนเทศบาล/ท้องถิ่นเรียบร้อย!");
    }
}
