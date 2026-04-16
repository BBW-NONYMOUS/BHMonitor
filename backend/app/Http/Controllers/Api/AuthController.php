<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Owner;
use App\Models\Student;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function login(Request $request): JsonResponse
    {
        $request->validate([
            'email'    => 'required|email',
            'password' => 'required',
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Invalid credentials.'],
            ]);
        }

        // Block pending accounts
        if ($user->account_status === 'pending') {
            return response()->json([
                'account_status' => 'pending',
                'message'        => 'Your account is pending admin approval. Please wait for confirmation.',
            ], 403);
        }

        // Block rejected accounts
        if ($user->account_status === 'rejected') {
            return response()->json([
                'account_status' => 'rejected',
                'message'        => 'Your account has been rejected. ' . ($user->rejection_reason ?? 'Please contact the administrator.'),
            ], 403);
        }

        $token = $user->createToken('auth-token')->plainTextToken;

        ActivityLog::create([
            'user_id'    => $user->id,
            'action'     => "User {$user->name} logged in.",
            'created_at' => now(),
        ]);

        return response()->json([
            'token' => $token,
            'user'  => $this->userPayload($user),
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Logged out successfully.']);
    }

    public function user(Request $request): JsonResponse
    {
        $user = $request->user()->load('owner', 'student');
        return response()->json($this->userPayload($user));
    }

    public function registerStudent(Request $request): JsonResponse
    {
        $data = $request->validate([
            'student_no'     => 'required|string|max:50',
            'first_name'     => 'required|string|max:255',
            'last_name'      => 'required|string|max:255',
            'email'          => 'required|email|unique:users,email',
            'password'       => 'required|min:6|confirmed',
            'gender'         => 'nullable|in:Male,Female',
            'course'         => 'nullable|string|max:255',
            'year_level'     => 'nullable|string|max:50',
            'contact_number' => 'nullable|string|max:20',
            'address'        => 'nullable|string|max:500',
        ]);

        // If a student record with this student_no already exists, link to it
        $existingStudent = Student::where('student_no', $data['student_no'])->first();
        if ($existingStudent && $existingStudent->user_id) {
            throw ValidationException::withMessages([
                'student_no' => ['This student number already has an account.'],
            ]);
        }

        if (!$existingStudent) {
            $request->validate(['student_no' => 'unique:students,student_no']);
        }

        $user = User::create([
            'name'           => $data['first_name'] . ' ' . $data['last_name'],
            'email'          => $data['email'],
            'password'       => Hash::make($data['password']),
            'role'           => 'student',
            'account_status' => 'pending', // Students require admin approval
        ]);

        if ($existingStudent) {
            $existingStudent->update([
                'user_id' => $user->id,
                'address' => $data['address'] ?? $existingStudent->address,
            ]);
        } else {
            Student::create([
                'user_id'        => $user->id,
                'student_no'     => $data['student_no'],
                'first_name'     => $data['first_name'],
                'last_name'      => $data['last_name'],
                'gender'         => $data['gender'] ?? null,
                'course'         => $data['course'] ?? null,
                'year_level'     => $data['year_level'] ?? null,
                'contact_number' => $data['contact_number'] ?? null,
                'address'        => $data['address'] ?? null,
            ]);
        }

        ActivityLog::create([
            'user_id'    => $user->id,
            'action'     => "Student {$user->name} registered and is awaiting approval.",
            'created_at' => now(),
        ]);

        // Return without token — account is pending, they must wait for approval
        return response()->json([
            'account_status' => 'pending',
            'message'        => 'Your account has been submitted and is awaiting admin approval.',
        ], 201);
    }

    public function registerOwner(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name'           => 'required|string|max:255',
            'email'          => 'required|email|unique:users',
            'password'       => 'required|min:6|confirmed',
            'full_name'      => 'required|string|max:255',
            'contact_number' => 'nullable|string|max:20',
            'address'        => 'nullable|string',
        ]);

        $user = User::create([
            'name'           => $data['name'],
            'email'          => $data['email'],
            'password'       => Hash::make($data['password']),
            'role'           => 'owner',
            'account_status' => 'pending', // Owners require admin approval
        ]);

        Owner::create([
            'user_id'        => $user->id,
            'full_name'      => $data['full_name'],
            'email'          => $data['email'],
            'contact_number' => $data['contact_number'] ?? null,
            'address'        => $data['address'] ?? null,
        ]);

        ActivityLog::create([
            'user_id'    => $user->id,
            'action'     => "Owner {$user->name} registered and is awaiting approval.",
            'created_at' => now(),
        ]);

        // Return without token — account is pending
        return response()->json([
            'account_status' => 'pending',
            'message'        => 'Your account has been submitted and is awaiting admin approval.',
        ], 201);
    }

    public function updateProfile(Request $request): JsonResponse
    {
        /** @var \App\Models\User $user */
        $user = $request->user();

        $data = $request->validate([
            'name'  => 'sometimes|string|max:255',
            'email' => 'sometimes|email|unique:users,email,' . $user->id,
        ]);

        if ($request->hasFile('profile_photo')) {
            $request->validate(['profile_photo' => 'image|max:5120']); // max 5MB
            $data['profile_photo'] = $request->file('profile_photo')->store('avatars', 'public');
        }

        $user->update($data);

        return response()->json($this->userPayload($user->fresh()->load('owner', 'student')));
    }

    public function userPayload(User $user): array
    {
        return [
            'id'                  => $user->id,
            'name'                => $user->name,
            'email'               => $user->email,
            'role'                => $user->role,
            'account_status'      => $user->account_status ?? 'approved',
            'profile_photo_url'   => $user->profile_photo ? '/storage/' . $user->profile_photo : null,
            'owner_id'            => $user->owner?->id,
            'student_id'          => $user->student?->id,
            'student_no'          => $user->student?->student_no,
        ];
    }
}
