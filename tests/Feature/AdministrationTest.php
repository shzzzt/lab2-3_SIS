<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdministrationTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_is_excluded_from_academic_routes(): void
    {
        $this->actingAs(User::factory()->create(['role' => 'admin']), 'api');
        foreach (['students', 'programs', 'courses', 'academic-terms', 'course-offerings', 'enrollments', 'grades'] as $resource) {
            $this->getJson('/api/v1/'.$resource)->assertForbidden();
            $this->postJson('/api/v1/'.$resource, [])->assertForbidden();
        }
        $this->getJson('/api/v1/admin/users')->assertOk();
    }

    public function test_registrar_manages_academics_but_cannot_administer_accounts_or_settings(): void
    {
        $this->actingAs(User::factory()->create(['role' => 'registrar']), 'api');
        $this->getJson('/api/v1/students')->assertOk();
        $this->getJson('/api/v1/users?role=faculty')->assertOk();
        $this->getJson('/api/v1/admin/users')->assertForbidden();
        $this->postJson('/api/v1/admin/users', [])->assertForbidden();
        $this->putJson('/api/v1/admin/settings', [])->assertForbidden();
    }

    public function test_admin_can_create_update_accounts_and_save_settings_but_cannot_demote_self(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $this->actingAs($admin, 'api');
        $payload = ['first_name' => 'Test', 'last_name' => 'Registrar', 'email' => 'new@example.com', 'password' => 'password123', 'role' => 'registrar', 'status' => 'active'];
        $id = $this->postJson('/api/v1/admin/users', $payload)->assertCreated()->assertJsonMissingPath('data.password')->json('data.id');
        $this->patchJson('/api/v1/admin/users/'.$id, [...$payload, 'status' => 'suspended'])->assertOk()->assertJsonPath('data.status', 'suspended');
        $this->patchJson('/api/v1/admin/users/'.$admin->id, [...$payload, 'email' => $admin->email])->assertUnprocessable();
        $this->putJson('/api/v1/admin/settings', ['institution_name' => 'Test College', 'support_email' => 'help@example.com'])->assertOk();
        $this->getJson('/api/v1/system-info')->assertOk()->assertJsonPath('data.institution_name', 'Test College');
    }

    public function test_admin_can_change_theme_and_logo_shown_on_public_branding(): void
    {
        $this->getJson('/api/v1/branding')->assertOk()->assertJsonPath('data.theme', 'teal')->assertJsonPath('data.logo', null);

        $this->actingAs(User::factory()->create(['role' => 'admin']), 'api');
        $this->putJson('/api/v1/admin/settings', ['institution_name' => 'Test College', 'theme' => 'neon'])->assertUnprocessable();
        $this->putJson('/api/v1/admin/settings', ['institution_name' => 'Test College', 'theme' => 'forest'])->assertOk();

        $logo = \Illuminate\Http\UploadedFile::fake()->image('logo.png', 64, 64);
        $this->post('/api/v1/admin/settings/logo', ['logo' => $logo], ['Accept' => 'application/json'])->assertOk();
        $this->post('/api/v1/admin/settings/logo', ['logo' => \Illuminate\Http\UploadedFile::fake()->create('logo.svg', 4, 'image/svg+xml')], ['Accept' => 'application/json'])->assertUnprocessable();

        // Saving other settings keeps the uploaded logo.
        $this->putJson('/api/v1/admin/settings', ['institution_name' => 'Renamed College'])->assertOk();
        $branding = $this->getJson('/api/v1/branding')->assertOk()
            ->assertJsonPath('data.institution_name', 'Renamed College')
            ->assertJsonPath('data.theme', 'forest')
            ->assertJsonMissingPath('data.support_email');
        $this->assertStringStartsWith('data:image/png;base64,', $branding->json('data.logo'));
        $this->assertSame(0, \Illuminate\Support\Facades\DB::table('audit_logs')->where('changes', 'like', '%base64%')->count());

        $this->deleteJson('/api/v1/admin/settings/logo')->assertOk();
        $this->getJson('/api/v1/branding')->assertJsonPath('data.logo', null);
    }

    public function test_registrar_cannot_change_logo(): void
    {
        $this->actingAs(User::factory()->create(['role' => 'registrar']), 'api');
        $this->post('/api/v1/admin/settings/logo', ['logo' => \Illuminate\Http\UploadedFile::fake()->image('logo.png')], ['Accept' => 'application/json'])->assertForbidden();
        $this->deleteJson('/api/v1/admin/settings/logo')->assertForbidden();
    }

    public function test_suspended_accounts_cannot_login_or_use_existing_sessions(): void
    {
        $user = User::factory()->create(['role' => 'registrar', 'status' => 'suspended']);
        $this->postJson('/api/v1/auth/login', ['email' => $user->email, 'password' => 'password'])->assertUnauthorized();
        $this->actingAs($user, 'api')->getJson('/api/v1/students')->assertUnauthorized();
        $this->getJson('/api/v1/auth/me')->assertUnauthorized();
    }
}
