<?php

use App\Http\Controllers\Api\SocialAuthController;
use Illuminate\Support\Facades\Route;

// ─── Google OAuth (must be before the SPA catch-all) ──────────────────────
Route::get('/auth/google/redirect', [SocialAuthController::class, 'redirectToGoogle'])
    ->name('auth.google.redirect');
Route::get('/auth/google/callback', [SocialAuthController::class, 'handleGoogleCallback'])
    ->name('auth.google.callback');

// Serve React SPA for all other routes
Route::get('/{any?}', function () {
    return view('app');
})->where('any', '.*');
