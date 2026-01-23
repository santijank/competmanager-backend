<?php

namespace Database\Factories;

use App\Models\School;
use App\Models\SchoolGroup;
use Illuminate\Database\Eloquent\Factories\Factory;

class SchoolFactory extends Factory
{
    protected $model = School::class;

    public function definition(): array
    {
        return [
            'name' => $this->faker->company() . ' School',
            'code' => strtoupper($this->faker->lexify('SCH???')),
            'school_group_id' => SchoolGroup::factory(),
            'address' => $this->faker->address(),
            'phone' => $this->faker->phoneNumber(),
            'email' => $this->faker->companyEmail(),
        ];
    }
}
