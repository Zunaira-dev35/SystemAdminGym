<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EmailVerification extends Model
{
    protected $fillable = ['company_name','company_email','package_type','package_id','deposit_method','token','expires_at','status'];
}
