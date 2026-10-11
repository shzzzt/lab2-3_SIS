<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class AdministrationController extends Controller
{
    public function index()
    {
        return response()->json(['data' => User::orderBy('last_name')->get()]);
    }

    private function rules(?User $user = null): array
    {
        return [
            'first_name' => ['required', 'string', 'max:100'],
            'last_name' => ['required', 'string', 'max:100'],
            'email' => ['required', 'email', 'max:255', Rule::unique('users')->ignore($user?->id)],
            'password' => [$user ? 'sometimes' : 'required', ...\App\Services\SecurityPolicy::passwordRules()],
            'role' => ['required', Rule::in(['admin', 'registrar', 'faculty', 'student', 'advisor'])],
            'status' => ['required', Rule::in(['active', 'inactive', 'suspended', 'pending'])],
        ];
    }

    public function store(Request $request)
    {
        return response()->json(['data' => User::create($request->validate($this->rules()))], 201);
    }

    public function update(Request $request, User $user)
    {
        $data = $request->validate($this->rules($user));
        if ($user->id === $request->user('api')->id && ($data['role'] !== 'admin' || $data['status'] !== 'active')) {
            throw ValidationException::withMessages(['role' => ['You cannot remove your own administrator access.']]);
        }
        if ($data['role'] !== $user->role && ($user->student()->exists() || DB::table('course_offerings')->where('instructor_id', $user->id)->exists())) {
            throw ValidationException::withMessages(['role' => ['This account is linked to academic records. Reassign those records before changing its role.']]);
        }
        if (isset($data['password'])) { $user->auth_version++; }
        $user->fill($data)->save();
        return response()->json(['data' => $user->fresh()]);
    }

    public const THEMES = ['teal', 'indigo', 'forest', 'plum', 'sunset', 'graphite'];

    private const DEFAULT_SETTINGS = [
        'institution_name' => 'Student Information', 'support_email' => '', 'theme' => 'teal', 'logo' => null,
    ];

    private function storedSettings(): array
    {
        $stored = DB::table('system_settings')->where('id', 1)->value('settings');

        return array_merge(self::DEFAULT_SETTINGS, $stored ? json_decode($stored, true) : []);
    }

    private function writeSettings(array $settings): void
    {
        DB::table('system_settings')->updateOrInsert(['id' => 1], ['settings' => json_encode($settings)]);
    }

    public function settings()
    {
        return response()->json(['data' => $this->storedSettings()]);
    }

    public function branding()
    {
        return response()->json(['data' => array_intersect_key($this->storedSettings(), array_flip(['institution_name', 'theme', 'logo']))]);
    }

    public function saveSettings(Request $request)
    {
        $data = $request->validate([
            'institution_name' => ['required', 'string', 'max:100'],
            'support_email' => ['nullable', 'email', 'max:255'],
            'theme' => ['sometimes', Rule::in(self::THEMES)],
        ]);
        $before = $this->storedSettings();
        $after = array_merge($before, $data);
        $this->writeSettings($after);
        \App\Services\AuditLogger::record('updated', 'SystemSettings', 1, ['before' => $this->auditable($before), 'after' => $this->auditable($after)]);
        return response()->json(['data' => $after]);
    }

    public function uploadLogo(Request $request)
    {
        $request->validate(['logo' => ['required', 'file', 'mimes:png,jpg,jpeg,webp', 'max:512']]);
        $file = $request->file('logo');
        $settings = $this->storedSettings();
        $hadLogo = $settings['logo'] !== null;
        $settings['logo'] = 'data:'.$file->getMimeType().';base64,'.base64_encode($file->get());
        $this->writeSettings($settings);
        \App\Services\AuditLogger::record('updated', 'SystemSettings', 1, ['before' => ['logo' => $hadLogo ? 'custom' : 'none'], 'after' => ['logo' => 'custom']]);
        return response()->json(['success' => true, 'message' => 'Logo updated.', 'data' => $settings]);
    }

    public function removeLogo()
    {
        $settings = $this->storedSettings();
        $hadLogo = $settings['logo'] !== null;
        $settings['logo'] = null;
        $this->writeSettings($settings);
        if ($hadLogo) {
            \App\Services\AuditLogger::record('updated', 'SystemSettings', 1, ['before' => ['logo' => 'custom'], 'after' => ['logo' => 'none']]);
        }
        return response()->json(['success' => true, 'message' => 'Logo removed.', 'data' => $settings]);
    }

    /** Audit entries record whether a logo is set, not the image data itself. */
    private function auditable(array $settings): array
    {
        return [...$settings, 'logo' => $settings['logo'] === null ? 'none' : 'custom'];
    }
}
