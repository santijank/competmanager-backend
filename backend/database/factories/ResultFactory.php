<?php

namespace Database\Factories;

use App\Models\Result;
use App\Models\Registration;
use App\Models\Competition;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class ResultFactory extends Factory
{
    protected $model = Result::class;

    public function definition(): array
    {
        return [
            'registration_id' => Registration::factory(),
            'competition_id' => Competition::factory(),
            'level' => $this->faker->randomElement(['group', 'district']),
            'score' => $this->faker->randomFloat(2, 0, 100),
            'rank' => null,
            'medal' => 'none',
            'judges' => json_encode([
                $this->faker->name(),
                $this->faker->name(),
            ]),
            'committee' => json_encode([
                $this->faker->name(),
                $this->faker->name(),
            ]),
            'scored_by' => User::factory(),
            'scored_at' => now(),
            'is_confirmed' => false,
            'confirmed_at' => null,
            'confirmed_by' => null,
            'confirmed_to_district' => false,
            'advanced_at' => null,
            'advanced_by' => null,
            'comments' => null,
        ];
    }

    /**
     * State สำหรับผลที่ confirmed แล้ว
     */
    public function confirmed(): static
    {
        return $this->state(function (array $attributes) {
            return [
                'is_confirmed' => true,
                'confirmed_at' => now(),
                'confirmed_by' => User::factory(),
            ];
        });
    }

    /**
     * State สำหรับผลที่ได้เหรียญทอง
     */
    public function gold(): static
    {
        return $this->state(function (array $attributes) {
            return [
                'score' => $this->faker->randomFloat(2, 90, 100),
                'rank' => 1,
                'medal' => 'gold',
            ];
        });
    }

    /**
     * State สำหรับผลที่ advance ไประดับเขต
     */
    public function advanced(): static
    {
        return $this->state(function (array $attributes) {
            return [
                'confirmed_to_district' => true,
                'advanced_at' => now(),
                'advanced_by' => User::factory(),
            ];
        });
    }
}
