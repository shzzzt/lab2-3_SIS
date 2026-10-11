<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Tymon\JWTAuth\Contracts\JWTSubject;

#[Fillable(['first_name', 'last_name', 'email', 'password', 'role', 'status'])]
#[Hidden(['password', 'remember_token', 'mfa_secret', 'mfa_pending_secret', 'mfa_pending_expires_at', 'mfa_confirmed_at', 'mfa_recovery_codes', 'mfa_last_counter', 'auth_version'])]
class User extends Authenticatable implements JWTSubject
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable;

    public function getJWTIdentifier(): mixed
    {
        return $this->getKey();
    }

    public function getJWTCustomClaims(): array
    {
        return ['av' => (int) $this->auth_version];
    }

    public function student(): HasOne
    {
        return $this->hasOne(Student::class);
    }

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'mfa_secret' => 'encrypted',
            'mfa_pending_secret' => 'encrypted',
            'mfa_pending_expires_at' => 'datetime',
            'mfa_confirmed_at' => 'datetime',
            'mfa_recovery_codes' => 'array',
            'auth_version' => 'integer',
            'mfa_last_counter' => 'integer',
        ];
    }
}
