<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Owner;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class OwnerController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Owner::with('user', 'boardingHouses');

        if ($search = $request->get('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('full_name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        return response()->json($query->orderByDesc('created_at')->paginate(15));
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name'           => 'required|string|max:255',
            'email'          => 'required|email|unique:users',
            'password'       => 'required|min:6',
            'full_name'      => 'required|string|max:255',
            'contact_number' => 'nullable|string|max:20',
            'address'        => 'nullable|string',
        ]);

        $user = User::create([
            'name'     => $data['name'],
            'email'    => $data['email'],
            'password' => Hash::make($data['password']),
            'role'     => 'owner',
        ]);

        $owner = Owner::create([
            'user_id'        => $user->id,
            'full_name'      => $data['full_name'],
            'email'          => $data['email'],
            'contact_number' => $data['contact_number'] ?? null,
            'address'        => $data['address'] ?? null,
        ]);

        ActivityLog::create([
            'user_id'    => $request->user()->id,
            'action'     => "Created owner account: {$owner->full_name}.",
            'created_at' => now(),
        ]);

        return response()->json($owner->load('user', 'boardingHouses'), 201);
    }

    public function show(Owner $owner): JsonResponse
    {
        return response()->json($owner->load('user', 'boardingHouses'));
    }

    public function update(Request $request, Owner $owner): JsonResponse
    {
        $data = $request->validate([
            'full_name'      => 'required|string|max:255',
            'contact_number' => 'nullable|string|max:20',
            'address'        => 'nullable|string',
            'email'          => "required|email|unique:owners,email,{$owner->id}",
        ]);

        $owner->update($data);

        return response()->json($owner->load('user', 'boardingHouses'));
    }

    public function destroy(Request $request, Owner $owner): JsonResponse
    {
        $name = $owner->full_name;
        $owner->user()->delete();

        ActivityLog::create([
            'user_id'    => $request->user()->id,
            'action'     => "Deleted owner: {$name}.",
            'created_at' => now(),
        ]);

        return response()->json(['message' => 'Owner deleted.']);
    }
}
