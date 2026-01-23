<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\SchoolGroup;
use Illuminate\Support\Facades\Hash;

class GroupAdminUserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     * 
     * สร้าง Group Admin Users สำหรับทุกกลุ่มโรงเรียน (กลุ่มละ 2 คน)
     */
    public function run(): void
    {
        // ดึงกลุ่มโรงเรียนทั้งหมด
        $schoolGroups = SchoolGroup::all();

        if ($schoolGroups->isEmpty()) {
            echo "⚠️ ไม่พบกลุ่มโรงเรียนในระบบ กรุณาสร้างกลุ่มโรงเรียนก่อน\n";
            return;
        }

        $createdCount = 0;
        $skippedCount = 0;

        foreach ($schoolGroups as $group) {
            // สร้าง 2 Group Admin สำหรับแต่ละกลุ่ม
            for ($i = 1; $i <= 2; $i++) {
                $email = "group{$group->id}_admin{$i}@competmanager.local";
                
                // ตรวจสอบว่ามี email นี้อยู่แล้วหรือไม่
                $existingUser = User::where('email', $email)->first();
                
                if ($existingUser) {
                    echo "⚠️ ข้ามผู้ใช้ที่มีอยู่แล้ว: {$email}\n";
                    $skippedCount++;
                    continue;
                }

                // สร้าง user ใหม่
                $user = User::create([
                    'name' => "ผู้ดูแลกลุ่ม {$group->name} คนที่ {$i}",
                    'email' => $email,
                    'password' => Hash::make('password123'), // รหัสผ่านเริ่มต้น
                    'role' => 'group_admin',
                    'school_group_id' => $group->id,
                ]);

                echo "✅ สร้าง Group Admin: {$user->name} (email: {$email}, password: password123)\n";
                $createdCount++;
            }
        }

        echo "\n";
        echo "============================================\n";
        echo "✅ สร้าง Group Admin Users เสร็จสิ้น!\n";
        echo "============================================\n";
        echo "📊 สรุป:\n";
        echo "   - สร้างใหม่: {$createdCount} users\n";
        echo "   - ข้ามแล้ว: {$skippedCount} users\n";
        echo "   - กลุ่มทั้งหมด: {$schoolGroups->count()} กลุ่ม\n";
        echo "\n";
        echo "📝 รายละเอียดการเข้าสู่ระบบ:\n";
        echo "   Email: group{X}_admin{1-2}@competmanager.local\n";
        echo "   Password: password123\n";
        echo "\n";
        echo "ตัวอย่าง:\n";
        
        // แสดงตัวอย่าง 3 กลุ่มแรก
        $sampleGroups = $schoolGroups->take(3);
        foreach ($sampleGroups as $group) {
            echo "   - กลุ่ม {$group->name}:\n";
            echo "     • Email: group{$group->id}_admin1@competmanager.local | Password: password123\n";
            echo "     • Email: group{$group->id}_admin2@competmanager.local | Password: password123\n";
        }
        
        if ($schoolGroups->count() > 3) {
            echo "   ... และอื่นๆ อีก " . ($schoolGroups->count() - 3) . " กลุ่ม\n";
        }
        
        echo "\n";
        echo "⚠️ หมายเหตุ: กรุณาเปลี่ยนรหัสผ่านหลังเข้าสู่ระบบครั้งแรก\n";
    }
}
