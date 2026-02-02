<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Competition;
use App\Models\SchoolGroup;

class CreateGroupCompetitions extends Command
{
    protected $signature = 'competitions:create-groups';
    protected $description = 'สร้างการแข่งขันระดับกลุ่มจากระดับเขต';

    public function handle()
    {
        $districtComps = Competition::where('competition_level', 'district')
            ->where('status', 'active')
            ->get();
            
        $schoolGroups = SchoolGroup::all();
        
        $this->info("📊 สถิติ:");
        $this->info("  - การแข่งขันระดับเขต: {$districtComps->count()} รายการ");
        $this->info("  - กลุ่มโรงเรียน: {$schoolGroups->count()} กลุ่ม");
        $this->info("  - จะสร้างรวม: " . ($districtComps->count() * $schoolGroups->count()) . " รายการ");
        
        if (!$this->confirm('ต้องการดำเนินการต่อ?', true)) {
            return 0;
        }
        
        $bar = $this->output->createProgressBar($districtComps->count() * $schoolGroups->count());
        $created = 0;
        
        foreach ($districtComps as $comp) {
            foreach ($schoolGroups as $group) {
                // Fix date values
                $startDate = $this->fixDate($comp->start_date);
                $endDate = $this->fixDate($comp->end_date);
                $regStartDate = $this->fixDate($comp->registration_start_date);
                $regEndDate = $this->fixDate($comp->registration_end_date);
                
                Competition::create([
                    'category_id' => $comp->category_id,
                    'code' => $comp->code . '_G' . $group->id,
                    'name' => $comp->name,
                    'description' => $comp->description,
                    'competition_level' => 'group',
                    'school_group_id' => $group->id,
                    'level' => $comp->level,
                    'min_students' => $comp->min_students,
                    'max_students' => $comp->max_students,
                    'student_count' => $comp->student_count,
                    'min_teachers' => $comp->min_teachers,
                    'max_teachers' => $comp->max_teachers,
                    'teacher_count' => $comp->teacher_count,
                    'min_judges' => $comp->min_judges,
                    'max_judges' => $comp->max_judges,
                    'judge_count' => $comp->judge_count,
                    'competition_type' => $comp->competition_type,
                    'status' => 'active',
                    'is_active' => 1,
                    'registration_status' => 'open',
                    'start_date' => $startDate,
                    'end_date' => $endDate,
                    'registration_start_date' => $regStartDate,
                    'registration_end_date' => $regEndDate,
                    'order_number' => $comp->order_number,
                    'participants_count' => $comp->participants_count ?? 0,
                    'advancement_count' => $comp->advancement_count ?? 2,
                ]);
                
                $created++;
                $bar->advance();
            }
        }
        
        $bar->finish();
        $this->newLine();
        $this->info("✅ สร้างเสร็จสิ้น! รวม {$created} รายการ");
        
        return 0;
    }
    
    private function fixDate($date)
    {
        // ถ้าเป็น 0000-00-00 หรือวันที่ไม่ valid ให้ใช้ค่า default
        if (empty($date) || 
            $date == '0000-00-00' || 
            $date == '0000-00-00 00:00:00' ||
            strtotime($date) === false ||
            strtotime($date) < 0) {
            return '2026-02-01';
        }
        
        return $date;
    }
}