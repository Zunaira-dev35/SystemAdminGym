<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Facades\Request;
use Laravel\Sanctum\HasApiTokens;
use League\CommonMark\Delimiter\Bracket;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable, HasApiTokens , HasRoles;
    protected $guard_name = 'sanctum';

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'phone',
        'password',
        'reference_num',
        'type',
        'role_id',
        'user_type',
        'status',
        'profile_image',
        'email_otp',
        'email_otp_expires_at',
        'base_branch_id',
        'blacklisted',
        'password_string',
        'device_fcm_token',
        'gym_id'
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    protected $appends = ['role_group_id','today_attendance','logged_branch','system_currency','remaining_package_days','subscription_status','system_company_name' , 'system_company_logo'];

    function getRoleGroupIdAttribute(){
        $roleGroup = RoleGroup::where('role_id',$this->role_id)->first();
        $roleGroupId = null;
        if($roleGroup){
            $roleGroupId = $roleGroup->id;
            return $roleGroupId;
        }
    }

   

    function memberProfile(){
        return $this->hasOne(MemberProfile::class,'user_id','id');
    }

    function employeeProfile(){
        return $this->hasOne(EmployeeProfile::class,'user_id','id');
    }

    function branch(){
        return $this->hasOne(Branch::class,'id','base_branch_id');
    }

    function getTodayAttendanceAttribute(){
        $todayAttendance = null;
        $user = User::where('id',$this->id)->first();
        if($user->gym_id){
            $gym = Gym::find($user->gym_id);
            if($this->hasRole($gym->reference_num.' Member')){
                $todayAttendance = Attendance::where('user_id',$this->id)->where('date',now()->toDateString())->first();
            }
        }
        return $todayAttendance;
    }

    function statusHistory(){
        return $this->hasMany(UserStatusDetail::class , 'user_id' , 'id')->orderBy('id','desc');
    }

    function employeeShifts(){
        return $this->hasMany(EmployeeShift::class , 'user_id' , 'id');
    }

    function getLoggedBranchAttribute(){
        $loggedBranchId = request()->logged_branch_id;
        if(!$loggedBranchId){
            return null;
        }
        $branch = Branch::where('id' , $loggedBranchId)->first();
        return $branch;
    }

    function getSystemCurrencyAttribute(){
        if($this->gym_id){
            $systemSettings = SystemSetting::with('currency')->where('gym_id',$this->gym_id)->first();
        }else{
            $systemSettings = SystemSetting::with('currency')->where('type','system')->first();
        }
        $systemSettingCurrency = $systemSettings?->currency?->symbol ?? 'Rs'; 
        return $systemSettingCurrency;
    }

    function getSystemCompanyNameAttribute(){
        if($this->gym_id){
            $systemSettings = SystemSetting::with('currency')->where('gym_id',$this->gym_id)->first();
        }else{
            $systemSettings = SystemSetting::with('currency')->where('type','system')->first();
        }
        $systemSettingCompanyName = $systemSettings?->company_name ?? 'Gym ERP'; 
        return $systemSettingCompanyName;
    }

    function getSystemCompanyLogoAttribute(){
        if($this->gym_id){
            $systemSettings = SystemSetting::with('currency')->where('gym_id',$this->gym_id)->first();
        }else{
            $systemSettings = SystemSetting::with('currency')->where('type','system')->first();
        }
        $systemSettingCompanyLogoUrl = $systemSettings?->company_logo ?? ''; 
        return $systemSettingCompanyLogoUrl;
    }

    function activityLogs(){
        return $this->hasMany(SystemLog::class , 'reference_entity_id' , 'id')->where('reference_entity' , 'User')->orderBy('id','desc');
    }

    function assignBranches(){
        return $this->hasMany(UserBranch::class , 'user_id' , 'id');
    }

    function gym(){
        return $this->hasOne(Gym::class , 'id' , 'gym_id');
    }

    function getRemainingPackageDaysAttribute(){
        $totalPackageDays = 0;
        $remainingPackageDays = 0;
        $usedPackageDays = 0;
        if($this->gym_id){
            $gym = Gym::find($this->gym_id);
            $startDate = $gym->package_start_date ? Carbon::parse($gym->package_start_date) : null;
            $endDate = $gym->package_renewal_date ? Carbon::parse($gym->package_renewal_date) : null;
            if ($startDate && $endDate && $endDate->greaterThan($startDate)) {
                $totalPackageDays = (int) $startDate->diffInDays($endDate);
                $usedPackageDays = (int) min( $totalPackageDays, $startDate->diffInDays(now()) );
                $remainingPackageDays = (int) max( 0, $totalPackageDays - $usedPackageDays );
            }
        }
        return $remainingPackageDays;
    }

    function getSubscriptionStatusAttribute(){
        $subscriptionStatus = 'inactive';
        if($this->gym_id){
            $gym = Gym::find($this->gym_id);
            if($gym){
                $now = Carbon::now();
                $packageRenewalDate = $gym->package_renewal_date ? Carbon::parse($gym->package_renewal_date) : null;
                if($packageRenewalDate && $now->greaterThan($packageRenewalDate)){
                    $subscriptionStatus = 'expired';
                }else{
                    $subscriptionStatus = 'active';
                }
            }
        
        }
        return $subscriptionStatus;
    }
}
