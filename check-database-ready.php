<?php
// check-database-ready.php - ตรวจสอบความพร้อมฐานข้อมูล
require_once __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "🔍 ตรวจสอบความพร้อมฐานข้อมูล CompetManager\n";
echo "===============================================\n\n";

try {
    // 1. ตรวจสอบการเชื่อมต่อฐานข้อมูล
    echo "1. 🔌 การเชื่อมต่อฐานข้อมูล:\n";
    DB::connection()->getPdo();
    echo "   ✅ เชื่อมต่อสำเร็จ\n";
    echo "   📊 Database: " . DB::connection()->getDatabaseName() . "\n\n";
    
    // 2. ตรวจสอบจำนวน Users
    echo "2. 👥 ข้อมูล Users:\n";
    $totalUsers = DB::table('users')->count();
    $districtAdmins = DB::table('users')->where('role', 'district_admin')->count();
    $groupAdmins = DB::table('users')->where('role', 'group_admin')->count();  
    $schoolAdmins = DB::table('users')->where('role', 'school_admin')->count();
    
    echo "   📈 ผู้ใช้ทั้งหมด: {$totalUsers} คน\n";
    echo "   🏛️  District Admin: {$districtAdmins} คน\n";
    echo "   👥 Group Admin: {$groupAdmins} คน\n";
    echo "   🏫 School Admin: {$schoolAdmins} คน\n";
    
    if ($totalUsers > 0) {
        echo "   ✅ มีผู้ใช้ในระบบแล้ว\n";
    } else {
        echo "   ❌ ไม่มีผู้ใช้ในระบบ\n";
    }
    echo "\n";
    
    // 3. ตรวจสอบ Test Accounts
    echo "3. 🔑 Test Accounts:\n";
    $testAccounts = [
        'admin@compet.site' => 'District Admin',
        'group1_admin1@competmanager.local' => 'Group Admin',
        'school_1@competmanager.local' => 'School Admin'
    ];
    
    foreach ($testAccounts as $email => $role) {
        $user = DB::table('users')->where('email', $email)->first();
        if ($user) {
            echo "   ✅ {$role}: {$email} (ID: {$user->id}, Role: {$user->role})\n";
        } else {
            echo "   ❌ {$role}: {$email} - ไม่พบ\n";
        }
    }
    echo "\n";
    
    // 4. ตรวจสอบ Categories
    echo "4. 📚 ข้อมูล Categories:\n";
    $totalCategories = DB::table('categories')->count();
    echo "   📊 หมวดหมู่ทั้งหมด: {$totalCategories} หมวด\n";
    
    if ($totalCategories > 0) {
        $sampleCategories = DB::table('categories')->select('name', 'code')->limit(5)->get();
        echo "   📋 ตัวอย่าง:\n";
        foreach ($sampleCategories as $cat) {
            echo "      - {$cat->name} ({$cat->code})\n";
        }
        echo "   ✅ มีหมวดหมู่แล้ว\n";
    } else {
        echo "   ❌ ไม่มีหมวดหมู่\n";
    }
    echo "\n";
    
    // 5. ตรวจสอบ School Groups
    echo "5. 🏫 ข้อมูล School Groups:\n";
    $totalGroups = DB::table('school_groups')->count();
    echo "   📊 กลุ่มโรงเรียนทั้งหมด: {$totalGroups} กลุ่ม\n";
    
    if ($totalGroups > 0) {
        $sampleGroups = DB::table('school_groups')->select('name', 'code')->limit(5)->get();
        echo "   📋 ตัวอย่าง:\n";
        foreach ($sampleGroups as $group) {
            echo "      - {$group->name} ({$group->code})\n";
        }
        echo "   ✅ มีกลุ่มโรงเรียนแล้ว\n";
    } else {
        echo "   ❌ ไม่มีกลุ่มโรงเรียน\n";
    }
    echo "\n";
    
    // 6. ตรวจสอบ Competitions
    echo "6. 🏆 ข้อมูล Competitions:\n";
    $totalCompetitions = DB::table('competitions')->count();
    $groupCompetitions = DB::table('competitions')->whereNotNull('school_group_id')->count();
    $districtCompetitions = DB::table('competitions')->whereNull('school_group_id')->count();
    $activeCompetitions = DB::table('competitions')->where('is_active', true)->count();
    
    echo "   📊 การแข่งขันทั้งหมด: {$totalCompetitions} รายการ\n";
    echo "   🏫 ระดับกลุ่ม: {$groupCompetitions} รายการ\n";
    echo "   🏛️  ระดับเขต: {$districtCompetitions} รายการ\n";
    echo "   ✅ ที่เปิดใช้งาน: {$activeCompetitions} รายการ\n";
    
    if ($totalCompetitions > 0) {
        echo "   ✅ มีกิจกรรมการแข่งขันแล้ว\n";
        
        // แสดงตัวอย่างการแข่งขัน
        $sampleCompetitions = DB::table('competitions as c')
            ->leftJoin('categories as cat', 'c.category_id', '=', 'cat.id')
            ->leftJoin('school_groups as sg', 'c.school_group_id', '=', 'sg.id')
            ->select('c.name', 'cat.name as category_name', 'sg.name as group_name')
            ->limit(3)
            ->get();
            
        echo "   📋 ตัวอย่างการแข่งขัน:\n";
        foreach ($sampleCompetitions as $comp) {
            $group = $comp->group_name ?? 'ระดับเขต';
            echo "      - {$comp->name} ({$comp->category_name}) - {$group}\n";
        }
    } else {
        echo "   ❌ ไม่มีกิจกรรมการแข่งขัน\n";
    }
    echo "\n";
    
    // 7. ตรวจสอบ Registrations
    echo "7. 📝 ข้อมุล Registrations:\n";
    $totalRegistrations = DB::table('registrations')->count();
    $approvedRegistrations = DB::table('registrations')->where('status', 'approved')->count();
    
    echo "   📊 การลงทะเบียนทั้งหมด: {$totalRegistrations} รายการ\n";
    echo "   ✅ ที่อนุมัติแล้ว: {$approvedRegistrations} รายการ\n";
    
    if ($totalRegistrations > 0) {
        echo "   ✅ มีการลงทะเบียนแล้ว\n";
    } else {
        echo "   ⚠️  ยังไม่มีการลงทะเบียน (ปกติสำหรับระบบใหม่)\n";
    }
    echo "\n";
    
    // 8. สรุปความพร้อม
    echo "8. 🎯 สรุปความพร้อม:\n";
    
    $readyCount = 0;
    $requirements = [
        ['Users', $totalUsers > 0],
        ['Test Accounts', DB::table('users')->where('email', 'admin@compet.site')->exists()],
        ['Categories', $totalCategories > 0],
        ['School Groups', $totalGroups > 0],  
        ['Competitions', $totalCompetitions > 0]
    ];
    
    foreach ($requirements as [$item, $ready]) {
        if ($ready) {
            echo "   ✅ {$item}: พร้อม\n";
            $readyCount++;
        } else {
            echo "   ❌ {$item}: ไม่พร้อม\n";
        }
    }
    
    $readyPercentage = round(($readyCount / count($requirements)) * 100);
    echo "\n";
    echo "📊 ความพร้อมรวม: {$readyCount}/" . count($requirements) . " ({$readyPercentage}%)\n";
    
    if ($readyPercentage >= 80) {
        echo "🎉 ระบบพร้อมสำหรับการทดสอบ!\n";
        echo "\n";
        echo "🚀 ขั้นตอนถัดไป:\n";
        echo "1. Deploy Controller: copy CompetitionController-fixed.php app\\Http\\Controllers\\Api\\CompetitionController.php\n";
        echo "2. Clear Cache: php artisan cache:clear\n";
        echo "3. Start Server: php artisan serve\n";
        echo "4. Test Login: ลองเข้าระบบด้วย admin@compet.site / password\n";
    } else {
        echo "⚠️  ระบบยังไม่พร้อม - ต้องเตรียมข้อมูลเพิ่ม\n";
        if ($totalUsers == 0) {
            echo "💡 แนะนำ: รัน php setup-new-system.php เพื่อเตรียมข้อมูล\n";
        }
    }
    
} catch (Exception $e) {
    echo "❌ เกิดข้อผิดพลาด: " . $e->getMessage() . "\n";
    echo "🔧 ตรวจสอบ:\n";
    echo "   - การเชื่อมต่อฐานข้อมูลใน .env\n";
    echo "   - Laravel serve ทำงานหรือไม่\n";
    echo "   - Database ถูก import หรือไม่\n";
}

echo "\n============================================\n";
echo "✅ การตรวจสอบเสร็จสิ้น\n";
