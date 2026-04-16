<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Student;
use App\Models\StudentInquiry;
use App\Models\BoardingHouse;
use App\Models\Notification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StudentInquiryController extends Controller
{
    /**
     * Submit a reservation (auth required — auto-fills student info from account)
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'boarding_house_id' => 'required|exists:boarding_houses,id',
            'move_in_date'      => 'nullable|date|after_or_equal:today',
            'year_level'        => 'nullable|string|max:20',
            'message'           => 'nullable|string|max:1000',
            // For unauthenticated users (public fallback)
            'full_name'         => 'nullable|string|max:255',
            'email'             => 'nullable|email|max:255',
            'contact_number'    => 'nullable|string|max:20',
            'student_no'        => 'nullable|string|max:50',
            'course'            => 'nullable|string|max:100',
            'gender'            => 'nullable|in:Male,Female',
            'address'           => 'nullable|string|max:500',
        ]);

        $bh = BoardingHouse::where('approval_status', 'approved')
            ->where('status', 'active')
            ->findOrFail($validated['boarding_house_id']);

        // Auto-populate from authenticated student account
        $user    = $request->user();
        $student = $user?->student;

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

        $reservations = StudentInquiry::where('boarding_house_id', $boardingHouseId)
            ->orderByDesc('created_at')
            ->get();

        return response()->json($reservations);
    }

    /**
     * Update reservation status (owner/admin only)
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $inquiry = StudentInquiry::with('boardingHouse')->findOrFail($id);
        $user    = $request->user();

        if ($user->role !== 'admin' && (!$user->owner || $inquiry->boardingHouse->owner_id !== $user->owner->id)) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'status'      => 'sometimes|in:pending,contacted,approved,declined,cancelled',
            'owner_notes' => 'nullable|string|max:1000',
        ]);

        $inquiry->update($validated);

        return response()->json([
            'message'     => 'Reservation updated successfully.',
            'reservation' => $inquiry,
        ]);
    }

    /**
     * Reservation counts for dashboard badge
     */
    public function counts(Request $request): JsonResponse
    {
        $user  = $request->user();
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
        $query = StudentInquiry::with('boardingHouse:id,boarding_name');

        if ($user->role === 'owner' && $user->owner) {
            $bhIds = $user->owner->boardingHouses()->pluck('id');
            $query->whereIn('boarding_house_id', $bhIds);
        }

        $reservations = $query->orderByDesc('created_at')->get();
        return response()->json($reservations);
    }

    /**
     * Get approved reservations available for Direct Add to students
     */
    public function approvedForDirectAdd(Request $request): JsonResponse
    {
        $reservations = StudentInquiry::with('boardingHouse:id,boarding_name')
            ->where('status', 'approved')
            ->whereNull('student_id') // not yet converted
            ->orderByDesc('created_at')
            ->get();

        return response()->json($reservations);
    }
}
