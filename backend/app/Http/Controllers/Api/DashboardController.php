<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\BoardingHouse;
use App\Models\Room;
use App\Models\Student;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user    = $request->user();
        $isAdmin = $user->isAdmin();
        $ownerId = $user->owner?->id;

        $bhQuery = BoardingHouse::query();
        if (!$isAdmin) {
            $bhQuery->where('owner_id', $ownerId);
        }
        $boardingHouseIds = $bhQuery->pluck('id');

        $totalStudents        = $isAdmin
            ? Student::count()
            : Student::whereIn('boarding_house_id', $boardingHouseIds)->count();
        $totalBoardingHouses  = $bhQuery->count();
        $totalRooms           = Room::whereIn('boarding_house_id', $boardingHouseIds)->count();
        $occupiedRooms        = Room::whereIn('boarding_house_id', $boardingHouseIds)
                                    ->where('available_slots', 0)
                                    ->where('status', '!=', 'maintenance')
                                    ->count();

        // Pending account approvals — admin only
        $pendingAccounts = $isAdmin
            ? User::whereIn('role', ['student', 'owner'])->where('account_status', 'pending')->count()
            : 0;

        // Pending BH approvals — admin only
        $pendingBhApprovals = $isAdmin
            ? BoardingHouse::where('approval_status', 'pending')->count()
            : 0;

        $recentLogs = ActivityLog::with('user')
            ->orderByDesc('created_at')
            ->limit(10)
            ->get()
            ->map(fn($log) => [
                'id'         => $log->id,
                'action'     => $log->action,
                'user'       => $log->user?->name,
                'created_at' => $log->created_at?->diffForHumans(),
            ]);

        return response()->json([
            'stats' => [
                'total_students'        => $totalStudents,
                'total_boarding_houses' => $totalBoardingHouses,
                'total_rooms'           => $totalRooms,
                'occupied_rooms'        => $occupiedRooms,
                'pending_approvals'     => $pendingBhApprovals,
                'pending_accounts'      => $pendingAccounts,
            ],
            'recent_logs' => $recentLogs,
        ]);
    }
}
