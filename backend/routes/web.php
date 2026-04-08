<?php

use Illuminate\Support\Facades\Route;

// Serve React SPA for all routes
Route::get('/{any?}', function () {
    return view('app');
})->where('any', '.*');
