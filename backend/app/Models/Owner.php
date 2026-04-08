<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * @property int $id
 * @property int $user_id
 * @property string $full_name
 * @property string|null $contact_number
 * @property string|null $email
 * @property string|null $address
 */
class Owner extends Model
{
    use HasFactory;

    protected $fillable = ['user_id', 'full_name', 'contact_number', 'email', 'address'];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function boardingHouses()
    {
        return $this->hasMany(BoardingHouse::class);
    }
}
