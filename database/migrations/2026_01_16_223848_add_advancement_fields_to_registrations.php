<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('registrations', function (Blueprint $table) {
            // Advancement tracking - ตรวจสอบก่อนเพิ่ม
            if (!Schema::hasColumn('registrations', 'source_result_id')) {
                $table->unsignedBigInteger('source_result_id')->nullable()->after('status');
            }
            
            if (!Schema::hasColumn('registrations', 'auto_generated')) {
                $table->boolean('auto_generated')->default(false)->after('source_result_id');
            }
            
            if (!Schema::hasColumn('registrations', 'advancement_rank')) {
                $table->integer('advancement_rank')->nullable()->after('auto_generated');
            }
        });

        // Add foreign key ถ้ายังไม่มี
        if (Schema::hasColumn('registrations', 'source_result_id')) {
            $foreignKeyName = 'registrations_source_result_id_foreign';
            
            // ตรวจสอบว่ามี foreign key แล้วหรือยัง
            $hasForeignKey = DB::select(
                "SELECT CONSTRAINT_NAME 
                FROM information_schema.KEY_COLUMN_USAGE 
                WHERE TABLE_SCHEMA = DATABASE() 
                AND TABLE_NAME = 'registrations' 
                AND COLUMN_NAME = 'source_result_id' 
                AND REFERENCED_TABLE_NAME = 'results'"
            );

            if (empty($hasForeignKey)) {
                Schema::table('registrations', function (Blueprint $table) {
                    $table->foreign('source_result_id')
                          ->references('id')
                          ->on('results')
                          ->onDelete('set null');
                });
            }
        }

        // Add index ถ้ายังไม่มี
        if (Schema::hasColumn('registrations', 'auto_generated')) {
            $indexName = 'registrations_auto_generated_index';
            
            // ตรวจสอบว่ามี index แล้วหรือยัง
            $hasIndex = DB::select(
                "SHOW INDEX FROM registrations WHERE Key_name = ?",
                [$indexName]
            );

            if (empty($hasIndex)) {
                Schema::table('registrations', function (Blueprint $table) {
                    $table->index('auto_generated');
                });
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Drop foreign key ถ้ามี
        $hasForeignKey = DB::select(
            "SELECT CONSTRAINT_NAME 
            FROM information_schema.KEY_COLUMN_USAGE 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = 'registrations' 
            AND COLUMN_NAME = 'source_result_id' 
            AND REFERENCED_TABLE_NAME = 'results'"
        );

        if (!empty($hasForeignKey)) {
            Schema::table('registrations', function (Blueprint $table) {
                $table->dropForeign(['source_result_id']);
            });
        }
        
        // Drop index ถ้ามี
        $hasIndex = DB::select(
            "SHOW INDEX FROM registrations WHERE Key_name = 'registrations_auto_generated_index'"
        );

        if (!empty($hasIndex)) {
            Schema::table('registrations', function (Blueprint $table) {
                $table->dropIndex(['auto_generated']);
            });
        }

        // Drop columns ถ้ามี
        Schema::table('registrations', function (Blueprint $table) {
            if (Schema::hasColumn('registrations', 'source_result_id')) {
                $table->dropColumn('source_result_id');
            }
            if (Schema::hasColumn('registrations', 'auto_generated')) {
                $table->dropColumn('auto_generated');
            }
            if (Schema::hasColumn('registrations', 'advancement_rank')) {
                $table->dropColumn('advancement_rank');
            }
        });
    }
};