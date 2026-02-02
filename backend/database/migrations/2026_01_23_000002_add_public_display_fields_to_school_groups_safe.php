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
        Schema::table('school_groups', function (Blueprint $table) {
            // เช็คและเพิ่ม column ที่ยังไม่มี
            if (!Schema::hasColumn('school_groups', 'color')) {
                $table->string('color')->default('blue')->after('name');
            }
            
            if (!Schema::hasColumn('school_groups', 'icon')) {
                $table->string('icon')->default('🏫')->after('color');
            }
            
            if (!Schema::hasColumn('school_groups', 'description')) {
                $table->text('description')->nullable()->after('icon');
            }
            
            if (!Schema::hasColumn('school_groups', 'total_schools')) {
                $table->integer('total_schools')->default(0)->after('description');
            }
            
            if (!Schema::hasColumn('school_groups', 'total_students')) {
                $table->integer('total_students')->default(0)->after('total_schools');
            }
            
            if (!Schema::hasColumn('school_groups', 'total_competitions')) {
                $table->integer('total_competitions')->default(0)->after('total_students');
            }
            
            if (!Schema::hasColumn('school_groups', 'passed_district')) {
                $table->integer('passed_district')->default(0)->after('total_competitions');
            }
            
            if (!Schema::hasColumn('school_groups', 'gold_medals')) {
                $table->integer('gold_medals')->default(0)->after('passed_district');
            }
            
            if (!Schema::hasColumn('school_groups', 'silver_medals')) {
                $table->integer('silver_medals')->default(0)->after('gold_medals');
            }
            
            if (!Schema::hasColumn('school_groups', 'bronze_medals')) {
                $table->integer('bronze_medals')->default(0)->after('silver_medals');
            }
            
            if (!Schema::hasColumn('school_groups', 'display_order')) {
                $table->integer('display_order')->default(0)->after('bronze_medals');
            }
            
            if (!Schema::hasColumn('school_groups', 'is_active')) {
                $table->boolean('is_active')->default(true)->after('display_order');
            }
        });
        
        // เพิ่ม index (ถ้ายังไม่มี)
        $indexExists = collect(DB::select("SHOW INDEX FROM school_groups WHERE Key_name = 'school_groups_is_active_display_order_index'"))->isNotEmpty();
        
        if (!$indexExists) {
            Schema::table('school_groups', function (Blueprint $table) {
                $table->index(['is_active', 'display_order']);
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('school_groups', function (Blueprint $table) {
            // ลบ column ที่มีอยู่
            $columnsToRemove = [
                'color',
                'icon',
                'description',
                'total_schools',
                'total_students',
                'total_competitions',
                'passed_district',
                'gold_medals',
                'silver_medals',
                'bronze_medals',
                'display_order',
                'is_active'
            ];
            
            foreach ($columnsToRemove as $column) {
                if (Schema::hasColumn('school_groups', $column)) {
                    $table->dropColumn($column);
                }
            }
            
            // ลบ index
            $indexExists = collect(DB::select("SHOW INDEX FROM school_groups WHERE Key_name = 'school_groups_is_active_display_order_index'"))->isNotEmpty();
            
            if ($indexExists) {
                $table->dropIndex(['is_active', 'display_order']);
            }
        });
    }
};
