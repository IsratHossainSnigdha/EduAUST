<?php

use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\Auth\RegisterInfoController;
use App\Http\Controllers\Auth\RegisterSecurityController;
use App\Http\Controllers\Auth\RegisterVerifyController;
use App\Http\Controllers\Auth\SessionController;
use App\Http\Controllers\DepartmentController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth:sanctum'])->get('/user', function (Request $request) {
    return $request->user();
});

Route::prefix('v1')->group(function () {
    Route::get('/departments', [DepartmentController::class, 'index'])
        ->name('api.v1.departments.index');

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

        Route::middleware('auth.jwt')->group(function () {
            Route::get('/me', [SessionController::class, 'me'])->name('api.v1.auth.me');
            Route::post('/logout', [SessionController::class, 'logout'])->name('api.v1.auth.logout');
        });
    });
});
