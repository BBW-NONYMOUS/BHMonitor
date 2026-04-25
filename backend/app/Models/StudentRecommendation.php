<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StudentRecommendation extends Model
{
    use HasFactory;

    protected $fillable = [
        'student_id',
        'owner_id',
        'status',
        'student_message',
        'owner_response',
        'rejection_reason',
        'requested_at',
        'responded_at',
        'rating',
        'student_review',
        'template_used',
        'is_bulk_request',
    ];

    protected $casts = [
        'requested_at' => 'datetime',
        'responded_at' => 'datetime',
        'is_bulk_request' => 'boolean',
    ];

    public function student()
    {
        return $this->belongsTo(Student::class);
    }

    public function owner()
    {
        return $this->belongsTo(Owner::class);
    }

    public function ratings()
    {
        return $this->hasMany(RecommendationRating::class);
    }

    public function latestRating()
    {
        return $this->hasOne(RecommendationRating::class)->latest();
    }

    public function isPending(): bool
    {
        return $this->status === 'pending';
    }

    public function isAccepted(): bool
    {
        return $this->status === 'accepted';
    }

    public function isRejected(): bool
    {
        return $this->status === 'rejected';
    }

    public function isSubmitted(): bool
    {
        return $this->status === 'submitted';
    }

    public function isRated(): bool
    {
        return $this->rating !== null;
    }
}
