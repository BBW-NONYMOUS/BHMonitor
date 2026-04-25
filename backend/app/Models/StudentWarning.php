<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StudentWarning extends Model
{
    use HasFactory;

    protected $fillable = [
        'student_id',
        'owner_id',
        'boarding_house_name',
        'comment',
    ];

    public function student()
    {
        return $this->belongsTo(Student::class);
    }

    public function owner()
    {
        return $this->belongsTo(Owner::class);
    }
}
