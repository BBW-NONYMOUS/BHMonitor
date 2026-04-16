<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RoomPhoto extends Model
{
    use HasFactory;

    protected $fillable = ['room_id', 'photo_path', 'sort_order'];

    protected $appends = ['photo_url'];

    public function room()
    {
        return $this->belongsTo(Room::class);
    }

    public function getPhotoUrlAttribute(): string
    {
        return '/storage/' . $this->photo_path;
    }
}
