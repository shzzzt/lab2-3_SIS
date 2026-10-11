<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Program;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class AuditLogTest extends TestCase
{
    use RefreshDatabase;

    public function test_account_changes_record_actor_and_values_without_credentials(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $this->actingAs($admin, 'api');
        $payload = ['first_name' => 'Audit', 'last_name' => 'User', 'email' => 'audit@example.com', 'password' => 'secret-password', 'role' => 'registrar', 'status' => 'active'];
        $id = $this->postJson('/api/v1/admin/users', $payload)->assertCreated()->json('data.id');
        $this->patchJson('/api/v1/admin/users/'.$id, [...$payload, 'password' => 'new-secret-password', 'status' => 'suspended'])->assertOk();
        $response = $this->getJson('/api/v1/admin/audit-logs?action=updated')->assertOk();
        $response->assertJsonPath('data.0.actor_id', $admin->id)
            ->assertJsonPath('data.0.resource_id', (string) $id)
            ->assertJsonPath('data.0.changes.status.before', 'active')
            ->assertJsonPath('data.0.changes.status.after', 'suspended')
            ->assertJsonPath('data.0.changes.password_changed', true)
            ->assertJsonMissingPath('data.0.changes.password');
        $raw = DB::table('audit_logs')->pluck('changes')->implode('');
        $this->assertStringNotContainsString('secret-password', $raw);
        $this->assertStringNotContainsString('remember_token', $raw);
        $this->assertStringNotContainsString('$2y$', $raw);
        $this->assertDatabaseHas('audit_logs', ['action' => 'created', 'resource' => 'User', 'actor_id' => $admin->id]);
    }

    public function test_only_admin_can_read_logs_and_no_mutation_routes_exist(): void
    {
        foreach (['registrar', 'faculty', 'student', 'advisor'] as $role) {
            $this->actingAs(User::factory()->create(['role' => $role]), 'api')->getJson('/api/v1/admin/audit-logs')->assertForbidden();
        }
        $this->actingAs(User::factory()->create(['role' => 'admin']), 'api')->getJson('/api/v1/admin/audit-logs')->assertOk();
        $this->postJson('/api/v1/admin/audit-logs', [])->assertStatus(405);
        $this->deleteJson('/api/v1/admin/audit-logs/1')->assertNotFound();
    }

    public function test_academic_changes_and_rollback_are_audited_consistently(): void
    {
        $program = Program::factory()->create();
        $registrar = User::factory()->create(['role' => 'registrar']);
        $this->actingAs($registrar, 'api')->patchJson('/api/v1/programs/'.$program->id, ['name' => 'Changed program'])->assertOk();
        $this->assertDatabaseHas('audit_logs', ['actor_id' => $registrar->id, 'resource' => 'Program', 'action' => 'updated']);
        $count = DB::table('audit_logs')->count();
        DB::beginTransaction();
        $program->refresh()->update(['name' => 'Rolled back']);
        DB::rollBack();
        $this->assertSame($count, DB::table('audit_logs')->count());
        $this->assertSame('Changed program', $program->fresh()->name);
    }

    public function test_authentication_events_do_not_store_tokens_or_passwords(): void
    {
        User::factory()->create(['email' => 'login@example.com', 'role' => 'admin']);
        $this->postJson('/api/v1/auth/login', ['email' => 'login@example.com', 'password' => 'wrong'])->assertUnauthorized();
        $token = $this->postJson('/api/v1/auth/login', ['email' => 'login@example.com', 'password' => 'password'])->assertOk()->json('access_token');
        $this->withToken($token)->postJson('/api/v1/auth/logout')->assertOk();
        foreach (['login_failed', 'login_succeeded', 'logout'] as $action) {
            $this->assertDatabaseHas('audit_logs', ['action' => $action, 'resource' => 'Authentication']);
        }
        $this->assertStringNotContainsString($token, DB::table('audit_logs')->get()->toJson());
    }

    public function test_failed_response_rolls_back_both_change_and_audit_entry(): void
    {
        $program = Program::factory()->create();
        $original = $program->name;
        $this->actingAs(User::factory()->create(['role' => 'registrar']), 'api');
        $request = \Illuminate\Http\Request::create('/api/v1/programs/'.$program->id, 'PATCH');
        $middleware = new \App\Http\Middleware\AuditTransaction;
        $middleware->handle($request, function () use ($program) {
            $program->update(['name' => 'Must roll back']);
            return response()->json(['message' => 'Failure after update'], 500);
        });
        $this->assertSame($original, $program->fresh()->name);
        $this->assertDatabaseCount('audit_logs', 0);
    }

    public function test_settings_history_filters_and_pagination(): void
    {
        $this->actingAs(User::factory()->create(['role' => 'admin']), 'api');
        $this->putJson('/api/v1/admin/settings', ['institution_name' => 'Audit College', 'support_email' => 'help@example.com'])->assertOk();
        $this->getJson('/api/v1/admin/audit-logs?search=SystemSettings&action=updated')->assertOk()
            ->assertJsonPath('total', 1)->assertJsonPath('data.0.changes.after.institution_name', 'Audit College');
        $this->getJson('/api/v1/admin/audit-logs?from=2000-01-01&to=2000-01-02')->assertOk()->assertJsonPath('total', 0);
        $this->getJson('/api/v1/admin/audit-logs?to=2099-01-01')->assertOk();
        $this->getJson('/api/v1/admin/audit-logs?page=-1')->assertUnprocessable();
        for ($i = 0; $i < 26; $i++) { \App\Services\AuditLogger::record('updated', 'PaginationTest', $i); }
        $this->getJson('/api/v1/admin/audit-logs?search=PaginationTest&page=2')->assertOk()->assertJsonPath('total', 26)->assertJsonCount(1, 'data');
    }
}
