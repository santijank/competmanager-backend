<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class BackupDatabase extends Command
{
    protected $signature = 'db:backup
                            {--local : Force use local database config}
                            {--show-config : Show current database configuration}';
    protected $description = 'สำรองข้อมูล Database ไปยัง Storage';

    public function handle()
    {
        // แสดง config ถ้าต้องการ
        if ($this->option('show-config')) {
            $this->showDatabaseConfig();
            return Command::SUCCESS;
        }

        $this->info('🔄 เริ่มต้นการสำรองข้อมูล...');
        $this->showDatabaseConfig();

        // ตรวจสอบ connection ก่อน
        if (!$this->checkConnection()) {
            return Command::FAILURE;
        }

        try {
            $database = config('database.connections.mysql.database');

            // สร้างชื่อไฟล์ backup
            $timestamp = now()->format('Y-m-d_H-i-s');
            $filename = "backup_{$database}_{$timestamp}.sql";
            $backupPath = storage_path("app/backups/{$filename}");

            // สร้างโฟลเดอร์ถ้ายังไม่มี
            if (!file_exists(storage_path('app/backups'))) {
                mkdir(storage_path('app/backups'), 0755, true);
            }

            // ใช้ PHP backup
            $this->info('📦 กำลังสำรองข้อมูล...');
            $this->phpBackup($backupPath);

            // ตรวจสอบไฟล์
            if (file_exists($backupPath) && filesize($backupPath) > 0) {
                $filesize = $this->formatBytes(filesize($backupPath));
                $this->newLine();
                $this->info("✅ สำรองข้อมูลสำเร็จ!");
                $this->info("   📁 ไฟล์: {$filename}");
                $this->info("   📊 ขนาด: {$filesize}");
                $this->info("   📂 ตำแหน่ง: storage/app/backups/");

                // Log การ backup
                Log::channel('daily')->info('Database backup completed', [
                    'filename' => $filename,
                    'size' => $filesize,
                    'timestamp' => now()->toDateTimeString(),
                ]);

                // ลบ backup เก่าที่เกิน 7 วัน
                $this->cleanOldBackups();

                return Command::SUCCESS;
            } else {
                throw new \Exception('Backup file is empty or not created');
            }

        } catch (\Exception $e) {
            $this->error('❌ เกิดข้อผิดพลาด: ' . $e->getMessage());
            Log::channel('daily')->error('Database backup failed', [
                'error' => $e->getMessage(),
                'timestamp' => now()->toDateTimeString(),
            ]);

            return Command::FAILURE;
        }
    }

    /**
     * แสดง database config ปัจจุบัน
     */
    private function showDatabaseConfig()
    {
        $host = config('database.connections.mysql.host');
        $port = config('database.connections.mysql.port');
        $database = config('database.connections.mysql.database');
        $username = config('database.connections.mysql.username');

        $this->newLine();
        $this->info('📋 Database Configuration:');
        $this->line("   Host: {$host}");
        $this->line("   Port: {$port}");
        $this->line("   Database: {$database}");
        $this->line("   Username: {$username}");
        $this->newLine();
    }

    /**
     * ตรวจสอบ database connection
     */
    private function checkConnection(): bool
    {
        try {
            DB::connection()->getPdo();
            $this->info('✅ Database connection OK');
            return true;
        } catch (\Exception $e) {
            $this->error('❌ ไม่สามารถเชื่อมต่อ Database ได้');
            $this->error('   ' . $e->getMessage());
            $this->newLine();
            $this->warn('💡 คำแนะนำ:');
            $this->line('   1. ตรวจสอบว่า MySQL Server กำลังทำงาน');
            $this->line('   2. ตรวจสอบค่า DB_HOST, DB_PORT, DB_DATABASE ใน .env');
            $this->line('   3. สำหรับ Railway: ใช้ค่าจาก Railway Variables');
            $this->newLine();
            $this->line('   รัน: php artisan db:backup --show-config เพื่อดูค่าปัจจุบัน');
            return false;
        }
    }

    /**
     * PHP-based backup
     */
    private function phpBackup($backupPath)
    {
        $tables = DB::select('SHOW TABLES');
        $database = config('database.connections.mysql.database');
        $tableKey = "Tables_in_{$database}";

        $sql = "-- =============================================\n";
        $sql .= "-- Database Backup\n";
        $sql .= "-- Generated: " . now()->toDateTimeString() . "\n";
        $sql .= "-- Database: {$database}\n";
        $sql .= "-- Host: " . config('database.connections.mysql.host') . "\n";
        $sql .= "-- =============================================\n\n";
        $sql .= "SET FOREIGN_KEY_CHECKS=0;\n";
        $sql .= "SET SQL_MODE='NO_AUTO_VALUE_ON_ZERO';\n";
        $sql .= "SET AUTOCOMMIT=0;\n";
        $sql .= "START TRANSACTION;\n\n";

        $bar = $this->output->createProgressBar(count($tables));
        $bar->setFormat(' %current%/%max% [%bar%] %percent:3s%% -- %message%');

        $totalRows = 0;

        foreach ($tables as $table) {
            $tableName = $table->$tableKey;
            $bar->setMessage($tableName);

            // Get CREATE TABLE statement
            $createTable = DB::select("SHOW CREATE TABLE `{$tableName}`");
            $sql .= "-- ----------------------------------------\n";
            $sql .= "-- Table: {$tableName}\n";
            $sql .= "-- ----------------------------------------\n";
            $sql .= "DROP TABLE IF EXISTS `{$tableName}`;\n";
            $sql .= $createTable[0]->{'Create Table'} . ";\n\n";

            // Get table data
            $rows = DB::table($tableName)->get();
            $rowCount = $rows->count();
            $totalRows += $rowCount;

            if ($rowCount > 0) {
                $columns = array_keys((array)$rows->first());
                $columnList = '`' . implode('`, `', $columns) . '`';

                $sql .= "-- Data: {$rowCount} rows\n";

                foreach ($rows->chunk(100) as $chunk) {
                    $values = [];
                    foreach ($chunk as $row) {
                        $rowValues = array_map(function ($value) {
                            if (is_null($value)) {
                                return 'NULL';
                            }
                            return "'" . addslashes($value) . "'";
                        }, (array)$row);
                        $values[] = '(' . implode(', ', $rowValues) . ')';
                    }
                    $sql .= "INSERT INTO `{$tableName}` ({$columnList}) VALUES\n";
                    $sql .= implode(",\n", $values) . ";\n";
                }
                $sql .= "\n";
            } else {
                $sql .= "-- (empty table)\n\n";
            }

            $bar->advance();
        }

        $sql .= "SET FOREIGN_KEY_CHECKS=1;\n";
        $sql .= "COMMIT;\n";
        $sql .= "\n-- Backup completed: " . count($tables) . " tables, {$totalRows} total rows\n";

        $bar->finish();
        $this->newLine();
        $this->info("   📊 Tables: " . count($tables) . ", Total Rows: {$totalRows}");

        // Write to file
        file_put_contents($backupPath, $sql);
    }

    /**
     * ลบ backup เก่าที่เกิน 7 วัน
     */
    private function cleanOldBackups()
    {
        $backupDir = storage_path('app/backups');
        $files = glob($backupDir . '/backup_*.sql');
        $now = time();
        $retentionDays = 7;

        $deletedCount = 0;
        foreach ($files as $file) {
            if (is_file($file) && ($now - filemtime($file)) > ($retentionDays * 24 * 60 * 60)) {
                unlink($file);
                $deletedCount++;
            }
        }

        if ($deletedCount > 0) {
            $this->info("   🗑️ ลบ backup เก่า {$deletedCount} ไฟล์");
        }
    }

    /**
     * Format bytes to human readable
     */
    private function formatBytes($bytes, $precision = 2)
    {
        $units = ['B', 'KB', 'MB', 'GB'];
        $bytes = max($bytes, 0);
        $pow = floor(($bytes ? log($bytes) : 0) / log(1024));
        $pow = min($pow, count($units) - 1);
        $bytes /= pow(1024, $pow);

        return round($bytes, $precision) . ' ' . $units[$pow];
    }
}
