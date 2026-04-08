<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StudentInquiry extends Model
{
    use HasFactory;

    protected $fillable = [
        'boarding_house_id',
        'student_id',
        'full_name',
        'email',
        'contact_number',
        'student_no',
        'course',
        'year_level',
        'gender',
        'message',
        'preferred_room_type',
        'budget',
        'move_in_date',
        'status',
        'owner_notes',
    ];

    protected function casts(): array
    {
        return [
            'budget' => 'float',
            'move_in_date' => 'date',
        ];
    }

    public function boardingHouse()
    {
        return $this->belongsTo(BoardingHouse::class);
    }

    public function student()
    {
        return $this->belongsTo(Student::class);
    }
}
