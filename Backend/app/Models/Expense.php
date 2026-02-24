<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Expense extends Model
{
    protected $fillable = ['gym_id','title','category_id','amount','payment_method','notes','date','time','reference_num','created_by','branch_id','bank_id'];

    protected $appends = ['system_currency'];

    function category(){
        return $this->hasOne(ExpenseCategory::class,'id','category_id');
    }

    function transaction(){
        return $this->hasOne(Transaction::class,'expense_id','id');
    }

    function createdBy(){
        return $this->hasOne(User::class,'id','created_by');
    }

    function branch(){
        return $this->hasOne(Branch::class , 'id' , 'branch_id');
    }

    function getSystemCurrencyAttribute(){
        $systemSettings = SystemSetting::with('currency')->first();
        $systemSettingCurrency = $systemSettings?->currency?->symbol ?? 'Rs'; 
        return $systemSettingCurrency;
    }

    function bank(){
        return $this->hasOne(Bank::class , 'id' , 'bank_id');
    }
}
