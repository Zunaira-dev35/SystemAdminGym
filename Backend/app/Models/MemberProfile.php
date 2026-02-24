<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;

class MemberProfile extends Model
{
    protected $fillable = ['user_id', 'address', 'cnic', 'register_date', 'whatsapp_num', 'current_plan_id', 'current_plan_start_date', 'current_plan_expire_date', 'face_encoding', 'fingerprint_encoding', 'used_visit_days', 'current_plan_fee', 'must_complete_by_date'];

    protected $appends = ['remaining_days_balance', 'allowed_visit_days', 'total_visits','unused_days_since_last_active','remaining_grace_days','freeze_allow_count', 'freeze_used_count'];

    public function user()
    {
        return $this->hasOne(User::class, 'id', 'user_id');
    }

    public function plan()
    {
        return $this->hasOne(Plan::class, 'id', 'current_plan_id');
    }

    // public function getRemainingDaysBalanceAttribute()
    // {
    //     $remainingDaysBalance = 0;
    //     $elapsedDays = 0;
    //     if ($this->current_plan_id && $this->current_plan_start_date) {
    //         $lastActiveStatus = UserStatusDetail::where('user_id', $this->user_id)->where('plan_id', $this->current_plan_id)->where('plan_start_date', $this->current_plan_start_date)->where('status','active')->orderBy('id', 'desc')->first();
    //         if ($lastActiveStatus) {
    //             $lastStatusDate = Carbon::parse($lastActiveStatus->date);
    //         }else{
    //              $lastStatusDate = Carbon::parse($this->current_plan_start_date);
    //         }
    //             $today = Carbon::parse(now()->toDateString());
    //             if($lastStatusDate < $today){
    //             $elapsedDays = $lastStatusDate->diffInDays($today);
    //             }
    //             // Adjust remaining days to today
    //             $currentRemainingDays = max(0, $lastActiveStatus->remaining_days - $elapsedDays);
    //             $remainingDaysBalance = $currentRemainingDays;
            
    //     }

    //     return $remainingDaysBalance;
    // }
    
    public function getRemainingDaysBalanceAttribute()
    {
        if (!$this->current_plan_id || !$this->current_plan_start_date) {
            return 0;
        }

        $lastActiveStatus = UserStatusDetail::where('user_id', $this->user_id) ->where('plan_id', $this->current_plan_id) ->where('plan_start_date', $this->current_plan_start_date) ->where('status', 'active') ->orderByDesc('id') ->first();
        // Determine base date & base remaining days
        if ($lastActiveStatus) {
            $baseDate = Carbon::parse($lastActiveStatus->date)->startOfDay();
            $baseRemainingDays = (int) $lastActiveStatus->remaining_days;
        } else {
            $baseDate = Carbon::parse($this->current_plan_start_date)->startOfDay();
            $plan = Plan::where('id',$this->current_plan_id)->first();
            $baseRemainingDays = (int) $plan->duration_days; // total plan days
        }

        $today = now()->startOfDay();
        $elapsedDays = $baseDate->lessThan($today) ? $baseDate->diffInDays($today) : 0;
        return max(0, $baseRemainingDays - $elapsedDays);
    }


    public function getUnusedDaysSinceLastActiveAttribute()
    {
        $unusedDays = 0;

        if (! $this->current_plan_id || ! $this->current_plan_start_date) {
            
            return $unusedDays;
        }

        // Get the last active status
        $lastActiveStatus = UserStatusDetail::where('user_id', $this->user_id)
            ->where('plan_id', $this->current_plan_id)
            ->where('plan_start_date', $this->current_plan_start_date)
            ->where('status', 'active')
            ->orderBy('id', 'desc')
            ->first();

        if (! $lastActiveStatus) {
            return $unusedDays;
        }

        $lastActiveDate = Carbon::parse($lastActiveStatus->date);
        $today = Carbon::parse(now()->toDateString());

        // If last active date is in the future (edge case), return 0
        if ($lastActiveDate->greaterThan($today)) {
            return 0;
        }

        // Total days passed since last active status (including today)
        $totalDaysPassed = $lastActiveDate->diffInDays($today);

        // Remaining days at last active status
        $remainingDaysAtLastActive = $lastActiveStatus->remaining_days;

        // Unused days = Days passed that exceeded the remaining days balance
        $unusedDays = max(0, $remainingDaysAtLastActive - $totalDaysPassed);
        return $unusedDays;

    }

    public function getAllowedVisitDaysAttribute()
    {
        $systemSettings = SystemSetting::first();
        $systemSettingAllowedDays = $systemSettings?->higher_branch_allowed_days ?? '0';

        return $systemSettingAllowedDays;
    }

    public function getTotalVisitsAttribute()
    {
        $attendance = Attendance::where('user_id', $this->user_id)->count();

        return $attendance;
    }
     public function getRemainingGraceDaysAttribute()
    {
        $remainingGraceDays = "0";
        if($this->current_plan_id){

        
        if ($this->must_complete_by_date) {
            // If must_complete_by_date is set, calculate days remaining until deadline
            $today = Carbon::parse(now()->toDateString());
            $deadline = Carbon::parse($this->must_complete_by_date);
            
            // Calculate remaining days (positive if deadline is in future, negative if passed)
            $remainingGraceDays = $today->diffInDays($deadline, false);
            
            // Return 0 if deadline has passed
            if ($remainingGraceDays < 0) {
                $remainingGraceDays = 0;
            }
        } else {
            // If must_complete_by_date is null, return freeze_allowed_days from current plan
            if ($this->current_plan_id) {
                $plan = Plan::find($this->current_plan_id);
                if ($plan && $plan->freeze_allowed_days) {
                    $remainingGraceDays = $plan->freeze_allowed_days ?? 0;
                }else{
                    $remainingGraceDays = "Unlimited";
                }
            }
        }
        }
        
        return $remainingGraceDays;
    }

    public function getFreezeAllowCountAttribute()
    {
        $freezeAllowCount = "0";
        
        if ($this->current_plan_id) {
            $plan = Plan::find($this->current_plan_id);
            if ($plan) {
                $freezeAllowCount =  $plan->freeze_allowed_count ? $plan->freeze_allowed_count : "Unlimited";
            }
        }
        
        return $freezeAllowCount;
    }

    public function getFreezeUsedCountAttribute()
    {
        $freezeUsedCount = 0;
        
        if ($this->must_complete_by_date && $this->current_plan_id && $this->current_plan_start_date) {
            // Count approved freeze requests for current plan instance
            $freezeUsedCount = FreezeRequest::where('user_id', $this->user_id)
                ->where('plan_id', $this->current_plan_id)
                ->where('plan_start_date', $this->current_plan_start_date)
                ->where('status', 'approved')
                ->count();
        } else {
            $freezeUsedCount = 0;
        }
        
        return $freezeUsedCount;
    }
}
