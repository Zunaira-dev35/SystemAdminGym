<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Gym extends Model
{
    protected $fillable = ['company_name','company_email','company_phone','company_address','password','package_id','branch_limit','user_limit','member_limit','employee_limit','duration','price','package_start_date','package_renewal_date','status','reference_num','invoice_id'];

    protected $appends = ['package_name','package_type','system_currency','default_user','pending_payment','paid_payment','used_member_limit','used_user_limit','used_employee_limit','used_branch_limit','system_company_logo'];

    function package(){
        return $this->hasOne(Package::class , 'id' , 'package_id');
    }

    function currentInvoice(){
        return $this->hasOne(Invoice::class , 'id' , 'invoice_id');
    }

    function getPackageNameAttribute(){
        $packageName = null;
        if($this->package_id){
            $package = Package::where('id',$this->package_id)->first();
            $packageName = $package->name;
        }
        return $packageName;
    }

    function getPackageTypeAttribute(){
        $packageType = null;
        if($this->package_id){
            $package = Package::where('id',$this->package_id)->first();
            $packageType = $package->type;
        }
        return $packageType;
    }

    function getSystemCurrencyAttribute(){
        $systemSettings = SystemSetting::with('currency')->where('type','system')->first();
        $systemSettingCurrency = $systemSettings?->currency?->symbol ?? 'Rs'; 
        return $systemSettingCurrency;
    }

    function invoices(){
        return $this->hasMany(Invoice::class , 'gym_id' , 'id')->orderBy('id','desc');
    }

    function subscriptionHistories(){
        return $this->hasMany(SubscriptionHistory::class  , 'gym_id' , 'id')->orderBy('id','desc');
    }

    function getDefaultUserAttribute(){
        $user = User::where('gym_id',$this->id)->where('type','default')->first();
        return $user;
    }

    function getPendingPaymentAttribute(){
        $pendingPayments = Invoice::where('gym_id',$this->id)->where('payment_status','pending')->sum('grand_total');
        return $pendingPayments;
    }

     function getPaidPaymentAttribute(){
        $paidPayments = Invoice::where('gym_id',$this->id)->where('payment_status','paid')->sum('grand_total');
        return $paidPayments;
    }

    function getUsedMemberLimitAttribute(){
        $users = User::where('gym_id',$this->id)->where('user_type','member')->count();
        return $users;
    }

    function getUsedUserLimitAttribute(){
        $users = User::where('gym_id',$this->id)->where('user_type','other')->count();
        return $users;
    }

    function getUsedEmployeeLimitAttribute(){
        $users = User::where('gym_id',$this->id)->where('user_type','employee')->count();
        return $users;
    }

    function getUsedBranchLimitAttribute(){
        $branches = Branch::where('gym_id',$this->id)->count();
        return $branches;
    }

     function getSystemCompanyLogoAttribute(){
        $systemSettings = SystemSetting::with('currency')->where('gym_id',$this->gym_id)->first();
        $systemSettingCompanyLogoUrl = $systemSettings?->company_logo ?? ''; 
        return $systemSettingCompanyLogoUrl;
    }
}
