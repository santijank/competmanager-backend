<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\School;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class CreateSchoolAdmins extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'schools:create-admins 
                          {--password= : รหัสผ่านเริ่มต้น (ถ้าไม่ระบุจะเป็น School2024!)}
                          {--force : สร้างใหม่ทับของเดิม}
                          {--school= : ID ของโรงเรียนที่ต้องการสร้าง (ถ้าต้องการเฉพาะโรงเรียนเดียว)}';

    /**
     * The console command description.
     */
    protected $description = 'สร้าง Admin User สำหรับทุกโรงเรียน หรือโรงเรียนที่ระบุ';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('🏫 สร้าง School Admin');
        $this->info('======================');
        $this->newLine();
        
        // Get password
        $password = $this->option('password') ?: 'School2024!';
        $force = $this->option('force');
        $schoolId = $this->option('school');
        
        // Get schools
        if ($schoolId) {
            $schools = School::with('schoolGroup')->where('id', $schoolId)->get();
            if ($schools->isEmpty()) {
                $this->error("❌ ไม่พบโรงเรียน ID: {$schoolId}");
                return 1;
            }
        } else {
            $schools = School::with('schoolGroup')->get();
        }
        
        if ($schools->isEmpty()) {
            $this->error('❌ ไม่พบโรงเรียนในระบบ');
            return 1;
        }
        
        $this->info("📊 พบโรงเรียน: {$schools->count()} แห่ง");
        $this->info("🔑 รหัสผ่าน: {$password}");
        $this->newLine();
        
        // Confirm
        if (!$this->confirm('ต้องการดำเนินการต่อหรือไม่?', true)) {
            $this->info('ยกเลิกการทำงาน');
            return 0;
        }
        
        $this->newLine();
        
        // Progress bar
        $bar = $this->output->createProgressBar($schools->count());
        $bar->start();
        
        $created = 0;
        $updated = 0;
        $skipped = 0;
        $errors = 0;
        
        $accounts = [];
        
        foreach ($schools as $school) {
            try {
                $email = $this->generateEmail($school->name, $school->id);
                $existingUser = User::where('email', $email)->first();
                
                if ($existingUser && !$force) {
                    $skipped++;
                } elseif ($existingUser && $force) {
                    // Update existing
                    $existingUser->password = Hash::make($password);
                    $existingUser->school_id = $school->id;
                    $existingUser->school_group_id = $school->school_group_id;
                    $existingUser->save();
                    $updated++;
                    
                    $accounts[] = [
                        'school' => $school->name,
                        'group' => $school->schoolGroup->name ?? '-',
                        'email' => $email,
                        'password' => $password,
                        'status' => 'อัพเดท'
                    ];
                } else {
                    // Create new
                    User::create([
                        'name' => "Admin " . $school->name,
                        'email' => $email,
                        'password' => Hash::make($password),
                        'role' => 'teacher',
                        'school_id' => $school->id,
                        'school_group_id' => $school->school_group_id,
                    ]);
                    $created++;
                    
                    $accounts[] = [
                        'school' => $school->name,
                        'group' => $school->schoolGroup->name ?? '-',
                        'email' => $email,
                        'password' => $password,
                        'status' => 'สร้างใหม่'
                    ];
                }
                
            } catch (\Exception $e) {
                $errors++;
                $this->error("\n❌ {$school->name}: {$e->getMessage()}");
            }
            
            $bar->advance();
        }
        
        $bar->finish();
        $this->newLine(2);
        
        // Summary
        $this->info('======================');
        $this->info('📋 สรุปผล');
        $this->info('======================');
        $this->info("✅ สร้างใหม่: {$created} คน");
        if ($force) {
            $this->info("🔄 อัพเดท: {$updated} คน");
        }
        $this->info("⏭️  ข้าม: {$skipped} คน");
        $this->info("❌ ผิดพลาด: {$errors} คน");
        $this->newLine();
        
        // Show accounts table
        if (!empty($accounts)) {
            $this->table(
                ['โรงเรียน', 'กลุ่ม', 'อีเมล', 'รหัสผ่าน', 'สถานะ'],
                array_map(function($account) {
                    return [
                        Str::limit($account['school'], 30),
                        Str::limit($account['group'], 20),
                        $account['email'],
                        $account['password'],
                        $account['status']
                    ];
                }, $accounts)
            );
        }
        
        // Generate CSV
        $this->newLine();
        if ($this->confirm('ต้องการสร้างไฟล์ CSV หรือไม่?', true)) {
            $csvPath = $this->generateCSV($schools, $password);
            $this->info("📄 สร้างไฟล์: {$csvPath}");
        }
        
        return 0;
    }
    
    private function generateEmail(string $schoolName, int $schoolId): string
    {
        $slug = Str::slug($schoolName, '-');
        
        if (empty($slug) || strlen($slug) < 3) {
            $slug = "school-{$schoolId}";
        }
        
        return "{$slug}@compet.site";
    }
    
    private function generateCSV($schools, $password): string
    {
        $csvPath = storage_path('app/school_admin_accounts_' . date('Y-m-d_His') . '.csv');
        
        $fp = fopen($csvPath, 'w');
        fprintf($fp, chr(0xEF).chr(0xBB).chr(0xBF));
        
        fputcsv($fp, [
            'ลำดับ',
            'ชื่อโรงเรียน',
            'กลุ่มโรงเรียน',
            'อีเมล',
            'รหัสผ่าน',
            'ลิงก์เข้าระบบ'
        ]);
        
        $index = 1;
        foreach ($schools as $school) {
            $email = $this->generateEmail($school->name, $school->id);
            
            fputcsv($fp, [
                $index++,
                $school->name,
                $school->schoolGroup->name ?? '-',
                $email,
                $password,
                'http://localhost:3000/login'
            ]);
        }
        
        fclose($fp);
        
        return $csvPath;
    }
}
