<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // ลบข้อมูลซ้ำก่อน (เก็บเฉพาะรายการที่ approved หรือ id ต่ำสุด)
        $duplicates = DB::table('registrations')
            ->select('competition_id', 'school_id', DB::raw('MIN(id) as keep_id'))
            ->groupBy('competition_id', 'school_id')
            ->havingRaw('COUNT(*) > 1')
            ->get();

        foreach ($duplicates as $dup) {
            // เก็บรายการที่ approved ไว้ ถ้ามี
            $approvedId = DB::table('registrations')
                ->where('competition_id', $dup->competition_id)
                ->where('school_id', $dup->school_id)
                ->where('status', 'approved')
                ->value('id');

            $keepId = $approvedId ?? $dup->keep_id;

            // ลบรายการซ้ำ ยกเว้นรายการที่เก็บไว้
            DB::table('registrations')
                ->where('competition_id', $dup->competition_id)
                ->where('school_id', $dup->school_id)
                ->where('id', '!=', $keepId)
                ->delete();
        }

        // เพิ่ม unique constraint
        Schema::table('registrations', function (Blueprint $table) {
            $table->unique(['competition_id', 'school_id'], 'registrations_competition_school_unique');
        });
    }

    public function down(): void
    {
        Schema::table('registrations', function (Blueprint $table) {
            $table->dropUnique('registrations_competition_school_unique');
        });
    }
};
