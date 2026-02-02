<?php
// debug-competition-system.php
// วางไฟล์นี้ในโฟลเดอร์ root ของ Laravel project แล้วรัน: php debug-competition-system.php

require_once __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "🔍 ตรวจสอบระบบ CompetManager - Competition Filtering\n";
echo "=====================================================\n\n";

// 1. Database Connection
try {
    DB::connection()->getPdo();
    echo "✅ Database: เชื่อมต่อสำเร็จ\n\n";
} catch (Exception $e) {
    echo "❌ Database: เชื่อมต่อไม่ได้ - " . $e->getMessage() . "\n\n";
    exit;
}

// 2. ตรวจสอบ Users และ Roles
echo "👥 Users และ Roles:\n";
echo "-" . str_repeat("-", 50) . "\n";

$usersByRole = DB::table('users')
    ->select('role', DB::raw('count(*) as count'))
    ->groupBy('role')
    ->get();

foreach ($usersByRole as $roleData) {
    echo sprintf("   %-15s: %d คน\n", $roleData->role, $roleData->count);
}

// ตรวจสอบ admin accounts
$adminAccounts = DB::table('users')
    ->whereIn('role', ['admin', 'district_admin', 'group_admin'])
    ->select('id', 'name', 'email', 'role', 'school_group_id')
    ->get();

echo "\n🔑 Admin Accounts:\n";
if ($adminAccounts->count() === 0) {
    echo "   ❌ ไม่พบ Admin accounts!\n";
} else {
    foreach ($adminAccounts as $admin) {
        $group = $admin->school_group_id ? "กลุ่ม {$admin->school_group_id}" : "ทุกกลุ่ม";
        echo sprintf("   %-15s: %s (%s) - %s\n", 
            $admin->role, $admin->name, $admin->email, $group);
    }
}

// ตรวจสอบ school_admin accounts
$schoolAdmins = DB::table('users')
    ->where('role', 'school_admin')
    ->select('id', 'name', 'email', 'school_group_id')
    ->get();

echo "\n🏫 School Admin Accounts:\n";
$schoolAdminsWithoutGroup = 0;
foreach ($schoolAdmins as $sa) {
    $group = $sa->school_group_id ? "กลุ่ม {$sa->school_group_id}" : "⚠️ ไม่มีกลุ่ม";
    echo sprintf("   %s (%s) - %s\n", $sa->name, $sa->email, $group);
    if (!$sa->school_group_id) {
        $schoolAdminsWithoutGroup++;
    }
}
echo "\n";

// 3. ตรวจสอบ School Groups
echo "🏫 School Groups:\n";
echo "-" . str_repeat("-", 50) . "\n";

$schoolGroups = DB::table('school_groups')->get(['id', 'name']);
foreach ($schoolGroups as $group) {
    $schoolsCount = DB::table('schools')->where('school_group_id', $group->id)->count();
    $usersCount = DB::table('users')->where('school_group_id', $group->id)->count();
    echo sprintf("   กลุ่ม %d: %s (%d โรงเรียน, %d users)\n", 
        $group->id, $group->name, $schoolsCount, $usersCount);
}
echo "\n";

// 4. ตรวจสอบ Competitions
echo "🏆 Competitions:\n";
echo "-" . str_repeat("-", 50) . "\n";

$totalCompetitions = DB::table('competitions')->count();
$competitionsByGroup = DB::table('competitions')
    ->leftJoin('school_groups', 'competitions.school_group_id', '=', 'school_groups.id')
    ->select('competitions.school_group_id', 'school_groups.name', DB::raw('count(*) as count'))
    ->groupBy('competitions.school_group_id', 'school_groups.name')
    ->get();

echo "รวมทั้งหมด: {$totalCompetitions} การแข่งขัน\n";
foreach ($competitionsByGroup as $groupData) {
    if ($groupData->school_group_id) {
        echo sprintf("   กลุ่ม %d (%s): %d การแข่งขัน\n", 
            $groupData->school_group_id, $groupData->name, $groupData->count);
    } else {
        echo sprintf("   สาธารณะ (NULL): %d การแข่งขัน\n", $groupData->count);
    }
}
echo "\n";

