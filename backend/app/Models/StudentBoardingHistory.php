<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StudentBoardingHistory extends Model
{
    protected $fillable = [
        'student_id', 'boarding_house_id', 'boarded_at', 'vacated_at', 'notes',
    ];

    protected function casts(): array
    {
        return [
            'boarded_at' => 'datetime',
            'vacated_at' => 'datetime',
        ];
    }

    public function student()
    {
        return $this->belongsTo(Student::class);
    }

    public function boardingHouse()
    {
        return $this->belongsTo(BoardingHouse::class);
    }
}
