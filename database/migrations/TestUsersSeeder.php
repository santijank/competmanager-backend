<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Carbon\Carbon;

class TestUsersSeeder extends Seeder
{
    /**
     * Run the database seeds.
     * 
     * สร้าง Test Users สำหรับทดสอบระบบ
     * Password ทั้งหมด: password
     */
    public function run(): void
    {
        $now = Carbon::now();
        $password = Hash::make('password');

        $users = [
            // 1. District Admin
            [
                'id' => 1,
                'name' => 'Admin (District)',
                'email' => 'admin@compet.site',
                'email_verified_at' => $now,
                'password' => $password,
                'role' => 'admin',
                'committee_level' => null,
                'school_id' => null,
                'school_group_id' => null,
                'remember_token' => null,
                'created_at' => $now,
                'updated_at' => $now,
            ],

            // 2. Group Admin - กลุ่ม 1
            [
                'id' => 2,
                'name' => 'Group Admin กลุ่ม 1',
                'email' => 'groupadmin1@test.com',
                'email_verified_at' => $now,
                'password' => $password,
                'role' => 'group_admin',
                'committee_level' => null,
                'school_id' => null,
                'school_group_id' => 1, // กลุ่มบูรพาศึกษา
                'remember_token' => null,
                'created_at' => $now,
                'updated_at' => $now,
            ],

            // 3. Group Admin - กลุ่ม 2
            [
                'id' => 3,
                'name' => 'Group Admin กลุ่ม 2',
                'email' => 'groupadmin2@test.com',
                'email_verified_at' => $now,
                'password' => $password,
                'role' => 'group_admin',
                'committee_level' => null,
                'school_id' => null,
                'school_group_id' => 2, // กลุ่มเมืองนครปฐม
                'remember_token' => null,
                'created_at' => $now,
                'updated_at' => $now,
            ],

            // 4. Teacher - โรงเรียนวัดดอนยายหอม (กลุ่ม 1)
            [
                'id' => 4,
                'name' => 'ครูสมชาย ใจดี',
                'email' => 'teacher1@test.com',
                'email_verified_at' => $now,
                'password' => $password,
                'role' => 'teacher',
                'committee_level' => null,
                'school_id' => null, // จะอัพเดททีหลังหลัง import โรงเรียน
                'school_group_id' => 1,
                'remember_token' => null,
                'created_at' => $now,
                'updated_at' => $now,
            ],

            // 5. Teacher - โรงเรียนวัดเกาะวังไทร (กลุ่ม 2)
            [
                'id' => 5,
                'name' => 'ครูสมหญิง รักงาม',
                'email' => 'teacher2@test.com',
                'email_verified_at' => $now,
                'password' => $password,
                'role' => 'teacher',
                'committee_level' => null,
                'school_id' => null, // จะอัพเดททีหลังหลัง import โรงเรียน
                'school_group_id' => 2,
                'remember_token' => null,
                'created_at' => $now,
                'updated_at' => $now,
            ],

            // 6. Committee (Group Level) - กลุ่ม 1
            [
                'id' => 6,
                'name' => 'คณะทำงานกลุ่ม 1',
                'email' => 'committee-group1@test.com',
                'email_verified_at' => $now,
                'password' => $password,
                'role' => 'committee',
                'committee_level' => 'group',
                'school_id' => null,
                'school_group_id' => 1,
                'remember_token' => null,
                'created_at' => $now,
                'updated_at' => $now,
            ],

            // 7. Committee (District Level)
            [
                'id' => 7,
                'name' => 'คณะทำงานระดับเขต',
                'email' => 'committee-district@test.com',
                'email_verified_at' => $now,
                'password' => $password,
                'role' => 'committee',
                'committee_level' => 'district',
                'school_id' => null,
                'school_group_id' => null,
                'remember_token' => null,
                'created_at' => $now,
                'updated_at' => $now,
            ],
        ];

        DB::table('users')->insert($users);

        $this->command->info('✅ สร้าง Test Users 7 รายการ');
        $this->command->info('');
        $this->command->info('📧 Test Accounts (รหัสผ่านทั้งหมด: password):');
        $this->command->table(
            ['Email', 'Role', 'หมายเหตุ'],
            [
                ['admin@compet.site', 'admin', 'District Admin'],
                ['groupadmin1@test.com', 'group_admin', 'Group Admin กลุ่ม 1'],
                ['groupadmin2@test.com', 'group_admin', 'Group Admin กลุ่ม 2'],
                ['teacher1@test.com', 'teacher', 'ครู - กลุ่ม 1'],
                ['teacher2@test.com', 'teacher', 'ครู - กลุ่ม 2'],
                ['committee-group1@test.com', 'committee', 'คณะทำงานกลุ่ม 1'],
                ['committee-district@test.com', 'committee', 'คณะทำงานระดับเขต'],
            ]
        );
        $this->command->warn('');
        $this->command->warn('⚠️  หมายเหตุ: school_id ของ Teacher จะถูกอัพเดทหลังจาก Import โรงเรียน');
    }
}
