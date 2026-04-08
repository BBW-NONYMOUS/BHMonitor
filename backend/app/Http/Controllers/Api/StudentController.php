<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\BoardingHouse;
use App\Models\Student;
use App\Models\StudentBoardingHistory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StudentController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $query = Student::with('boardingHouse.owner');

        if ($user->isOwner()) {
            $ownerId = $user->owner?->id;
            $bhIds = BoardingHouse::where('owner_id', $ownerId)->pluck('id');
            $query->whereIn('boarding_house_id', $bhIds);
        }

        if ($search = $request->get('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('student_no', 'like', "%{$search}%")
                  ->orWhere('first_name', 'like', "%{$search}%")
                  ->orWhere('last_name', 'like', "%{$search}%");
            });
        }
        if ($course = $request->get('course')) {
            $query->where('course', $course);
        }
        if ($year = $request->get('year_level')) {
            $query->where('year_level', $year);
        }

        $students = $query->orderByDesc('created_at')->paginate(15);

        return response()->json($students);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'student_no'      => 'required|string|unique:students',
            'first_name'      => 'required|string',
            'last_name'       => 'required|string',
            'gender'          => 'nullable|in:Male,Female',
            'course'          => 'nullable|string',
            'year_level'      => 'nullable|string',
            'contact_number'  => 'nullable|string|max:20',
            'parent_name'     => 'nullable|string',
            'parent_contact'  => 'nullable|string|max:20',
            'boarding_house_id' => 'nullable|exists:boarding_houses,id',
        ]);

        if ($request->hasFile('image')) {
            $data['image'] = $request->file('image')->store('students', 'public');
        }

        $student = Student::create($data);

        // Record initial boarding assignment in history
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

        return response()->json($student->load('boardingHouse'), 201);
    }

    public function show(Student $student): JsonResponse
    {
        return response()->json($student->load('boardingHouse.owner', 'boardingHouse.rooms'));
    }

    public function update(Request $request, Student $student): JsonResponse
    {
        $data = $request->validate([
            'student_no'      => "required|string|unique:students,student_no,{$student->id}",
            'first_name'      => 'required|string',
            'last_name'       => 'required|string',
            'gender'          => 'nullable|in:Male,Female',
            'course'          => 'nullable|string',
            'year_level'      => 'nullable|string',
            'contact_number'  => 'nullable|string|max:20',
            'parent_name'     => 'nullable|string',
            'parent_contact'  => 'nullable|string|max:20',
            'boarding_house_id' => 'nullable|exists:boarding_houses,id',
        ]);

        if ($request->hasFile('image')) {
            $data['image'] = $request->file('image')->store('students', 'public');
        }

        $oldBhId = $student->boarding_house_id;
        $newBhId = $data['boarding_house_id'] ?? null;

        $student->update($data);

        // Track boarding house change in history
        if ($oldBhId !== $newBhId) {
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

        return response()->json($student->load('boardingHouse'));
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
            ->orderBy('boarding_name')
            ->get(['id', 'boarding_name', 'address', 'available_rooms', 'room_rate']);

        return response()->json([
            'student'        => $student->load('boardingHouse'),
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

        // Close the current open history entry if the student is moving out
        if ($oldBhId && $oldBhId !== $newBhId) {
            StudentBoardingHistory::where('student_id', $student->id)
                ->whereNull('vacated_at')
                ->update(['vacated_at' => now()]);
        }

        $student->update(['boarding_house_id' => $newBhId]);

        // Record the new assignment
        if ($newBhId) {
            StudentBoardingHistory::create([
                'student_id'       => $student->id,
                'boarding_house_id' => $newBhId,
                'boarded_at'       => now(),
                'notes'            => $data['notes'] ?? null,
            ]);
        }

        $bh = $newBhId ? BoardingHouse::find($newBhId) : null;
        ActivityLog::create([
            'user_id' => $request->user()->id,
            'action'  => $newBhId
                ? "Assigned student {$student->first_name} {$student->last_name} to {$bh->boarding_name}."
                : "Unassigned student {$student->first_name} {$student->last_name} from boarding house.",
            'created_at' => now(),
        ]);

        return response()->json($student->load('boardingHouse'));
    }

    public function boardingHistory(Student $student): JsonResponse
    {
        $history = $student->boardingHistories()
            ->with('boardingHouse:id,boarding_name,address')
            ->get();

        return response()->json($history);
    }
}
