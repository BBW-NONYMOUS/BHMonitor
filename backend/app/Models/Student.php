<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Student extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id', 'student_no', 'first_name', 'last_name', 'gender', 'course',
        'year_level', 'contact_number', 'address', 'parent_name', 'parent_contact',
        'image', 'boarding_house_id', 'boarding_approval_status',
        'boarding_rejection_comment', 'room_id',
    ];

    protected $appends = ['image_url', 'full_name'];

    public function getImageUrlAttribute(): ?string
    {
        return $this->image ? '/storage/' . $this->image : null;
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function boardingHouse()
    {
        return $this->belongsTo(BoardingHouse::class);
    }

    public function room()
    {
        return $this->belongsTo(Room::class);
    }

    public function boardingHistories()
    {
        return $this->hasMany(StudentBoardingHistory::class)->orderByDesc('boarded_at');
    }

    public function documents()
    {
        return $this->hasMany(StudentDocument::class);
    }

    public function inquiry()
    {
        return $this->hasOne(StudentInquiry::class);
    }

    public function recommendations()
    {
        return $this->hasMany(StudentRecommendation::class);
    }

    public function getFullNameAttribute(): string
    {
        return "{$this->first_name} {$this->last_name}";
    }

    public function isPendingApproval(): bool
    {
        return $this->boarding_approval_status === 'pending';
    }

    public function isApproved(): bool
    {
        return $this->boarding_approval_status === 'approved';
    }

    public function isDeclined(): bool
    {
        return $this->boarding_approval_status === 'declined';
    }
}
