<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\BoardingHouse;
use App\Models\Room;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RoomController extends Controller
{
    public function index(BoardingHouse $boardingHouse): JsonResponse
    {
        return response()->json($boardingHouse->rooms()->orderBy('room_name')->get());
    }

    private function authorizeOwnership(Request $request, BoardingHouse $boardingHouse): void
    {
        $user = $request->user();
        if ($user->isOwner() && $boardingHouse->owner_id !== $user->owner?->id) {
            abort(403, 'You do not own this boarding house.');
        }
    }

    public function store(Request $request, BoardingHouse $boardingHouse): JsonResponse
    {
        $this->authorizeOwnership($request, $boardingHouse);
        $data = $request->validate([
            'room_name'   => 'required|string',
            'capacity'    => 'required|integer|min:1',
            'price'       => 'required|numeric|min:0',
            'status'      => 'nullable|in:available,occupied,maintenance',
            'gender_type' => 'nullable|in:Male,Female,Mixed',
            'amenities'   => 'nullable|string',
        ]);

        $data['boarding_house_id'] = $boardingHouse->id;
        $data['available_slots'] = $data['capacity'];
        $data['occupied_slots'] = 0;

        $room = Room::create($data);

        ActivityLog::create([
            'user_id'    => $request->user()->id,
            'action'     => "Added room {$room->room_name} to {$boardingHouse->boarding_name}.",
            'created_at' => now(),
        ]);

        return response()->json($room, 201);
    }

    public function update(Request $request, BoardingHouse $boardingHouse, Room $room): JsonResponse
    {
        $this->authorizeOwnership($request, $boardingHouse);

        $data = $request->validate([
            'room_name'      => 'required|string',
            'capacity'       => 'required|integer|min:1',
            'occupied_slots' => 'nullable|integer|min:0',
            'price'          => 'required|numeric|min:0',
            'status'         => 'nullable|in:available,occupied,maintenance',
            'gender_type'    => 'nullable|in:Male,Female,Mixed',
            'amenities'      => 'nullable|string',
        ]);

        $occupiedSlots = $data['occupied_slots'] ?? $room->occupied_slots;
        $data['available_slots'] = max(0, $data['capacity'] - $occupiedSlots);

        $room->update($data);

        ActivityLog::create([
            'user_id'    => $request->user()->id,
            'action'     => "Updated room {$room->room_name} in {$boardingHouse->boarding_name}.",
            'created_at' => now(),
        ]);

        return response()->json($room);
    }

    public function destroy(Request $request, BoardingHouse $boardingHouse, Room $room): JsonResponse
    {
        $this->authorizeOwnership($request, $boardingHouse);

        $name = $room->room_name;
        $room->delete();

        ActivityLog::create([
            'user_id'    => $request->user()->id,
            'action'     => "Deleted room {$name} from {$boardingHouse->boarding_name}.",
            'created_at' => now(),
        ]);

        return response()->json(['message' => 'Room deleted.']);
    }
}
