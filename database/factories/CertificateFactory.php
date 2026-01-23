<?php

namespace Database\Factories;

use App\Models\Certificate;
use App\Models\Result;
use App\Models\Competition;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class CertificateFactory extends Factory
{
    protected $model = Certificate::class;

    public function definition(): array
    {
        $result = Result::factory()->create();
        $students = json_decode($result->registration->students, true);
        
        return [
            'certificate_code' => 'CERT-' . strtoupper(Str::random(10)),
            'result_id' => $result->id,
            'competition_id' => $result->competition_id,
            'student_name' => $students[0]['name'] ?? 'Test Student',
            'school_name' => $result->registration->school->name,
            'competition_name' => $result->competition->name,
            'level' => $result->level,
            'rank' => $result->rank ?? 0,
            'medal' => $result->medal ?? 'none',
            'judges' => json_encode([
                $this->faker->name(),
                $this->faker->name(),
            ]),
            'committee' => json_encode([
                $this->faker->name(),
                $this->faker->name(),
            ]),
            'issue_date' => now()->format('Y-m-d'),
            'generated_by' => User::factory(),
            'generated_at' => now(),
        ];
    }
}
