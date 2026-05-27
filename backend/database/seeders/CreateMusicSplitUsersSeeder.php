<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;

class CreateMusicSplitUsersSeeder extends Seeder
{
    public function run(): void
    {
        $hash = bcrypt('password123');

        $users = [
            ['name' => 'Admin ดนตรี-ขับร้อง', 'email' => 'cat_admin_music_singing@competmanager.com', 'role' => 'category_admin', 'category_id' => 12, 'competition_name_filter' => 'ขับร้อง'],
            ['name' => 'พิมพ์ข้อมูล ดนตรี-ขับร้อง', 'email' => 'data_music_singing@competmanager.com', 'role' => 'data_entry', 'category_id' => 12, 'competition_name_filter' => 'ขับร้อง'],
            ['name' => 'Admin ดนตรี-อื่นๆ', 'email' => 'cat_admin_music_other@competmanager.com', 'role' => 'category_admin', 'category_id' => 12, 'competition_name_filter' => '!ขับร้อง'],
            ['name' => 'พิมพ์ข้อมูล ดนตรี-อื่นๆ', 'email' => 'data_music_other@competmanager.com', 'role' => 'data_entry', 'category_id' => 12, 'competition_name_filter' => '!ขับร้อง'],
        ];

        foreach ($users as $u) {
            if (!User::where('email', $u['email'])->exists()) {
                User::create(array_merge($u, ['password' => $hash, 'is_active' => true]));
                $this->command->info('Created: ' . $u['email']);
            } else {
                $this->command->warn('Already exists: ' . $u['email']);
            }
        }
    }
}
