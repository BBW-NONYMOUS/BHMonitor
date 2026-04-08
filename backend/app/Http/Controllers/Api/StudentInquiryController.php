<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\StudentInquiry;
use App\Models\BoardingHouse;
use App\Models\Notification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StudentInquiryController extends Controller
{
    /**
     * Submit a new inquiry (public - no auth required)
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'boarding_house_id' => 'required|exists:boarding_houses,id',
            'full_name' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'contact_number' => 'required|string|max:20',
            'student_no' => 'nullable|string|max:50',
            'course' => 'nullable|string|max:100',
            'year_level' => 'nullable|string|max:20',
            'gender' => 'nullable|in:Male,Female',
            'message' => 'nullable|string|max:1000',
            'preferred_room_type' => 'nullable|string|max:50',
            'budget' => 'nullable|numeric|min:0',
            'move_in_date' => 'nullable|date|after_or_equal:today',
        ]);

        // Check if boarding house is active
        $bh = BoardingHouse::where('status', 'active')->findOrFail($validated['boarding_house_id']);

        // Check for duplicate pending inquiry (same email + BH)
        $existing = StudentInquiry::where('boarding_house_id', $validated['boarding_house_id'])
            ->where('email', $validated['email'])
            ->where('status', 'pending')
            ->first();

        if ($existing) {
            return response()->json([
                'message' => 'You already have a pending inquiry for this boarding house.',
                'inquiry' => $existing,
            ], 422);
        }

        $inquiry = StudentInquiry::create($validated);

        // Send notification to the boarding house owner
        if ($bh->owner && $bh->owner->user) {
            Notification::createInquiryNotification($bh->owner->user, $inquiry, $bh);
        }

        return response()->json([
            'message' => 'Your inquiry has been submitted! The owner will contact you soon.',
            'inquiry' => $inquiry,
        ], 201);
    }

    /**
     * Get inquiries for a boarding house (owner only)
     */
    public function index(Request $request, int $boardingHouseId): JsonResponse
    {
        $bh = BoardingHouse::findOrFail($boardingHouseId);

        // Authorization: only owner of this BH or admin
        $user = $request->user();
        if ($user->role !== 'admin' && (!$user->owner || $bh->owner_id !== $user->owner->id)) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $inquiries = StudentInquiry::where('boarding_house_id', $boardingHouseId)
            ->orderByDesc('created_at')
            ->get();

        return response()->json($inquiries);
    }

    /**
     * Update inquiry status (owner only)
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $inquiry = StudentInquiry::with('boardingHouse')->findOrFail($id);

        // Authorization
        $user = $request->user();
        if ($user->role !== 'admin' && (!$user->owner || $inquiry->boardingHouse->owner_id !== $user->owner->id)) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'status' => 'sometimes|in:pending,contacted,approved,declined,cancelled',
            'owner_notes' => 'nullable|string|max:1000',
        ]);

        $inquiry->update($validated);

        return response()->json([
            'message' => 'Inquiry updated successfully',
            'inquiry' => $inquiry,
        ]);
    }

    /**
     * Get inquiry counts for dashboard
     */
    public function counts(Request $request): JsonResponse
    {
        $user = $request->user();

        $query = StudentInquiry::query();

        // If owner, only count their BHs
        if ($user->role === 'owner' && $user->owner) {
            $bhIds = $user->owner->boardingHouses()->pluck('id');
            $query->whereIn('boarding_house_id', $bhIds);
        }

        $counts = [
            'pending' => (clone $query)->where('status', 'pending')->count(),
            'contacted' => (clone $query)->where('status', 'contacted')->count(),
            'approved' => (clone $query)->where('status', 'approved')->count(),
            'total' => (clone $query)->count(),
        ];

        return response()->json($counts);
    }

    /**
     * Get all inquiries for the authenticated owner (across all their BHs)
     */
    public function allInquiries(Request $request): JsonResponse
    {
        $user = $request->user();

        $query = StudentInquiry::with('boardingHouse:id,boarding_name');

        // If owner, only show their BHs
        if ($user->role === 'owner' && $user->owner) {
            $bhIds = $user->owner->boardingHouses()->pluck('id');
            $query->whereIn('boarding_house_id', $bhIds);
        }

        $inquiries = $query->orderByDesc('created_at')->get();

        return response()->json($inquiries);
    }
}
