<?php

namespace App\Console\Commands;

use App\Models\Plan;
use App\Models\User;
use App\Models\UserStatusDetail;
use App\Models\AdvancePayment;
use App\Models\FeeCollection;
use App\Models\MemberProfile; 
use App\Models\Branch;
use App\Models\Gym;
use App\Models\Transaction;
use Exception;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class AutoExpireMember extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:auto-expire-member';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Expire members and process advance payments';

    /**
     * Execute the console command.
     */
    public function handle()
    {
      
       
        $todayDate = Carbon::now()->toDateString();
        Gym::where('status','active')->where('package_renewal_date','>',$todayDate)->orderBy('id','desc')->chunk(50,function($gyms){
            foreach($gyms as $gym){
                // FIRST: Process ACTIVE members for expiration
                User::with('memberProfile')
                ->where('status', 'active')
                ->whereHas('memberProfile', function ($query) {
                    $query->whereNotNull('current_plan_expire_date');
                })
                ->whereHas('roles', function ($query) use ($gym){
                    $query->where('name', $gym->reference_num.' Member');
                })
                ->orderBy('id', 'desc')
                ->chunk(100, function ($users) {
                    foreach ($users as $user) {
                        try {
                            DB::beginTransaction();
                            $memberProfile = $user->memberProfile;
                            $userExpireDate = $memberProfile->current_plan_expire_date;
                            $todayDate = now()->toDateString();
                            
                            // Check if plan has expired
                            if ($todayDate >= $userExpireDate) {
                                // ALWAYS EXPIRE THE MEMBER FIRST
                                $expiredSuccessfully = $this->expireMember($user, $memberProfile);
                                
                                if ($expiredSuccessfully) {
                                
                                    // Check for advance payment AFTER expiration
                                    $advancePayment = AdvancePayment::where('user_id', $user->id)
                                        ->where('status', 'pending')
                                        ->where('is_auto_renew', true)
                                        ->orderBy('payment_date', 'asc')
                                        ->first();
                                    
                                    if ($advancePayment) {
                                        // RENEW FROM EXPIRED STATE
                                        $this->renewFromExpiredState($user, $advancePayment);
                                    }else{
                                        $memberProfile->update(['current_plan_id' => null , 'current_plan_start_date' => null , 'current_plan_expire_date' => null , 'current_plan_fee' => null, 'must_complete_by_date' => null]);
                                    }
                                }
                            }
                            
                            DB::commit();
                        } catch (Exception $e) {
                            DB::rollBack();
                            $this->error("Error processing active member ID {$user->id}: " . $e->getMessage());
                        }
                    }
                });

            // SECOND: Process FROZEN members (similar logic)
            User::with('memberProfile')
                ->where('status', 'frozen')
                ->whereHas('memberProfile', function ($query) {
                    $query->whereNotNull('current_plan_id');
                })
                ->whereHas('roles', function ($query) use ($gym){
                    $query->where('name', $gym->reference_num.' Member');
                })
                ->orderBy('id', 'desc')
                ->chunk(100, function ($users) {
                    foreach ($users as $user) {
                        try {
                            DB::beginTransaction();
                            $memberProfile = $user->memberProfile;
                            $todayDate = now()->toDateString();
                            
                            // Get the latest frozen status for this plan
                            $latestFrozenStatus = UserStatusDetail::where('user_id', $user->id)
                                ->where('plan_id', $memberProfile->current_plan_id)
                                ->where('plan_start_date', $memberProfile->current_plan_start_date)
                                ->where('status', 'frozen')
                                ->whereNotNull('must_complete_by_date')
                                ->orderBy('id', 'desc')
                                ->first();
                            
                            // If no must_complete_by_date found, get it from the first freeze approval
                            if (!$latestFrozenStatus || !$latestFrozenStatus->must_complete_by_date) {
                                $firstFreezeApproval = DB::table('freeze_requests')
                                    ->where('user_id', $user->id)
                                    ->where('plan_id', $memberProfile->current_plan_id)
                                    ->where('plan_start_date', $memberProfile->current_plan_start_date)
                                    ->where('status', 'approved')
                                    ->whereNotNull('must_complete_by_date')
                                    ->orderBy('approve_date', 'asc')
                                    ->first();
                                
                                if ($firstFreezeApproval) {
                                    $mustCompleteByDate = $firstFreezeApproval->must_complete_by_date;
                                } else {
                                    DB::rollBack();
                                    continue;
                                }
                            } else {
                                $mustCompleteByDate = $latestFrozenStatus->must_complete_by_date;
                            }
                            
                            // Check if today is past the must_complete_by_date
                            if ($todayDate > $mustCompleteByDate) {
                                // EXPIRE THE FROZEN MEMBER FIRST
                                $expiredSuccessfully = $this->expireFrozenMember($user, $memberProfile, $latestFrozenStatus, $mustCompleteByDate);
                                
                                if ($expiredSuccessfully) {
                                  
                                    // Check for advance payment AFTER expiration
                                    $advancePayment = AdvancePayment::where('user_id', $user->id)
                                        ->where('status', 'pending')
                                        ->where('is_auto_renew', true)
                                        ->orderBy('payment_date', 'asc')
                                        ->first();
                                    
                                    if ($advancePayment) {
                                        // RENEW FROM EXPIRED STATE
                                        $this->renewFromExpiredState($user, $advancePayment, true);
                                    }else{
                                        $memberProfile->update(['current_plan_id' => null , 'current_plan_start_date' => null , 'current_plan_expire_date' => null , 'current_plan_fee' => null, 'must_complete_by_date' => null]);
                                    }
                                }
                            }
                            DB::commit();
                        } catch (Exception $e) {
                            DB::rollBack();
                            $this->error('Error processing frozen member ID ' . $user->id . ': ' . $e->getMessage());
                        }
                    }
                });
            }
           
            
        });
        
    }
    
    /**
     * Expire a member (no advance payment available)
     * Returns: boolean - whether expiration was successful
     */
    private function expireMember(User $user, \App\Models\MemberProfile $memberProfile): bool
    {
        try {
            $unUsedDays = $memberProfile->unused_days_since_last_active;
            $currentPlan = Plan::where('id', $memberProfile->current_plan_id)->first();
            
            $userLatestActiveStatus = UserStatusDetail::where('user_id', $user->id)
                ->where('plan_id', $memberProfile->current_plan_id)
                ->where('plan_start_date', $memberProfile->current_plan_start_date)
                ->where('status', 'active')
                ->orderBy('id', 'desc')
                ->first();
            // Create expired status
            UserStatusDetail::create([
                'user_id' => $user->id,
                'status' => 'expired',
                'plan_id' => $memberProfile->current_plan_id,
                'plan_start_date' => $memberProfile->current_plan_start_date,
                'plan_expire_date' => $memberProfile->current_plan_expire_date,
                'date' => $memberProfile->current_plan_expire_date,
                'time' => now()->toTimeString(),
                'updated_by_id' => null,
                'remaining_days' => 0,
                'plan_total_days' => $userLatestActiveStatus->plan_total_days ?? 0
            ]);
            
            // Update user status to expired
            $user->update(['status' => 'expired']);
            
            // Generate system log
            if ($unUsedDays > 0 && $currentPlan) {
                GenerateSystemLogs(
                    'Member Expired',
                    "Member {$user->reference_num} expired by system. You not used {$unUsedDays} days in Grace period of {$currentPlan->freeze_allowed_days} starting from your 1st Freeze Request",
                    $user->id,
                    'User',
                    $user->gym_id,
                    $currentPlan->branch_id,
                    null
                );
            } else {
                GenerateSystemLogs(
                    'Member Expired',
                    "Member {$user->reference_num} expired by system.",
                    $user->id,
                    'User',
                    $user->gym_id,
                    $currentPlan ? $currentPlan->branch_id : null,
                    null
                );
            }
            
            // Generate notification
            $gym = Gym::find($user->gym_id);
            $recipients = User::where('gym_id',$user->gym_id)->whereDoesntHave('roles', function ($query) use ($gym){
                $query->whereIn('name', [$gym->reference_num.' Member']);
            })->get(['id', 'reference_num', 'name']);
            
            foreach ($recipients as $recipient) {
                generateNotification(
                    $recipient->id,
                    'Member Expired',
                    "Member {$user->reference_num} expired by system.",
                    'member',
                    $currentPlan ? $currentPlan->branch_id : null,
                    null
                );
            }
            
            // Notification to member
            if ($unUsedDays > 0 && $currentPlan) {
                generateNotification(
                    $user->id,
                    'Your Plan Expired',
                    "Your plan has expired. You not used {$unUsedDays} days in Grace period of {$currentPlan->freeze_allowed_days} starting from your 1st Freeze Request. Please visit the gym to renew or start a new membership",
                    'member',
                    $currentPlan->branch_id,
                    null
                );
            } else {
                generateNotification(
                    $user->id,
                    'Your Plan Expired',
                    'Your plan has expired. Please visit the gym to renew or start a new membership',
                    'member',
                    $currentPlan ? $currentPlan->branch_id : null,
                    null
                );
            }
            
            // Send push notification
            $userFcmToken = $user->device_fcm_token ?? null;
            if ($userFcmToken) {
                if ($unUsedDays > 0 && $currentPlan) {
                    sendFCM(
                        $userFcmToken,
                        'Your Plan Expired',
                        "You not used {$unUsedDays} days in Grace period of {$currentPlan->freeze_allowed_days} starting from your 1st Freeze Request. Please visit the gym to renew or start a new membership"
                    );
                } else {
                    sendFCM(
                        $userFcmToken,
                        'Your Plan Expired',
                        'Your plan has expired. Please visit the gym to renew or start a new membership'
                    );
                }
            }
            
            return true;
        } catch (Exception $e) {
            $this->error("Error expiring member ID {$user->id}: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Renew a member from expired state using advance payment
     */
    private function renewFromExpiredState(User $user, AdvancePayment $advancePayment, bool $wasFrozen = false)
    {
        $today = now();
        $plan = $advancePayment->plan;
        $planDurationDays = $plan->duration_days;
        
        // Calculate new plan dates
        $planStartDate = $today->toDateString();
        $planExpireDate = Carbon::parse($planStartDate)->addDays($planDurationDays)->toDateString();
        
        // Get member profile (it should exist since we just expired the member)
        $memberProfile = MemberProfile::where('user_id', $user->id)->first();
        
        if (!$memberProfile) {
            throw new Exception("Member profile not found for user ID {$user->id}");
        }
        
        // UPDATE EXISTING FEE COLLECTION with plan dates
        $feeCollection = $advancePayment->feeCollection;
        $feeCollection->update([
            'plan_start_date' => $planStartDate,
            'plan_expire_date' => $planExpireDate,
            'status' => 'applied'
        ]);
        
        // Update advance payment status
        $advancePayment->update([
            'status' => 'applied'
        ]);
        
        // Update the transaction with application date
        Transaction::where('fee_collection_id', $feeCollection->id)
            ->update([
                'application_date' => $today->toDateString(),
                'description' => DB::raw("CONCAT(description, ' | Auto-applied on: " . $today->toDateString() . " for plan starting: " . $planStartDate . "')")
            ]);
        
        // Update member profile with NEW plan
        $memberProfile->update([
            'current_plan_id' => $advancePayment->plan_id,
            'current_plan_start_date' => $planStartDate,
            'current_plan_expire_date' => $planExpireDate,
            'used_visit_days' => 0,
            'current_plan_fee' => $advancePayment->amount,
            'must_complete_by_date' => null
        ]);
        
        // Create user status history for renewal from expired state
        UserStatusDetail::create([
            'user_id' => $user->id,
            'status' => 'active',
            'plan_id' => $advancePayment->plan_id,
            'plan_start_date' => $planStartDate,
            'plan_expire_date' => $planExpireDate,
            'date' => $planStartDate,
            'time' => $today->toTimeString(),
            'remaining_days' => $planDurationDays,
            'plan_total_days' => $planDurationDays,
        ]);
        
        // Update user status to active
        $user->update(['status' => 'active']);
        
        // Generate system logs
        $logMessage = "Member {$user->reference_num} renewed from advance payment {$advancePayment->reference_num} after expiration. ";
        $logMessage .= "Payment was received on {$advancePayment->payment_date} (Voucher: {$feeCollection->reference_num}), applied on {$today->toDateString()}.";
        if ($wasFrozen) {
            $logMessage .= " Member was previously frozen and expired.";
        }
        
        GenerateSystemLogs(
            'Member Renewed from Advance Payment After Expiration',
            $logMessage,
            $feeCollection->id,
            'FeeCollection',
            $user->gym_id,
            $advancePayment->branch_id,
            null
        );
         $gym = Gym::find($user->gym_id);
        // Generate notification to admins
        $recipients = User::where('gym_id',$user->gym_id)->whereDoesntHave('roles', function ($query) use($gym) {
            $query->whereIn('name', [$gym->reference_num.' Member']);
        })->get(['id', 'reference_num', 'name']);
        
        foreach ($recipients as $recipient) {
            generateNotification(
                $recipient->id,
                'Member Renewed Automatically After Expiration',
                "Member {$user->reference_num} has been automatically renewed from advance payment after expiration. Voucher: {$feeCollection->reference_num}",
                'member',
                $advancePayment->branch_id,
                null
            );
        }
        
        // Notification to member
        generateNotification(
            $user->id,
            'Plan Renewed Automatically',
            "Your advance payment (Voucher: {$feeCollection->reference_num}) has been automatically applied after expiration. Your new plan is now active from {$planStartDate} to {$planExpireDate}.",
            'member',
            $advancePayment->branch_id,
            null
        );
        
        // Send push notification
        $userFcmToken = $user->device_fcm_token ?? null;
        if ($userFcmToken) {
            sendFCM(
                $userFcmToken,
                'Plan Renewed Automatically',
                "Your advance payment has been applied. New plan active from {$planStartDate} to {$planExpireDate}."
            );
        }
    }
    
    /**
     * Expire a frozen member
     */
    private function expireFrozenMember(User $user, \App\Models\MemberProfile $memberProfile, $latestFrozenStatus, $mustCompleteByDate): bool
    {
        try {
            $currentPlan = Plan::where('id', $memberProfile->current_plan_id)->first();
            $unUsedDays = $latestFrozenStatus->remaining_days ?? 0;
            
            // Create expired status
            UserStatusDetail::create([
                'user_id' => $user->id,
                'status' => 'expired',
                'plan_id' => $memberProfile->current_plan_id,
                'plan_start_date' => $memberProfile->current_plan_start_date,
                'plan_expire_date' => now()->toDateString(),
                'date' => now()->toDateString(),
                'time' => now()->toTimeString(),
                'updated_by_id' => null,
                'remaining_days' => 0,
                'plan_total_days' => $latestFrozenStatus->plan_total_days ?? 0,
                'must_complete_by_date' => $mustCompleteByDate
            ]);
            
            $user->update(['status' => 'expired']);
            $memberProfile->update([
                'current_plan_id' => null,
                'current_plan_start_date' => null,
                'current_plan_expire_date' => null,
                'current_plan_fee' => null,
                'must_complete_by_date' => null
            ]);
            
            // Generate system log
            $logMessage = "Member {$user->reference_num} expired by system. ";
            if ($unUsedDays > 0) {
                $logMessage .= "You did not used {$unUsedDays} days in Grace period of {$currentPlan->freeze_allowed_days} starting from your 1st Freeze Request. Deadline was {$mustCompleteByDate}";
            } else {
                $logMessage .= "Deadline to use remaining days ({$mustCompleteByDate}) has passed.";
            }
            
            GenerateSystemLogs(
                'Member Expired',
                $logMessage,
                $user->id,
                'User',
                $user->gym_id,
                $currentPlan->branch_id ?? null,
                null
            );
            
            // Generate notification
            $gym = Gym::find($user->gym_id);
            $recipients = User::where('gym_id',$user->gym_id)->whereDoesntHave('roles', function ($query) use($gym) {
                $query->whereIn('name', [$gym->reference_num.' Member']);
            })->get(['id', 'reference_num', 'name']);
            
            foreach ($recipients as $recipient) {
                generateNotification(
                    $recipient->id,
                    'Member Expired',
                    "Member {$user->reference_num} expired by system after freeze deadline.",
                    'member',
                    $currentPlan->branch_id ?? null,
                    null
                );
            }
            
            // Notification to member
            if ($unUsedDays > 0) {
                generateNotification(
                    $user->id,
                    'Your Plan Expired',
                    "Your plan has expired. You did not use {$unUsedDays} days within the grace period. The deadline was {$mustCompleteByDate}. Please visit the gym to renew or start a new membership",
                    'member',
                    $currentPlan->branch_id ?? null,
                    null
                );
            } else {
                generateNotification(
                    $user->id,
                    'Your Plan Expired',
                    "Your plan has expired. The deadline to use remaining days ({$mustCompleteByDate}) has passed. Please visit the gym to renew or start a new membership",
                    'member',
                    $currentPlan->branch_id ?? null,
                    null
                );
            }
            
            // Send push notification
            $userFcmToken = $user->device_fcm_token ?? null;
            if ($userFcmToken) {
                if ($unUsedDays > 0) {
                    sendFCM(
                        $userFcmToken,
                        'Your Plan Expired',
                        "You did not use {$unUsedDays} days within the grace period. The deadline was {$mustCompleteByDate}. Please visit the gym to renew or start a new membership"
                    );
                } else {
                    sendFCM(
                        $userFcmToken,
                        'Your Plan Expired',
                        "The deadline to use remaining days ({$mustCompleteByDate}) has passed. Please visit the gym to renew or start a new membership"
                    );
                }
            }
            
            return true;
        } catch (Exception $e) {
            $this->error("Error expiring frozen member ID {$user->id}: " . $e->getMessage());
            return false;
        }
    }
}