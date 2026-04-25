<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Notification;
use App\Models\Owner;
use App\Models\Student;
use App\Models\StudentRecommendation;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class RecommendationController extends Controller
{
    /**
     * Get student's sent recommendations (student view)
     */
    public function studentRecommendations(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!$user->isStudent() || !$user->student) {
            abort(403, 'Only students can view recommendations.');
        }

        $recommendations = StudentRecommendation::where('student_id', $user->student->id)
            ->with(['owner.user:id,name,profile_photo'])
            ->orderByDesc('requested_at')
            ->paginate(15);

        return response()->json($recommendations);
    }

    /**
     * Get owner's received recommendation requests (owner view)
     */
    public function ownerRecommendations(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!$user->isOwner() || !$user->owner) {
            abort(403, 'Only owners can view recommendations.');
        }

        $status = $request->input('status');

        $query = StudentRecommendation::where('owner_id', $user->owner->id)
            ->with(['student.user:id,email,profile_photo', 'student.boardingHouse:id,boarding_name']);

        if ($status) {
            $query->where('status', $status);
        }

        $recommendations = $query->orderByDesc('requested_at')->paginate(15);

        return response()->json($recommendations);
    }

    /**
     * Student requests a recommendation from an owner
     */
    public function requestRecommendation(Request $request): JsonResponse
    {
        $data = $request->validate([
            'owner_id' => 'required|exists:owners,id',
            'message'  => 'nullable|string|max:1000',
        ]);

        $user = $request->user();

        if (!$user->isStudent() || !$user->student) {
            abort(403, 'Only students can request recommendations.');
        }

        $student = $user->student;

        // Check if recommendation already exists
        $existing = StudentRecommendation::where('student_id', $student->id)
            ->where('owner_id', $data['owner_id'])
            ->first();

        if ($existing) {
            throw ValidationException::withMessages([
                'owner_id' => ['You have already requested a recommendation from this owner.'],
            ]);
        }

        $owner = Owner::findOrFail($data['owner_id']);

        $recommendation = StudentRecommendation::create([
            'student_id' => $student->id,
            'owner_id'   => $owner->id,
            'status'     => 'pending',
            'student_message' => $data['message'] ?? null,
            'requested_at'    => now(),
        ]);

        // Notify owner
        if ($owner->user) {
            Notification::create([
                'user_id' => $owner->user_id,
                'type'    => 'recommendation_request',
                'title'   => 'New Recommendation Request',
                'message' => "{$student->first_name} {$student->last_name} requested a recommendation.",
                'data'    => [
                    'recommendation_id' => $recommendation->id,
                    'student_id'        => $student->id,
                ],
            ]);
        }

        ActivityLog::create([
            'user_id'    => $user->id,
            'action'     => "Requested recommendation from {$owner->full_name}.",
            'created_at' => now(),
        ]);

        return response()->json([
            'message'        => 'Recommendation request sent.',
            'recommendation' => $recommendation->load('owner.user'),
        ], 201);
    }

    /**
     * Owner accepts a recommendation request
     */
    public function acceptRecommendation(Request $request, StudentRecommendation $recommendation): JsonResponse
    {
        $user = $request->user();

        if (!$user->isOwner() || !$user->owner) {
            abort(403, 'Only owners can accept recommendations.');
        }

        if ($recommendation->owner_id !== $user->owner->id) {
            abort(403, 'Unauthorized.');
        }

        if ($recommendation->status !== 'pending') {
            throw ValidationException::withMessages([
                'status' => ["This recommendation is already {$recommendation->status}."],
            ]);
        }

        $recommendation->update(['status' => 'accepted']);

        // Notify student
        if ($recommendation->student->user) {
            Notification::create([
                'user_id' => $recommendation->student->user_id,
                'type'    => 'recommendation_accepted',
                'title'   => 'Recommendation Accepted',
                'message' => "{$user->name} accepted your recommendation request.",
                'data'    => ['recommendation_id' => $recommendation->id],
            ]);
        }

        ActivityLog::create([
            'user_id'    => $user->id,
            'action'     => "Accepted recommendation request from {$recommendation->student->full_name}.",
            'created_at' => now(),
        ]);

        return response()->json([
            'message'        => 'Recommendation request accepted.',
            'recommendation' => $recommendation,
        ]);
    }

    /**
     * Owner rejects a recommendation request
     */
    public function rejectRecommendation(Request $request, StudentRecommendation $recommendation): JsonResponse
    {
        $data = $request->validate([
            'reason' => 'nullable|string|max:500',
        ]);

        $user = $request->user();

        if (!$user->isOwner() || !$user->owner) {
            abort(403, 'Only owners can reject recommendations.');
        }

        if ($recommendation->owner_id !== $user->owner->id) {
            abort(403, 'Unauthorized.');
        }

        if ($recommendation->status !== 'pending') {
            throw ValidationException::withMessages([
                'status' => ["This recommendation is already {$recommendation->status}."],
            ]);
        }

        $recommendation->update([
            'status'           => 'rejected',
            'rejection_reason' => $data['reason'] ?? null,
            'responded_at'     => now(),
        ]);

        // Notify student
        if ($recommendation->student->user) {
            Notification::create([
                'user_id' => $recommendation->student->user_id,
                'type'    => 'recommendation_rejected',
                'title'   => 'Recommendation Request Declined',
                'message' => "{$user->name} declined your recommendation request." .
                    ($data['reason'] ? " Reason: {$data['reason']}" : ""),
                'data'    => ['recommendation_id' => $recommendation->id],
            ]);
        }

        ActivityLog::create([
            'user_id'    => $user->id,
            'action'     => "Rejected recommendation request from {$recommendation->student->full_name}.",
            'created_at' => now(),
        ]);

        return response()->json([
            'message'        => 'Recommendation request rejected.',
            'recommendation' => $recommendation,
        ]);
    }

    /**
     * Owner submits a recommendation letter
     */
    public function submitRecommendation(Request $request, StudentRecommendation $recommendation): JsonResponse
    {
        $data = $request->validate([
            'recommendation_text' => 'required|string|min:50|max:5000',
        ]);

        $user = $request->user();

        if (!$user->isOwner() || !$user->owner) {
            abort(403, 'Only owners can submit recommendations.');
        }

        if ($recommendation->owner_id !== $user->owner->id) {
            abort(403, 'Unauthorized.');
        }

        if (!in_array($recommendation->status, ['accepted', 'submitted'])) {
            throw ValidationException::withMessages([
                'status' => ['You must accept the request before submitting a recommendation.'],
            ]);
        }

        $recommendation->update([
            'status'         => 'submitted',
            'owner_response' => $data['recommendation_text'],
            'responded_at'   => now(),
        ]);

        // Notify student
        if ($recommendation->student->user) {
            Notification::create([
                'user_id' => $recommendation->student->user_id,
                'type'    => 'recommendation_submitted',
                'title'   => 'Your Recommendation is Ready',
                'message' => "{$user->name} submitted your recommendation letter.",
                'data'    => ['recommendation_id' => $recommendation->id],
            ]);
        }

        ActivityLog::create([
            'user_id'    => $user->id,
            'action'     => "Submitted recommendation for {$recommendation->student->full_name}.",
            'created_at' => now(),
        ]);

        return response()->json([
            'message'        => 'Recommendation submitted successfully.',
            'recommendation' => $recommendation,
        ]);
    }

    /**
     * Student views a submitted recommendation
     */
    public function viewRecommendation(Request $request, StudentRecommendation $recommendation): JsonResponse
    {
        $user = $request->user();

        if (!$user->isStudent() || !$user->student) {
            abort(403, 'Only students can view recommendations.');
        }

        if ($recommendation->student_id !== $user->student->id) {
            abort(403, 'Unauthorized.');
        }

        if ($recommendation->status !== 'submitted') {
            abort(403, 'This recommendation has not been submitted yet.');
        }

        return response()->json($recommendation->load('owner.user:id,name'));
    }

    /**
     * Withdraw a pending recommendation request
     */
    public function withdrawRecommendation(Request $request, StudentRecommendation $recommendation): JsonResponse
    {
        $user = $request->user();

        if (!$user->isStudent() || !$user->student) {
            abort(403, 'Only students can withdraw recommendations.');
        }

        if ($recommendation->student_id !== $user->student->id) {
            abort(403, 'Unauthorized.');
        }

        if ($recommendation->status !== 'pending') {
            throw ValidationException::withMessages([
                'status' => ['You can only withdraw pending requests.'],
            ]);
        }

        $recommendation->delete();

        ActivityLog::create([
            'user_id'    => $user->id,
            'action'     => "Withdrew recommendation request from {$recommendation->owner->full_name}.",
            'created_at' => now(),
        ]);

        return response()->json(['message' => 'Recommendation request withdrawn.']);
    }
}
