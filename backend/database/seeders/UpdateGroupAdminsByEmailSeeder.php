<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\SchoolGroup;

class UpdateGroupAdminsByEmailSeeder extends Seeder
{
    /**
     * อัพเดท school_group_id ให้ Group Admins ตาม Email Pattern
     * ไม่ต้องใช้ User ID - ใช้ Email แทน (ปลอดภัย!)
     */
    public function run(): void
    {
        $this->command->info('🔄 กำลังอัพเดท school_group_id ให้ Group Admins...');
        $this->command->info('📧 ใช้ Email Pattern: group{X}_admin{Y}@competmanager.local');
        $this->command->info('');

        // ========================================
        // Mapping: กลุ่มหมายเลข → Group ID
        // ========================================
        $groupMapping = [
            1 => 25,  // G01 - บูรพาศึกษา
            2 => 26,  // G02 - เมืองนครปฐม
            3 => 27,  // G03 - ปฐมนคร
            4 => 28,  // G04 - พระปฐมเจดีย์
            5 => 29,  // G05 - กำแพงแสน 4
            6 => 30,  // G06 - กำแพงแสน 1
            7 => 31,  // G07 - กำแพงแสน 2
            8 => 32,  // G08 - กำแพงแสน 3
            9 => 33,  // G09 - บ้านหลวง
            10 => 34, // G10 - ดอนตูม
            11 => 35, // G11 - ขยายโอกาส (เอกชน)
            12 => 36, // G12 - เอกชน (ขยายโอกาส)
        ];

        $updated = 0;
        $notFound = 0;
        $unchanged = 0;

        // ========================================
        // อัพเดทแต่ละกลุ่ม (2 admins ต่อกลุ่ม)
        // ========================================
        foreach ($groupMapping as $groupNum => $groupId) {
            $group = SchoolGroup::find($groupId);
            $groupName = $group ? $group->name : "Unknown";
            
            $this->command->info("📋 กลุ่ม {$groupNum}: {$groupName}");

            // อัพเดท Admin ทั้ง 2 คน
            for ($adminNum = 1; $adminNum <= 2; $adminNum++) {
                $email = "group{$groupNum}_admin{$adminNum}@competmanager.local";
                $user = User::where('email', $email)->first();

                if ($user) {
                    $oldGroup = $user->school_group_id;
                    
                    if ($oldGroup !== $groupId) {
                        $user->school_group_id = $groupId;
                        $user->save();
                        
                        $oldGroupText = $oldGroup ? "ID {$oldGroup}" : "NULL";
                        $this->command->info("   ✅ {$email}: {$oldGroupText} → {$groupId}");
                        $updated++;
                    } else {
                        $this->command->comment("   ⏭️  {$email}: ไม่เปลี่ยนแปลง (มีกลุ่มแล้ว)");
                        $unchanged++;
                    }
                } else {
                    $this->command->warn("   ⚠️  {$email}: ไม่พบใน Database");
                    $notFound++;
                }
            }
            
            $this->command->info('');
        }

        // ========================================
        // อัพเดท District Admin (ถ้ามี)
        // ========================================
        $this->command->info('📋 District Admin:');
        
        $districtAdmins = User::where('role', 'district_admin')->get();
        foreach ($districtAdmins as $admin) {
            if ($admin->school_group_id !== null) {
                $admin->school_group_id = null;
                $admin->save();
                $this->command->info("   ✅ {$admin->email}: District Admin ไม่ต้องมีกลุ่ม → NULL");
                $updated++;
            } else {
                $this->command->comment("   ⏭️  {$admin->email}: ไม่เปลี่ยนแปลง");
                $unchanged++;
            }
        }

        // ========================================
        // สรุปผลลัพธ์
        // ========================================
        $this->command->info('');
        $this->command->info(str_repeat('=', 60));
        $this->command->info('📊 สรุปผลลัพธ์:');
        $this->command->info(str_repeat('=', 60));
        $this->command->info("✅ อัพเดทสำเร็จ: {$updated} Users");
        $this->command->info("⏭️  ไม่เปลี่ยนแปลง: {$unchanged} Users (มีกลุ่มถูกต้องแล้ว)");
        
        if ($notFound > 0) {
            $this->command->warn("⚠️  ไม่พบใน Database: {$notFound} Email addresses");
        }

        // สถิติ
        $this->command->info('');
        $this->command->info('📈 สถิติ Users:');
        
        $stats = [
            'District Admins' => User::where('role', 'district_admin')->count(),
            'Group Admins (มีกลุ่ม)' => User::where('role', 'group_admin')->whereNotNull('school_group_id')->count(),
            'Group Admins (ไม่มีกลุ่ม)' => User::where('role', 'group_admin')->whereNull('school_group_id')->count(),
            'Total Group Admins' => User::where('role', 'group_admin')->count(),
        ];

        foreach ($stats as $label => $count) {
            $icon = '✅';
            if ($label === 'Group Admins (ไม่มีกลุ่ม)' && $count > 0) {
                $icon = '⚠️';
            }
            $this->command->info("{$icon} {$label}: {$count}");
        }

        // แสดงตัวอย่าง Login
        $this->command->info('');
        $this->command->info('🔑 ตัวอย่าง Login:');
        $this->command->info('   Email: group1_admin1@competmanager.local');
        $this->command->info('   Password: password123');
        $this->command->info('');
        $this->command->info('🎉 อัพเดท school_group_id เสร็จสมบูรณ์!');
    }
}
