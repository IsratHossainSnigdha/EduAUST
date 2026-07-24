<?php

use App\Http\Controllers\Auth\RegisterInfoController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth:sanctum'])->get('/user', function (Request $request) {
    return $request->user();
});

Route::prefix('v1')->group(function () {
    Route::prefix('auth')->group(function () {
        Route::post('/register/info', [RegisterInfoController::class, 'store'])
            ->middleware('throttle:6,1')
            ->name('api.v1.auth.register.info');
    });
});
