<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Payroll extends Model
{
    //
    protected $fillable = ['gym_id',
        'user_id', 'payroll_month', 'basic_salary',
        'cheat_minutes', 'cheat_deduction',
        'absent_days', 'absent_deduction',
        'leave_days', 'holiday_days', 'net_payable', 'shift_absent',
        'reference_num', 'status', 'processed_by', 'processed_at', 'period_start', 'period_end',
        'period_days', 'period_salary', 'shift_config', 'absent_details','cheat_details'
    ];

    protected $appends = ['system_currency'];
    protected $casts = [
        'shift_absent' => 'array',
        'shift_config' => 'array',
        'absent_details' => 'array',
        'cheat_details' => 'array',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
    public function transaction()
    {
        return $this->hasOne(Transaction::class, 'payroll_id');
    }
    public function processedBy()
    {
        return $this->belongsTo(User::class, 'processed_by');
    }
    function getSystemCurrencyAttribute(){
        $systemSettings = SystemSetting::with('currency')->first();
        $systemSettingCurrency = $systemSettings?->currency?->symbol ?? 'Rs'; 
        return $systemSettingCurrency;
    }

}

