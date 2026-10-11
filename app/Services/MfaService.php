<?php

namespace App\Services;

use App\Models\User;
use OTPHP\TOTP;

class MfaService
{
    // Caller must hold a database row lock, so a code cannot be consumed twice.
    public static function verify(User $user, string $code, bool $pending = false): bool
    {
        if (! $pending) {
            $hashes = $user->mfa_recovery_codes ?? [];
            foreach ($hashes as $index => $hash) {
                if (hash_equals($hash, hash('sha256', strtolower(trim($code))))) {
                    unset($hashes[$index]);
                    $user->mfa_recovery_codes = array_values($hashes);
                    $user->save();
                    return true;
                }
            }
        }
        $secret = $pending ? $user->mfa_pending_secret : $user->mfa_secret;
        if (! $secret || ! preg_match('/^\d{6}$/D', $code)) { return false; }
        $otp = TOTP::createFromSecret($secret);
        $counter = intdiv(now()->timestamp, 30);
        foreach ([$counter, $counter - 1, $counter + 1] as $candidate) {
            if (! $pending && $candidate <= ($user->mfa_last_counter ?? -1)) { continue; }
            if (hash_equals($otp->at($candidate * 30), $code)) {
                $user->mfa_last_counter = $candidate;
                $user->save();
                return true;
            }
        }
        return false;
    }

    public static function recoveryCodes(User $user): array
    {
        $codes = array_map(fn () => bin2hex(random_bytes(10)), range(1, 8));
        $user->mfa_recovery_codes = array_map(fn ($code) => hash('sha256', $code), $codes);
        $user->save();
        return $codes;
    }
}
