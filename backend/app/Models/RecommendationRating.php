<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RecommendationRating extends Model
{
    use HasFactory;

    protected $fillable = [
        'recommendation_id',
        'rating',
        'review',
    ];

    public function recommendation()
    {
        return $this->belongsTo(StudentRecommendation::class);
    }
}
