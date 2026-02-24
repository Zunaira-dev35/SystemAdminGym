<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Invoice extends Model
{
    protected $fillable = ['gym_id','package_id','package_start_date','package_renewal_date','sub_total','discount_percent','grand_total','desctiption','reference_num','date','time','deposit_method','payment_status'];

    function gym(){
        return $this->hasOne(Gym::class , 'id' , 'gym_id');
    }

    function package(){
        return $this->hasOne(Package::class , 'id' , 'package_id');
    }
}
