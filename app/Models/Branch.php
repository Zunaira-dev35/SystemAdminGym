<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Branch extends Model
{
    protected $fillable = ['name','type','status','address','phone','reference_num','branch_ip','gym_id'];
}
