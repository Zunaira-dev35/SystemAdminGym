<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Notifications\DatabaseNotification;

class Notification extends DatabaseNotification
{
    protected $fillable = ['gym_id','user_id', 'name', 'message', 'is_read', 'read_at', 'type', 'image', 'date', 'time','branch_id','reference_entity_name','reference_entity_id'];

    protected $casts = [
        'created_at' => 'datetime:Y-m-d H:i:s',
        'updated_at' => 'datetime:Y-m-d H:i:s',
        'read_at' => 'datetime:Y-m-d H:i:s',
        'date' => 'datetime:Y-m-d',
        'time'  => 'datetime:H:i:s'
    ];
    
    function receiver(){
        return $this->hasOne(User::class,'id','user_id');
    }
}
