<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EmployeeProfile extends Model
{
    protected $fillable = ['user_id','designation','salary','join_date','face_encoding','fingerprint_encoding','address','cnic'];

    protected $appends = ['system_currency'];

    function user(){
        return $this->hasOne(User::class, 'id' , 'user_id');
    }

    function getSystemCurrencyAttribute(){
        $systemSettings = SystemSetting::with('currency')->first();
        $systemSettingCurrency = $systemSettings?->currency?->symbol ?? 'Rs'; 
        return $systemSettingCurrency;
    }

}
