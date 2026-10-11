<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class ActiveAccount
{
    public function handle(Request $request, Closure $next)
    {
        if ($request->user('api')?->status !== 'active') {
            return response()->json(['success' => false, 'message' => 'This account is not active.'], 401);
        }
        $user = $request->user('api');
        if (auth('api')->getToken()) {
            $payload = auth('api')->payload();
            if ((int) $payload->get('av') !== (int) $user->auth_version
                || ($user->mfa_confirmed_at && ! $payload->get('mfa'))
                || now()->timestamp - (int) $payload->get('iat') >= \App\Services\SecurityPolicy::get()['session_minutes'] * 60) {
                return response()->json(['success' => false, 'message' => 'Your session has expired. Sign in again.'], 401);
            }
        }
        return $next($request);
    }
}
