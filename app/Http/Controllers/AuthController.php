<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use OpenApi\Attributes as OA;

class AuthController extends Controller
{
    #[OA\Post(
        path: '/api/v1/auth/login',
        summary: 'Issue a JWT',
        description: 'Purpose: exchange credentials for a JWT. Auth: none - this is the only public endpoint.',
        tags: ['Auth'],
        requestBody: new OA\RequestBody(
            required: true,
            description: 'Credentials of an active user account. `email` and `password` are required.',
            content: new OA\JsonContent(ref: '#/components/schemas/LoginInput')
        ),
        responses: [
            new OA\Response(response: 200, description: 'Authenticated - returns the JWT and its lifetime.', content: new OA\JsonContent(ref: '#/components/schemas/TokenResponse')),
            new OA\Response(response: 401, description: 'Invalid credentials - "Invalid credentials."', content: new OA\JsonContent(ref: '#/components/schemas/ApiError')),
            new OA\Response(response: 422, description: 'Validation error - email or password missing.', content: new OA\JsonContent(ref: '#/components/schemas/ValidationError')),
        ]
    )]
    public function login(Request $request): JsonResponse
    {
        $credentials = $request->validate([
            'email' => ['required', 'email', 'max:255'],
            'password' => ['required', 'string', 'max:128'],
            'code' => ['nullable', 'string', 'max:64'],
        ]);
        $policy = \App\Services\SecurityPolicy::get();
        $key = 'login:'.hash('sha256', strtolower($credentials['email']));
        $ipKey = 'login-ip:'.hash('sha256', $request->ip());
        if (\Illuminate\Support\Facades\RateLimiter::tooManyAttempts($key, $policy['login_attempts']) || \Illuminate\Support\Facades\RateLimiter::tooManyAttempts($ipKey, 50)) {
            return response()->json(['success' => false, 'message' => 'Login blocked: too many sign-in attempts. Try again later.'], 429);
        }
        return \Illuminate\Support\Facades\DB::transaction(function () use ($credentials, $key, $ipKey, $policy) {
            $user = \App\Models\User::where('email', $credentials['email'])->lockForUpdate()->first();
            $valid = $user && $user->status === 'active' && \Illuminate\Support\Facades\Hash::check($credentials['password'], $user->password);
            if ($valid && $user->mfa_confirmed_at && empty($credentials['code'])) {
                return response()->json([
                    'success' => true,
                    'message' => 'Password accepted. Enter your authenticator code to finish signing in.',
                    'mfa_required' => true,
                ], 202);
            }
            if ($valid && $user->mfa_confirmed_at) {
                $valid = \App\Services\MfaService::verify($user, $credentials['code']);
            }
            if (! $valid) {
                \Illuminate\Support\Facades\RateLimiter::hit($key, $policy['lockout_minutes'] * 60);
                \Illuminate\Support\Facades\RateLimiter::hit($ipKey, $policy['lockout_minutes'] * 60);
                \App\Services\AuditLogger::record('login_failed', 'Authentication');
                return response()->json(['success' => false, 'message' => 'Login failed: invalid credentials or verification code.'], 401);
            }
            \Illuminate\Support\Facades\RateLimiter::clear($key);
            $token = \App\Services\SecurityPolicy::token($user, (bool) $user->mfa_confirmed_at);
            \App\Services\AuditLogger::record('login_succeeded', 'Authentication', $user->id, [], $user);
            $name = trim("{$user->first_name} {$user->last_name}");
            return response()->json([
                'success' => true,
                'message' => "Login successful. Welcome, {$name} ({$user->role}).",
                'user' => ['id' => $user->id, 'name' => $name, 'email' => $user->email, 'role' => $user->role],
                ...$token,
            ]);
        });
    }

    #[OA\Get(
        path: '/api/v1/auth/me',
        summary: 'Get the authenticated user',
        description: 'Purpose: return the authenticated user record (no `data` wrapper). Auth: Bearer JWT, any role.',
        tags: ['Auth'],
        security: [['bearerAuth' => []]],
        responses: [
            new OA\Response(response: 200, description: 'Current user.', content: new OA\JsonContent(ref: '#/components/schemas/UserResource')),
            new OA\Response(response: 401, description: 'Unauthenticated - missing, malformed or expired JWT.', content: new OA\JsonContent(ref: '#/components/schemas/ApiError')),
        ]
    )]
    public function me(): JsonResponse
    {
        $user = auth('api')->user();
        return response()->json([...$user->toArray(),
            'mfa_enabled' => (bool) $user->mfa_confirmed_at,
            'mfa_required' => \App\Services\SecurityPolicy::mfaRequired($user),
            'permissions' => \App\Services\SecurityPolicy::permissions($user),
        ]);
    }

    #[OA\Post(
        path: '/api/v1/auth/logout',
        summary: 'Invalidate the current JWT',
        description: 'Purpose: revoke the presented token so it can no longer be used. No request body is required. Auth: Bearer JWT, any role.',
        tags: ['Auth'],
        security: [['bearerAuth' => []]],
        responses: [
            new OA\Response(response: 200, description: 'Logged out.', content: new OA\JsonContent(ref: '#/components/schemas/MessageResponse')),
            new OA\Response(response: 401, description: 'Unauthenticated - missing, malformed or expired JWT.', content: new OA\JsonContent(ref: '#/components/schemas/ApiError')),
        ]
    )]
    public function logout(): JsonResponse
    {
        \App\Services\AuditLogger::record('logout', 'Authentication', auth('api')->id());
        auth('api')->logout();

        return response()->json(['success' => true, 'message' => 'Successfully logged out.']);
    }

    private function respondWithToken(string $token): JsonResponse
    {
        return response()->json([
            'access_token' => $token,
            'token_type' => 'bearer',
            'expires_in' => auth('api')->factory()->getTTL() * 60,
        ]);
    }
}
