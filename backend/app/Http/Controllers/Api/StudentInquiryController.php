<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\BoardingHouse;
use App\Models\Student;
use App\Models\StudentBoardingHistory;
use App\Models\StudentInquiry;
use App\Models\Notification;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class StudentInquiryController extends Controller
{
    private function findReservationStudent(StudentInquiry $inquiry): ?Student
    {
        if ($inquiry->student) {
            return $inquiry->student;
        }

        if ($inquiry->student_no) {
            return Student::where('student_no', $inquiry->student_no)->first();
        }

        if ($inquiry->email) {
            return User::where('email', $inquiry->email)->first()?->student;
        }

        return null;
    }

    private function ensureStudentCanBeApproved(StudentInquiry $inquiry): void
    {
        $student = $this->findReservationStudent($inquiry);

        if (
            $student
            && $student->boarding_house_id
            && in_array($student->boarding_approval_status, ['approved', null], true)
        ) {
            $message = (int) $student->boarding_house_id === (int) $inquiry->boarding_house_id
                ? 'You are already registered in this specific boarding house'
                : 'You are already registered in a boarding house';

            throw ValidationException::withMessages([
                'student_id' => [$message],
            ]);
        }
    }

    private function syncApprovedReservation(StudentInquiry $inquiry, Request $request): void
    {
        if ($inquiry->status !== 'approved') {
            return;
        }

        $student = $inquiry->student;

        if (!$student && $inquiry->student_no) {
            $student = Student::where('student_no', $inquiry->student_no)->first();
        }

        if (!$student) {
            if (!$inquiry->student_no) {
                return;
            }

            [$firstName, $lastName] = array_pad(explode(' ', trim($inquiry->full_name), 2), 2, '');

            $student = Student::create([
                'student_no'        => $inquiry->student_no,
                'first_name'        => $firstName ?: $inquiry->full_name,
                'last_name'         => $lastName,
                'gender'            => $inquiry->gender,
                'course'            => $inquiry->course,
                'year_level'        => $inquiry->year_level,
                'contact_number'    => $inquiry->contact_number,
                'address'           => $inquiry->address,
                'boarding_house_id' => $inquiry->boarding_house_id,
                'boarding_approval_status' => 'approved',
            ]);

            StudentBoardingHistory::create([
                'student_id'        => $student->id,
                'boarding_house_id' => $inquiry->boarding_house_id,
                'boarded_at'        => now(),
                'notes'             => 'Created automatically from approved reservation.',
            ]);

            ActivityLog::create([
                'user_id'    => $request->user()->id,
                'action'     => "Created student {$student->first_name} {$student->last_name} from approved reservation.",
                'created_at' => now(),
            ]);
        } else {
            $oldBoardingHouseId = $student->boarding_house_id;
            $newBoardingHouseId = $inquiry->boarding_house_id;

            if ((int) $oldBoardingHouseId !== (int) $newBoardingHouseId) {
                if ($oldBoardingHouseId) {
                    StudentBoardingHistory::where('student_id', $student->id)
                        ->whereNull('vacated_at')
                        ->update(['vacated_at' => now()]);
                }

                $student->update([
                    'boarding_house_id' => $newBoardingHouseId,
                    'room_id'           => null,
                    'boarding_approval_status' => 'approved',
                    'boarding_rejection_comment' => null,
                ]);

                StudentBoardingHistory::create([
                    'student_id'        => $student->id,
                    'boarding_house_id' => $newBoardingHouseId,
                    'boarded_at'        => now(),
                    'notes'             => 'Assigned automatically from approved reservation.',
                ]);
            } else {
                $student->update([
                    'boarding_approval_status' => 'approved',
                    'boarding_rejection_comment' => null,
                ]);
            }
        }

        if ($inquiry->student_id !== $student->id) {
            $inquiry->update(['student_id' => $student->id]);
        }
    }

    /**
     * Submit a reservation (auth required — auto-fills student info from account)
     */
    public function store(Request $request): JsonResponse
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['message' => 'Please sign in before submitting a reservation.'], 401);
        }
        if (!$user->isStudent()) {
            return response()->json(['message' => 'Only student accounts can submit reservations.'], 403);
        }

        if (!$user->isApproved()) {
            return response()->json([
                'message' => 'Reservation cannot proceed due to inactive account.',
            ], 403);
        }

        $validated = $request->validate([
            'boarding_house_id' => 'required|exists:boarding_houses,id',
            'move_in_date'      => 'nullable|date|after_or_equal:today',
            'year_level'        => 'nullable|string|max:20',
            'message'           => 'nullable|string|max:1000',
        ]);

        $bh = BoardingHouse::where('approval_status', 'approved')
            ->where('status', 'active')
            ->findOrFail($validated['boarding_house_id']);

        // Auto-populate from authenticated student account
        $student = $user?->student;

        if (!$student) {
            return response()->json([
                'message' => 'Profile incomplete or inactive. Please complete your student profile before reserving.',
            ], 422);
        }

        if ($student) {
            $validated['full_name']      = $student->first_name . ' ' . $student->last_name;
            $validated['email']          = $user->email;
            $validated['contact_number'] = $student->contact_number;
            $validated['student_no']     = $student->student_no;
            $validated['course']         = $student->course;
            $validated['gender']         = $student->gender;
            $validated['address']        = $student->address;
            $validated['student_id']     = $student->id;
            $validated['year_level']     = $validated['year_level'] ?? $student->year_level;
        }

        // Check for duplicate pending reservation (same email + BH)
        $email = $validated['email'] ?? null;
        if ($email) {
            $existing = StudentInquiry::where('boarding_house_id', $validated['boarding_house_id'])
                ->where('email', $email)
                ->whereIn('status', ['pending', 'contacted'])
                ->first();

            if ($existing) {
                return response()->json([
                    'message'     => 'You already have a pending reservation for this boarding house.',
                    'reservation' => $existing,
                ], 422);
            }
        }

        $inquiry = StudentInquiry::create($validated);

        // Notify the boarding house owner
        if ($bh->owner && $bh->owner->user) {
            Notification::createInquiryNotification($bh->owner->user, $inquiry, $bh);
        }

        // Notify all admins
        User::where('role', 'admin')->each(function (User $admin) use ($inquiry, $bh) {
            Notification::createInquiryNotification($admin, $inquiry, $bh);
        });

        return response()->json([
            'message'     => 'Your reservation has been submitted! The owner will contact you soon.',
            'reservation' => $inquiry,
        ], 201);
    }

    /**
     * Get reservations for a boarding house (owner/admin only)
     */
    public function index(Request $request, int $boardingHouseId): JsonResponse
    {
        $bh   = BoardingHouse::findOrFail($boardingHouseId);
        $user = $request->user();

        if ($user->role !== 'admin' && (!$user->owner || $bh->owner_id !== $user->owner->id)) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $reservations = StudentInquiry::with([
                'student:id,user_id,boarding_house_id,room_id',
                'student.user:id,profile_photo',
            ])
            ->where('boarding_house_id', $boardingHouseId)
            ->orderByDesc('created_at')
            ->get();

        return response()->json($reservations);
    }

    /**
     * Update reservation status (owner/admin only)
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $inquiry = StudentInquiry::with([
            'boardingHouse',
            'student:id,user_id,boarding_house_id,room_id',
            'student.user:id,profile_photo',
        ])->findOrFail($id);
        $user    = $request->user();

        if ($user->role !== 'admin' && (!$user->owner || $inquiry->boardingHouse->owner_id !== $user->owner->id)) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'status'      => 'sometimes|in:pending,contacted,approved,declined,cancelled',
            'owner_notes' => 'nullable|string|max:1000',
        ]);

        if (($validated['status'] ?? null) === 'approved' && $inquiry->status !== 'approved') {
            $this->ensureStudentCanBeApproved($inquiry);
        }

        $inquiry->update($validated);
        $inquiry->refresh();

        if (isset($validated['status'])) {
            $this->syncApprovedReservation($inquiry, $request);

            // Notify the student when owner changes reservation status
            if (in_array($validated['status'], ['approved', 'declined', 'contacted'])) {
                $studentUser = null;
                if ($inquiry->student && $inquiry->student->user_id) {
                    $studentUser = User::find($inquiry->student->user_id);
                } elseif ($inquiry->email) {
                    $studentUser = User::where('email', $inquiry->email)->first();
                }

                if ($studentUser) {
                    Notification::createReservationStatusNotification(
                        $studentUser,
                        $inquiry,
                        $inquiry->boardingHouse,
                        $validated['status']
                    );
                }
            }
        }

        return response()->json([
            'message'     => 'Reservation updated successfully.',
            'reservation' => $inquiry->fresh([
                'boardingHouse',
                'student:id,user_id,boarding_house_id,room_id',
                'student.user:id,profile_photo',
            ]),
        ]);
    }

    /**
     * Reservation counts for dashboard badge
     */
    public function counts(Request $request): JsonResponse
    {
        $user  = $request->user();
        if (!in_array($user->role, ['admin', 'owner'], true)) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $query = StudentInquiry::query();

        if ($user->role === 'owner' && $user->owner) {
            $bhIds = $user->owner->boardingHouses()->pluck('id');
            $query->whereIn('boarding_house_id', $bhIds);
        }

        return response()->json([
            'pending'   => (clone $query)->where('status', 'pending')->count(),
            'contacted' => (clone $query)->where('status', 'contacted')->count(),
            'approved'  => (clone $query)->where('status', 'approved')->count(),
            'total'     => (clone $query)->count(),
        ]);
    }

    /**
     * All reservations for the authenticated owner
     */
    public function allInquiries(Request $request): JsonResponse
    {
        $user  = $request->user();
        if (!in_array($user->role, ['admin', 'owner'], true)) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $query = StudentInquiry::with([
            'boardingHouse:id,boarding_name',
            'student:id,user_id,boarding_house_id,room_id',
            'student.user:id,profile_photo',
        ]);

        if ($user->role === 'owner' && $user->owner) {
            $bhIds = $user->owner->boardingHouses()->pluck('id');
            $query->whereIn('boarding_house_id', $bhIds);
        }

        $reservations = $query->orderByDesc('created_at')->get();
        return response()->json($reservations);
    }

    /**
     * Reservations for the authenticated student
     */
    public function myReservations(Request $request): JsonResponse
    {
        $user = $request->user();
        if (!$user->isStudent()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $student = $user->student;
        if (!$student) {
            return response()->json([]);
        }

        $reservations = StudentInquiry::with([
                'boardingHouse:id,boarding_name,address',
                'student.room:id,room_name,boarding_house_id',
            ])
            ->where('student_id', $student->id)
            ->orderByDesc('created_at')
            ->get();

        return response()->json($reservations);
    }

    /**
     * Get approved reservations available for Direct Add to students
     */
    public function approvedForDirectAdd(Request $request): JsonResponse
    {
        $user = $request->user();
        if (!in_array($user->role, ['admin', 'owner'], true)) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $query = StudentInquiry::with('boardingHouse:id,boarding_name')
            ->where('status', 'approved')
            ->whereNull('student_id');

        if ($user->role === 'owner' && $user->owner) {
            $bhIds = $user->owner->boardingHouses()->pluck('id');
            $query->whereIn('boarding_house_id', $bhIds);
        }

        $reservations = $query->orderByDesc('created_at')->get();

        return response()->json($reservations);
    }
}
