<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Student extends Model
{
    use HasFactory;

    protected $fillable = [
        'student_no', 'first_name', 'last_name', 'gender', 'course',
        'year_level', 'contact_number', 'parent_name', 'parent_contact',
        'image', 'boarding_house_id',
    ];

    protected $appends = ['image_url'];

    public function getImageUrlAttribute(): ?string
    {
        return $this->image ? '/storage/' . $this->image : null;
    }

    public function boardingHouse()
    {
        return $this->belongsTo(BoardingHouse::class);
    }

    public function boardingHistories()
    {
        return $this->hasMany(StudentBoardingHistory::class)->orderByDesc('boarded_at');
    }

    public function getFullNameAttribute(): string
    {
        return "{$this->first_name} {$this->last_name}";
    }
}
