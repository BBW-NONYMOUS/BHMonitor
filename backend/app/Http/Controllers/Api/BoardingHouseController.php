<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\BoardingHouse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BoardingHouseController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        /** @var \App\Models\User $user */
        $user = $request->user();
        $query = BoardingHouse::with('owner');

        if ($user->isOwner()) {
            $query->where('owner_id', $user->owner?->id);
        }

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('boarding_name', 'like', "%{$search}%")
                  ->orWhere('address', 'like', "%{$search}%");
            });
        }
        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }
        if ($approvalStatus = $request->input('approval_status')) {
            $query->where('approval_status', $approvalStatus);
        }
        if ($availability = $request->input('availability')) {
            if ($availability === 'available') {
                $query->whereRaw('available_rooms > 0');
            } elseif ($availability === 'full') {
                $query->whereRaw('available_rooms <= 0')->where('total_rooms', '>', 0);
            }
        }

        $boardingHouses = $query->orderByDesc('created_at')->paginate(15);
        return response()->json($boardingHouses);
    }

    public function store(Request $request): JsonResponse
    {
        /** @var \App\Models\User $user */
        $user = $request->user();
        $data = $request->validate([
            'owner_id'      => $user->isAdmin() ? 'required|exists:owners,id' : 'nullable',
            'boarding_name' => 'required|string|max:255',
            'address'       => 'required|string',
            'description'   => 'nullable|string',
            'facilities'    => 'nullable|string',
            'latitude'      => 'nullable|numeric',
            'longitude'     => 'nullable|numeric',
            'status'        => 'nullable|in:active,inactive',
        ]);

        if ($user->isOwner()) {
            $data['owner_id']        = $user->owner->id;
            $data['approval_status'] = 'pending'; // owners need admin approval
        } else {
            $data['approval_status'] = 'approved'; // admin-created go live immediately
        }

        if ($request->hasFile('image')) {
            $data['image'] = $request->file('image')->store('boarding_houses', 'public');
        }

        $bh = BoardingHouse::create($data);

        ActivityLog::create([
            'user_id'    => $user->id,
            'action'     => "Added boarding house: {$bh->boarding_name}.",
            'created_at' => now(),
        ]);

        return response()->json($bh->load('owner'), 201);
    }

    public function show(BoardingHouse $boardingHouse): JsonResponse
    {
        return response()->json($boardingHouse->load('owner', 'rooms', 'students'));
    }

    private function authorizeOwnership(Request $request, BoardingHouse $boardingHouse): void
    {
        /** @var \App\Models\User $user */
        $user = $request->user();
        if ($user->isOwner() && $boardingHouse->owner_id !== $user->owner?->id) {
            abort(403, 'You do not own this boarding house.');
        }
    }

    public function update(Request $request, BoardingHouse $boardingHouse): JsonResponse
    {
        $this->authorizeOwnership($request, $boardingHouse);

        $data = $request->validate([
            'boarding_name' => 'required|string|max:255',
            'address'       => 'required|string',
            'description'   => 'nullable|string',
            'facilities'    => 'nullable|string',
            'latitude'      => 'nullable|numeric',
            'longitude'     => 'nullable|numeric',
            'status'        => 'nullable|in:active,inactive',
            'owner_id'      => 'nullable|exists:owners,id',
        ]);

        if ($request->hasFile('image')) {
            $data['image'] = $request->file('image')->store('boarding_houses', 'public');
        }

        $boardingHouse->update($data);

        ActivityLog::create([
            'user_id'    => $request->user()->id,
            'action'     => "Updated boarding house: {$boardingHouse->boarding_name}.",
            'created_at' => now(),
        ]);

        return response()->json($boardingHouse->load('owner'));
    }

    public function destroy(Request $request, BoardingHouse $boardingHouse): JsonResponse
    {
        $this->authorizeOwnership($request, $boardingHouse);

        $name = $boardingHouse->boarding_name;
        $boardingHouse->delete();

        ActivityLog::create([
            'user_id'    => $request->user()->id,
            'action'     => "Deleted boarding house: {$name}.",
            'created_at' => now(),
        ]);

        return response()->json(['message' => 'Boarding house deleted.']);
    }

    public function approve(Request $request, BoardingHouse $boardingHouse): JsonResponse
    {
        $data = $request->validate(['admin_notes' => 'nullable|string']);

        $boardingHouse->update([
            'approval_status' => 'approved',
            'status'          => 'active',
            'admin_notes'     => $data['admin_notes'] ?? $boardingHouse->admin_notes,
        ]);

        ActivityLog::create([
            'user_id'    => $request->user()->id,
            'action'     => "Approved boarding house: {$boardingHouse->boarding_name}.",
            'created_at' => now(),
        ]);

        return response()->json($boardingHouse->load('owner'));
    }

    public function reject(Request $request, BoardingHouse $boardingHouse): JsonResponse
    {
        $data = $request->validate(['admin_notes' => 'nullable|string']);

        $boardingHouse->update([
            'approval_status' => 'rejected',
            'admin_notes'     => $data['admin_notes'] ?? $boardingHouse->admin_notes,
        ]);

        ActivityLog::create([
            'user_id'    => $request->user()->id,
            'action'     => "Rejected boarding house: {$boardingHouse->boarding_name}.",
            'created_at' => now(),
        ]);

        return response()->json($boardingHouse->load('owner'));
    }

    public function myBoardingHouses(Request $request): JsonResponse
    {
        $user = $request->user();
        if (!$user->owner) {
            return response()->json([], 200);
        }
        $boardingHouses = $user->owner->boardingHouses()->where('status', 'active')->get();
        return response()->json($boardingHouses);
    }
}
