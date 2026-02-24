<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Leave extends Model
{
    protected $fillable = ['gym_id','user_id','start_date','end_date','leave_title','apply_reason','doc_url','status','hold_reason','reject_reason','leave_mode','verify_by','verify_at','created_by'];

    function user(){
        return $this->hasOne(User::class,'id','user_id');
    }
}
