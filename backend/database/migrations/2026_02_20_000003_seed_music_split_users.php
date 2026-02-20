<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

return new class extends Migration
{
    public function up(): void
    {
        $hash = Hash::make('password123');

        $users = [
            // ชุดขับร้อง: 1 admin + 5 data_entry
            ['name' => 'Admin ดนตรี-ขับร้อง', 'email' => 'cat_admin_music_singing@competmanager.com', 'role' => 'category_admin', 'category_id' => 12, 'competition_name_filter' => 'ขับร้อง'],
            ['name' => 'พิมพ์ข้อมูล ดนตรี-ขับร้อง 1', 'email' => 'data_music_singing1@competmanager.com', 'role' => 'data_entry', 'category_id' => 12, 'competition_name_filter' => 'ขับร้อง'],
            ['name' => 'พิมพ์ข้อมูล ดนตรี-ขับร้อง 2', 'email' => 'data_music_singing2@competmanager.com', 'role' => 'data_entry', 'category_id' => 12, 'competition_name_filter' => 'ขับร้อง'],
            ['name' => 'พิมพ์ข้อมูล ดนตรี-ขับร้อง 3', 'email' => 'data_music_singing3@competmanager.com', 'role' => 'data_entry', 'category_id' => 12, 'competition_name_filter' => 'ขับร้อง'],
            ['name' => 'พิมพ์ข้อมูล ดนตรี-ขับร้อง 4', 'email' => 'data_music_singing4@competmanager.com', 'role' => 'data_entry', 'category_id' => 12, 'competition_name_filter' => 'ขับร้อง'],
            ['name' => 'พิมพ์ข้อมูล ดนตรี-ขับร้อง 5', 'email' => 'data_music_singing5@competmanager.com', 'role' => 'data_entry', 'category_id' => 12, 'competition_name_filter' => 'ขับร้อง'],
            // ชุดอื่นๆ: 1 admin + 5 data_entry
            ['name' => 'Admin ดนตรี-อื่นๆ', 'email' => 'cat_admin_music_other@competmanager.com', 'role' => 'category_admin', 'category_id' => 12, 'competition_name_filter' => '!ขับร้อง'],
            ['name' => 'พิมพ์ข้อมูล ดนตรี-อื่นๆ 1', 'email' => 'data_music_other1@competmanager.com', 'role' => 'data_entry', 'category_id' => 12, 'competition_name_filter' => '!ขับร้อง'],
            ['name' => 'พิมพ์ข้อมูล ดนตรี-อื่นๆ 2', 'email' => 'data_music_other2@competmanager.com', 'role' => 'data_entry', 'category_id' => 12, 'competition_name_filter' => '!ขับร้อง'],
            ['name' => 'พิมพ์ข้อมูล ดนตรี-อื่นๆ 3', 'email' => 'data_music_other3@competmanager.com', 'role' => 'data_entry', 'category_id' => 12, 'competition_name_filter' => '!ขับร้อง'],
            ['name' => 'พิมพ์ข้อมูล ดนตรี-อื่นๆ 4', 'email' => 'data_music_other4@competmanager.com', 'role' => 'data_entry', 'category_id' => 12, 'competition_name_filter' => '!ขับร้อง'],
            ['name' => 'พิมพ์ข้อมูล ดนตรี-อื่นๆ 5', 'email' => 'data_music_other5@competmanager.com', 'role' => 'data_entry', 'category_id' => 12, 'competition_name_filter' => '!ขับร้อง'],
        ];

        foreach ($users as $u) {
            if (!DB::table('users')->where('email', $u['email'])->exists()) {
                DB::table('users')->insert(array_merge($u, [
                    'password' => $hash,
                    'is_active' => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]));
            }
        }
    }

    public function down(): void
    {
        DB::table('users')->whereIn('email', [
            'cat_admin_music_singing@competmanager.com',
            'data_music_singing1@competmanager.com',
            'data_music_singing2@competmanager.com',
            'data_music_singing3@competmanager.com',
            'data_music_singing4@competmanager.com',
            'data_music_singing5@competmanager.com',
            'cat_admin_music_other@competmanager.com',
            'data_music_other1@competmanager.com',
            'data_music_other2@competmanager.com',
            'data_music_other3@competmanager.com',
            'data_music_other4@competmanager.com',
            'data_music_other5@competmanager.com',
        ])->delete();
    }
};
