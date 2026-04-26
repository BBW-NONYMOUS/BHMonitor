<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Mail\AccountApproved;
use App\Mail\AccountRejected;
use App\Models\ActivityLog;
use App\Models\BoardingHouse;
use App\Models\Notification;
use App\Models\StudentWarning;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;

class AccountController extends Controller
{
    /**
     * List all accounts — admin sees owners, owners see students
     */
    public function index(Request $request): JsonResponse
    {
        $status = $request->input('status');
        $role   = $request->input('role');
        $search = $request->input('search');

        $user = $request->user();
        if (!$user->isAdmin() && !$user->isOwner()) {
            abort(403, 'Unauthorized.');
        }

        $query = User::with(['owner', 'student.boardingHouse']);

        // Admin sees all non-admin accounts (owners and students)
        if ($user->isAdmin()) {
            $query->whereIn('role', ['owner', 'student']);
            if ($status === 'deleted') {
                $query->onlyTrashed();
            }
        }
        // Owners see only STUDENT accounts from their boarding houses
        elseif ($user->isOwner()) {
            $bhIds = BoardingHouse::where('owner_id', $user->owner?->id)->pluck('id');
            $query->where('role', 'student')
                ->whereHas('student', function ($q) use ($bhIds, $status) {
                    $q->whereIn('boarding_house_id', $bhIds);
                    if ($status) {
                        $q->where('boarding_approval_status', $status);
                    }
                });
        }

        if ($status && $status !== 'deleted' && $user->isAdmin()) {
            $query->where('account_status', $status);
        }
        if ($role && $user->isAdmin()) {
            $query->where('role', $role);
        }
        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        $accounts = $query->orderByRaw("CASE account_status WHEN 'pending' THEN 0 WHEN 'approved' THEN 1 ELSE 2 END")
                          ->orderByDesc('created_at')
                          ->paginate(15);

        $accounts->setCollection(
            $accounts->getCollection()->map(fn (User $account) => $this->payload($account))
        );

        return response()->json($accounts);
    }

    /**
     * Approve a user account — admin approves owners, owners approve students
     */
    public function approve(Request $request, User $user): JsonResponse
    {
        $actor = $request->user();
        if (!$actor->isAdmin() && !$actor->isOwner()) {
            abort(403, 'Unauthorized.');
        }

        if ($user->isAdmin()) {
            return response()->json(['message' => 'Cannot modify admin accounts.'], 403);
        }

        // Admin approves user accounts. Student boarding-house acceptance remains owner-controlled.
        if ($actor->isAdmin()) {
            $user->update([
                'account_status'   => 'approved',
                'rejection_reason' => null,
            ]);
        }
        // Owners can only approve their students
        elseif ($actor->isOwner()) {
            $this->authorizeOwnerStudent($actor, $user);

            $user->update([
                'account_status'   => 'approved',
                'rejection_reason' => null,
            ]);

            $user->student?->update([
                'boarding_approval_status' => 'approved',
                'boarding_rejection_comment' => null,
            ]);
        }

        Mail::to($user->email)->send(new AccountApproved($user));

        Notification::createAccountStatusNotification($user, 'approved');

        ActivityLog::create([
            'user_id'    => $actor->id,
            'action'     => "Approved account for {$user->name} ({$user->role}).",
            'created_at' => now(),
        ]);

        return response()->json([
            'message' => "Account for {$user->name} has been approved.",
            'user'    => $this->payload($user->fresh()),
        ]);
    }

    /**
     * Reject a user account — admin rejects owners, owners reject students
     */
    public function reject(Request $request, User $user): JsonResponse
    {
        $actor = $request->user();
        if (!$actor->isAdmin() && !$actor->isOwner()) {
            abort(403, 'Unauthorized.');
        }

        if ($user->isAdmin()) {
            return response()->json(['message' => 'Cannot modify admin accounts.'], 403);
        }

        $data = $request->validate([
            'rejection_reason' => 'nullable|string|max:500',
            'mark_warning' => 'nullable|boolean',
        ]);

        $rejectionReason = $data['rejection_reason'] ?? null;
        $markWarning = (bool) ($data['mark_warning'] ?? false);

        // Admin rejects user accounts. Owners reject boarding-house registrations.
        if ($actor->isAdmin()) {
            $user->update([
                'account_status'   => 'rejected',
                'rejection_reason' => $rejectionReason,
            ]);

            // Revoke all tokens so they cannot use any existing sessions
            $user->tokens()->delete();
        }
        // Owners can only reject their students
        elseif ($actor->isOwner()) {
            $this->authorizeOwnerStudent($actor, $user);

            $user->student?->update([
                'boarding_approval_status' => 'declined',
                'boarding_rejection_comment' => $rejectionReason,
                'has_warning' => $markWarning ? true : $user->student->has_warning,
                'warning_comment' => $markWarning ? $rejectionReason : $user->student->warning_comment,
                'warning_marked_by' => $markWarning ? $actor->id : $user->student->warning_marked_by,
                'warning_marked_at' => $markWarning ? now() : $user->student->warning_marked_at,
            ]);

            if ($markWarning && $rejectionReason && $user->student) {
                StudentWarning::create([
                    'student_id' => $user->student->id,
                    'owner_id' => $actor->owner?->id,
                    'boarding_house_name' => $user->student->boardingHouse?->boarding_name,
                    'comment' => $rejectionReason,
                ]);
            }

            if ($user->account_status === 'pending') {
                $user->update([
                    'account_status'   => 'rejected',
                    'rejection_reason' => $rejectionReason,
                ]);
                $user->tokens()->delete();
            }
        }

        Mail::to($user->email)->send(new AccountRejected($user, $rejectionReason));

        Notification::createAccountStatusNotification($user, 'rejected', $rejectionReason);

        ActivityLog::create([
            'user_id'    => $actor->id,
            'action'     => "Rejected account for {$user->name} ({$user->role}).",
            'created_at' => now(),
        ]);

        return response()->json([
            'message' => "Account for {$user->name} has been rejected.",
            'user'    => $this->payload($user->fresh()),
        ]);
    }

