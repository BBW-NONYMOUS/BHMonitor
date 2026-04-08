<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\BoardingHouse;
use App\Models\Room;
use App\Models\Student;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReportController extends Controller
{
    public function students(Request $request): JsonResponse
    {
        $user = $request->user();
        $query = Student::with('boardingHouse.owner');

        if ($user->isOwner()) {
            $bhIds = BoardingHouse::where('owner_id', $user->owner->id)->pluck('id');
            $query->whereIn('boarding_house_id', $bhIds);
        }

        return response()->json($query->orderBy('last_name')->get());
    }

    public function boardingHouses(Request $request): JsonResponse
    {
        $user = $request->user();
        $query = BoardingHouse::with('owner')->withCount('students', 'rooms');

        if ($user->isOwner()) {
            $query->where('owner_id', $user->owner->id);
        }

        return response()->json($query->orderBy('boarding_name')->get());
    }

    public function occupancy(Request $request): JsonResponse
    {
        $user = $request->user();
        $query = BoardingHouse::with(['rooms' => fn ($q) => $q->orderBy('room_name')]);

        if ($user->isOwner()) {
            $query->where('owner_id', $user->owner->id);
        }

        return response()->json($query->orderBy('boarding_name')->get());
    }

    public function geo(Request $request): JsonResponse
    {
        $user = $request->user();
        $query = BoardingHouse::withCount('students')
            ->whereNotNull('latitude')
            ->whereNotNull('longitude');

        if ($user->isOwner()) {
            $query->where('owner_id', $user->owner->id);
        }

        return response()->json($query->orderBy('boarding_name')->get());
    }
}
