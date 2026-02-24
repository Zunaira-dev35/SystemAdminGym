<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AttendanceDetails extends Model
{
    protected $fillable = ['attendance_id','user_id','user_type','date','checkin_time','checkout_time','created_by_id','checkin_type','branch_id'];

    function user(){
        return $this->hasOne(User::class,'id','user_id');
    }

    function branch(){
        return $this->hasOne(Branch::class , 'id','branch_id');
    }

    function createdBy(){
        return $this->hasOne(User::class,'id','created_by_id');
    }
}
