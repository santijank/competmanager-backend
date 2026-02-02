<?php

namespace Database\Factories;

use App\Models\Registration;
use App\Models\Competition;
use App\Models\School;
use App\Models\SchoolGroup;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class RegistrationFactory extends Factory
{
    protected $model = Registration::class;

    public function definition(): array
    {
        return [
            'registration_code' => 'REG-' . strtoupper(Str::random(8)),
            'competition_id' => Competition::factory(),
            'school_id' => School::factory(),
            'school_group_id' => SchoolGroup::factory(),
            'created_by' => User::factory(),
            'students' => json_encode([
                [
                    'name' => $this->faker->name(),
                    'grade' => $this->faker->randomElement(['ป.1', 'ป.2', 'ป.3', 'ป.4', 'ป.5', 'ป.6']),
                    'class' => $this->faker->numberBetween(1, 10)
                ]
            ]),
            'teachers' => json_encode([
                [
                    'name' => $this->faker->name(),
                    'phone' => $this->faker->phoneNumber(),
                    'email' => $this->faker->email()
                ]
            ]),
            'contact_phone' => $this->faker->phoneNumber(),
            'registration_type' => 'manual',
            'source_level' => null,
            'source_result_id' => null,
            'status' => 'pending',
            'approved_by' => null,
            'approved_at' => null,
            'rejected_by' => null,
            'rejected_at' => null,
            'admin_notes' => null,
            'notes' => null,
            'remarks' => null,
        ];
    }

    /**
     * State สำหรับ registration ที่ approved แล้ว
     */
    public function approved(): static
    {
        return $this->state(function (array $attributes) {
            return [
                'status' => 'approved',
                'approved_by' => User::factory(),
                'approved_at' => now(),
            ];
        });
    }

    /**
     * State สำหรับ registration ที่ rejected
     */
    public function rejected(): static
    {
        return $this->state(function (array $attributes) {
            return [
                'status' => 'rejected',
                'rejected_by' => User::factory(),
                'rejected_at' => now(),
            ];
        });
    }
}
