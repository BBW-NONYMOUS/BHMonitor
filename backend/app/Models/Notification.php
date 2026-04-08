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
}
