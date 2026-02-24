<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Holiday extends Model
{
    protected $fillable = [
        'start_date',
        'end_date',
        'note',
        'created_by',
        'gym_id'
    ];

    function createdbyUser(){
        return $this->hasOne(User::class,'id','created_by');
    }
}
