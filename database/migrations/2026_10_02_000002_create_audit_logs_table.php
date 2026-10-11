<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('audit_logs', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('actor_id')->nullable()->index();
            $table->string('actor_name')->nullable();
            $table->string('actor_role')->nullable();
            $table->string('action')->index();
            $table->string('resource')->index();
            $table->string('resource_id')->nullable();
            $table->json('changes')->nullable();
            $table->timestamp('created_at')->index();
        });
    }
    public function down(): void { Schema::dropIfExists('audit_logs'); }
};
