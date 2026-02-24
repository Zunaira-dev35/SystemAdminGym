<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FreezeRequest extends Model
{
    protected $fillable = ['user_id','start_date','end_date','plan_id','plan_start_date','plan_expire_date','generate_date','generate_time','approve_date','approve_time','reject_date','reject_time','status','duration_days','reason','branch_id','created_by_id','approve_by_id','rejected_by_id','reference_num','must_complete_by_date','is_first_freeze','process_status','gym_id'];

    function member(){
        return $this->hasOne(User::class,'id','user_id');
    }

    function createdByUser(){
        return $this->hasOne(User::class,'id','created_by_id');
    }

    function approvedByUser(){
        return $this->hasOne(User::class,'id','approve_by_id');
    }

    function rejectedByUser(){
        return $this->hasOne(User::class,'id','rejected_by_id');
    }

    function branch(){
        return $this->hasOne(Branch::class , 'id' , 'branch_id');
    }
}
