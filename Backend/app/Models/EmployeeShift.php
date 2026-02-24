<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EmployeeShift extends Model
{
    protected $fillable = ['user_id','type','rest_day_name','morning_start_time','morning_end_time','evening_start_time','evening_end_time'];

    function user(){
        return $this->hasOne(User::class , 'id' , 'user_id');
    }

    
}
