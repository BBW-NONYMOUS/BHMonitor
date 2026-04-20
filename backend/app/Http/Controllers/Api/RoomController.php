<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\BoardingHouse;
use App\Models\Room;
use App\Models\RoomPhoto;
use App\Models\Student;
use App\Models\StudentInquiry;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RoomController extends Controller
{
    private function authorizeOwnerRoomManagement(Request $request, BoardingHouse $boardingHouse): void
    {
        $user = $request->user();

        if (!$user->isOwner()) {
            abort(403, 'Only the boarding house owner can manage room assignments.');
        }

        if ($boardingHouse->owner_id !== $user->owner?->id) {
            abort(403, 'You do not own this boarding house.');
        }
    }

    public function index(BoardingHouse $boardingHouse): JsonResponse
    {
        $rooms = $boardingHouse->rooms()
            ->with(['photos', 'students:id,first_name,last_name,student_no,room_id'])
            ->orderBy('room_name')
            ->get()
            ->map(function (Room $room) {
                $studentCount = $room->students->count();
                $room->student_count = $studentCount;
                $room->computed_status = match(true) {
                    $studentCount === 0              => 'available',
                    $studentCount >= $room->capacity => 'full',
                    default                          => 'limited',
                };
                return $room;
            });

        return response()->json($rooms);
    }

    private function authorizeOwnership(Request $request, BoardingHouse $boardingHouse): void
    {
        $user = $request->user();
        if ($user->isAdmin()) {
            abort(403, 'Admins can only view and delete rooms.');
        }
        if ($user->isOwner() && $boardingHouse->owner_id !== $user->owner?->id) {
            abort(403, 'You do not own this boarding house.');
        }
    }

    private function authorizeOwnerOnly(Request $request, BoardingHouse $boardingHouse): void
    {
        $user = $request->user();
        if ($user->isOwner() && $boardingHouse->owner_id !== $user->owner?->id) {
            abort(403, 'You do not own this boarding house.');
        }
    }

    public function store(Request $request, BoardingHouse $boardingHouse): JsonResponse
    {
        // Only owners can create rooms
        $user = $request->user();
        if ($user->isAdmin()) {
            return response()->json(['message' => 'Admins cannot create rooms. Only the boarding house owner can.'], 403);
        }
        $this->authorizeOwnerOnly($request, $boardingHouse);

        $data = $request->validate([
            'room_name'   => 'required|string|max:100',
            'capacity'    => 'required|integer|min:1',
            'price'       => 'required|numeric|min:0',
            'gender_type' => 'nullable|in:Male,Female,Mixed',
            'amenities'   => 'nullable|string|max:500',
            'photos'      => 'required|array|min:3|max:6',
            'photos.*'    => 'image|max:5120',
        ]);

        $data['boarding_house_id'] = $boardingHouse->id;
        $data['available_slots']  = $data['capacity'];
        $data['occupied_slots']   = 0;
        $data['status']           = 'available';

        $room = Room::create($data);

        // Store room photos (up to 3)
        if ($request->hasFile('photos')) {
            foreach ($request->file('photos') as $index => $photo) {
                $path = $photo->store('room_photos', 'public');
                RoomPhoto::create([
                    'room_id'    => $room->id,
                    'photo_path' => $path,
                    'sort_order' => $index,
                ]);
            }
        }

        ActivityLog::create([
            'user_id'    => $request->user()->id,
            'action'     => "Added room {$room->room_name} to {$boardingHouse->boarding_name}.",
            'created_at' => now(),
        ]);

        return response()->json($room->load('photos'), 201);
    }

    public function update(Request $request, BoardingHouse $boardingHouse, Room $room): JsonResponse
    {
        // Only owners can edit rooms
        $user = $request->user();
        if ($user->isAdmin()) {
            return response()->json(['message' => 'Admins cannot edit rooms. Only the boarding house owner can.'], 403);
        }
        $this->authorizeOwnerOnly($request, $boardingHouse);

        $data = $request->validate([
            'room_name'   => 'required|string|max:100',
            'capacity'    => 'required|integer|min:1',
            'price'       => 'required|numeric|min:0',
            'gender_type' => 'nullable|in:Male,Female,Mixed',
            'amenities'   => 'nullable|string|max:500',
            'photos'      => 'nullable|array|min:3|max:6',
            'photos.*'    => 'image|max:5120',
        ]);

        $studentCount = $room->students()->count();
        $data['occupied_slots']  = $studentCount;
        $data['available_slots'] = max(0, $data['capacity'] - $studentCount);

        $room->update($data);

        // Append new photos (replacing all old ones if new ones provided)
        if ($request->hasFile('photos')) {
            $room->photos()->delete();
            foreach ($request->file('photos') as $index => $photo) {
                $path = $photo->store('room_photos', 'public');
                RoomPhoto::create([
                    'room_id'    => $room->id,
                    'photo_path' => $path,
                    'sort_order' => $index,
                ]);
            }
        }

        ActivityLog::create([
            'user_id'    => $request->user()->id,
            'action'     => "Updated room {$room->room_name} in {$boardingHouse->boarding_name}.",
            'created_at' => now(),
        ]);

        return response()->json($room->load('photos'));
    }

    public function destroy(Request $request, BoardingHouse $boardingHouse, Room $room): JsonResponse
    {
        // Both admin and owner can delete rooms, but owner must own the BH
        $user = $request->user();
        if ($user->isOwner() && $boardingHouse->owner_id !== $user->owner?->id) {
            abort(403, 'You do not own this boarding house.');
        }

        // Unassign students from this room before deleting
        Student::where('room_id', $room->id)->update(['room_id' => null]);

        $name = $room->room_name;
        $room->delete();

        ActivityLog::create([
            'user_id'    => $request->user()->id,
            'action'     => "Deleted room {$name} from {$boardingHouse->boarding_name}.",
            'created_at' => now(),
        ]);

        return response()->json(['message' => 'Room deleted.']);
    }

    /**
     * Add a student to a room — enforces slot capacity
     */
    public function addStudent(Request $request, BoardingHouse $boardingHouse, Room $room): JsonResponse
    {
        $this->authorizeOwnerRoomManagement($request, $boardingHouse);

        $data = $request->validate([
            'student_id' => 'required|exists:students,id',
        ]);

        $student = Student::findOrFail($data['student_id']);

        // Enforce slot limit
        $currentCount = $room->students()->count();
        if ($currentCount >= $room->capacity) {
            return response()->json(['message' => 'This room is already at full capacity.'], 422);
        }

        // Remove from previous room if any
        if ($student->room_id && $student->room_id !== $room->id) {
            $prevRoom = Room::find($student->room_id);
            if ($prevRoom) {
                $prevRoom->occupied_slots = max(0, $prevRoom->occupied_slots - 1);
                $prevRoom->available_slots = $prevRoom->capacity - $prevRoom->occupied_slots;
                $prevRoom->save();
            }
        }

        $student->update([
            'room_id'           => $room->id,
            'boarding_house_id' => $boardingHouse->id,
        ]);

        // Update room slot counts
        $newCount = $room->students()->count();
        $room->update([
            'occupied_slots'  => $newCount,
            'available_slots' => max(0, $room->capacity - $newCount),
        ]);

        ActivityLog::create([
            'user_id'    => $request->user()->id,
            'action'     => "Assigned student {$student->full_name} to room {$room->room_name} in {$boardingHouse->boarding_name}.",
            'created_at' => now(),
        ]);

        return response()->json([
            'message' => "Student assigned to room {$room->room_name}.",
            'student' => $student->fresh(['boardingHouse', 'room']),
        ]);
    }

    /**
     * Remove a student from a room
     */
    public function removeStudent(Request $request, BoardingHouse $boardingHouse, Room $room, Student $student): JsonResponse
    {
        $this->authorizeOwnerRoomManagement($request, $boardingHouse);

        if ($student->room_id !== $room->id) {
            return response()->json(['message' => 'Student is not in this room.'], 422);
        }

        $student->update(['room_id' => null]);

        $newCount = $room->students()->count();
        $room->update([
            'occupied_slots'  => $newCount,
            'available_slots' => max(0, $room->capacity - $newCount),
        ]);

        ActivityLog::create([
            'user_id'    => $request->user()->id,
            'action'     => "Removed student {$student->full_name} from room {$room->room_name}.",
            'created_at' => now(),
        ]);

        return response()->json(['message' => 'Student removed from room.']);
    }

    /**
     * Get students available to be assigned to a room
     */
    public function availableStudents(Request $request, BoardingHouse $boardingHouse, Room $room): JsonResponse
    {
        $this->authorizeOwnerRoomManagement($request, $boardingHouse);

        $approvedStudentIds = StudentInquiry::where('boarding_house_id', $boardingHouse->id)
            ->where('status', 'approved')
            ->whereNotNull('student_id')
            ->pluck('student_id');

        $students = Student::where(function ($query) use ($boardingHouse, $approvedStudentIds) {
                $query->where('boarding_house_id', $boardingHouse->id);

                if ($approvedStudentIds->isNotEmpty()) {
                    $query->orWhereIn('id', $approvedStudentIds);
                }
            })
            ->where(function ($q) use ($room) {
                $q->whereNull('room_id')->orWhere('room_id', '!=', $room->id);
            })
            ->select('id', 'first_name', 'last_name', 'student_no', 'gender', 'room_id')
            ->distinct()
            ->get();

        return response()->json($students);
    }
}
