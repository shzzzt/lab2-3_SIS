<?php

use App\Http\Controllers\AcademicRecordController;
use App\Http\Controllers\AcademicTermController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\CourseController;
use App\Http\Controllers\CourseOfferingController;
use App\Http\Controllers\EnrollmentController;
use App\Http\Controllers\GradeController;
use App\Http\Controllers\ProgramController;
use App\Http\Controllers\StudentController;
use App\Http\Controllers\UserDirectoryController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1/auth')->group(function (): void {
    Route::post('login', [AuthController::class, 'login']);

    Route::middleware(['auth:api', \App\Http\Middleware\ActiveAccount::class, \App\Http\Middleware\SecurityAccess::class])->group(function (): void {
        Route::post('logout', [AuthController::class, 'logout']);
        Route::get('me', [AuthController::class, 'me']);
    });
});

Route::get('v1/branding', [\App\Http\Controllers\AdministrationController::class, 'branding']);

Route::prefix('v1')->middleware(['auth:api', \App\Http\Middleware\ActiveAccount::class, \App\Http\Middleware\SecurityAccess::class])->group(function (): void {
    Route::prefix('security')->group(function (): void {
        Route::get('mfa', [\App\Http\Controllers\SecurityController::class, 'status']);
        Route::post('mfa/setup', [\App\Http\Controllers\SecurityController::class, 'setup']);
        Route::post('mfa/confirm', [\App\Http\Controllers\SecurityController::class, 'confirm']);
        Route::post('mfa/disable', [\App\Http\Controllers\SecurityController::class, 'disable']);
        Route::post('mfa/recovery', [\App\Http\Controllers\SecurityController::class, 'recovery']);
    });
    Route::get('system-info', [\App\Http\Controllers\AdministrationController::class, 'settings']);
    Route::get('users', [UserDirectoryController::class, 'index'])->middleware('role:admin,registrar');
    Route::middleware('role:admin')->prefix('admin')->group(function (): void {
        Route::get('security', [\App\Http\Controllers\SecurityController::class, 'policy']);
        Route::put('security', [\App\Http\Controllers\SecurityController::class, 'savePolicy']);
        Route::get('audit-logs', [\App\Http\Controllers\AuditLogController::class, 'index']);
        Route::get('users', [\App\Http\Controllers\AdministrationController::class, 'index']);
        Route::post('users', [\App\Http\Controllers\AdministrationController::class, 'store']);
        Route::patch('users/{user}', [\App\Http\Controllers\AdministrationController::class, 'update']);
        Route::get('settings', [\App\Http\Controllers\AdministrationController::class, 'settings']);
        Route::put('settings', [\App\Http\Controllers\AdministrationController::class, 'saveSettings']);
        Route::post('settings/logo', [\App\Http\Controllers\AdministrationController::class, 'uploadLogo']);
        Route::delete('settings/logo', [\App\Http\Controllers\AdministrationController::class, 'removeLogo']);
    });
    Route::middleware('role:registrar,student')->group(function (): void {
        Route::apiResource('students', StudentController::class);
    });

    Route::middleware('role:registrar')->group(function (): void {
        Route::apiResource('programs', ProgramController::class);
        Route::apiResource('courses', CourseController::class);
        Route::apiResource('academic-terms', AcademicTermController::class);
        Route::post('course-offerings', [CourseOfferingController::class, 'store']);
        Route::match(['put', 'patch'], 'course-offerings/{course_offering}', [CourseOfferingController::class, 'update']);
        Route::delete('course-offerings/{course_offering}', [CourseOfferingController::class, 'destroy']);
        Route::post('enrollments', [EnrollmentController::class, 'store']);
        Route::match(['put', 'patch'], 'enrollments/{enrollment}', [EnrollmentController::class, 'update']);
        Route::delete('enrollments/{enrollment}', [EnrollmentController::class, 'destroy']);
    });

    Route::middleware('role:registrar,faculty,instructor,advisor,student')->group(function (): void {
        Route::get('course-offerings', [CourseOfferingController::class, 'index']);
        Route::get('course-offerings/{course_offering}', [CourseOfferingController::class, 'show']);
        Route::get('enrollments', [EnrollmentController::class, 'index']);
        Route::get('enrollments/{enrollment}', [EnrollmentController::class, 'show']);
        Route::get('students/{student}/enrollments', [EnrollmentController::class, 'studentEnrollments']);
        Route::get('students/{student}/grades', [GradeController::class, 'studentGrades']);
        Route::get('students/{student}/academic-record', [AcademicRecordController::class, 'show']);
        Route::get('course-offerings/{course_offering}/students', [EnrollmentController::class, 'offeringStudents']);
        Route::get('grades', [GradeController::class, 'index']);
        Route::get('grades/{grade}', [GradeController::class, 'show']);
    });

    Route::middleware('role:faculty,instructor')->group(function (): void {
        Route::post('grades', [GradeController::class, 'store']);
        Route::match(['put', 'patch'], 'grades/{grade}', [GradeController::class, 'update']);
    });
});
