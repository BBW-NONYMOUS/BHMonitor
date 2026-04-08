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

    protected static function booted(): void
    {
        static::saved(fn (Room $room) => $room->boardingHouse->syncRoomCounts());
        static::deleted(fn (Room $room) => $room->boardingHouse->syncRoomCounts());
    }
}
