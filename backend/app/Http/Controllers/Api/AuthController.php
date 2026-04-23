<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Notification;
use App\Models\Owner;
use App\Models\Student;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    private function storeProfilePhoto(Request $request): ?string
    {
        if (!$request->hasFile('profile_photo')) {
            return null;
        }

        $request->validate([
            'profile_photo' => 'image|max:5120',
        ]);

        return $request->file('profile_photo')->store('avatars', 'public');
    }

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
            'profile_photo'  => 'nullable|image|max:5120',
        ]);

        $profilePhoto = $this->storeProfilePhoto($request);

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
            'profile_photo'  => $profilePhoto,
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

        // Notify all admins of the new pending account
        User::where('role', 'admin')->each(function (User $admin) use ($user) {
            Notification::createNewAccountRegistrationNotification($admin, $user);
        });

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
            'profile_photo'  => 'nullable|image|max:5120',
        ]);

        $profilePhoto = $this->storeProfilePhoto($request);

        $user = User::create([
            'name'           => $data['name'],
            'email'          => $data['email'],
            'password'       => Hash::make($data['password']),
            'role'           => 'owner',
            'account_status' => 'pending', // Owners require admin approval
            'profile_photo'  => $profilePhoto,
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

        // Notify all admins of the new pending account
        User::where('role', 'admin')->each(function (User $admin) use ($user) {
            Notification::createNewAccountRegistrationNotification($admin, $user);
        });

        // Return without token — account is pending
        return response()->json([
            'account_status' => 'pending',
            'message'        => 'Your account has been submitted and is awaiting admin approval.',
        ], 201);
    }

    public function updateProfile(Request $request): JsonResponse
    {
        /** @var \App\Models\User $user */
        $user = $request->user()->loadMissing('owner', 'student');

        $rules = [
            'name'  => 'sometimes|string|max:255',
            'email' => 'sometimes|email|unique:users,email,' . $user->id,
            'current_password' => 'nullable|string',
            'new_password'     => 'nullable|string|min:8|confirmed',
        ];

        if ($user->isOwner()) {
            $rules['full_name'] = 'sometimes|string|max:255';
            $rules['contact_number'] = 'nullable|string|max:20';
            $rules['address'] = 'nullable|string|max:500';
        }

        $data = $request->validate($rules);

        $userUpdates = [];

        if (array_key_exists('name', $data)) {
            $userUpdates['name'] = $data['name'];
        }

        if (array_key_exists('email', $data)) {
            $userUpdates['email'] = $data['email'];
        }

        if (!empty($data['new_password'])) {
            if (empty($data['current_password']) || !Hash::check($data['current_password'], $user->password)) {
                throw ValidationException::withMessages([
                    'current_password' => ['The current password is incorrect.'],
                ]);
            }

            $userUpdates['password'] = Hash::make($data['new_password']);
        }

        $profilePhoto = $this->storeProfilePhoto($request);
        if ($profilePhoto) {
            if ($user->profile_photo) {
                Storage::disk('public')->delete($user->profile_photo);
            }

            $userUpdates['profile_photo'] = $profilePhoto;
        }

        if ($userUpdates !== []) {
            $user->update($userUpdates);
        }

        if ($user->isOwner()) {
            $ownerUpdates = [];

            if (array_key_exists('full_name', $data)) {
                $ownerUpdates['full_name'] = $data['full_name'];
            }

            if (array_key_exists('contact_number', $data)) {
                $ownerUpdates['contact_number'] = $data['contact_number'];
            }

            if (array_key_exists('address', $data)) {
                $ownerUpdates['address'] = $data['address'];
            }

            if (array_key_exists('email', $userUpdates)) {
                $ownerUpdates['email'] = $userUpdates['email'];
            }

            if ($ownerUpdates !== []) {
                $user->owner()->updateOrCreate(
                    ['user_id' => $user->id],
                    $ownerUpdates
                );
            }
        }

        ActivityLog::create([
            'user_id' => $user->id,
            'action' => !empty($data['new_password'])
                ? "User {$user->name} updated account settings and password."
                : "User {$user->name} updated account settings.",
            'created_at' => now(),
        ]);

        return response()->json([
            'message' => 'Settings updated successfully.',
            'user' => $this->userPayload($user->fresh()->load('owner', 'student')),
        ]);
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
            'full_name'           => $user->owner?->full_name ?? $user->name,
            'owner_id'            => $user->owner?->id,
            'student_id'          => $user->student?->id,
            'student_no'          => $user->student?->student_no,
            'address'             => $user->student?->address ?? $user->owner?->address,
            'contact_number'      => $user->student?->contact_number ?? $user->owner?->contact_number,
            'google_linked'       => (bool) $user->google_id,
        ];
    }
}
