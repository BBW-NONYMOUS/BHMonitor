<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\AccountController;
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
use App\Http\Controllers\Api\StudentDocumentController;
use App\Http\Controllers\Api\BackupController;

// ─── Public Auth ───────────────────────────────────────────────────────────
Route::post('/login',            [AuthController::class, 'login']);
Route::post('/register-owner',   [AuthController::class, 'registerOwner']);
Route::post('/register-student', [AuthController::class, 'registerStudent']);

// ─── Public Finder ─────────────────────────────────────────────────────────
Route::get('/find-boarding',          [StudentFinderController::class, 'search']);
Route::get('/find-boarding/markers',  [MapController::class, 'publicMarkers']);
Route::get('/find-boarding/{id}',     [StudentFinderController::class, 'show']);

// ─── Public Reservation (unauthenticated fallback) ─────────────────────────
Route::post('/reservations', [StudentInquiryController::class, 'store']);
// Legacy alias kept for backward compat
Route::post('/student-inquiries', [StudentInquiryController::class, 'store']);

// ─── Authenticated Routes ───────────────────────────────────────────────────
Route::middleware('auth:sanctum')->group(function () {

    // Auth / Profile
    Route::get('/user',            [AuthController::class, 'user']);
    Route::post('/logout',         [AuthController::class, 'logout']);
    Route::post('/profile/update', [AuthController::class, 'updateProfile']);

    // Dashboard
    Route::get('/dashboard', [DashboardController::class, 'index']);

    // ─── Students ────────────────────────────────────────────────────────
    Route::apiResource('students', StudentController::class);
    Route::post('/students/from-reservation',           [StudentController::class, 'storeFromReservation']);
    Route::get('/students/{student}/assign',            [StudentController::class, 'assignForm']);
    Route::post('/students/{student}/assign',           [StudentController::class, 'assign']);
    Route::get('/students/{student}/boarding-history',  [StudentController::class, 'boardingHistory']);

    // Student Documents
    Route::get('/students/{student}/documents',                         [StudentDocumentController::class, 'index']);
    Route::post('/students/{student}/documents',                        [StudentDocumentController::class, 'store']);
    Route::delete('/students/{student}/documents/{document}',           [StudentDocumentController::class, 'destroy']);
    Route::put('/students/{student}/documents/{document}/verify',       [StudentDocumentController::class, 'verify']);

    // ─── Boarding Houses ─────────────────────────────────────────────────
    Route::apiResource('boarding-houses', BoardingHouseController::class);
    Route::get('/my-boarding-houses', [BoardingHouseController::class, 'myBoardingHouses']);

    // Rooms
    Route::get('/boarding-houses/{boardingHouse}/rooms',                    [RoomController::class, 'index']);
    Route::post('/boarding-houses/{boardingHouse}/rooms',                   [RoomController::class, 'store']);
    Route::put('/boarding-houses/{boardingHouse}/rooms/{room}',             [RoomController::class, 'update']);
    Route::delete('/boarding-houses/{boardingHouse}/rooms/{room}',          [RoomController::class, 'destroy']);
    Route::get('/boarding-houses/{boardingHouse}/rooms/{room}/students',    [RoomController::class, 'availableStudents']);
    Route::post('/boarding-houses/{boardingHouse}/rooms/{room}/add-student',    [RoomController::class, 'addStudent']);
    Route::delete('/boarding-houses/{boardingHouse}/rooms/{room}/students/{student}', [RoomController::class, 'removeStudent']);

    // ─── Reservations (formerly Inquiries) ──────────────────────────────
    Route::get('/boarding-houses/{boardingHouse}/reservations',     [StudentInquiryController::class, 'index']);
    Route::get('/reservations/counts',                              [StudentInquiryController::class, 'counts']);
    Route::get('/reservations',                                     [StudentInquiryController::class, 'allInquiries']);
    Route::get('/reservations/approved-for-direct-add',            [StudentInquiryController::class, 'approvedForDirectAdd']);
    Route::put('/reservations/{id}',                               [StudentInquiryController::class, 'update']);

    // Legacy aliases
    Route::get('/boarding-houses/{boardingHouse}/inquiries',  [StudentInquiryController::class, 'index']);
    Route::get('/student-inquiries/counts',                   [StudentInquiryController::class, 'counts']);
    Route::get('/student-inquiries',                          [StudentInquiryController::class, 'allInquiries']);
    Route::put('/student-inquiries/{id}',                     [StudentInquiryController::class, 'update']);

    // ─── Notifications ───────────────────────────────────────────────────
    Route::get('/notifications',                    [NotificationController::class, 'index']);
    Route::get('/notifications/unread-count',       [NotificationController::class, 'unreadCount']);
    Route::put('/notifications/{id}/read',          [NotificationController::class, 'markAsRead']);
    Route::put('/notifications/read-all',           [NotificationController::class, 'markAllAsRead']);
    Route::delete('/notifications/{id}',            [NotificationController::class, 'destroy']);
    Route::delete('/notifications/clear-read',      [NotificationController::class, 'clearRead']);

    // ─── Map ─────────────────────────────────────────────────────────────
    Route::get('/map/markers', [MapController::class, 'markers']);

    // ─── Reports ─────────────────────────────────────────────────────────
    Route::get('/reports/students',        [ReportController::class, 'students']);
    Route::get('/reports/boarding-houses', [ReportController::class, 'boardingHouses']);
    Route::get('/reports/occupancy',       [ReportController::class, 'occupancy']);
    Route::get('/reports/geo',             [ReportController::class, 'geo']);

    // ─── Admin Only ──────────────────────────────────────────────────────
    Route::middleware('role:admin')->group(function () {

        // Owners management
        Route::apiResource('owners', OwnerController::class);

        // Boarding house approval
        Route::put('/boarding-houses/{boardingHouse}/approve', [BoardingHouseController::class, 'approve']);
        Route::put('/boarding-houses/{boardingHouse}/reject',  [BoardingHouseController::class, 'reject']);

        // Account management
        Route::get('/accounts',                     [AccountController::class, 'index']);
        Route::get('/accounts/pending-count',       [AccountController::class, 'pendingCount']);
        Route::put('/accounts/{user}/approve',      [AccountController::class, 'approve']);
        Route::put('/accounts/{user}/reject',       [AccountController::class, 'reject']);
        Route::delete('/accounts/{user}',           [AccountController::class, 'destroy']);

        // Database backup / restore
        Route::get('/backup/export',    [BackupController::class, 'export']);
        Route::post('/backup/restore',  [BackupController::class, 'restore']);
    });
});
