<?php

namespace Tests\Feature;

use App\Models\User;
use App\Services\SecurityPolicy;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\{Cache, DB};
use OTPHP\TOTP;
use Tests\TestCase;

class SecurityControlsTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Cache::flush();
    }

    private function tokenRequest(string $token): static
    {
        app('auth')->forgetGuards();
        app('tymon.jwt')->unsetToken();
        return $this->withToken($token);
    }

    private function login(User $user, ?string $code = null)
    {
        app('auth')->forgetGuards();
        app('tymon.jwt')->unsetToken();
        return $this->withHeader('Authorization', '')->postJson('/api/v1/auth/login', ['email' => $user->email, 'password' => 'password', 'code' => $code]);
    }

    public function test_mfa_enrollment_login_replay_recovery_and_secret_redaction(): void
    {
        $user = User::factory()->create(['role' => 'admin']);
        $token = $this->login($user)->assertOk()->json('access_token');
        $setup = $this->tokenRequest($token)->postJson('/api/v1/security/mfa/setup', ['password' => 'password'])->assertOk();
        $secret = $setup->json('secret');
        $this->assertNotSame($secret, DB::table('users')->where('id', $user->id)->value('mfa_pending_secret'));
        $code = TOTP::createFromSecret($secret)->at(now()->timestamp);
        $confirmed = $this->tokenRequest($token)->postJson('/api/v1/security/mfa/confirm', ['code' => $code])->assertOk();
        $newToken = $confirmed->json('access_token');
        $recovery = $confirmed->json('recovery_codes');
        $this->assertCount(8, $recovery);
        $this->tokenRequest($token)->getJson('/api/v1/auth/me')->assertUnauthorized();
        $this->tokenRequest($newToken)->getJson('/api/v1/auth/me')->assertOk()->assertJsonPath('mfa_enabled', true)->assertJsonMissingPath('mfa_secret')->assertJsonMissingPath('mfa_recovery_codes');
        $this->login($user)->assertStatus(202)->assertJsonMissingPath('access_token');
        $this->login($user, $code)->assertUnauthorized();
        $this->travel(31)->seconds();
        $freshCode = TOTP::createFromSecret($secret)->at(now()->timestamp);
        $this->login($user, $freshCode)->assertOk();
        $this->login($user, $freshCode)->assertUnauthorized();
        $this->login($user, $recovery[0])->assertOk();
        $this->login($user, $recovery[0])->assertUnauthorized();
        $this->assertCount(7, $user->fresh()->mfa_recovery_codes);
        $serialized = DB::table('audit_logs')->get()->toJson();
        $this->assertStringNotContainsString($secret, $serialized);
        $this->assertStringNotContainsString($recovery[0], $serialized);
        $this->assertStringNotContainsString($newToken, $serialized);
        $this->assertDatabaseHas('audit_logs', ['action' => 'mfa_enabled', 'actor_id' => $user->id]);
    }

    public function test_required_mfa_blocks_records_until_enrollment_and_cannot_be_disabled(): void
    {
        $user = User::factory()->create(['role' => 'registrar']);
        $settings = SecurityPolicy::get();
        $settings['mfa_required_roles'] = ['registrar'];
        DB::table('security_policies')->insert(['id' => 1, 'settings' => json_encode($settings)]);
        $token = $this->login($user)->assertOk()->json('access_token');
        $this->tokenRequest($token)->getJson('/api/v1/students')->assertForbidden()->assertJsonPath('code', 'mfa_enrollment_required');
        $secret = $this->tokenRequest($token)->postJson('/api/v1/security/mfa/setup', ['password' => 'password'])->assertOk()->json('secret');
        $result = $this->tokenRequest($token)->postJson('/api/v1/security/mfa/confirm', ['code' => TOTP::createFromSecret($secret)->at(now()->timestamp)])->assertOk();
        $token = $result->json('access_token');
        $this->tokenRequest($token)->getJson('/api/v1/students')->assertOk();
        $this->tokenRequest($token)->postJson('/api/v1/security/mfa/disable', ['password' => 'password', 'code' => $result->json('recovery_codes.0')])->assertStatus(409);
    }

    public function test_optional_mfa_can_be_disabled_and_recovery_codes_regenerated(): void
    {
        $user = User::factory()->create(['role' => 'admin']);
        $token = $this->login($user)->json('access_token');
        $secret = $this->tokenRequest($token)->postJson('/api/v1/security/mfa/setup', ['password' => 'password'])->json('secret');
        $result = $this->tokenRequest($token)->postJson('/api/v1/security/mfa/confirm', ['code' => TOTP::createFromSecret($secret)->at(now()->timestamp)])->assertOk();
        $token = $result->json('access_token');
        $codes = $this->tokenRequest($token)->postJson('/api/v1/security/mfa/recovery', ['password' => 'password', 'code' => $result->json('recovery_codes.0')])->assertOk()->json('recovery_codes');
        $this->login($user, $result->json('recovery_codes.1'))->assertUnauthorized();
        $disabled = $this->tokenRequest($token)->postJson('/api/v1/security/mfa/disable', ['password' => 'password', 'code' => $codes[0]])->assertOk();
        $this->tokenRequest($token)->getJson('/api/v1/auth/me')->assertUnauthorized();
        $this->tokenRequest($disabled->json('access_token'))->getJson('/api/v1/auth/me')->assertOk()->assertJsonPath('mfa_enabled', false);
        $this->login($user)->assertOk();
    }

    public function test_policy_permissions_password_requirements_and_role_ceilings(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $registrar = User::factory()->create(['role' => 'registrar']);
        $this->actingAs($admin, 'api');
        $policy = SecurityPolicy::get();
        $policy['permissions']['registrar']['students'] = 'read';
        $policy['permissions']['registrar']['programs'] = 'none';
        $policy['password_min_length'] = 12;
        $this->putJson('/api/v1/admin/security', [...$policy, 'password' => 'wrong'])->assertUnprocessable();
        $this->putJson('/api/v1/admin/security', [...$policy, 'password' => 'password'])->assertOk();
        $this->postJson('/api/v1/admin/users', ['first_name' => 'A', 'last_name' => 'B', 'email' => 'test@example.com', 'password' => 'short123', 'role' => 'student', 'status' => 'active'])->assertUnprocessable();
        $policy['permissions']['student']['grades'] = 'manage';
        $this->putJson('/api/v1/admin/security', [...$policy, 'password' => 'password'])->assertUnprocessable();
        $this->actingAs($registrar, 'api');
        $this->getJson('/api/v1/students')->assertOk();
        $this->postJson('/api/v1/students', [])->assertForbidden();
        $this->getJson('/api/v1/programs')->assertForbidden();
        $this->getJson('/api/v1/admin/security')->assertForbidden();
    }

    public function test_security_setup_requires_password_and_failed_attempts_are_throttled(): void
    {
        $user = User::factory()->create(['role' => 'admin']);
        $token = $this->login($user)->json('access_token');
        for ($attempt = 0; $attempt < 10; $attempt++) {
            $this->tokenRequest($token)->postJson('/api/v1/security/mfa/setup', ['password' => 'wrong'])->assertUnprocessable();
        }
        $this->tokenRequest($token)->postJson('/api/v1/security/mfa/setup', ['password' => 'password'])->assertStatus(429);
        $this->assertNull($user->fresh()->mfa_secret);
        $this->assertNull($user->fresh()->mfa_pending_secret);
    }

    public function test_login_throttling_and_reduced_session_duration(): void
    {
        $user = User::factory()->create(['role' => 'admin']);
        $token = $this->login($user)->assertOk()->json('access_token');
        for ($i = 0; $i < 5; $i++) {
            $this->withHeader('Authorization', '')->postJson('/api/v1/auth/login', ['email' => $user->email, 'password' => 'wrong'])->assertUnauthorized();
        }
        $this->login($user)->assertStatus(429);
        $this->travel(16)->minutes();
        $this->login($user)->assertOk();
        $policy = SecurityPolicy::get();
        $policy['session_minutes'] = 5;
        DB::table('security_policies')->insert(['id' => 1, 'settings' => json_encode($policy)]);
        $this->tokenRequest($token)->getJson('/api/v1/auth/me')->assertUnauthorized();
    }
}
