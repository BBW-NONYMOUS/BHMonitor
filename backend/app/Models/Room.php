<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Room extends Model
{
    use HasFactory;

    protected $fillable = [
        'boarding_house_id', 'room_name', 'capacity', 'occupied_slots',
        'available_slots', 'price', 'status', 'gender_type', 'amenities',
    ];

    protected $appends = ['computed_status'];

    protected function casts(): array
    {
        return [
            'price'          => 'float',
            'capacity'       => 'integer',
            'occupied_slots' => 'integer',
            'available_slots'=> 'integer',
        ];
    }

    public function boardingHouse()
    {
        return $this->belongsTo(BoardingHouse::class);
    }

    public function students()
    {
        return $this->hasMany(Student::class);
    }

    public function photos()
    {
        return $this->hasMany(RoomPhoto::class)->orderBy('sort_order');
    }

    /**
     * Auto-computed availability status based on student count vs. capacity.
     * available = 0 students, limited = 1 to capacity-1, full = at capacity
     */
    public function getComputedStatusAttribute(): string
    {
        $count = $this->students()->count();
        if ($count === 0) return 'available';
        if ($count >= $this->capacity) return 'full';
        return 'limited';
    }

    protected static function booted(): void
    {
        static::saved(fn (Room $room) => $room->boardingHouse->syncRoomCounts());
        static::deleted(fn (Room $room) => $room->boardingHouse->syncRoomCounts());
    }
}
