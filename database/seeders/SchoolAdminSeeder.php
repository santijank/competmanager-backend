<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\School;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class SchoolAdminSeeder extends Seeder
{
    /**
     * สร้าง User (Teacher role) สำหรับทุกโรงเรียน
     * พร้อมรหัสผ่านที่กำหนดไว้
     */
    public function run(): void
    {
        echo "\n🏫 สร้าง School Admin สำหรับทุกโรงเรียน...\n\n";
        
        // Default password สำหรับทุกโรงเรียน
        $defaultPassword = 'School2024!'; // เปลี่ยนได้ตามต้องการ
        
        // ดึงโรงเรียนทั้งหมด
        $schools = School::with('schoolGroup')->get();
        
        if ($schools->isEmpty()) {
            echo "❌ ไม่พบโรงเรียนในระบบ กรุณาสร้างโรงเรียนก่อน\n";
            return;
        }
        
        echo "📊 พบโรงเรียนทั้งหมด: {$schools->count()} แห่ง\n\n";
        
        $created = 0;
        $skipped = 0;
        $errors = 0;
        
        foreach ($schools as $school) {
            try {
                // สร้าง email จากชื่อโรงเรียน
                $email = $this->generateEmail($school->name, $school->id);
                
                // เช็คว่ามี User นี้อยู่แล้วหรือไม่
                $existingUser = User::where('email', $email)->first();
                
                if ($existingUser) {
                    echo "⏭️  SKIP: {$school->name} (มี User แล้ว: {$email})\n";
                    $skipped++;
                    continue;
                }
                
                // สร้าง User ใหม่
                $user = User::create([
                    'name' => "Admin " . $school->name,
                    'email' => $email,
                    'password' => Hash::make($defaultPassword),
                    'role' => 'teacher',
                    'school_id' => $school->id,
                    'school_group_id' => $school->school_group_id,
                ]);
                
                echo "✅ สร้าง: {$school->name}\n";
                echo "   Email: {$email}\n";
                echo "   Password: {$defaultPassword}\n";
                echo "   กลุ่ม: {$school->schoolGroup->name}\n\n";
                
                $created++;
                
            } catch (\Exception $e) {
                echo "❌ ERROR: {$school->name} - {$e->getMessage()}\n";
                $errors++;
            }
        }
        
        // สรุปผล
        echo "\n" . str_repeat("=", 60) . "\n";
        echo "📋 สรุปผลการสร้าง School Admin\n";
        echo str_repeat("=", 60) . "\n";
        echo "✅ สร้างสำเร็จ: {$created} คน\n";
        echo "⏭️  ข้ามไป (มีอยู่แล้ว): {$skipped} คน\n";
        echo "❌ เกิดข้อผิดพลาด: {$errors} คน\n";
        echo "📊 โรงเรียนทั้งหมด: {$schools->count()} แห่ง\n";
        echo str_repeat("=", 60) . "\n\n";
        
        // แสดงรหัสผ่าน
        echo "🔑 รหัสผ่านเริ่มต้นสำหรับทุกโรงเรียน: {$defaultPassword}\n";
        echo "💡 Super Admin สามารถเปลี่ยนรหัสผ่านได้ที่หน้า /users\n\n";
        
        // สร้างไฟล์ CSV สำหรับแจก
        $this->generateCSV($schools, $defaultPassword);
    }
    
    /**
     * สร้าง email จากชื่อโรงเรียน
     */
    private function generateEmail(string $schoolName, int $schoolId): string
    {
        // แปลงชื่อเป็น slug
        $slug = Str::slug($schoolName, '-');
        
        // ถ้าชื่อเป็นภาษาไทย slug จะว่าง ให้ใช้ ID แทน
        if (empty($slug) || strlen($slug) < 3) {
            $slug = "school-{$schoolId}";
        }
        
        return "{$slug}@compet.site";
    }
    
    /**
     * สร้างไฟล์ CSV สำหรับแจกให้โรงเรียน
     */
    private function generateCSV($schools, $defaultPassword): void
    {
        $csvPath = storage_path('app/school_admin_accounts.csv');
        
        $fp = fopen($csvPath, 'w');
        
        // UTF-8 BOM สำหรับ Excel
        fprintf($fp, chr(0xEF).chr(0xBB).chr(0xBF));
        
        // Header
        fputcsv($fp, [
            'ลำดับ',
            'ชื่อโรงเรียน',
            'กลุ่มโรงเรียน',
            'อีเมล',
            'รหัสผ่าน',
            'ลิงก์เข้าระบบ'
        ]);
        
        // Data
        $index = 1;
        foreach ($schools as $school) {
            $email = $this->generateEmail($school->name, $school->id);
            
            fputcsv($fp, [
                $index++,
                $school->name,
                $school->schoolGroup->name ?? '-',
                $email,
                $defaultPassword,
                'http://localhost:3000/login'
            ]);
        }
        
        fclose($fp);
        
        echo "📄 สร้างไฟล์ CSV: {$csvPath}\n";
        echo "   สามารถนำไปแจกให้โรงเรียนได้เลย!\n\n";
    }
}
