<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\DB;

class AuditLogger
{
    public static function record(string $action, string $resource, string|int|null $id = null, array $changes = [], ?User $actor = null): void
    {
        $actor ??= auth('api')->user();
        DB::table('audit_logs')->insert([
            'actor_id' => $actor?->id,
            'actor_name' => $actor ? trim($actor->first_name.' '.$actor->last_name) : null,
            'actor_role' => $actor?->role,
            'action' => $action,
            'resource' => $resource,
            'resource_id' => $id === null ? null : (string) $id,
            'changes' => json_encode($changes, JSON_THROW_ON_ERROR),
            'created_at' => now(),
        ]);
    }
}
