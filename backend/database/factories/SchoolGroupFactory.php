<?php

namespace Database\Factories;

use App\Models\SchoolGroup;
use Illuminate\Database\Eloquent\Factories\Factory;

class SchoolGroupFactory extends Factory
{
    protected $model = SchoolGroup::class;

    public function definition(): array
    {
        return [
            'name' => 'Group ' . $this->faker->unique()->numberBetween(1, 1000),
            'code' => 'G' . $this->faker->unique()->numberBetween(1000, 9999),
            'description' => $this->faker->sentence(),
        ];
    }
}
