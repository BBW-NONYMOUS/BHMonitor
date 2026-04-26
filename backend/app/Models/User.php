<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

/**
 * @property-read \App\Models\Owner|null $owner
 */
class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable, SoftDeletes;

    protected $fillable = [
        'name', 'email', 'password', 'role',
        'account_status', 'profile_photo', 'rejection_reason', 'google_id',
    ];

    protected $hidden = ['password', 'remember_token'];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password'          => 'hashed',
            'deleted_at'        => 'datetime',
        ];
    }

    public function owner()
    {
        return $this->hasOne(Owner::class);
    }

    public function student()
    {
        return $this->hasOne(\App\Models\Student::class);
    }

    public function activityLogs()
    {
        return $this->hasMany(ActivityLog::class);
    }

    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    public function isOwner(): bool
    {
        return $this->role === 'owner';
    }

    public function isStudent(): bool
    {
        return $this->role === 'student';
    }

    public function isPending(): bool
    {
        return $this->account_status === 'pending';
    }

    public function isApproved(): bool
    {
        return $this->account_status === 'approved';
    }

    public function isRejected(): bool
    {
        return $this->account_status === 'rejected';
    }

    public function isInactive(): bool
    {
        return $this->trashed() || in_array($this->account_status, ['pending', 'rejected'], true);
    }

    public function getProfilePhotoUrlAttribute(): ?string
    {
        return $this->profile_photo ? '/storage/' . $this->profile_photo : null;
    }
}
