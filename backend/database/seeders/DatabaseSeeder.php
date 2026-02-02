<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->command->info('🚀 เริ่มต้น Seeding ระบบ CompetManager');
        $this->command->info('=====================================');
        $this->command->info('');

        // 1. School Groups (10 กลุ่ม)
        $this->command->info('📍 Step 1/5: กลุ่มโรงเรียน...');
        $this->call(SchoolGroupsSeeder::class);
        $this->command->info('');

        // 2. Categories (19 หมวดหมู่)
        $this->command->info('📚 Step 2/5: หมวดหมู่กิจกรรม...');
        $this->call(CategoriesSeeder::class);
        $this->command->info('');

        // 3. Test Users (7 ราย)
        $this->command->info('👥 Step 3/5: ผู้ใช้งานทดสอบ...');
        $this->call(TestUsersSeeder::class);
        $this->command->info('');

        // 4. Schools & Competitions (จากไฟล์ SQL)
        $this->command->info('🏫 Step 4/5: โรงเรียนและกิจกรรม...');
        $this->command->warn('⚠️  ต้องการ Import ข้อมูล 121 โรงเรียน + 292 กิจกรรม');
        $this->command->warn('📁 กรุณาวางไฟล์ student_arts_competition.sql ที่: storage/app/');
        
        if ($this->command->confirm('Import ข้อมูลจากไฟล์ SQL หรือไม่?', true)) {
            $this->call(DataExtractorSeeder::class);
        } else {
            $this->command->info('⏭️  ข้ามการ Import - ใช้ข้อมูลตัวอย่างแทน');
            $this->call(SchoolsSeeder::class);
            $this->command->warn('⚠️  กิจกรรม 292 รายการยังไม่ถูก Import');
        }
        $this->command->info('');

        // 5. Summary
        $this->command->info('✅ Step 5/5: สรุปผลการ Seeding');
        $this->command->info('=====================================');
        $this->printSummary();
        $this->command->info('');
        $this->command->info('🎉 Seeding เสร็จสมบูรณ์!');
    }

    private function printSummary(): void
    {
        $summary = [
            ['ตาราง', 'จำนวน', 'สถานะ'],
            ['school_groups', \DB::table('school_groups')->count(), '✅'],
            ['categories', \DB::table('categories')->count(), '✅'],
            ['users', \DB::table('users')->count(), '✅'],
            ['schools', \DB::table('schools')->count(), \DB::table('schools')->count() >= 121 ? '✅' : '⚠️'],
            ['competitions', \DB::table('competitions')->count(), \DB::table('competitions')->count() >= 292 ? '✅' : '⚠️'],
        ];

        $this->command->table([], $summary);
        
        if (\DB::table('schools')->count() < 121 || \DB::table('competitions')->count() < 292) {
            $this->command->warn('');
            $this->command->warn('⚠️  ข้อมูลยังไม่ครบ! กรุณา Import จากไฟล์ SQL:');
            $this->command->warn('   php artisan db:seed --class=DataExtractorSeeder');
        }
    }
}
