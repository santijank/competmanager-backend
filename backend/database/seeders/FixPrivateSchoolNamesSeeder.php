<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\School;
use App\Models\User;

class FixPrivateSchoolNamesSeeder extends Seeder
{
    public function run(): void
    {
        $fixes = [
            ['code' => 'PRI004', 'old' => 'โรงเรียนอนุบาลไพวิทยา', 'new' => 'โรงเรียนอนุบาลไผทวิทยา'],
            ['code' => 'PRI017', 'old' => 'โรงเรียนอนุบาลณัฎฐดุตา', 'new' => 'โรงเรียนอนุบาลณัฐกฤษา(แพรววิทยา)'],
        ];

        foreach ($fixes as $fix) {
            $school = School::where('code', $fix['code'])->first();
            if ($school) {
                $school->update(['name' => $fix['new']]);

                // อัพเดทชื่อ user ด้วย
                $user = User::where('school_id', $school->id)->first();
                if ($user) {
                    $user->update(['name' => 'ผู้ดูแล ' . $fix['new']]);
                }

                $this->command->info("✅ {$fix['code']}: {$fix['old']} → {$fix['new']}");
            } else {
                $this->command->warn("⚠️ ไม่พบโรงเรียน code: {$fix['code']}");
            }
        }

        $this->command->info("\n🎉 แก้ไขชื่อโรงเรียนเอกชนเรียบร้อย!");
    }
}
