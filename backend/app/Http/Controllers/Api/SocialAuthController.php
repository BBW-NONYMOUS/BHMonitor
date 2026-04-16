<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Laravel\Socialite\Facades\Socialite;

class SocialAuthController extends Controller
{
    /**
     * Redirect to Google OAuth consent screen.
     */
    public function redirectToGoogle(Request $request): RedirectResponse
    {
        return Socialite::driver('google')
            ->redirectUrl(config('services.google.redirect'))
            ->redirect();
    }

    /**
     * Handle Google OAuth callback.
     * Issues a Sanctum token and redirects the frontend SPA with the result.
     */
    public function handleGoogleCallback(Request $request): RedirectResponse
    {
        $frontendUrl = rtrim((string) config('app.frontend_url'), '/');

        try {
            $googleUser = Socialite::driver('google')
                ->redirectUrl(config('services.google.redirect'))
                ->user();
        } catch (\Exception $e) {
            \Log::error('Google OAuth error: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);
            $params = http_build_query([
                'status'  => 'error',
                'message' => 'Google authentication failed: ' . $e->getMessage(),
            ]);
            return redirect("{$frontendUrl}/auth/google/callback?{$params}");
        }

        // Find by google_id first, then fall back to email
        $user = User::where('google_id', $googleUser->getId())->first()
              ?? User::where('email', $googleUser->getEmail())->first();

        if (!$user) {
            // New user — send to frontend to complete registration
            $params = http_build_query([
                'status' => 'new',
                'name'   => $googleUser->getName() ?? '',
                'email'  => $googleUser->getEmail() ?? '',
                'avatar' => $googleUser->getAvatar() ?? '',
            ]);
            return redirect("{$frontendUrl}/auth/google/callback?{$params}");
        }

        // Persist google_id for future logins
        if (!$user->google_id) {
            $user->update(['google_id' => $googleUser->getId()]);
        }

        if ($user->account_status === 'pending') {
            $params = http_build_query([
                'status'  => 'pending',
                'message' => 'Your account is pending admin approval. Please wait for confirmation.',
            ]);
            return redirect("{$frontendUrl}/auth/google/callback?{$params}");
        }

        if ($user->account_status === 'rejected') {
            $params = http_build_query([
                'status'  => 'rejected',
                'message' => 'Your account has been rejected. ' . ($user->rejection_reason ?? 'Please contact the administrator.'),
            ]);
            return redirect("{$frontendUrl}/auth/google/callback?{$params}");
        }

        // Approved — issue Sanctum token
        $token = $user->createToken('google-auth')->plainTextToken;

        ActivityLog::create([
            'user_id'    => $user->id,
            'action'     => "User {$user->name} logged in via Google.",
            'created_at' => now(),
        ]);

        $user->loadMissing('owner', 'student');

        $userData = [
            'id'                => $user->id,
            'name'              => $user->name,
            'email'             => $user->email,
            'role'              => $user->role,
            'account_status'    => $user->account_status,
            'profile_photo_url' => $user->profile_photo
                ? '/storage/' . $user->profile_photo
                : $googleUser->getAvatar(),
            'owner_id'          => $user->owner?->id,
            'student_id'        => $user->student?->id,
            'student_no'        => $user->student?->student_no,
        ];

        $params = http_build_query([
            'status' => 'success',
            'token'  => $token,
            'user'   => base64_encode(json_encode($userData)),
        ]);

        return redirect("{$frontendUrl}/auth/google/callback?{$params}");
    }
}
