<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Package extends Model
{
    protected $fillable = ['name','description','branch_limit','user_limit','member_limit','duration','price','status','created_by','is_app_avail','type','trial_days'];

    
}
