<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Transaction extends Model
{
    protected $fillable = ['gym_id','payment_method','debit_amount','credit_amount','date','time','description','transaction_type','reference_num','expense_id',
    'income_id','fee_collection_id','created_by','source','branch_id','payroll_id','payment_refund_id','bank_id','payment_date','application_date','advance_payment_id'];

    function createdBy(){
        return $this->hasOne(User::class,'id','created_by');
    }
    
    function income(){
        return $this->hasOne(Income::class , 'id' , 'income_id');
    }

    function expense(){
        return $this->hasOne(Expense::class,'id','expense_id');
    }

    function feeCollection(){
        return $this->hasOne(FeeCollection::class,'id','fee_collection_id');
    }

    function branch(){
        return $this->hasOne(Branch::class , 'id' , 'branch_id');
    }
    function paymentRefund(){
        return $this->hasOne(PaymentRefund::class, 'id', 'payment_refund_id');
    }

    function bank(){
        return $this->hasOne(Bank::class , 'id' , 'bank_id');
    }
    function AdvancePayment()
    {
        return $this->belongsTo(AdvancePayment::class, 'advance_payment_id');
    }
}
