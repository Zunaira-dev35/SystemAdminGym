<?php

namespace App\Console\Commands;

use App\Models\FreezeRequest;
use App\Models\Gym;
use App\Models\User;
use App\Models\UserStatusDetail;
use Carbon\Carbon;
use Exception;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class AutoApproveFreezeRequests extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:auto-approve-freeze-requests';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Auto approve freeze requests';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $todayDate = Carbon::now()->toDateString();
        Gym::where('status','active')->where('package_renewal_date','>',$todayDate)->orderBy('id','desc')->chunk(50,function($gyms){
            foreach($gyms as $gym){
                FreezeRequest::with('member.memberProfile')->where('gym_id',$gym->id)->whereHas('member.memberProfile')->where('status','pending')->chunk(100 , function($freezeRequests){
                    foreach($freezeRequests as $freezeRequest){
                        try{
                            DB::beginTransaction();
                            $freezeRequestDate = $freezeRequest->start_date;
                            $todayDate = now()->toDateString();
                            if($todayDate > $freezeRequestDate){
                                $freezeRequest->update(['status' => 'approved' , 'approve_date' => now()->toDateString() , 'approve_time' =>  now()->toTimeString() ]);
                            }
                            DB::commit();
                        }catch(Exception $e){
                            DB::rollBack();
                        }
                    }
                });
            }
        });
        
    }
}
