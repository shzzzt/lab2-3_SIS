<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Services\{AuditLogger, MfaService, SecurityPolicy};
use Illuminate\Http\Request;
use Illuminate\Support\Facades\{DB, Hash};
use Illuminate\Validation\{Rule, ValidationException};
use OTPHP\TOTP;

class SecurityController extends Controller
{
    private function confirmPassword(Request $request, User $user): void
    {
        $request->validate(['password' => ['required', 'string', 'max:128']]);
        if (! Hash::check($request->input('password'), $user->password)) {
            throw ValidationException::withMessages(['password' => ['The current password is incorrect.']]);
        }
    }

    public function policy()
    {
        return response()->json(['data' => SecurityPolicy::get(), 'ceilings' => SecurityPolicy::ceilings()]);
    }

    public function savePolicy(Request $request)
    {
        $this->confirmPassword($request, $request->user('api'));
        $rules = [
            'password_min_length' => ['required', 'integer', 'min:8', 'max:128'],
            'session_minutes' => ['required', 'integer', 'min:5', 'max:480'],
            'login_attempts' => ['required', 'integer', 'min:3', 'max:10'],
            'lockout_minutes' => ['required', 'integer', 'min:1', 'max:60'],
            'mfa_required_roles' => ['present', 'array'],
            'mfa_required_roles.*' => [Rule::in(array_keys(SecurityPolicy::ceilings())), 'distinct'],
            'permissions' => ['required', 'array:'.implode(',', array_keys(SecurityPolicy::ceilings()))],
        ];
        foreach (SecurityPolicy::ceilings() as $role => $modules) {
            $rules['permissions.'.$role] = ['required', 'array:'.implode(',', array_keys($modules))];
            foreach ($modules as $module => $ceiling) {
                $allowed = $role === 'admin' ? [$ceiling] : ($ceiling === 'manage' ? ['none', 'read', 'manage'] : ['none', 'read']);
                $rules["permissions.$role.$module"] = ['required', Rule::in($allowed)];
            }
        }
        $data = $request->validate($rules);
        if (in_array('admin', $data['mfa_required_roles'], true) && ! $request->user('api')->mfa_confirmed_at) {
            throw ValidationException::withMessages(['mfa_required_roles' => ['Enable MFA on your own account before requiring it for Admin.']]);
        }
        $before = SecurityPolicy::get();
        DB::table('security_policies')->updateOrInsert(['id' => 1], ['settings' => json_encode($data)]);
        AuditLogger::record('updated', 'SecurityPolicy', 1, ['before' => $before, 'after' => $data]);
        return response()->json(['data' => $data]);
    }

    public function status(Request $request)
    {
        $user = $request->user('api');
        return response()->json(['data' => [
            'enabled' => (bool) $user->mfa_confirmed_at,
            'required' => SecurityPolicy::mfaRequired($user),
            'recovery_codes_remaining' => count($user->mfa_recovery_codes ?? []),
        ]]);
    }

    public function setup(Request $request)
    {
        $user = User::lockForUpdate()->findOrFail($request->user('api')->id);
        $this->confirmPassword($request, $user);
        abort_if((bool) $user->mfa_confirmed_at, 409, 'MFA is already enabled.');
        $otp = TOTP::generate();
        $otp->setLabel($user->email);
        $otp->setIssuer('Student Information');
        $user->mfa_pending_secret = $otp->getSecret();
        $user->mfa_pending_expires_at = now()->addMinutes(10);
        $user->save();
        return response()->json(['secret' => $otp->getSecret(), 'uri' => $otp->getProvisioningUri()])->header('Cache-Control', 'no-store');
    }

    public function confirm(Request $request)
    {
        $request->validate(['code' => ['required', 'string', 'size:6']]);
        $user = User::lockForUpdate()->findOrFail($request->user('api')->id);
        if ($user->mfa_confirmed_at || ! $user->mfa_pending_expires_at || $user->mfa_pending_expires_at->isPast() || ! MfaService::verify($user, $request->input('code'), true)) {
            throw ValidationException::withMessages(['code' => ['The code is invalid or setup has expired.']]);
        }
        $user->mfa_secret = $user->mfa_pending_secret;
        $user->mfa_pending_secret = null;
        $user->mfa_pending_expires_at = null;
        $user->mfa_confirmed_at = now();
        $user->auth_version++;
        $user->save();
        $codes = MfaService::recoveryCodes($user);
        AuditLogger::record('mfa_enabled', 'User', $user->id);
        return response()->json([...SecurityPolicy::token($user, true), 'recovery_codes' => $codes])->header('Cache-Control', 'no-store');
    }

    private function verifyFactor(Request $request, User $user): void
    {
        $this->confirmPassword($request, $user);
        $request->validate(['code' => ['required', 'string', 'max:64']]);
        if (! $user->mfa_confirmed_at || ! MfaService::verify($user, $request->input('code'))) {
            throw ValidationException::withMessages(['code' => ['Invalid or already used verification code.']]);
        }
    }

    public function disable(Request $request)
    {
        $user = User::lockForUpdate()->findOrFail($request->user('api')->id);
        abort_if(SecurityPolicy::mfaRequired($user), 409, 'MFA is required for your role.');
        $this->verifyFactor($request, $user);
        $user->mfa_secret = null;
        $user->mfa_confirmed_at = null;
        $user->mfa_recovery_codes = null;
        $user->mfa_last_counter = null;
        $user->auth_version++;
        $user->save();
        AuditLogger::record('mfa_disabled', 'User', $user->id);
        return response()->json(SecurityPolicy::token($user, false));
    }

    public function recovery(Request $request)
    {
        $user = User::lockForUpdate()->findOrFail($request->user('api')->id);
        $this->verifyFactor($request, $user);
        $codes = MfaService::recoveryCodes($user);
        AuditLogger::record('recovery_codes_regenerated', 'User', $user->id);
        return response()->json(['recovery_codes' => $codes])->header('Cache-Control', 'no-store');
    }
}
