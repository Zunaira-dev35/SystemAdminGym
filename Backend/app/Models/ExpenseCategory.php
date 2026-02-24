<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ExpenseCategory extends Model
{
    protected $fillable = ['gym_id','title','description','created_by','branch_id'];

    function createdBy(){
        return $this->hasOne(User::class,'id','created_by');
    }
}
