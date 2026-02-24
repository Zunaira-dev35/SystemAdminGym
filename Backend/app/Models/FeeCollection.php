<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FeeCollection extends Model
{
    protected $fillable = ['gym_id','reference_num','user_id','plan_id','plan_start_date','plan_expire_date','amount','deposit_method','created_by_id','generate_date','generate_time','branch_id','bank_id','is_refund','receipt_url','is_advance','advance_payment_id'];

    function member(){
        return $this->hasOne(User::class,'id','user_id');
    }

    function createdByUser(){
        return $this->hasOne(User::class,'id','created_by_id');
    }

    function plan(){
        return $this->hasOne(Plan::class,'id','plan_id');
    }

    function transaction(){
        return $this->hasOne(Transaction::class,'fee_collection_id','id');
    }

     function branch(){
        return $this->hasOne(Branch::class , 'id','branch_id');
    }
    function refunds(){
        return $this->hasMany(PaymentRefund::class, 'fee_collection_id', 'id');
    }

    function hasRefund(){
        return $this->refunds()->exists();
    }

    function bank(){
        return $this->hasOne(Bank::class , 'id' , 'bank_id');
    }
    function advancePayment(){
        return $this->hasOne(AdvancePayment::class , 'id' , 'advance_payment_id');
    }
}
