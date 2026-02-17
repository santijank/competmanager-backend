<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Category;
use Illuminate\Support\Facades\Hash;

class CategoryScopedUsersSeeder extends Seeder
{
    /**
     * สร้าง users สำหรับ category-scoped roles
     * - 1 super admin (admin) - เห็นทุกหมวดหมู่
     * - 1 category_admin + 5 data_entry ต่อหมวดหมู่
     * Password: password123
     */
    public function run(): void
    {
        $password = Hash::make('password123');

        // 1. สร้าง Super Admin (ถ้ายังไม่มี)
        $superAdmin = User::firstOrCreate(
            ['email' => 'superadmin@competmanager.com'],
            [
                'name' => 'Super Admin',
                'password' => $password,
                'role' => 'admin',
                'is_active' => true,
            ]
        );
        $this->command->info("✅ Super Admin: {$superAdmin->email}");

        // 2. สร้าง category_admin + data_entry ต่อหมวดหมู่
        $categories = Category::where('is_active', true)->orderBy('order')->get();

        foreach ($categories as $category) {
            $code = strtolower($category->code);

            // สร้าง category_admin
            $admin = User::firstOrCreate(
                ['email' => "cat_admin_{$code}@competmanager.com"],
                [
                    'name' => "Admin {$category->name}",
                    'password' => $password,
                    'role' => 'category_admin',
                    'category_id' => $category->id,
                    'is_active' => true,
                ]
            );
            // อัพเดท category_id ถ้ามีอยู่แล้ว
            if (!$admin->wasRecentlyCreated) {
                $admin->update(['category_id' => $category->id, 'role' => 'category_admin']);
            }

            // สร้าง data_entry 5 คน
            for ($i = 1; $i <= 5; $i++) {
                $entry = User::firstOrCreate(
                    ['email' => "data_{$code}_{$i}@competmanager.com"],
                    [
                        'name' => "ทีมบันทึก {$i} {$category->name}",
                        'password' => $password,
                        'role' => 'data_entry',
                        'category_id' => $category->id,
                        'is_active' => true,
                    ]
                );
                if (!$entry->wasRecentlyCreated) {
                    $entry->update(['category_id' => $category->id, 'role' => 'data_entry']);
                }
            }

            $this->command->info("✅ Category [{$category->code}]: 1 admin + 5 data_entry");
        }

        $totalCategories = $categories->count();
        $this->command->info("🎉 สร้าง users สำเร็จ: 1 super admin + {$totalCategories} categories x 6 users = " . (1 + $totalCategories * 6) . " users");
    }
}