    /**
     * Deactivate a user account with soft delete — admin only
     */
    public function destroy(Request $request, User $user): JsonResponse
    {
        if ($user->isAdmin()) {
            return response()->json(['message' => 'Cannot delete admin accounts.'], 403);
        }

        $name = $user->name;
        $user->tokens()->delete();
        $user->delete();

        ActivityLog::create([
            'user_id'    => $request->user()->id,
            'action'     => "Deactivated account for {$name}.",
            'created_at' => now(),
        ]);

        return response()->json(['message' => "Account for {$name} deactivated. Linked student, boarding house, and reservation data were preserved."]);
    }

    public function restore(Request $request, int $id): JsonResponse
    {
        $actor = $request->user();
        if (!$actor->isAdmin()) {
            abort(403, 'Unauthorized.');
        }

        $user = User::withTrashed()->findOrFail($id);
        if (!$user->trashed()) {
            return response()->json([
                'message' => "Account for {$user->name} is already active.",
                'user'    => $this->payload($user),
            ]);
        }

        $user->restore();

        ActivityLog::create([
            'user_id'    => $actor->id,
            'action'     => "Restored account for {$user->name}.",
            'created_at' => now(),
        ]);

        return response()->json([
            'message' => "Account for {$user->name} restored.",
            'user'    => $this->payload($user->fresh()),
        ]);
    }

    /**
     * Pending accounts count — for dashboard badge
     */
    public function pendingCount(Request $request): JsonResponse
    {
        $user = $request->user();
        if (!$user->isAdmin() && !$user->isOwner()) {
            abort(403, 'Unauthorized.');
        }

        if ($user->isOwner()) {
            // Owners see pending student approvals for their boarding houses
            $bhIds = BoardingHouse::where('owner_id', $user->owner?->id)->pluck('id');
            $count = User::where('role', 'student')
                ->whereHas('student', fn ($q) => $q->whereIn('boarding_house_id', $bhIds)->where('boarding_approval_status', 'pending'))
                ->count();
        } else {
            // Admins see pending OWNER account approvals only
            $count = User::where('role', 'owner')
                         ->where('account_status', 'pending')
                         ->count();
        }

        return response()->json(['pending_accounts' => $count]);
    }

    private function payload(User $user): array
    {
        $user->loadMissing('student.boardingHouse', 'owner');

        return [
            'id'               => $user->id,
            'name'             => $user->name,
            'email'            => $user->email,
            'role'             => $user->role,
            'account_status'   => $user->account_status,
            'rejection_reason' => $user->rejection_reason,
            'is_deleted'       => $user->trashed(),
            'deleted_at'       => $user->deleted_at?->format('M d, Y'),
            'created_at'       => $user->created_at?->format('M d, Y'),
            'student_no'       => $user->student?->student_no,
            'student_id'       => $user->student?->id,
            'owner_name'       => $user->owner?->full_name,
            'boarding_house'   => $user->student?->boardingHouse?->boarding_name,
            'boarding_approval_status' => $user->student?->boarding_approval_status,
            'boarding_rejection_comment' => $user->student?->boarding_rejection_comment,
            'has_warning' => (bool) $user->student?->has_warning,
            'warning_comment' => $user->student?->warning_comment,
            'warnings_count' => $user->student?->warnings()->count() ?? 0,
        ];
    }

    private function authorizeOwnerStudent(User $ownerUser, User $studentUser): void
    {
        if (!$studentUser->isStudent() || !$studentUser->student) {
            abort(403, 'Owners can only review student accounts.');
        }

        $ownsBoardingHouse = $ownerUser->owner
            ? $ownerUser->owner->boardingHouses()->where('id', $studentUser->student->boarding_house_id)->exists()
            : false;

        if (!$ownsBoardingHouse) {
            abort(403, 'You can only review students registered to your boarding house.');
        }
    }
}
