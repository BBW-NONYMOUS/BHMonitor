<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * @property int $id
 * @property int $owner_id
 * @property string $boarding_name
 * @property string $address
 * @property string|null $description
 * @property string|null $facilities
 * @property float|null $room_rate
 * @property int|null $total_rooms
 * @property int|null $available_rooms
 * @property float|null $latitude
 * @property float|null $longitude
 * @property string|null $image
 * @property string $status
 * @property-read \App\Models\Owner|null $owner
 * @property-read \Illuminate\Database\Eloquent\Collection<\App\Models\Room> $rooms
 * @property-read \Illuminate\Database\Eloquent\Collection<\App\Models\Student> $students
 */
class BoardingHouse extends Model
{
    use HasFactory;

    protected $fillable = [
        'owner_id', 'boarding_name', 'address', 'description', 'facilities',
        'room_rate', 'total_rooms', 'available_rooms', 'latitude', 'longitude',
        'image', 'status', 'approval_status', 'admin_notes',
    ];

    protected $appends = ['image_url'];

    public function getImageUrlAttribute(): ?string
    {
        return $this->image ? '/storage/' . $this->image : null;
    }

    protected function casts(): array
    {
        return [
            'latitude'  => 'float',
            'longitude' => 'float',
            'room_rate' => 'float',
        ];
    }

    public function owner()
    {
        return $this->belongsTo(Owner::class);
    }

    public function rooms()
    {
        return $this->hasMany(Room::class);
    }

    public function students()
    {
        return $this->hasMany(Student::class);
    }

    public function syncRoomCounts(): void
    {
        $this->total_rooms = $this->rooms()->count();
        $this->available_rooms = $this->rooms()
            ->where('status', '!=', 'maintenance')
            ->where('available_slots', '>', 0)
            ->count();
        $minRate = $this->rooms()->min('price');
        $this->room_rate = $minRate ?? 0;
        $this->save();
    }
}
