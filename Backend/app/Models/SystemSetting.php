<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SystemSetting extends Model
{
    protected $fillable = ['company_name','company_email','company_phone','timezone_id','currency_id','country_id','allow_higher_branch_access','higher_branch_allowed_days','type','gym_id','company_logo'];

    function currency(){
        return $this->hasOne(Currency::class,'id','currency_id');
    }

    function timezone(){
        return $this->hasOne(TimeZone::class,'id','timezone_id');
    }
}
