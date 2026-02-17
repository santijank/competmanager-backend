<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Competition;
use Illuminate\Support\Facades\DB;

/**
 * เพิ่มกิจกรรม "การแข่งขันขลุ่ยเพียงออหมู่" ระดับ ม.1-ม.3
 * โดย replicate จากระดับ ป.1-ป.6 ที่มีอยู่แล้ว (ทุก group + district + master)
 */
class AddKhluyM13Seeder extends Seeder
{
    public function run(): void
    {
        // ค้นหากิจกรรม "ขลุ่ยเพียงออหมู่" ทุกตัวที่มีอยู่แล้ว (ป.1-ป.6 / ป.1-6)
        $existingCompetitions = Competition::where('name', 'LIKE', '%ขลุ่ยเพียงออ%หมู่%')
            ->get();

        if ($existingCompetitions->isEmpty()) {
            $this->command->warn('⚠️ ไม่พบกิจกรรม "ขลุ่ยเพียงออหมู่" ในระบบ');
            return;
        }

        $this->command->info("📋 พบกิจกรรม ขลุ่ยเพียงออหมู่ จำนวน {$existingCompetitions->count()} รายการ:");
        foreach ($existingCompetitions as $comp) {
            $this->command->info("   - ID:{$comp->id} | {$comp->name} | level:{$comp->level} | competition_level:{$comp->competition_level} | school_group_id:{$comp->school_group_id} | code:{$comp->code}");
        }

        // ตรวจสอบว่ามีระดับ ม.1-3 อยู่แล้วหรือยัง
        $existingM13 = Competition::where('name', 'LIKE', '%ขลุ่ยเพียงออ%หมู่%')
            ->where(function ($q) {
                $q->where('level', 'LIKE', '%ม.1%')
                  ->orWhere('name', 'LIKE', '%ม.1%');
            })
            ->count();

        if ($existingM13 > 0) {
            $this->command->info("ℹ️ มีกิจกรรมขลุ่ยเพียงออหมู่ ระดับ ม.1-ม.3 อยู่แล้ว {$existingM13} รายการ - ข้าม");
            return;
        }

        $count = 0;

        foreach ($existingCompetitions as $source) {
            // สร้างตัวใหม่ ม.1-ม.3 จากแต่ละตัวที่มี
            $newComp = $source->replicate();

            // แก้ชื่อ: เปลี่ยน ป.1-ป.6 เป็น ม.1-ม.3
            $newName = $source->name;
            $newName = str_replace('ป.1-ป.6', 'ม.1-ม.3', $newName);
            $newName = str_replace('ป.1-6', 'ม.1-ม.3', $newName);
            // ถ้าชื่อไม่เปลี่ยน (อาจเป็นรูปแบบอื่น) ให้เพิ่ม ม.1-ม.3 ต่อท้าย
            if ($newName === $source->name) {
                $newName = $newName . ' ม.1-ม.3';
            }
            $newComp->name = $newName;

            // แก้ level
            $newComp->level = 'ม.1-3';

            // แก้ code: เพิ่ม _M13 suffix
            $newComp->code = $source->code . '_M13';

            // แก้ description
            $newComp->description = str_replace(['ป.1-ป.6', 'ป.1-6'], 'ม.1-ม.3', $source->description ?? '');

            // Reset counters
            $newComp->total_registrations = 0;
            $newComp->participants_count = 0;
            $newComp->submitted_to_district = false;
            $newComp->submitted_at = null;
            $newComp->created_at = now();
            $newComp->updated_at = now();

            $newComp->save();
            $count++;

            $this->command->info("✅ สร้าง: {$newComp->name} (ID:{$newComp->id}, code:{$newComp->code}, group_id:{$newComp->school_group_id}, level:{$newComp->competition_level})");
        }

        $this->command->info("\n🎉 สร้างกิจกรรมขลุ่ยเพียงออหมู่ ม.1-ม.3 สำเร็จ {$count} รายการ!");
    }
}
