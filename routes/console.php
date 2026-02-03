<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

/**
 * ===================================
 * 📅 Scheduled Tasks (Cron Jobs)
 * ===================================
 *
 * Railway จะรัน schedule ผ่าน:
 * php artisan schedule:run
 *
 * ตั้งค่าใน railway.json หรือ Procfile
 */

// 🔄 Database Backup - ทุกวันเที่ยงคืน (00:00)
Schedule::command('db:backup')
    ->dailyAt('00:00')
    ->timezone('Asia/Bangkok')
    ->onSuccess(function () {
        \Log::channel('daily')->info('✅ Scheduled backup completed successfully');
    })
    ->onFailure(function () {
        \Log::channel('daily')->error('❌ Scheduled backup failed');
    })
    ->appendOutputTo(storage_path('logs/backup.log'));

// 🗑️ ลบ log เก่า - ทุกสัปดาห์ วันจันทร์ตี 1
Schedule::command('log:clear')
    ->weeklyOn(1, '01:00')
    ->timezone('Asia/Bangkok');

// 🧹 Clear cache - ทุกวัน ตี 2
Schedule::command('cache:clear')
    ->dailyAt('02:00')
    ->timezone('Asia/Bangkok');
