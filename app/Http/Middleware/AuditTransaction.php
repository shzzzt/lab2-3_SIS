<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Throwable;

class AuditTransaction
{
    public function handle(Request $request, Closure $next)
    {
        if ($request->isMethodSafe() || $request->is('api/v1/auth/*')) {
            return $next($request);
        }
        DB::beginTransaction();
        try {
            $response = $next($request);
            // Laravel may render an exception as a response inside the pipeline.
            if ($response->getStatusCode() >= 400) {
                DB::rollBack();
            } else {
                DB::commit();
            }
            return $response;
        } catch (Throwable $exception) {
            DB::rollBack();
            throw $exception;
        }
    }
}
