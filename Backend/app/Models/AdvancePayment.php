<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AdvancePayment extends Model
{
    protected $fillable = [
        'reference_num',
        'user_id',
        'plan_id',
        'amount',
        'deposit_method',
        'bank_id',
        'payment_date',
        'payment_time',
        'created_by_id',
        'branch_id',
        'notes',
        'status',
        'is_auto_renew',
        'fee_collection_id',
        'is_advance_refund',
        'advance_payment_id',
        'gym_id'
    ];

    protected $casts = [
        'is_auto_renew' => 'boolean',
        'payment_date' => 'date'
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function plan()
    {
        return $this->belongsTo(Plan::class);
    }

    public function createdBy()
    {
        return $this->belongsTo(User::class, 'created_by_id');
    }

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    public function bank()
    {
        return $this->belongsTo(Bank::class);
    }

    public function feeCollection()
    {
        return $this->belongsTo(FeeCollection::class);
    }

    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    public function scopeForUser($query, $userId)
    {
        return $query->where('user_id', $userId);
    }

    public function scopeAutoRenew($query)
    {
        return $query->where('is_auto_renew', true);
    }
    public function transaction()
    {
        return $this->hasOne(Transaction::class, 'advance_payment_id');
    }
}