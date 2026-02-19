<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RegistrationPhoto extends Model
{
    protected $fillable = [
        'registration_id',
        'person_type',
        'person_index',
        'photo_path',
    ];

    public function registration()
    {
        return $this->belongsTo(Registration::class);
    }
}
