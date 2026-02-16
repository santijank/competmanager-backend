<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\SchoolGroup;
use App\Models\School;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class AddMunicipalSchoolsSeeder extends Seeder
{
    public function run(): void
    {
        // 1. สร้างกลุ่มโรงเรียนเทศบาล
        $group = SchoolGroup::firstOrCreate(
            ['code' => 'G13'],
            [
                'name' => 'กลุ่มโรงเรียนเทศบาล',
                'description' => 'กลุ่มโรงเรียนสังกัดเทศบาล',
                'is_active' => true,
                'color' => 'amber',
                'icon' => '🏛️',
                'display_order' => 13,
            ]
        );

        $this->command->info("✅ กลุ่มโรงเรียนเทศบาล (ID: {$group->id})");

        // 2. เพิ่ม 10 โรงเรียน
        $schools = [
            ['code' => 'MUN001', 'name' => 'โรงเรียนเทศบาล 1 วัดพระงาม (สามัคคีพิทยา)'],
            ['code' => 'MUN002', 'name' => 'โรงเรียนเทศบาล 2 วัดเสนหา (สมัครพลผดุง)'],
            ['code' => 'MUN003', 'name' => 'โรงเรียนเทศบาล 3 สระกระเทียม'],
            ['code' => 'MUN004', 'name' => 'โรงเรียนเทศบาล 4 เชาวนปรีชาอุทิศ'],
            ['code' => 'MUN005', 'name' => 'โรงเรียนเทศบาล 5 วัดพระปฐมเจดีย์'],
            ['code' => 'MUN006', 'name' => 'โรงเรียนกีฬาเทศบาลนครนครปฐม'],
            ['code' => 'MUN007', 'name' => 'โรงเรียนอนุบาลเทศบาลนครนครปฐม'],
            ['code' => 'MUN008', 'name' => 'โรงเรียนอนุบาลสระแก้ว'],
            ['code' => 'MUN009', 'name' => 'โรงเรียนอนุบาลประปานคร'],
            ['code' => 'MUN010', 'name' => 'โรงเรียนอนุบาลสุขสวัสดิ์ (ประถมศึกษา)'],
        ];

        foreach ($schools as $schoolData) {
            $school = School::firstOrCreate(
                ['code' => $schoolData['code']],
                [
                    'name' => $schoolData['name'],
                    'school_group_id' => $group->id,
                    'school_type' => 'government',
                    'is_active' => true,
                ]
            );

            // สร้าง user สำหรับแต่ละโรงเรียน
            $email = strtolower($schoolData['code']) . '@school.com';
            User::firstOrCreate(
                ['email' => $email],
                [
                    'name' => 'ผู้ดูแล ' . $schoolData['name'],
                    'password' => Hash::make('password123'),
                    'role' => 'school_admin',
                    'school_id' => $school->id,
                    'school_group_id' => $group->id,
                    'is_active' => true,
                ]
            );

            $this->command->info("  ✅ {$school->name} ({$email})");
        }

        // 3. สร้าง Group Admin
        User::firstOrCreate(
            ['email' => 'groupadmin-mun@school.com'],
            [
                'name' => 'ผู้ดูแลกลุ่มโรงเรียนเทศบาล',
                'password' => Hash::make('password123'),
                'role' => 'group_admin',
                'school_id' => null,
                'school_group_id' => $group->id,
                'is_active' => true,
            ]
        );

        $this->command->info("  ✅ Group Admin: groupadmin-mun@school.com");
        $this->command->info("\n🎉 เพิ่มกลุ่มโรงเรียนเทศบาล 10 โรงเรียน + 11 users เรียบร้อย!");
    }
}
