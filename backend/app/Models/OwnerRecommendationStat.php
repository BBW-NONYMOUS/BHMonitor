<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class OwnerRecommendationStat extends Model
{
    use HasFactory;

    protected $fillable = [
        'owner_id',
        'total_recommendations',
        'accepted',
        'rejected',
        'submitted',
        'average_rating',
    ];

    public function owner()
    {
        return $this->belongsTo(Owner::class);
    }
}
