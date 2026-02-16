<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\SchoolGroup;
use App\Models\Competition;

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

        // 2. เพิ่มกิจกรรมทั้งหมด (copy จากกลุ่มเอกชน G12)
        $privateGroup = SchoolGroup::where('code', 'G12')->first();

        if ($privateGroup) {
            // ดึง competition_ids จากกลุ่มเอกชน
            $competitionIds = $privateGroup->selectedCompetitions()->pluck('competitions.id')->toArray();

            if (count($competitionIds) > 0) {
                $group->selectedCompetitions()->syncWithoutDetaching($competitionIds);
                $this->command->info("✅ เพิ่มกิจกรรม " . count($competitionIds) . " รายการ (copy จากกลุ่มเอกชน)");
            } else {
                // ถ้ากลุ่มเอกชนไม่มี ให้ใช้กิจกรรมทั้งหมดที่ active
                $allIds = Competition::where('is_active', true)->pluck('id')->toArray();
                $group->selectedCompetitions()->syncWithoutDetaching($allIds);
                $this->command->info("✅ เพิ่มกิจกรรมทั้งหมด " . count($allIds) . " รายการ");
            }
        } else {
            // fallback: ใช้กิจกรรมทั้งหมด
            $allIds = Competition::where('is_active', true)->pluck('id')->toArray();
            $group->selectedCompetitions()->syncWithoutDetaching($allIds);
            $this->command->info("✅ เพิ่มกิจกรรมทั้งหมด " . count($allIds) . " รายการ");
        }

        $this->command->info("\n🎉 อัพเดทกลุ่มโรงเรียนเทศบาล/ท้องถิ่นเรียบร้อย!");
    }
}
