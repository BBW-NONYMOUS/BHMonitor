<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\BoardingHouse;
use App\Models\Notification;
use App\Models\Room;
use App\Models\Student;
use App\Models\StudentBoardingHistory;
use App\Models\StudentInquiry;
use App\Models\StudentWarning;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class StudentController extends Controller
{
    private function registrationConflictResponse(Student $student, int $boardingHouseId): ?JsonResponse
    {
        if (
            $student->boarding_house_id
            && in_array($student->boarding_approval_status, ['approved', null], true)
        ) {
            $message = (int) $student->boarding_house_id === $boardingHouseId
                ? 'You are already registered in this specific boarding house'
                : 'You are already registered in a boarding house';

            return response()->json(['message' => $message], 422);
        }

        return null;
    }

    public function index(Request $request): JsonResponse
    {
        $user  = $request->user();
        $query = Student::with(['user:id,email,account_status,rejection_reason,profile_photo', 'boardingHouse.owner', 'room:id,room_name', 'inquiry:id,student_id,status', 'warningMarkedBy:id,name'])
            ->withCount('warnings');

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
            'student_no'        => 'required|digits_between:1,50|unique:students',
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

        if (!empty($data['boarding_house_id'])) {
            $data['boarding_approval_status'] = 'approved';
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

        $reservation = StudentInquiry::with(['boardingHouse', 'student'])->findOrFail($data['reservation_id']);

        // Authorization: owner can only assign students from their own boarding houses
        $user = $request->user();
        if ($user->role === 'owner') {
            if (!$user->owner || !$user->owner->boardingHouses()->where('id', $reservation->boarding_house_id)->exists()) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }
        }

        if (in_array($reservation->status, ['declined', 'cancelled'])) {
            return response()->json(['message' => 'Cannot assign a declined or cancelled reservation.'], 422);
        }

        // Auto-approve the reservation when owner assigns
        if ($reservation->status !== 'approved') {
            $reservation->update(['status' => 'approved']);
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
        $existingStudent = $reservation->student;

        if (!$existingStudent && $reservation->student_no) {
            $existingStudent = Student::where('student_no', $reservation->student_no)->first();
        }

        if ($existingStudent) {
            if ($conflict = $this->registrationConflictResponse($existingStudent, (int) $boardingHouseId)) {
                return $conflict;
            }

            $oldBoardingHouseId = $existingStudent->boarding_house_id;
            $updates = ['boarding_house_id' => $boardingHouseId];
            $updates['boarding_approval_status'] = 'approved';
            $updates['boarding_rejection_comment'] = null;

            if ($room) {
                $updates['room_id'] = $room->id;
            } elseif ((int) $oldBoardingHouseId !== (int) $boardingHouseId) {
                $updates['room_id'] = null;
            }

            $existingStudent->update($updates);

            if ((int) $oldBoardingHouseId !== (int) $boardingHouseId) {
                if ($oldBoardingHouseId) {
                    StudentBoardingHistory::where('student_id', $existingStudent->id)
                        ->whereNull('vacated_at')
                        ->update(['vacated_at' => now()]);
                }

                StudentBoardingHistory::create([
                    'student_id'        => $existingStudent->id,
                    'boarding_house_id' => $boardingHouseId,
                    'boarded_at'        => now(),
                    'notes'             => 'Assigned from reservation.',
                ]);
            }

            if ($room) {
                $studentCount = $room->students()->count();
                $room->update([
                    'occupied_slots'  => $studentCount,
                    'available_slots' => max(0, $room->capacity - $studentCount),
                ]);
            }

            if ((int) $reservation->student_id !== (int) $existingStudent->id) {
                $reservation->update(['student_id' => $existingStudent->id]);
            }

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
            'boarding_approval_status' => 'approved',
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

    public function show(Request $request, Student $student): JsonResponse
    {
        $user = $request->user();

        if ($user->isStudent() && (int) $student->user_id !== (int) $user->id) {
            abort(403, 'You can only view your own student profile.');
        }

        $relations = [
            'user:id,email,account_status,rejection_reason,profile_photo',
            'boardingHouse.owner',
            'boardingHouse.rooms',
            'room',
            'warningMarkedBy:id,name',
        ];

        if (!$user->isStudent()) {
            $relations[] = 'warnings.owner.user:id,name,email';
            $student->loadCount('warnings');
        }

        return response()->json($student->load($relations));
    }

    public function update(Request $request, Student $student): JsonResponse
    {
        $user = $request->user();

        // Students cannot change their own student_no
        if ($user->isStudent()) {
            if ((int) $student->user_id !== (int) $user->id) {
                abort(403, 'You can only update your own student profile.');
            }

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
                'boarding_house_id' => 'nullable|exists:boarding_houses,id',
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

        if (
            $user->isStudent()
            && $oldBhId
            && (int) $oldBhId !== (int) $newBhId
            && in_array($student->boarding_approval_status, ['approved', null], true)
        ) {
            throw ValidationException::withMessages([
                'boarding_house_id' => ['You are already registered in a boarding house'],
            ]);
        }

        if ($user->isStudent() && (int) $oldBhId !== (int) $newBhId) {
            $data['boarding_approval_status'] = $newBhId ? 'pending' : null;
            $data['boarding_rejection_comment'] = null;
            $data['room_id'] = null;
        } elseif (!$user->isStudent() && array_key_exists('boarding_house_id', $data)) {
            $data['boarding_approval_status'] = $newBhId ? 'approved' : null;
            $data['boarding_rejection_comment'] = null;
        }

        $student->update($data);

        // Notify the new boarding house owner when a student changes their boarding house
        if ($user->isStudent() && $newBhId && (int) $oldBhId !== (int) $newBhId) {
            $boardingHouse = BoardingHouse::with('owner.user')->find($newBhId);
            $ownerUser = $boardingHouse?->owner?->user;
            if ($ownerUser) {
                Notification::create([
                    'user_id' => $ownerUser->id,
                    'type'    => 'new_student_registration',
                    'title'   => 'Student Updated Boarding House',
                    'message' => "{$student->first_name} {$student->last_name} selected {$boardingHouse->boarding_name} and needs your review.",
                    'data'    => [
                        'student_id'        => $student->id,
                        'boarding_house_id' => $newBhId,
                    ],
                ]);
            }
        }

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

        return response()->json($student->load('user:id,email,account_status,rejection_reason,profile_photo', 'boardingHouse.owner', 'room', 'warningMarkedBy:id,name'));
    }

    public function destroy(Request $request, Student $student): JsonResponse
    {
        $user = $request->user();
        $name = "{$student->first_name} {$student->last_name}";

        if ($user->isOwner()) {
            $bhIds = BoardingHouse::where('owner_id', $user->owner?->id)->pluck('id');

            if ($bhIds->isEmpty() || !in_array((int) $student->boarding_house_id, $bhIds->map(fn ($id) => (int) $id)->all(), true)) {
                return response()->json(['message' => 'You can only remove students registered to your boarding house.'], 403);
            }

            DB::transaction(function () use ($student, $bhIds) {
                StudentInquiry::where('student_id', $student->id)
                    ->whereIn('boarding_house_id', $bhIds)
                    ->delete();

                StudentBoardingHistory::where('student_id', $student->id)
                    ->whereIn('boarding_house_id', $bhIds)
                    ->whereNull('vacated_at')
                    ->update(['vacated_at' => now()]);

                $student->update([
                    'boarding_house_id' => null,
                    'room_id' => null,
                    'boarding_approval_status' => null,
                    'boarding_rejection_comment' => null,
                ]);
            });

            ActivityLog::create([
                'user_id'    => $user->id,
                'action'     => "Removed student {$name} from boarding house and cleared related reservations.",
                'created_at' => now(),
            ]);

            return response()->json(['message' => 'Student removed from this boarding house. Account remains active.']);
        }

        $student->delete();

        ActivityLog::create([
            'user_id'    => $user->id,
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

        $student->update([
            'boarding_house_id' => $newBhId,
            'room_id' => null,
            'boarding_approval_status' => $newBhId ? 'approved' : null,
            'boarding_rejection_comment' => null,
        ]);

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

    public function pendingApprovals(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!$user->isOwner()) {
            return response()->json(['message' => 'Only owners can view pending approvals'], 403);
        }

        $bhIds = BoardingHouse::where('owner_id', $user->owner?->id)->pluck('id');

        $students = Student::whereIn('boarding_house_id', $bhIds)
            ->where('boarding_approval_status', 'pending')
            ->with(['user:id,email,profile_photo', 'boardingHouse:id,boarding_name', 'warningMarkedBy:id,name'])
            ->withCount('warnings')
            ->orderByDesc('created_at')
            ->paginate(15);

        return response()->json($students);
    }

    public function approveBoardingStudent(Request $request, Student $student): JsonResponse
    {
        $user = $request->user();

        if (!$user->isOwner()) {
            return response()->json(['message' => 'Only owners can approve students'], 403);
        }

        // Check authorization: owner can only approve students in their boarding houses
        $boardingHouse = $student->boardingHouse;
        if (!$boardingHouse || $boardingHouse->owner_id !== $user->owner?->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        if ($student->boarding_approval_status !== 'pending') {
            return response()->json([
                'message' => "Student already has approval status: {$student->boarding_approval_status}"
            ], 422);
        }

        if ($conflict = $this->registrationConflictResponse($student, (int) $boardingHouse->id)) {
            return $conflict;
        }

        $student->update([
            'boarding_approval_status' => 'approved',
            'boarding_rejection_comment' => null,
        ]);

        // Notify the student of approval
        if ($student->user) {
            Notification::create([
                'user_id' => $student->user_id,
                'type'    => 'boarding_approval',
                'title'   => 'Boarding House Application Approved',
                'message' => "Your application for {$boardingHouse->boarding_name} has been approved!",
                'data'    => [
                    'student_id'        => $student->id,
                    'boarding_house_id' => $boardingHouse->id,
                ],
            ]);
        }

        ActivityLog::create([
            'user_id'    => $user->id,
            'action'     => "Approved student {$student->full_name} for boarding at {$boardingHouse->boarding_name}.",
            'created_at' => now(),
        ]);

        return response()->json([
            'message' => 'Student approved successfully.',
            'student' => $student->load('user:id,email,profile_photo', 'boardingHouse:id,boarding_name'),
        ]);
    }

    public function declineBoardingStudent(Request $request, Student $student): JsonResponse
    {
        $data = $request->validate([
            'rejection_comment' => 'nullable|string|max:500',
            'mark_warning' => 'nullable|boolean',
        ]);

        $user = $request->user();

        if (!$user->isOwner()) {
            return response()->json(['message' => 'Only owners can decline students'], 403);
        }

        // Check authorization: owner can only decline students in their boarding houses
        $boardingHouse = $student->boardingHouse;
        if (!$boardingHouse || $boardingHouse->owner_id !== $user->owner?->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        if ($student->boarding_approval_status !== 'pending') {
            return response()->json([
                'message' => "Student already has approval status: {$student->boarding_approval_status}"
            ], 422);
        }

        $markWarning = (bool) ($data['mark_warning'] ?? false);
        $rejectionComment = $data['rejection_comment'] ?? null;

        $student->update([
            'boarding_approval_status' => 'declined',
            'boarding_rejection_comment' => $rejectionComment,
            'has_warning' => $markWarning ? true : $student->has_warning,
            'warning_comment' => $markWarning ? $rejectionComment : $student->warning_comment,
            'warning_marked_by' => $markWarning ? $user->id : $student->warning_marked_by,
            'warning_marked_at' => $markWarning ? now() : $student->warning_marked_at,
        ]);

        // Notify the student of decline
        if ($student->user) {
            Notification::create([
                'user_id' => $student->user_id,
                'type'    => 'boarding_decline',
                'title'   => 'Boarding House Application Declined',
                'message' => "Your application for {$boardingHouse->boarding_name} has been declined." .
                    ($rejectionComment ? " Reason: {$rejectionComment}" : ""),
                'data'    => [
                    'student_id'        => $student->id,
                    'boarding_house_id' => $boardingHouse->id,
                ],
            ]);
        }

        if ($markWarning && $rejectionComment) {
            StudentWarning::create([
                'student_id' => $student->id,
                'owner_id' => $user->owner?->id,
                'boarding_house_name' => $boardingHouse->boarding_name,
                'comment' => $rejectionComment,
            ]);
        }

        ActivityLog::create([
            'user_id'    => $user->id,
            'action'     => "Declined student {$student->full_name} for boarding at {$boardingHouse->boarding_name}." .
                ($rejectionComment ? " Reason: {$rejectionComment}" : "") .
                ($markWarning ? " Warning marked." : ""),
            'created_at' => now(),
        ]);

        return response()->json([
            'message' => 'Student declined.',
            'student' => $student->load('user:id,email,profile_photo', 'boardingHouse:id,boarding_name', 'warningMarkedBy:id,name'),
        ]);
    }

    public function addWarning(Request $request, Student $student): JsonResponse
    {
        $user = $request->user();

        if (!$user->isOwner()) {
            return response()->json(['message' => 'Only boarding house owners can add student warnings.'], 403);
        }

        $boardingHouse = $student->boardingHouse;
        if (!$boardingHouse || $boardingHouse->owner_id !== $user->owner?->id) {
            return response()->json(['message' => 'You can only add warnings for students registered to your boarding house.'], 403);
        }

        $data = $request->validate([
            'comment' => 'required|string|max:1000',
        ]);

        $warning = StudentWarning::create([
            'student_id' => $student->id,
            'owner_id' => $user->owner?->id,
            'boarding_house_name' => $boardingHouse->boarding_name,
            'comment' => $data['comment'],
        ]);

        $student->update([
            'has_warning' => true,
            'warning_comment' => $data['comment'],
            'warning_marked_by' => $user->id,
            'warning_marked_at' => now(),
        ]);

        ActivityLog::create([
            'user_id' => $user->id,
            'action' => "Added a warning to student {$student->full_name}.",
            'created_at' => now(),
        ]);

        return response()->json([
            'message' => 'Warning added successfully.',
            'warning' => $warning->load('owner.user:id,name,email'),
            'warning_count' => $student->warnings()->count(),
        ], 201);
    }
}
