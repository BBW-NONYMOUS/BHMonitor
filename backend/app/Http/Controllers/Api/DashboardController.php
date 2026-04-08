<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\BoardingHouse;
use App\Models\Room;
use App\Models\Student;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $ownerId = $user->owner?->id;
        $isAdmin = $user->isAdmin();

        $bhQuery = BoardingHouse::query();
        if (!$isAdmin) {
            $bhQuery->where('owner_id', $ownerId);
        }
        $boardingHouseIds = $bhQuery->pluck('id');

        $totalStudents = Student::whereIn('boarding_house_id', $boardingHouseIds)->count();
        if ($isAdmin) {
            $totalStudents = Student::count();
        }

        $totalBoardingHouses = $bhQuery->count();

        $totalRooms = Room::whereIn('boarding_house_id', $boardingHouseIds)->count();
        $occupiedRooms = Room::whereIn('boarding_house_id', $boardingHouseIds)
            ->where('status', 'occupied')
            ->count();

        $recentLogs = ActivityLog::with('user')
            ->orderByDesc('created_at')
            ->limit(10)
            ->get()
            ->map(fn ($log) => [
                'id'         => $log->id,
                'action'     => $log->action,
                'user'       => $log->user?->name,
                'created_at' => $log->created_at?->diffForHumans(),
            ]);

        return response()->json([
            'stats' => [
                'total_students'       => $totalStudents,
                'total_boarding_houses'=> $totalBoardingHouses,
                'total_rooms'          => $totalRooms,
                'occupied_rooms'       => $occupiedRooms,
            ],
            'recent_logs' => $recentLogs,
        ]);
    }
}
