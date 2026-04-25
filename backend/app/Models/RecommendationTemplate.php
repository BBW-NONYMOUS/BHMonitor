<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RecommendationTemplate extends Model
{
    use HasFactory;

    protected $fillable = [
        'owner_id',
        'name',
        'template_text',
        'is_active',
    ];

    public function owner()
    {
        return $this->belongsTo(Owner::class);
    }

    public function recommendations()
    {
        return $this->hasMany(StudentRecommendation::class, 'template_used', 'name');
    }
}
