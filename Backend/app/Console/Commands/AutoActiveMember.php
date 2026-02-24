<?php

namespace App\Console\Commands;

use App\Models\Gym;
use App\Models\User;
use App\Models\UserStatusDetail;
use Carbon\Carbon;
use Illuminate\Console\Command;

class AutoActiveMember extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:auto-active-member';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Auto active member with future current plan start date';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $todayDate = Carbon::now()->toDateString();
        Gym::where('status','active')->where('package_renewal_date','>',$todayDate)->orderBy('id','desc')->chunk(50,function($gyms){
            foreach($gyms as $gym){
                User::with('memberProfile')
                ->where('status', 'inactive')
                ->whereHas('memberProfile', function ($query) {
                    $query->whereNotNull('current_plan_start_date')->whereNotNull('current_plan_expire_date');
                })
                ->whereHas('roles', function ($query) use ($gym) {
                    $query->where('name', $gym->reference_num.' Member');
                })
                ->orderBy('id', 'desc')
                ->chunk(100, function ($users) {
                    foreach($users as $user){
                        $today = Carbon::today();
                        $memberProfile = $user->memberProfile;
                        $currentPlanStartDate = Carbon::parse($memberProfile->current_plan_start_date)->startOfDay();
                        
                        if ($today->greaterThanOrEqualTo($currentPlanStartDate)) {
                        $user->update(['status' => 'active']);
    
                        // Check for existing active status
                        $existingStatus = UserStatusDetail::where('user_id', $user->id)
                            ->where('status', 'active')
                            ->where('plan_id', $memberProfile->current_plan_id)
                            ->where('plan_start_date', $memberProfile->current_plan_start_date)
                            ->first();
    
                        if (!$existingStatus) {
                            $remainingDays = Carbon::parse($memberProfile->current_plan_expire_date)->diffInDays($today);
                            $planTotalDays = Carbon::parse($memberProfile->current_plan_expire_date)
                                ->diffInDays(Carbon::parse($memberProfile->current_plan_start_date));
    
                            UserStatusDetail::create([
                                'user_id'          => $user->id,
                                'status'           => 'active',
                                'plan_id'          => $memberProfile->current_plan_id,
                                'plan_start_date'  => $memberProfile->current_plan_start_date,
                                'plan_expire_date' => $memberProfile->current_plan_expire_date,
                                'date'             => $memberProfile->current_plan_start_date,
                                'time'             => now()->toTimeString(),
                                'remaining_days'   => $remainingDays,
                                'plan_total_days'  => $planTotalDays,
                            ]);
                        }
    
                        }
                    }
                });
            }
        });
     
    }
}
