<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Bank extends Model
{
    protected $fillable = ['gym_id','name','account_number','reference_num','branch_id'];

     function branch(){
        return $this->hasOne(Branch::class,'id','branch_id');
    }
}
