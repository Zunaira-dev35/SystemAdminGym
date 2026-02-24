<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class UserStatusDetail extends Model
{
    protected $fillable = ['user_id','status','date','time','updated_by_id','plan_id','plan_start_date','plan_expire_date','remaining_days','plan_total_days','must_complete_by_date'];

    protected $appends = ['plan_name','plan_reference_num'];

    function createdBy(){
        return $this->hasOne(User::class , 'id' , 'updated_by_id');
    }

    function getPlanNameAttribute(){
        $plan = Plan::where('id',$this->plan_id)->first();
        $planName = null;
        if($plan){
            $planName = $plan->name;
        }
        return $planName;
    }

    function getPlanReferenceNumAttribute(){
        $plan = Plan::where('id',$this->plan_id)->first();
        $planRefNum = null;
        if($plan){
            $planRefNum = $plan->reference_num;
        }
        return $planRefNum;
    }
    
}
