<?php

/**
 * Script สำหรับ Extract ข้อมูลจากไฟล์ student_arts_competition.sql
 * 
 * วิธีใช้:
 * 1. วางไฟล์ student_arts_competition.sql ใน backend/storage/app/
 * 2. รัน: php artisan db:seed --class=DataExtractorSeeder
 */

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class DataExtractorSeeder extends Seeder
{
    public function run(): void
    {
        $this->command->info('🔄 กำลัง Extract ข้อมูลจากไฟล์ SQL...');
        
        $sqlFile = storage_path('app/student_arts_competition.sql');
        
        if (!file_exists($sqlFile)) {
            $this->command->error('❌ ไม่พบไฟล์ student_arts_competition.sql');
            $this->command->warn('📁 กรุณาวางไฟล์ที่: ' . $sqlFile);
            return;
        }

        $sql = file_get_contents($sqlFile);

        // Extract Schools (121 โรงเรียน)
        $this->extractSchools($sql);

        // Extract Competitions (292 กิจกรรม)
        $this->extractCompetitions($sql);

        $this->command->info('✅ Extract ข้อมูลเสร็จสมบูรณ์');
    }

    private function extractSchools(string $sql): void
    {
        // ตรวจสอบว่ามีโรงเรียนอยู่แล้วหรือไม่
        $existingCount = DB::table('schools')->count();
        if ($existingCount > 0) {
            $this->command->info("⏭️  มีโรงเรียนอยู่แล้ว {$existingCount} แห่ง - ข้าม");
            return;
        }

        // Extract INSERT INTO `schools` statement
        preg_match('/INSERT INTO `schools`.*?VALUES\s*(.*?);/s', $sql, $matches);
        
        if (!isset($matches[1])) {
            $this->command->error('❌ ไม่พบข้อมูลโรงเรียน');
            return;
        }

        $values = $matches[1];
        
        // แยก rows
        preg_match_all('/\((.*?)\)(?:,|\s*$)/s', $values, $rows);
        
        $schools = [];
        foreach ($rows[1] as $row) {
            $fields = str_getcsv($row, ',', "'");
            
            if (count($fields) >= 12) {
                $schools[] = [
                    'id' => (int)trim($fields[0]),
                    'code' => trim($fields[1], "'"),
                    'name' => trim($fields[2], "'"),
                    'school_group_id' => (int)trim($fields[3]),
                    'school_type' => trim($fields[4], "'"),
                    'address' => $fields[5] === 'NULL' ? null : trim($fields[5], "'"),
                    'phone' => $fields[6] === 'NULL' ? null : trim($fields[6], "'"),
                    'email' => $fields[7] === 'NULL' ? null : trim($fields[7], "'"),
                    'director_name' => $fields[8] === 'NULL' ? null : trim($fields[8], "'"),
                    'is_active' => (int)trim($fields[9]),
                    'deleted_at' => null,
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
            }
        }

        if (count($schools) > 0) {
            DB::table('schools')->insert($schools);
            $this->command->info('✅ Import โรงเรียน ' . count($schools) . ' แห่ง');
        }
    }

    private function extractCompetitions(string $sql): void
    {
        // ตรวจสอบว่ามีกิจกรรมอยู่แล้วหรือไม่
        $existingCount = DB::table('competitions')->count();
        if ($existingCount > 0) {
            $this->command->info("⏭️  มีกิจกรรมอยู่แล้ว {$existingCount} รายการ - ข้าม");
            return;
        }

        // Extract INSERT INTO `competitions` statements
        preg_match_all('/INSERT INTO `competitions`.*?VALUES\s*(.*?);/s', $sql, $matches);
        
        if (count($matches[1]) === 0) {
            $this->command->error('❌ ไม่พบข้อมูลกิจกรรม');
            return;
        }

        $allCompetitions = [];
        
        foreach ($matches[1] as $values) {
            // แยก rows
            preg_match_all('/\((.*?)\)(?:,|\s*$)/s', $values, $rows);
            
            foreach ($rows[1] as $row) {
                $fields = str_getcsv($row, ',', "'");
                
                // Helper function to convert NULL
                $parseValue = function($value) {
                    $trimmed = trim($value);
                    if ($trimmed === 'NULL' || $trimmed === '' || $trimmed === ' NULL') {
                        return null;
                    }
                    return trim($value, "'");
                };
                
                if (count($fields) >= 27) {
                    $allCompetitions[] = [
                        'id' => (int)trim($fields[0]),
                        'category_id' => (int)trim($fields[1]),
                        'code' => trim($fields[3], "'"),
                        'name' => trim($fields[4], "'"),
                        'description' => $parseValue($fields[5]),
                        'competition_type' => trim($fields[2], "'"),
                        'level' => trim($fields[7], "'"),
                        'max_students' => (int)trim($fields[8]),
                        'max_teachers' => (int)trim($fields[9]),
                        'max_judges' => (int)trim($fields[10]),
                        'criterion' => $parseValue($fields[11]),
                        'start_date' => trim($fields[12], "'"),
                        'end_date' => trim($fields[13], "'"),
                        'status' => trim($fields[14], "'"),
                        'competition_date' => $parseValue($fields[15]),
                        'competition_start_time' => $parseValue($fields[16]),
                        'competition_end_time' => $parseValue($fields[17]),
                        'registration_start_date' => $parseValue($fields[18]),
                        'registration_end_date' => $parseValue($fields[19]),
                        'registration_status' => 'upcoming',
                        'venue' => $parseValue($fields[20]),
                        'advancement_slots' => $parseValue($fields[21]) ? (int)trim($fields[21]) : null,
                        // แปลง 0 เป็น null สำหรับ school_group_id (0 = กิจกรรมระดับเขต)
                        'school_group_id' => (trim($fields[22]) === '0' || trim($fields[22]) === 'NULL') ? null : (int)trim($fields[22]),
                        'is_active' => (int)trim($fields[23]),
                        'allow_direct_registration' => false,
                        'rules' => $parseValue($fields[24]),
                        'created_at' => now(),
                        'updated_at' => now(),
                    ];
                }
            }
        }

        if (count($allCompetitions) > 0) {
            // Insert ทีละ chunk
            foreach (array_chunk($allCompetitions, 50) as $chunk) {
                DB::table('competitions')->insert($chunk);
            }
            $this->command->info('✅ Import กิจกรรม ' . count($allCompetitions) . ' รายการ');
        }
    }
}
