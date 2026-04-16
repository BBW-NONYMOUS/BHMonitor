<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Mail\AccountApproved;
use App\Mail\AccountRejected;
use App\Models\ActivityLog;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;

class AccountController extends Controller
{
    /**
     * List all accounts (student and owner) — admin only
     */
    public function index(Request $request): JsonResponse
    {
        $status = $request->input('status');
        $role   = $request->input('role');
        $search = $request->input('search');

        $query = User::with(['owner', 'student'])
            ->whereIn('role', ['student', 'owner']);

        if ($status) {
            $query->where('account_status', $status);
        }
        if ($role) {
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

        return response()->json($accounts);
    }

    /**
     * Approve a user account — admin only
     */
    public function approve(Request $request, User $user): JsonResponse
    {
        if ($user->isAdmin()) {
            return response()->json(['message' => 'Cannot modify admin accounts.'], 403);
        }

        $user->update([
            'account_status'   => 'approved',
            'rejection_reason' => null,
        ]);

        Mail::to($user->email)->send(new AccountApproved($user));

        ActivityLog::create([
            'user_id'    => $request->user()->id,
            'action'     => "Approved account for {$user->name} ({$user->role}).",
            'created_at' => now(),
        ]);

        return response()->json([
            'message' => "Account for {$user->name} has been approved.",
            'user'    => $this->payload($user->fresh()),
        ]);
    }

    /**
     * Reject a user account — admin only
     */
    public function reject(Request $request, User $user): JsonResponse
    {
        if ($user->isAdmin()) {
            return response()->json(['message' => 'Cannot modify admin accounts.'], 403);
        }

        $data = $request->validate([
            'rejection_reason' => 'nullable|string|max:500',
        ]);

        $rejectionReason = $data['rejection_reason'] ?? null;

        $user->update([
            'account_status'   => 'rejected',
            'rejection_reason' => $rejectionReason,
        ]);

        Mail::to($user->email)->send(new AccountRejected($user, $rejectionReason));

        // Revoke all tokens so they cannot use any existing sessions
        $user->tokens()->delete();

        ActivityLog::create([
            'user_id'    => $request->user()->id,
            'action'     => "Rejected account for {$user->name} ({$user->role}).",
            'created_at' => now(),
        ]);

        return response()->json([
            'message' => "Account for {$user->name} has been rejected.",
            'user'    => $this->payload($user->fresh()),
        ]);
    }

    /**
     * Delete a user account — admin only
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
            'action'     => "Deleted account for {$name}.",
            'created_at' => now(),
        ]);

        return response()->json(['message' => "Account for {$name} deleted."]);
    }

    /**
     * Pending accounts count — for dashboard badge
     */
    public function pendingCount(): JsonResponse
    {
        $count = User::whereIn('role', ['student', 'owner'])
                     ->where('account_status', 'pending')
                     ->count();

        return response()->json(['pending_accounts' => $count]);
    }

    private function payload(User $user): array
    {
        return [
            'id'               => $user->id,
            'name'             => $user->name,
            'email'            => $user->email,
            'role'             => $user->role,
            'account_status'   => $user->account_status,
            'rejection_reason' => $user->rejection_reason,
            'created_at'       => $user->created_at?->format('M d, Y'),
            'student_no'       => $user->student?->student_no,
            'owner_name'       => $user->owner?->full_name,
        ];
    }
}
