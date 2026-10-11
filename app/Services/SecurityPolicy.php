<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use App\Models\User;

class SecurityPolicy
{
    public static function ceilings(): array
    {
        return [
            'admin' => ['accounts' => 'manage', 'settings' => 'manage', 'security' => 'manage', 'audit' => 'read'],
            'registrar' => ['students' => 'manage', 'programs' => 'manage', 'courses' => 'manage', 'academic-terms' => 'manage', 'course-offerings' => 'manage', 'enrollments' => 'manage', 'grades' => 'read'],
            'faculty' => ['course-offerings' => 'read', 'enrollments' => 'read', 'grades' => 'manage'],
            'student' => ['students' => 'read', 'enrollments' => 'read', 'grades' => 'read'],
            'advisor' => ['course-offerings' => 'read', 'enrollments' => 'read', 'grades' => 'read'],
        ];
    }

    public static function get(): array
    {
        $value = DB::table('security_policies')->where('id', 1)->value('settings');
        return array_replace([
            'password_min_length' => 8,
            'session_minutes' => 60,
            'login_attempts' => 5,
            'lockout_minutes' => 15,
            'mfa_required_roles' => [],
            'permissions' => self::ceilings(),
        ], $value ? json_decode($value, true) : []);
    }

    public static function permissions(User $user): array
    {
        $role = $user->role === 'instructor' ? 'faculty' : $user->role;
        return self::get()['permissions'][$role] ?? [];
    }

    public static function mfaRequired(User $user): bool
    {
        return in_array($user->role, self::get()['mfa_required_roles'], true);
    }

    public static function passwordRules(): array
    {
        return ['string', 'min:'.self::get()['password_min_length'], 'max:128'];
    }

    public static function token(User $user, bool $mfa): array
    {
        $minutes = self::get()['session_minutes'];
        $guard = auth('api');
        $guard->factory()->setTTL($minutes);
        $token = $guard->claims(['mfa' => $mfa, 'av' => (int) $user->auth_version])->login($user);
        return ['access_token' => $token, 'token_type' => 'bearer', 'expires_in' => $minutes * 60];
    }
}
