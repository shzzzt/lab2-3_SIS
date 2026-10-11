<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AuditLogController extends Controller
{
    public function index(Request $request)
    {
        $filters = $request->validate([
            'action' => ['nullable', 'string', 'max:40'],
            'search' => ['nullable', 'string', 'max:100'],
            'from' => ['nullable', 'date_format:Y-m-d'],
            'to' => ['nullable', 'date_format:Y-m-d', 'after_or_equal:from'],
            'page' => ['sometimes', 'integer', 'min:1'],
        ]);
        $query = DB::table('audit_logs');
        if (! empty($filters['action'])) { $query->where('action', $filters['action']); }
        if (! empty($filters['search'])) {
            $search = '%'.$filters['search'].'%';
            $query->where(fn ($q) => $q->where('actor_name', 'like', $search)->orWhere('resource', 'like', $search)->orWhere('resource_id', 'like', $search));
        }
        if (! empty($filters['from'])) { $query->whereDate('created_at', '>=', $filters['from']); }
        if (! empty($filters['to'])) { $query->whereDate('created_at', '<=', $filters['to']); }
        $page = $query->orderByDesc('id')->paginate(25);
        $page->through(function ($entry) {
            $entry->changes = json_decode($entry->changes ?? '{}');
            $entry->created_at = \Illuminate\Support\Carbon::parse($entry->created_at)->toIso8601String();
            return $entry;
        });
        return response()->json($page);
    }
}
