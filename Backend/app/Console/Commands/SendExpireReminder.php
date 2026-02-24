<?php

namespace App\Console\Commands;

use App\Models\Gym;
use App\Models\User;
use App\Models\UserStatusDetail;
use Carbon\Carbon;
use Exception;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class SendExpireReminder extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:send-expire-reminder';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Sender expire reminder to members';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $todayDate = Carbon::now()->toDateString();
        Gym::where('status','active')->where('package_renewal_date','>',$todayDate)->orderBy('id','desc')->chunk(50,function($gyms){
            foreach($gyms as $gym){
                User::with('memberProfile.plan')->where('status','active')->whereHas('memberProfile' , function ($query) {
                    $query->whereNotNull('current_plan_expire_date');
                    })->whereHas('roles',function($query) use ($gym){
                        $query->where('name',$gym->reference_num.' Member');
                    })->orderBy('id','desc')->chunk(100 , function($users){
                        foreach($users as $user){
                            try{
                                DB::beginTransaction();
                                $memberProfile = $user->memberProfile;
                                $lastActiveStatus = UserStatusDetail::where('user_id', $user->id)->where('plan_id',$user->memberProfile->current_plan_id)->where('plan_start_date',$user->memberProfile->current_plan_start_date) ->where('status', 'active') ->orderBy('id', 'desc') ->first();
                                if($lastActiveStatus){
                                    $planDays = $lastActiveStatus->plan_total_days;
                                    $userExpireDate = Carbon::parse($memberProfile->current_plan_expire_date);
                                    $today = now()->startOfDay();
                                    $daysLeft = $today->diffInDays($userExpireDate, false);

                                    //send reminder on alternate days according plan duration days
                                    if ($planDays <= 1) {
                                        $reminderDays = []; // no reminders
                                    }elseif ($planDays == 2) {
                                        $reminderDays = [1]; // expiring
                                    } elseif ($planDays <= 6) {
                                        $reminderDays = [1];
                                    } elseif ($planDays <= 9) {
                                        $reminderDays = [3, 1];
                                    } else {
                                        $reminderDays = [7, 3, 1];
                                    }
                                    //Send notification according to case
                                    if (in_array($daysLeft, $reminderDays)) {
                                        switch ($daysLeft) {
                                            case 7:
                                                $title = 'Membership Expiring Soon';
                                                $message = 'Your membership will expire in 7 days. Renew to continue enjoying uninterrupted access.';
                                                break;
                                            
                                            case 3:
                                                $title = 'Membership Expiry Reminder';
                                                $message = 'Only 3 days left on your membership. Renew now to avoid interruption.';
                                                break;
                                            
                                            case 1:
                                                $title = 'Membership Expiring Tomorrow';
                                                $message = 'Your membership expires tomorrow. Renew today to keep your access active.';
                                                break;
                                            
                                            default:
                                                $title = 'Membership Expired';
                                                $message = 'Your membership has expired. Renew to regain access.';
                                        }
                                            
                                        $userFcmToken = $user->device_fcm_token ?? null;
                                        if ($userFcmToken) {
                                            sendFCM($userFcmToken, $title, $message, ['type' => 'payment_history']);
                                        }
                                    }
                                    generateNotification($user->id, $title , $message , 'member' , 'Member' , $user->id , $user->base_branch_id , null);

                                    DB::commit();
                                }
                            }catch(Exception $e){
                                DB::rollBack();
                            }
                                            
                        }
                });
            }
        });    
        
    }
}
