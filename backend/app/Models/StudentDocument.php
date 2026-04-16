<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StudentDocument extends Model
{
    protected $fillable = [
        'student_id', 'document_name', 'document_type', 'file_path',
        'file_original_name', 'file_size', 'uploaded_by', 'verified_at', 'verified_by',
    ];

    protected $appends = ['file_url'];

    protected function casts(): array
    {
        return [
            'verified_at' => 'datetime',
            'file_size'   => 'integer',
        ];
    }

    public function getFileUrlAttribute(): ?string
    {
        return $this->file_path ? '/storage/' . $this->file_path : null;
    }

    public function student()
    {
        return $this->belongsTo(Student::class);
    }

    public function uploader()
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }

    public function verifier()
    {
        return $this->belongsTo(User::class, 'verified_by');
    }
}
