<?php

namespace App\Providers;

use App\Models\Student;
use App\Policies\StudentPolicy;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        foreach ([\App\Models\User::class, \App\Models\Student::class, \App\Models\Program::class, \App\Models\Course::class, \App\Models\AcademicTerm::class, \App\Models\CourseOffering::class, \App\Models\Enrollment::class, \App\Models\Grade::class] as $model) {
            $model::observe(\App\Observers\AuditObserver::class);
        }
        Gate::policy(Student::class, StudentPolicy::class);
    }
}
