<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\StudentController;
use App\Http\Controllers\Api\BoardingHouseController;
use App\Http\Controllers\Api\RoomController;
use App\Http\Controllers\Api\OwnerController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\MapController;
use App\Http\Controllers\Api\StudentFinderController;
use App\Http\Controllers\Api\StudentInquiryController;
use App\Http\Controllers\Api\NotificationController;

// Auth routes
Route::post('/login', [AuthController::class, 'login']);
Route::post('/register-owner', [AuthController::class, 'registerOwner']);

// Public student finder
Route::get('/find-boarding', [StudentFinderController::class, 'search']);
Route::get('/find-boarding/markers', [MapController::class, 'publicMarkers']);
Route::get('/find-boarding/{id}', [StudentFinderController::class, 'show']);

// Public inquiry submission (students can submit without account)
Route::post('/student-inquiries', [StudentInquiryController::class, 'store']);

// Authenticated routes
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', [AuthController::class, 'user']);
    Route::post('/logout', [AuthController::class, 'logout']);

    // Dashboard
    Route::get('/dashboard', [DashboardController::class, 'index']);

    // Students
    Route::apiResource('students', StudentController::class);
    Route::get('/students/{student}/assign', [StudentController::class, 'assignForm']);
    Route::post('/students/{student}/assign', [StudentController::class, 'assign']);
    Route::get('/students/{student}/boarding-history', [StudentController::class, 'boardingHistory']);

    // Boarding Houses
    Route::apiResource('boarding-houses', BoardingHouseController::class);
    Route::get('/boarding-houses/{boardingHouse}/rooms', [RoomController::class, 'index']);
    Route::post('/boarding-houses/{boardingHouse}/rooms', [RoomController::class, 'store']);
    Route::put('/boarding-houses/{boardingHouse}/rooms/{room}', [RoomController::class, 'update']);
    Route::delete('/boarding-houses/{boardingHouse}/rooms/{room}', [RoomController::class, 'destroy']);

    // Student Inquiries (for owners to manage)
    Route::get('/boarding-houses/{boardingHouse}/inquiries', [StudentInquiryController::class, 'index']);
    Route::get('/student-inquiries/counts', [StudentInquiryController::class, 'counts']);
    Route::get('/student-inquiries', [StudentInquiryController::class, 'allInquiries']);
    Route::put('/student-inquiries/{id}', [StudentInquiryController::class, 'update']);

    // Notifications
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::get('/notifications/unread-count', [NotificationController::class, 'unreadCount']);
    Route::put('/notifications/{id}/read', [NotificationController::class, 'markAsRead']);
    Route::put('/notifications/read-all', [NotificationController::class, 'markAllAsRead']);
    Route::delete('/notifications/{id}', [NotificationController::class, 'destroy']);
    Route::delete('/notifications/clear-read', [NotificationController::class, 'clearRead']);

    // Map markers (authenticated)
    Route::get('/map/markers', [MapController::class, 'markers']);

    // Owners (admin only)
    Route::middleware('role:admin')->group(function () {
        Route::apiResource('owners', OwnerController::class);
    });

    // Reports
    Route::get('/reports/students', [ReportController::class, 'students']);
    Route::get('/reports/boarding-houses', [ReportController::class, 'boardingHouses']);
    Route::get('/reports/occupancy', [ReportController::class, 'occupancy']);
    Route::get('/reports/geo', [ReportController::class, 'geo']);
});
