<?php

namespace App\Http\Middleware;

use App\Services\SecurityPolicy;
use Closure;
use Illuminate\Http\Request;

class SecurityAccess
{
    public function handle(Request $request, Closure $next)
    {
        $user = $request->user('api');
        $path = $request->path();
        if (SecurityPolicy::mfaRequired($user) && ! $user->mfa_confirmed_at
            && ! $request->is('api/v1/auth/*', 'api/v1/security/*', 'api/v1/system-info')) {
            return response()->json(['success' => false, 'message' => 'Set up MFA before continuing.', 'code' => 'mfa_enrollment_required'], 403);
        }
        if ($request->is('api/v1/auth/*', 'api/v1/security/*', 'api/v1/system-info', 'api/v1/users')) { return $next($request); }
        $parts = explode('/', $path);
        $module = $parts[2] ?? '';
        if ($module === 'admin') {
            $module = ['users' => 'accounts', 'settings' => 'settings', 'security' => 'security', 'audit-logs' => 'audit'][$parts[3] ?? ''] ?? '';
        } elseif ($module === 'students' && isset($parts[4])) {
            $module = ['grades' => 'grades', 'enrollments' => 'enrollments', 'academic-record' => 'grades'][$parts[4]] ?? 'students';
        }
        $level = SecurityPolicy::permissions($user)[$module] ?? 'none';
        if ($level === 'none' || (! $request->isMethodSafe() && $level !== 'manage')) {
            return response()->json(['success' => false, 'message' => 'Access denied: your role does not have permission for this action.'], 403);
        }
        return $next($request);
    }
}
