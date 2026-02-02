<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class SchoolGroupsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $now = Carbon::now();

        $schoolGroups = [
            [
                'id' => 1,
                'code' => 'GROUP-01',
                'name' => 'กลุ่มโรงเรียนบูรพาศึกษา',
                'description' => 'กลุ่มโรงเรียนบูรพาศึกษา สพป.นครปฐม เขต 1',
                'contact_person' => null,
                'contact_phone' => null,
                'contact_email' => 'group01@npt1.go.th',
                'is_active' => true,
                'deleted_at' => null,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'id' => 2,
                'code' => 'GROUP-02',
                'name' => 'กลุ่มโรงเรียนเมืองนครปฐม',
                'description' => 'กลุ่มโรงเรียนเมืองนครปฐม สพป.นครปฐม เขต 1',
                'contact_person' => null,
                'contact_phone' => null,
                'contact_email' => 'group02@npt1.go.th',
                'is_active' => true,
                'deleted_at' => null,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'id' => 3,
                'code' => 'GROUP-03',
                'name' => 'กลุ่มโรงเรียนปฐมนคร',
                'description' => 'กลุ่มโรงเรียนปฐมนคร สพป.นครปฐม เขต 1',
                'contact_person' => null,
                'contact_phone' => null,
                'contact_email' => 'group03@npt1.go.th',
                'is_active' => true,
                'deleted_at' => null,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'id' => 4,
                'code' => 'GROUP-04',
                'name' => 'กลุ่มโรงเรียนพระปฐมเจดีย์',
                'description' => 'กลุ่มโรงเรียนพระปฐมเจดีย์ สพป.นครปฐม เขต 1',
                'contact_person' => null,
                'contact_phone' => null,
                'contact_email' => 'group04@npt1.go.th',
                'is_active' => true,
                'deleted_at' => null,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'id' => 5,
                'code' => 'GROUP-05',
                'name' => 'กลุ่มโรงเรียนกำแพงแสน 4',
                'description' => 'กลุ่มโรงเรียนกำแพงแสน 4 สพป.นครปฐม เขต 1',
                'contact_person' => null,
                'contact_phone' => null,
                'contact_email' => 'group05@npt1.go.th',
                'is_active' => true,
                'deleted_at' => null,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'id' => 6,
                'code' => 'GROUP-06',
                'name' => 'กลุ่มโรงเรียนกำแพงแสน 1',
                'description' => 'กลุ่มโรงเรียนกำแพงแสน 1 สพป.นครปฐม เขต 1',
                'contact_person' => null,
                'contact_phone' => null,
                'contact_email' => 'group06@npt1.go.th',
                'is_active' => true,
                'deleted_at' => null,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'id' => 7,
                'code' => 'GROUP-07',
                'name' => 'กลุ่มโรงเรียนกำแพงแสน 2',
                'description' => 'กลุ่มโรงเรียนกำแพงแสน 2 สพป.นครปฐม เขต 1',
                'contact_person' => null,
                'contact_phone' => null,
                'contact_email' => 'group07@npt1.go.th',
                'is_active' => true,
                'deleted_at' => null,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'id' => 8,
                'code' => 'GROUP-08',
                'name' => 'กลุ่มโรงเรียนกำแพงแสน 3',
                'description' => 'กลุ่มโรงเรียนกำแพงแสน 3 สพป.นครปฐม เขต 1',
                'contact_person' => null,
                'contact_phone' => null,
                'contact_email' => 'group08@npt1.go.th',
                'is_active' => true,
                'deleted_at' => null,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'id' => 9,
                'code' => 'GROUP-09',
                'name' => 'กลุ่มโรงเรียนบ้านหลวง',
                'description' => 'กลุ่มโรงเรียนบ้านหลวง สพป.นครปฐม เขต 1',
                'contact_person' => null,
                'contact_phone' => null,
                'contact_email' => 'group09@npt1.go.th',
                'is_active' => true,
                'deleted_at' => null,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'id' => 10,
                'code' => 'GROUP-10',
                'name' => 'กลุ่มโรงเรียนดอนตูม',
                'description' => 'กลุ่มโรงเรียนดอนตูม สพป.นครปฐม เขต 1',
                'contact_person' => null,
                'contact_phone' => null,
                'contact_email' => 'group10@npt1.go.th',
                'is_active' => true,
                'deleted_at' => null,
                'created_at' => $now,
                'updated_at' => $now,
            ],
        ];

        DB::table('school_groups')->insert($schoolGroups);

        $this->command->info('✅ สร้างกลุ่มโรงเรียน 10 กลุ่มเรียบร้อย');
    }
}
