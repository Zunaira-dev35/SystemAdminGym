<?php

namespace App\Console\Commands;

use App\Models\FreezeRequest;
use App\Models\Gym;
use App\Models\User;
use App\Models\UserStatusDetail;
use Carbon\Carbon;
use Exception;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class ProcessFreezeRequests extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:process-freeze-requests';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Process freeze requests that needs to update the user status as frozen';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $todayDate = Carbon::now()->toDateString();
        Gym::where('status','active')->where('package_renewal_date','>',$todayDate)->orderBy('id','desc')->chunk(50,function($gyms){
            foreach($gyms as $gym){
                FreezeRequest::where('gym_id',$gym->id)->where('status','approved')->where('process_status',0)->where('start_date','>=',now()->toDateString())->chunk(100 , function($freezeRequests){
                    foreach($freezeRequests as $freezeRequest){
                        try{
                            DB::beginTransaction();
                            $user = User::with('memberProfile')->where('id',$freezeRequest->user_id)->first();
                            $memberProfile = $user->memberProfile;
                            // Get last active status before freezing
                            $lastActiveStatus = UserStatusDetail::where('user_id', $user->id)->where('plan_id',$memberProfile->current_plan_id)->where('plan_start_date',$memberProfile->current_plan_start_date) ->where('status', 'active') ->orderBy('id', 'desc') ->first();
                            $freezeStartDate = Carbon::parse($freezeRequest->start_date);
                            $remainingDays = 0;
                            if ($lastActiveStatus && $lastActiveStatus->date) {
                                $lastActiveDate = Carbon::parse($lastActiveStatus->date);
                                $diffDays = $lastActiveDate->diffInDays($freezeStartDate);
                                $remainingDays = $lastActiveStatus->remaining_days - $diffDays;
                                if($remainingDays <= 0){
                                    $remainingDays = 0;
                                }
                                $user->update(['status' => 'frozen']);
                                UserStatusDetail::create(['user_id' => $user->id , 'status' => 'frozen' , 'plan_id' => $memberProfile->current_plan_id , 'plan_start_date' => $memberProfile->current_plan_start_date , 'plan_expire_date' => null , 'date' => $freezeRequest->start_date , 'time' => now()->toTimeString() , 'updated_by_id' => Auth::id() , 'remaining_days' => $remainingDays , 'plan_total_days' => $lastActiveStatus->plan_total_days]);
                                $user->memberProfile->update(['current_plan_expire_date' => null]);
                                $freezeRequest->update(['process_status' => 1]);
                                $description = 'Member '.$user->name.' '.$user->reference_num.' account frozen successfully by system.';
                                //Generate system log
                                GenerateSystemLogs('Member Account Frozen' , $description , $user->id, 'User' , $user->gym_id , $freezeRequest->branch_id , null);
                                //Generate notification
                                $recipients = User::where('gym_id',$user->gym_id)->whereNotIn('user_type',['member'])
                                ->get(['id', 'reference_num', 'name']); 
                                foreach($recipients as $recipient){
                                    generateNotification($recipient->id, 'Member Account Frozen' , $description , 'member','Member',$user->id , $freezeRequest->branch_id , null);
                                }
                                generateNotification($user->id, 'Account Frozen' , 'Your account frozen successfully' , 'member' , 'Member' , $user->id , $freezeRequest->branch_id , null);
                                //send push notification
                                $userFcmToken = $user->device_fcm_token ?? null;
                                 if($userFcmToken){
                                    sendFCM($userFcmToken ,'Account Frozen' , 'Your account frozen successfully');
                                }
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
