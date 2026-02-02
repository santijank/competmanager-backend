<?php

namespace Database\Factories;

use App\Models\Competition;
use App\Models\Category;
use Illuminate\Database\Eloquent\Factories\Factory;

class CompetitionFactory extends Factory
{
    protected $model = Competition::class;

    public function definition(): array
    {
        return [
            'category_id' => Category::factory(),
            'code' => strtoupper($this->faker->lexify('COMP???')),
            'name' => $this->faker->sentence(3),
            'description' => $this->faker->paragraph(),
            'competition_type' => $this->faker->randomElement(['regular', 'special', 'special_needs']),
            'level' => $this->faker->randomElement(['ป.1-3', 'ป.4-6', 'ม.1-3', 'ม.4-6']),
            'max_students' => $this->faker->numberBetween(1, 5),
            'max_teachers' => $this->faker->numberBetween(1, 3),
            'max_judges' => $this->faker->numberBetween(1, 5),
            'start_date' => now()->addDays(1),
            'end_date' => now()->addDays(7),
            'competition_date' => now()->addDays(7),
            'competition_start_time' => '09:00:00',
            'competition_end_time' => '16:00:00',
            'registration_start_date' => now(),
            'registration_end_date' => now()->addDays(5),
            'registration_status' => 'open',
            'allow_direct_registration' => $this->faker->boolean(),
            'criterion' => null,
            'rules' => $this->faker->paragraph(),
            'venue' => $this->faker->address(),
            'advancement_slots' => $this->faker->numberBetween(1, 5),
            'school_group_id' => null,
            'status' => 'active',
            'is_active' => true,
        ];
    }
}
