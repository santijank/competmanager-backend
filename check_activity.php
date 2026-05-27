<?php
require __DIR__ . '/backend/vendor/autoload.php';

$app = require_once __DIR__ . '/backend/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

$activities = DB::table('competition_activities')
    ->select('activity_id', 'activity_name_th', 'level', 'group_number')
    ->where('activity_name_th', 'LIKE', '%การใช้เชิงทัศน์%')
    ->orWhere('activity_name_th', 'LIKE', '%ใช้เชิงทัศน์%')
    ->orderBy('level')
    ->orderBy('group_number')
    ->get();

foreach ($activities as $act) {
    echo "ID: {$act->activity_id} | Level: {$act->level} | Group: {$act->group_number}\n";
    echo "Name: {$act->activity_name_th}\n";
    echo str_repeat('-', 80) . "\n";
}
