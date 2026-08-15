<?php

use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\Auth\NewPasswordController;
use App\Http\Controllers\Auth\PasswordResetLinkController;
use App\Http\Controllers\Auth\RegisterInfoController;
use App\Http\Controllers\Auth\RegisterSecurityController;
use App\Http\Controllers\Auth\RegisterVerifyController;
use App\Http\Controllers\Auth\SessionController;
use App\Http\Controllers\DepartmentController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\TutorController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    Route::get('/departments', [DepartmentController::class, 'index'])
        ->name('api.v1.departments.index');

    Route::middleware('auth.jwt')->prefix('notifications')->group(function () {
        Route::get('/', [NotificationController::class, 'index'])
            ->name('api.v1.notifications.index');

        Route::get('/unread-count', [NotificationController::class, 'unreadCount'])
            ->name('api.v1.notifications.unread-count');

        Route::patch('/read-all', [NotificationController::class, 'markAllAsRead'])
            ->name('api.v1.notifications.read-all');

        Route::patch('/{notification}/read', [NotificationController::class, 'markAsRead'])
            ->name('api.v1.notifications.read');
    });

    Route::middleware('auth.jwt')->prefix('tutors')->group(function () {
        Route::get('/', [TutorController::class, 'index'])
            ->name('api.v1.tutors.index');

        Route::get('/filters', [TutorController::class, 'filters'])
            ->name('api.v1.tutors.filters');
    });

    Route::prefix('auth')->group(function () {
        Route::post('/register/info', [RegisterInfoController::class, 'store'])
            ->middleware('throttle:6,1')
            ->name('api.v1.auth.register.info');

        Route::post('/register/verify', [RegisterVerifyController::class, 'verify'])
            ->middleware('throttle:10,1')
            ->name('api.v1.auth.register.verify');

        Route::post('/register/resend', [RegisterVerifyController::class, 'resend'])
            ->middleware('throttle:3,1')
            ->name('api.v1.auth.register.resend');

        Route::post('/register/security', [RegisterSecurityController::class, 'store'])
            ->middleware('throttle:6,1')
            ->name('api.v1.auth.register.security');

        Route::post('/login', [LoginController::class, 'store'])
            ->middleware('throttle:5,1')
            ->name('api.v1.auth.login');

        Route::post('/refresh', [SessionController::class, 'refresh'])
            ->middleware('throttle:10,1')
            ->name('api.v1.auth.refresh');

        Route::post('/forgot-password', [PasswordResetLinkController::class, 'store'])
            ->middleware('throttle:5,1')
            ->name('password.email');

        Route::post('/reset-password', [NewPasswordController::class, 'store'])
            ->middleware('throttle:5,1')
            ->name('password.store');

        Route::middleware('auth.jwt')->group(function () {
            Route::get('/me', [SessionController::class, 'me'])->name('api.v1.auth.me');
            Route::post('/logout', [SessionController::class, 'logout'])->name('api.v1.auth.logout');
        });
    });
});
