<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PlanTransfer extends Model
{
    protected $fillable = ['gym_id','user_id','current_plan_id','current_plan_start_date','current_plan_total_days','current_plan_used_days','current_plan_received_fee','total_fee_received','new_plan_id','new_plan_start_date','new_plan_total_days','new_plan_remaining_days','new_plan_total_fee','new_plan_remaining_fee','deposit_method','created_by_id','generate_date','generate_time','branch_id','reference_num','fee_collection_id','bank_id'];

    protected $appends = ['system_currency'];


    function member(){
        return $this->hasOne(User::class,'id','user_id');
    }

    function createdByUser(){
        return $this->hasOne(User::class,'id','created_by_id');
    }

    function previousPlan(){
        return $this->hasOne(Plan::class,'id','current_plan_id');
    }

    function transferedPlan(){
        return $this->hasOne(Plan::class,'id','new_plan_id');
    }

    function branch(){
        return $this->hasOne(Branch::class , 'id' , 'branch_id');
    }

    function getSystemCurrencyAttribute(){
        $systemSettings = SystemSetting::with('currency')->first();
        $systemSettingCurrency = $systemSettings?->currency?->symbol ?? 'Rs'; 
        return $systemSettingCurrency;
    }

    function feeCollection(){
        return $this->hasOne(FeeCollection::class , 'id' , 'fee_collection_id');
    }
}
