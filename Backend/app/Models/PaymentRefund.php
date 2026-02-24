<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PaymentRefund extends Model
{
    protected $fillable = [
        'gym_id',
        'reference_num',
        'fee_collection_id',
        'user_id',
        'plan_id',
        'refund_amount',
        'original_amount',
        'refund_method',
        'notes',
        'refund_date',
        'refund_time',
        'created_by_id',
        'branch_id'
    ];

    protected $appends = ['system_currency'];


    public function feeCollection()
    {
        return $this->belongsTo(FeeCollection::class, 'fee_collection_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function plan()
    {
        return $this->belongsTo(Plan::class, 'plan_id');
    }

    public function createdBy()
    {
        return $this->belongsTo(User::class, 'created_by_id');
    }

    public function branch()
    {
        return $this->belongsTo(Branch::class, 'branch_id');
    }

    public function transaction()
    {
        return $this->hasOne(Transaction::class, 'payment_refund_id', 'id');
    }

     function getSystemCurrencyAttribute(){
        $systemSettings = SystemSetting::with('currency')->first();
        $systemSettingCurrency = $systemSettings?->currency?->symbol ?? 'Rs'; 
        return $systemSettingCurrency;
    }
}