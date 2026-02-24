<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SubscriptionHistory extends Model
{
    protected $fillable = ['gym_id','package_id','package_start_date','package_renewal_date','invoice_id'];

    protected $appends = ['gym_name' , 'gym_reference_num' , 'package_name' , 'invoice_reference_num'];

    function getGymNameAttribute(){
        $gym = Gym::where('id',$this->gym_id)->first();
        $gymName = $gym?->company_name ?? null;
        return $gymName;
    }

    function getGymReferenceNumAttribute(){
        $gym = Gym::where('id',$this->gym_id)->first();
        $gymRefNum = $gym?->reference_num ?? null;
        return $gymRefNum;
    }

    function getPackageNameAttribute(){
        $package  = Package::where('id',$this->package_id)->first();
        $packageName = $package?->name ?? null;
        return $packageName;
    }

    function getInvoiceReferenceNumAttribute(){
        $invoice  = Invoice::where('id',$this->invoice_id)->first();
        $invoiceRefNum = $invoice?->reference_num ?? null;
        return $invoiceRefNum;
    }
}