// 5. ทดสอบ Filtering Logic
echo "🧪 ทดสอบ Filtering Logic:\n";
echo "-" . str_repeat("-", 50) . "\n";

// ทดสอบ School Admin filtering
$testSchoolAdmin = DB::table('users')->where('role', 'school_admin')->first();
if ($testSchoolAdmin) {
    echo "ทดสอบ School Admin: {$testSchoolAdmin->name}\n";
    echo "   school_group_id: " . ($testSchoolAdmin->school_group_id ?? 'NULL') . "\n";
    
    if ($testSchoolAdmin->school_group_id) {
        $visibleCompetitions = DB::table('competitions')
            ->where('school_group_id', $testSchoolAdmin->school_group_id)
            ->count();
        echo "   ควรเห็น: {$visibleCompetitions} การแข่งขัน (เฉพาะกลุ่ม {$testSchoolAdmin->school_group_id})\n";
    } else {
        $visibleCompetitions = DB::table('competitions')->whereNull('school_group_id')->count();
        echo "   ควรเห็น: {$visibleCompetitions} การแข่งขัน (เฉพาะสาธารณะ)\n";
    }
}

// ทดสอบ Group Admin filtering
$testGroupAdmin = DB::table('users')->where('role', 'group_admin')->first();
if ($testGroupAdmin) {
    echo "\nทดสอบ Group Admin: {$testGroupAdmin->name}\n";
    echo "   school_group_id: " . ($testGroupAdmin->school_group_id ?? 'NULL') . "\n";
    
    if ($testGroupAdmin->school_group_id) {
        $visibleCompetitions = DB::table('competitions')
            ->where('school_group_id', $testGroupAdmin->school_group_id)
            ->count();
        echo "   ควรเห็น: {$visibleCompetitions} การแข่งขัน (เฉพาะกลุ่ม {$testGroupAdmin->school_group_id})\n";
    }
}

// ทดสอบ District Admin
$testDistrictAdmin = DB::table('users')->where('role', 'district_admin')->first();
if ($testDistrictAdmin) {
    echo "\nทดสอบ District Admin: {$testDistrictAdmin->name}\n";
    echo "   ควรเห็น: {$totalCompetitions} การแข่งขัน (ทั้งหมด)\n";
}
echo "\n";

// 6. สรุปปัญหาและแนะนำการแก้ไข
echo "🛠️ สรุปปัญหาและการแก้ไข:\n";
echo "=" . str_repeat("=", 50) . "\n";

$issues = [];

if ($adminAccounts->count() === 0) {
    $issues[] = "❗ ไม่มี Admin accounts - รัน: php fix-admin-login.php";
}

if ($schoolAdminsWithoutGroup > 0) {
    $issues[] = "⚠️ มี {$schoolAdminsWithoutGroup} School Admin ที่ไม่มี school_group_id";
}

$competitionsWithoutGroup = DB::table('competitions')->whereNull('school_group_id')->count();
if ($competitionsWithoutGroup === $totalCompetitions) {
    $issues[] = "⚠️ ทุกการแข่งขันเป็นแบบสาธารณะ (school_group_id = NULL)";
} elseif ($competitionsWithoutGroup === 0) {
    $issues[] = "⚠️ ไม่มีการแข่งขันสาธารณะ";
}

if (empty($issues)) {
    echo "✅ ไม่พบปัญหาเด่นชัด\n";
} else {
    foreach ($issues as $issue) {
        echo "   {$issue}\n";
    }
}

echo "\n📋 คำแนะนำการแก้ไข:\n";
echo "-" . str_repeat("-", 50) . "\n";
echo "1. รัน: php fix-admin-login.php (แก้ไข admin accounts)\n";
echo "2. ตรวจสอบ CompetitionController.php (filtering logic)\n";
echo "3. ตรวจสอบ frontend error handling\n";
echo "4. Clear cache: php artisan cache:clear\n";
echo "5. ตรวจสอบ logs: tail -f storage/logs/laravel.log\n";

echo "\n" . str_repeat("=", 60) . "\n";
echo "🏁 การตรวจสอบเสร็จสิ้น\n";
echo str_repeat("=", 60) . "\n";
