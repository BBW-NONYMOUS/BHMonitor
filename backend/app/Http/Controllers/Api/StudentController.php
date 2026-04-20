<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\BoardingHouse;
use App\Models\Room;
use App\Models\Student;
use App\Models\StudentBoardingHistory;
use App\Models\StudentInquiry;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class StudentController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user  = $request->user();
        $query = Student::with(['boardingHouse.owner', 'room:id,room_name', 'inquiry:id,student_id,status']);

        if ($user->isOwner()) {
            $bhIds = BoardingHouse::where('owner_id', $user->owner?->id)->pluck('id');
            $approvedStudentIds = StudentInquiry::whereIn('boarding_house_id', $bhIds)
                ->where('status', 'approved')
                ->whereNotNull('student_id')
                ->pluck('student_id');

            $query->where(function ($q) use ($bhIds, $approvedStudentIds) {
                $q->whereIn('boarding_house_id', $bhIds);

                if ($approvedStudentIds->isNotEmpty()) {
                    $q->orWhereIn('id', $approvedStudentIds);
                }
            });
        }

        if ($search = $request->get('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('student_no', 'like', "%{$search}%")
                  ->orWhere('first_name', 'like', "%{$search}%")
                  ->orWhere('last_name', 'like', "%{$search}%");
            });
        }
        if ($course = $request->get('course')) $query->where('course', $course);
        if ($year   = $request->get('year_level')) $query->where('year_level', $year);

        return response()->json($query->orderByDesc('created_at')->paginate(15));
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'student_no'        => 'required|string|unique:students',
            'first_name'        => 'required|string|max:255',
            'last_name'         => 'required|string|max:255',
            'gender'            => 'nullable|in:Male,Female',
            'course'            => 'nullable|string|max:255',
            'year_level'        => 'nullable|string|max:50',
            'contact_number'    => 'nullable|string|max:20',
            'address'           => 'nullable|string|max:500',
            'parent_name'       => 'nullable|string|max:255',
            'parent_contact'    => 'nullable|string|max:20',
            'boarding_house_id' => 'nullable|exists:boarding_houses,id',
            'room_id'           => 'nullable|exists:rooms,id',
        ]);

        if ($request->hasFile('image')) {
            $request->validate(['image' => 'image|max:5120']);
            $data['image'] = $request->file('image')->store('students', 'public');
        }

        $room = null;
        if (!empty($data['room_id'])) {
            $room = Room::findOrFail($data['room_id']);

            if (empty($data['boarding_house_id'])) {
                $data['boarding_house_id'] = $room->boarding_house_id;
            } elseif ((int) $room->boarding_house_id !== (int) $data['boarding_house_id']) {
                throw ValidationException::withMessages([
                    'room_id' => ['The selected room does not belong to the selected boarding house.'],
                ]);
            }

            if ($room->students()->count() >= $room->capacity) {
                throw ValidationException::withMessages([
                    'room_id' => ['The selected room is already at full capacity.'],
                ]);
            }
        }

        $student = Student::create($data);

        if ($room) {
            $studentCount = $room->students()->count();
            $room->update([
                'occupied_slots'  => $studentCount,
                'available_slots' => max(0, $room->capacity - $studentCount),
            ]);
        }

        if (!empty($data['boarding_house_id'])) {
            StudentBoardingHistory::create([
                'student_id'        => $student->id,
                'boarding_house_id' => $data['boarding_house_id'],
                'boarded_at'        => now(),
            ]);
        }

        ActivityLog::create([
            'user_id'    => $request->user()->id,
            'action'     => "Added student {$student->first_name} {$student->last_name}.",
            'created_at' => now(),
        ]);

        return response()->json($student->load('boardingHouse', 'room'), 201);
    }

    /**
     * Direct Add from an approved reservation — no re-entry of data
     */
    public function storeFromReservation(Request $request): JsonResponse
    {
        $data = $request->validate([
            'reservation_id'    => 'required|exists:student_inquiries,id',
            'boarding_house_id' => 'nullable|exists:boarding_houses,id',
            'room_id'           => 'nullable|exists:rooms,id',
        ]);

        $reservation = StudentInquiry::findOrFail($data['reservation_id']);

        if ($reservation->status !== 'approved') {
            return response()->json(['message' => 'Only approved reservations can be converted to student records.'], 422);
        }

        if ($reservation->student_id) {
            return response()->json(['message' => 'This reservation has already been converted to a student record.'], 422);
        }

        $boardingHouseId = $data['boarding_house_id'] ?? $reservation->boarding_house_id;
        $room = null;
        if (!empty($data['room_id'])) {
            $room = Room::findOrFail($data['room_id']);

            if ((int) $room->boarding_house_id !== (int) $boardingHouseId) {
                throw ValidationException::withMessages([
                    'room_id' => ['The selected room does not belong to the selected boarding house.'],
                ]);
            }

            if ($room->students()->count() >= $room->capacity) {
                throw ValidationException::withMessages([
                    'room_id' => ['The selected room is already at full capacity.'],
                ]);
            }
        }

        // If a student with this student_no already exists, link the reservation to them
        $existingStudent = $reservation->student_no
            ? Student::where('student_no', $reservation->student_no)->first()
            : null;

        if ($existingStudent) {
            if ($room) {
                $existingStudent->update(['room_id' => $room->id, 'boarding_house_id' => $boardingHouseId]);
                $studentCount = $room->students()->count();
                $room->update([
                    'occupied_slots'  => $studentCount,
                    'available_slots' => max(0, $room->capacity - $studentCount),
                ]);
            }
            $reservation->update(['student_id' => $existingStudent->id]);
            return response()->json($existingStudent->load('boardingHouse', 'room'), 200);
        }

        $student = Student::create([
            'student_no'        => $reservation->student_no,
            'first_name'        => explode(' ', $reservation->full_name, 2)[0] ?? $reservation->full_name,
            'last_name'         => explode(' ', $reservation->full_name, 2)[1] ?? '',
            'gender'            => $reservation->gender,
            'course'            => $reservation->course,
            'year_level'        => $reservation->year_level,
            'contact_number'    => $reservation->contact_number,
            'address'           => $reservation->address,
            'boarding_house_id' => $boardingHouseId,
            'room_id'           => $data['room_id'] ?? null,
        ]);

        if ($room) {
            $studentCount = $room->students()->count();
            $room->update([
                'occupied_slots'  => $studentCount,
                'available_slots' => max(0, $room->capacity - $studentCount),
            ]);
        }

        // Link reservation to student and mark converted
        $reservation->update(['student_id' => $student->id]);

        if ($student->boarding_house_id) {
            StudentBoardingHistory::create([
                'student_id'        => $student->id,
                'boarding_house_id' => $student->boarding_house_id,
                'boarded_at'        => now(),
            ]);
        }

        ActivityLog::create([
            'user_id'    => $request->user()->id,
            'action'     => "Created student {$student->first_name} {$student->last_name} from reservation.",
            'created_at' => now(),
        ]);

        return response()->json($student->load('boardingHouse', 'room'), 201);
    }

    public function show(Student $student): JsonResponse
    {
        return response()->json($student->load('boardingHouse.owner', 'boardingHouse.rooms', 'room'));
    }

    public function update(Request $request, Student $student): JsonResponse
    {
        $user = $request->user();

        // Students cannot change their own student_no
        if ($user->isStudent()) {
            $data = $request->validate([
                'first_name'     => 'sometimes|string|max:255',
                'last_name'      => 'sometimes|string|max:255',
                'gender'         => 'nullable|in:Male,Female',
                'course'         => 'nullable|string|max:255',
                'year_level'     => 'nullable|string|max:50',
                'contact_number' => 'nullable|string|max:20',
                'address'        => 'nullable|string|max:500',
                'parent_name'    => 'nullable|string|max:255',
                'parent_contact' => 'nullable|string|max:20',
            ]);
            // Explicitly exclude student_no
            unset($data['student_no']);
        } else {
            $data = $request->validate([
                'first_name'        => 'required|string|max:255',
                'last_name'         => 'required|string|max:255',
                'gender'            => 'nullable|in:Male,Female',
                'course'            => 'nullable|string|max:255',
                'year_level'        => 'nullable|string|max:50',
                'contact_number'    => 'nullable|string|max:20',
                'address'           => 'nullable|string|max:500',
                'parent_name'       => 'nullable|string|max:255',
                'parent_contact'    => 'nullable|string|max:20',
                'boarding_house_id' => 'nullable|exists:boarding_houses,id',
                'room_id'           => 'nullable|exists:rooms,id',
            ]);
            // Student ID is immutable after creation
            unset($data['student_no']);
        }

        if ($request->hasFile('image')) {
            $request->validate(['image' => 'image|max:5120']);
            $data['image'] = $request->file('image')->store('students', 'public');
        }

        $oldBhId = $student->boarding_house_id;
        $newBhId = $data['boarding_house_id'] ?? $student->boarding_house_id;

        $student->update($data);

        if (isset($data['boarding_house_id']) && $oldBhId !== $newBhId) {
            if ($oldBhId) {
                StudentBoardingHistory::where('student_id', $student->id)
                    ->whereNull('vacated_at')
                    ->update(['vacated_at' => now()]);
            }
            if ($newBhId) {
                StudentBoardingHistory::create([
                    'student_id'        => $student->id,
                    'boarding_house_id' => $newBhId,
                    'boarded_at'        => now(),
                ]);
            }
        }

        ActivityLog::create([
            'user_id'    => $request->user()->id,
            'action'     => "Updated student {$student->first_name} {$student->last_name}.",
            'created_at' => now(),
        ]);

        return response()->json($student->load('boardingHouse', 'room'));
    }

    public function destroy(Request $request, Student $student): JsonResponse
    {
        $name = "{$student->first_name} {$student->last_name}";
        $student->delete();

        ActivityLog::create([
            'user_id'    => $request->user()->id,
            'action'     => "Deleted student {$name}.",
            'created_at' => now(),
        ]);

        return response()->json(['message' => 'Student deleted.']);
    }

    public function assignForm(Student $student): JsonResponse
    {
        $boardingHouses = BoardingHouse::where('status', 'active')
            ->where('approval_status', 'approved')
            ->with(['rooms' => fn($q) => $q->withCount('students')])
            ->orderBy('boarding_name')
            ->get(['id', 'boarding_name', 'address', 'available_rooms', 'room_rate']);

        return response()->json([
            'student'         => $student->load('boardingHouse', 'room'),
            'boarding_houses' => $boardingHouses,
        ]);
    }

    public function assign(Request $request, Student $student): JsonResponse
    {
        $data = $request->validate([
            'boarding_house_id' => 'nullable|exists:boarding_houses,id',
            'notes'             => 'nullable|string|max:255',
        ]);

        $newBhId = $data['boarding_house_id'] ?? null;
        $oldBhId = $student->boarding_house_id;

        if ($oldBhId && $oldBhId !== $newBhId) {
            StudentBoardingHistory::where('student_id', $student->id)
                ->whereNull('vacated_at')
                ->update(['vacated_at' => now()]);
        }

        $student->update(['boarding_house_id' => $newBhId, 'room_id' => null]);

        if ($newBhId) {
            StudentBoardingHistory::create([
                'student_id'        => $student->id,
                'boarding_house_id' => $newBhId,
                'boarded_at'        => now(),
                'notes'             => $data['notes'] ?? null,
            ]);
        }

        $bh = $newBhId ? BoardingHouse::find($newBhId) : null;
        ActivityLog::create([
            'user_id'    => $request->user()->id,
            'action'     => $newBhId
                ? "Assigned student {$student->first_name} {$student->last_name} to {$bh->boarding_name}."
                : "Unassigned student {$student->first_name} {$student->last_name} from boarding house.",
            'created_at' => now(),
        ]);

        return response()->json($student->load('boardingHouse', 'room'));
    }

    public function boardingHistory(Student $student): JsonResponse
    {
        return response()->json(
            $student->boardingHistories()->with('boardingHouse:id,boarding_name,address')->get()
        );
    }
}
