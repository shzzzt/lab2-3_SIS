<?php

namespace App\Observers;

use App\Services\AuditLogger;
use Illuminate\Database\Eloquent\Model;

class AuditObserver
{
    public function created(Model $model): void { $this->record($model, 'created'); }
    public function updated(Model $model): void { $this->record($model, 'updated'); }
    public function deleted(Model $model): void { $this->record($model, 'deleted'); }

    private function record(Model $model, string $action): void
    {
        if (! auth('api')->user()) { return; }
        // Use stored model values, never request bodies, headers, or credentials.
        $attributes = $action === 'updated' ? $model->getChanges() : $model->getAttributes();
        $changes = [];
        foreach ($attributes as $field => $value) {
            if (in_array($field, ['password', 'remember_token', 'created_at', 'updated_at'], true)) { continue; }
            if (! in_array($field, $model->getFillable(), true)) { continue; }
            $changes[$field] = ['before' => $action === 'created' ? null : $model->getRawOriginal($field), 'after' => $action === 'deleted' ? null : $value];
        }
        if ($model->wasChanged('password') && $action === 'updated') { $changes['password_changed'] = true; }
        if ($changes !== []) { AuditLogger::record($action, class_basename($model), $model->getKey(), $changes); }
    }
}
