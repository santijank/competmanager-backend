<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('competitions', function (Blueprint $table) {
            // เพิ่ม column สำหรับประกาศผล
            $table->boolean('is_published')->default(false)
                ->after('finalized_at')
                ->comment('สถานะว่าประกาศผลแล้วหรือยัง');
            
            $table->timestamp('published_at')->nullable()
                ->after('is_published')
                ->comment('วันเวลาที่ประกาศผล');
            
            // เพิ่ม index เพื่อเพิ่มความเร็วในการ query
            $table->index('is_published');
            $table->index('published_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('competitions', function (Blueprint $table) {
            // ลบ indexes
            $table->dropIndex(['is_published']);
            $table->dropIndex(['published_at']);
            
            // ลบ columns
            $table->dropColumn(['is_published', 'published_at']);
        });
    }
};
