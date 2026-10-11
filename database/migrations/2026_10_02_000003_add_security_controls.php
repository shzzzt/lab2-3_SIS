<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->text('mfa_secret')->nullable();
            $table->text('mfa_pending_secret')->nullable();
            $table->timestamp('mfa_pending_expires_at')->nullable();
            $table->timestamp('mfa_confirmed_at')->nullable();
            $table->json('mfa_recovery_codes')->nullable();
            $table->bigInteger('mfa_last_counter')->nullable();
            $table->unsignedInteger('auth_version')->default(0);
        });
        Schema::create('security_policies', function (Blueprint $table) {
            $table->id();
            $table->json('settings');
        });
    }
    public function down(): void
    {
        Schema::dropIfExists('security_policies');
        Schema::table('users', fn (Blueprint $table) => $table->dropColumn(['mfa_secret', 'mfa_pending_secret', 'mfa_pending_expires_at', 'mfa_confirmed_at', 'mfa_recovery_codes', 'mfa_last_counter', 'auth_version']));
    }
};
