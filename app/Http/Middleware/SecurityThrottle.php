<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;

class SecurityThrottle
{
    public function handle(Request $request, Closure $next)
    {
        if (! $request->isMethodSafe() && $request->is('api/v1/security/*', 'api/v1/admin/security')) {
            $key = 'security-action:'.hash('sha256', $request->ip());
            if (RateLimiter::tooManyAttempts($key, 10)) {
                return response()->json(['success' => false, 'message' => 'Too many security attempts. Wait a minute and try again.'], 429)
                    ->header('Retry-After', RateLimiter::availableIn($key));
            }
            // Outside the audit transaction: failed attempts must remain counted.
            RateLimiter::hit($key, 60);
        }
        return $next($request);
    }
}
