<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Plan extends Model
{
    protected $fillable = ['name','description','fee','duration_days','status','branch_id','reference_num','freeze_allowed_days','freeze_allowed_count','gym_id'];

    protected $appends = ['system_currency'];

    function getSystemCurrencyAttribute(){
        $systemSettings = SystemSetting::with('currency')->first();
        $systemSettingCurrency = $systemSettings?->currency?->symbol ?? 'Rs'; 
        return $systemSettingCurrency;
    }
}
