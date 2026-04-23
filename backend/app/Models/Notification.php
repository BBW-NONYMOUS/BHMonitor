<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Notification extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'type',
        'title',
        'message',
        'data',
        'is_read',
        'read_at',
    ];

    protected function casts(): array
    {
        return [
            'data' => 'array',
            'is_read' => 'boolean',
            'read_at' => 'datetime',
        ];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function markAsRead(): void
    {
        if (!$this->is_read) {
            $this->update([
                'is_read' => true,
                'read_at' => now(),
            ]);
        }
    }

    public static function createNewAccountRegistrationNotification(User $admin, User $newUser): self
    {
        $roleLabel = $newUser->role === 'owner' ? 'Owner' : 'Student';
        return self::create([
            'user_id' => $admin->id,
            'type'    => 'new_account_registration',
            'title'   => "New {$roleLabel} Account Pending",
            'message' => "{$newUser->name} has registered and is awaiting approval.",
            'data'    => [
                'applicant_id'   => $newUser->id,
                'applicant_name' => $newUser->name,
                'applicant_role' => $newUser->role,
            ],
        ]);
    }

    public static function createAccountStatusNotification(User $user, string $status, ?string $reason = null): self
    {
        $content = match ($status) {
            'approved' => [
                'title'   => 'Account Approved!',
                'message' => 'Your account has been approved. You can now log in and use the system.',
            ],
            'rejected' => [
                'title'   => 'Account Rejected',
                'message' => $reason
                    ? "Your account was rejected. Reason: {$reason}"
                    : 'Your account has been rejected. Please contact the administrator.',
            ],
            default => [
                'title'   => 'Account Status Updated',
                'message' => "Your account status has been changed to {$status}.",
            ],
        };

        return self::create([
            'user_id' => $user->id,
            'type'    => 'account_' . $status,
            'title'   => $content['title'],
            'message' => $content['message'],
            'data'    => ['status' => $status, 'reason' => $reason],
        ]);
    }

    public static function createNewBoardingHouseNotification(User $admin, BoardingHouse $boardingHouse): self
    {
        return self::create([
            'user_id' => $admin->id,
            'type'    => 'new_boarding_house',
            'title'   => 'New Boarding House Pending',
            'message' => "\"{$boardingHouse->boarding_name}\" has been submitted and needs your approval.",
            'data'    => [
                'boarding_house_id'   => $boardingHouse->id,
                'boarding_house_name' => $boardingHouse->boarding_name,
            ],
        ]);
    }

    public static function createBoardingHouseStatusNotification(User $owner, BoardingHouse $boardingHouse, string $status, ?string $notes = null): self
    {
        $content = match ($status) {
            'approved' => [
                'title'   => 'Boarding House Approved!',
                'message' => "Your boarding house \"{$boardingHouse->boarding_name}\" has been approved and is now live.",
            ],
            'rejected' => [
                'title'   => 'Boarding House Rejected',
                'message' => $notes
                    ? "Your boarding house \"{$boardingHouse->boarding_name}\" was rejected. Notes: {$notes}"
                    : "Your boarding house \"{$boardingHouse->boarding_name}\" has been rejected.",
            ],
            default => [
                'title'   => 'Boarding House Updated',
                'message' => "Your boarding house \"{$boardingHouse->boarding_name}\" status changed to {$status}.",
            ],
        };

        return self::create([
            'user_id' => $owner->id,
            'type'    => 'boarding_house_' . $status,
            'title'   => $content['title'],
            'message' => $content['message'],
            'data'    => [
                'boarding_house_id'   => $boardingHouse->id,
                'boarding_house_name' => $boardingHouse->boarding_name,
                'status'              => $status,
                'notes'               => $notes,
            ],
        ]);
    }

    public static function createInquiryNotification(User $user, StudentInquiry $inquiry, BoardingHouse $boardingHouse): self
    {
        return self::create([
            'user_id' => $user->id,
            'type' => 'inquiry',
            'title' => 'New Student Inquiry',
            'message' => "{$inquiry->full_name} is interested in {$boardingHouse->boarding_name}",
            'data' => [
                'inquiry_id' => $inquiry->id,
                'student_name' => $inquiry->full_name,
                'student_email' => $inquiry->email,
                'boarding_house_id' => $boardingHouse->id,
                'boarding_house_name' => $boardingHouse->boarding_name,
            ],
        ]);
    }

    public static function createReservationStatusNotification(User $user, StudentInquiry $inquiry, BoardingHouse $boardingHouse, string $status): self
    {
        $content = match ($status) {
            'approved'  => [
                'title'   => 'Reservation Approved!',
                'message' => "Your reservation at {$boardingHouse->boarding_name} has been approved. The owner will contact you with next steps.",
            ],
            'declined'  => [
                'title'   => 'Reservation Declined',
                'message' => "Your reservation at {$boardingHouse->boarding_name} has been declined.",
            ],
            'contacted' => [
                'title'   => 'Owner Responded',
                'message' => "The owner of {$boardingHouse->boarding_name} has responded to your reservation.",
            ],
            default => [
                'title'   => 'Reservation Updated',
                'message' => "Your reservation at {$boardingHouse->boarding_name} status changed to {$status}.",
            ],
        };

        return self::create([
            'user_id' => $user->id,
            'type'    => 'reservation_' . $status,
            'title'   => $content['title'],
            'message' => $content['message'],
            'data'    => [
                'inquiry_id'          => $inquiry->id,
                'boarding_house_id'   => $boardingHouse->id,
                'boarding_house_name' => $boardingHouse->boarding_name,
                'status'              => $status,
            ],
        ]);
    }
}
