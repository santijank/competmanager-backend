<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use App\Models\User;
use App\Models\Competition;
use App\Models\Registration;
use App\Models\Result;
use App\Models\Certificate;
use App\Models\School;
use App\Models\SchoolGroup;
use App\Models\Category;

class AuthorizationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        
        Category::create([
            'name' => 'Test Category',
            'code' => 'TEST',
            'description' => 'Test Category Description'
        ]);
        
        SchoolGroup::create(['name' => 'Test Group 1', 'code' => 'TG1']);
        SchoolGroup::create(['name' => 'Test Group 2', 'code' => 'TG2']);
    }

    public function test_admin_can_create_competition(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $response = $this->actingAs($admin, 'sanctum')
            ->postJson('/api/competitions', [
                'name' => 'Test Competition',
                'code' => 'TEST001',
                'category_id' => 1,
                'competition_type' => 'regular',
                'level' => 'ป.1-3',
                'max_students' => 1,
                'max_teachers' => 1,
                'max_judges' => 3,
                'start_date' => now()->addDays(1)->format('Y-m-d'),
                'end_date' => now()->addDays(7)->format('Y-m-d'),
                'registration_start_date' => now()->format('Y-m-d'),
                'registration_end_date' => now()->addDays(5)->format('Y-m-d'),
            ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('competitions', ['name' => 'Test Competition']);
    }

    public function test_teacher_cannot_create_competition(): void
    {
        $teacher = User::factory()->create(['role' => 'teacher']);

        $response = $this->actingAs($teacher, 'sanctum')
            ->postJson('/api/competitions', [
                'name' => 'Test Competition',
                'code' => 'TEST001',
                'category_id' => 1,
                'competition_type' => 'regular',
                'level' => 'ป.1-3',
                'max_students' => 1,
                'max_teachers' => 1,
                'max_judges' => 3,
                'start_date' => now()->addDays(1)->format('Y-m-d'),
                'end_date' => now()->addDays(7)->format('Y-m-d'),
            ]);

        $response->assertStatus(403);
    }

    public function test_admin_can_delete_competition(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $competition = Competition::factory()->create();

        $response = $this->actingAs($admin, 'sanctum')
            ->deleteJson("/api/competitions/{$competition->id}");

        $response->assertStatus(200);
        $this->assertDatabaseMissing('competitions', ['id' => $competition->id]);
    }

    public function test_teacher_cannot_delete_competition(): void
    {
        $teacher = User::factory()->create(['role' => 'teacher']);
        $competition = Competition::factory()->create();

        $response = $this->actingAs($teacher, 'sanctum')
            ->deleteJson("/api/competitions/{$competition->id}");

        $response->assertStatus(403);
        $this->assertDatabaseHas('competitions', ['id' => $competition->id]);
    }

    public function test_teacher_can_create_registration(): void
    {
        $schoolGroup = SchoolGroup::first();
        $school = School::factory()->create(['school_group_id' => $schoolGroup->id]);
        $teacher = User::factory()->create([
            'role' => 'teacher',
            'school_id' => $school->id
        ]);
        $competition = Competition::factory()->create([
            'registration_status' => 'open',
            'is_active' => true
        ]);

        $response = $this->actingAs($teacher, 'sanctum')
            ->postJson('/api/registrations', [
                'competition_id' => $competition->id,
                'school_id' => $school->id,
                'students' => [
                    ['name' => 'Test Student', 'grade' => 'ป.1', 'class' => 1]
                ],
                'teachers' => [
                    ['name' => 'Test Teacher', 'phone' => '0812345678']
                ],
            ]);

        $response->assertStatus(201);
    }

    public function test_committee_can_approve_registration(): void
    {
        $committee = User::factory()->create(['role' => 'committee']);
        $registration = Registration::factory()->create(['status' => 'pending']);

        $response = $this->actingAs($committee, 'sanctum')
            ->postJson("/api/registrations/{$registration->id}/approve");

        $response->assertStatus(200);
        $this->assertDatabaseHas('registrations', [
            'id' => $registration->id,
            'status' => 'approved'
        ]);
    }

    public function test_teacher_cannot_approve_registration(): void
    {
        $teacher = User::factory()->create(['role' => 'teacher']);
        $registration = Registration::factory()->create(['status' => 'pending']);

        $response = $this->actingAs($teacher, 'sanctum')
            ->postJson("/api/registrations/{$registration->id}/approve");

        $response->assertStatus(403);
        $this->assertDatabaseHas('registrations', [
            'id' => $registration->id,
            'status' => 'pending'
        ]);
    }

    public function test_committee_can_create_result(): void
    {
        $committee = User::factory()->create(['role' => 'committee']);
        $registration = Registration::factory()->approved()->create();

        $response = $this->actingAs($committee, 'sanctum')
            ->postJson('/api/results', [
                'competition_id' => $registration->competition_id,
                'registration_id' => $registration->id,
                'level' => 'group',
                'score' => 95.5,
            ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('results', ['score' => 95.5]);
    }

    public function test_teacher_cannot_create_result(): void
    {
        $teacher = User::factory()->create(['role' => 'teacher']);
        $registration = Registration::factory()->approved()->create();

        $response = $this->actingAs($teacher, 'sanctum')
            ->postJson('/api/results', [
                'competition_id' => $registration->competition_id,
                'registration_id' => $registration->id,
                'level' => 'group',
                'score' => 95.5,
            ]);

        $response->assertStatus(403);
    }

    public function test_committee_can_calculate_ranks(): void
    {
        $committee = User::factory()->create(['role' => 'committee']);
        $competition = Competition::factory()->create();

        $response = $this->actingAs($committee, 'sanctum')
            ->postJson("/api/results/competitions/{$competition->id}/calculate-ranks", [
                'level' => 'group'
            ]);

        $response->assertStatus(200);
    }

    public function test_teacher_cannot_calculate_ranks(): void
    {
        $teacher = User::factory()->create(['role' => 'teacher']);
        $competition = Competition::factory()->create();

        $response = $this->actingAs($teacher, 'sanctum')
            ->postJson("/api/results/competitions/{$competition->id}/calculate-ranks", [
                'level' => 'group'
            ]);

        $response->assertStatus(403);
    }

    public function test_committee_can_generate_certificate(): void
    {
        $committee = User::factory()->create(['role' => 'committee']);
        $result = Result::factory()->create(['level' => 'group']);

        $response = $this->actingAs($committee, 'sanctum')
            ->postJson("/api/certificates/results/{$result->id}/generate");

        $response->assertStatus(201);
        $this->assertDatabaseHas('certificates', ['result_id' => $result->id]);
    }

    public function test_teacher_cannot_generate_certificate(): void
    {
        $teacher = User::factory()->create(['role' => 'teacher']);
        $result = Result::factory()->create(['level' => 'group']);

        $response = $this->actingAs($teacher, 'sanctum')
            ->postJson("/api/certificates/results/{$result->id}/generate");

        $response->assertStatus(403);
    }

    public function test_group_admin_can_approve_own_group_registration(): void
    {
        $schoolGroup = SchoolGroup::first();
        $groupAdmin = User::factory()->create([
            'role' => 'group_admin',
            'school_group_id' => $schoolGroup->id
        ]);
        
        $school = School::factory()->create(['school_group_id' => $schoolGroup->id]);
        $registration = Registration::factory()->create([
            'school_id' => $school->id,
            'school_group_id' => $schoolGroup->id,
            'status' => 'pending'
        ]);

        $response = $this->actingAs($groupAdmin, 'sanctum')
            ->postJson("/api/registrations/{$registration->id}/approve");

        $response->assertStatus(200);
        $this->assertDatabaseHas('registrations', [
            'id' => $registration->id,
            'status' => 'approved'
        ]);
    }

    public function test_group_admin_cannot_approve_other_group_registration(): void
    {
        $schoolGroup1 = SchoolGroup::first();
        $schoolGroup2 = SchoolGroup::skip(1)->first();
        
        $groupAdmin = User::factory()->create([
            'role' => 'group_admin',
            'school_group_id' => $schoolGroup1->id
        ]);
        
        $school = School::factory()->create(['school_group_id' => $schoolGroup2->id]);
        $registration = Registration::factory()->create([
            'school_id' => $school->id,
            'school_group_id' => $schoolGroup2->id,
            'status' => 'pending'
        ]);

        $response = $this->actingAs($groupAdmin, 'sanctum')
            ->postJson("/api/registrations/{$registration->id}/approve");

        $response->assertStatus(403);
        $this->assertDatabaseHas('registrations', [
            'id' => $registration->id,
            'status' => 'pending'
        ]);
    }

    public function test_unauthenticated_cannot_access_protected_routes(): void
    {
        $response = $this->getJson('/api/competitions');
        $response->assertStatus(401);

        $response = $this->postJson('/api/competitions', []);
        $response->assertStatus(401);

        $response = $this->getJson('/api/registrations');
        $response->assertStatus(401);
    }
}
