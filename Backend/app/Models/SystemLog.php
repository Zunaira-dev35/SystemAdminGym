<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\Relation;

class SystemLog extends Model
{
     protected $fillable = ['gym_id','action_type','action_description','reference_entity_id','reference_entity','created_by_user_id','date','time','device_ip','branch_id'];

  

    function createdBy(){
        return $this->hasOne(User::class,'id','created_by_user_id');
    }

    protected $appends = ['reference_entity_name'];


    function getReferenceEntityNameAttribute(){
        return $this->reference_entity;
    }

    public function referenceEntity()
    {
        Relation::morphMap([
        'User' => \App\Models\User::class,
        'FeeCollection' =>  \App\Models\FeeCollection::class,
        'Plan'  =>  \App\Models\Plan::class,
        'Income'    =>  \App\Models\Income::class,
        'Expense'   =>  \App\Models\Expense::class,
        'FreezeRequest' =>  \App\Models\FreezeRequest::class,
        'PaymentRefund' =>  \App\Models\PaymentRefund::class,
        'MembershipTransfer'    =>  \App\Models\MembershipTransfer::class,
        'AdvancePayment' =>  \App\Models\AdvancePayment::class,
        ]);

        return $this->morphTo(
            __FUNCTION__,
            'reference_entity',  
            'reference_entity_id' 
        );
    }

    function branch(){
        return $this->hasOne(Branch::class , 'id','branch_id');
    }
}
