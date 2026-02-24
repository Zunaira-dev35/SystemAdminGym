<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Attendance extends Model
{
    protected $fillable = ['gym_id','user_id','user_type','date','checkin_time','checkout_time','created_by_id','checkin_type','branch_id','attendance_type','shift_start_time','shift_end_time'];

    function user(){
        return $this->hasOne(User::class,'id','user_id');
    }

    function branch(){
        return $this->hasOne(Branch::class , 'id','branch_id');
    }

    

    function createdBy(){
        return $this->hasOne(User::class,'id','created_by_id');
    }

    function attendanceDetails(){
        return $this->hasMany(AttendanceDetails::class , 'attendance_id' , 'id')->orderBy('id','desc');
    }
}
