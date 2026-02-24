<?php

namespace App\Http\Controllers;

use App\Models\Bank;
use App\Models\Branch;
use App\Models\FeeCollection;
use App\Models\Gym;
use App\Models\MemberProfile;
use App\Models\Plan;
use App\Models\PlanTransfer;
use App\Models\SystemSetting;
use App\Models\User;
use App\Models\UserStatusDetail;
use Carbon\Carbon;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class PlanTransferController extends Controller
{
    function planTransfers(Request $request){
        try{
            $gym = Gym::find($request->logged_gym_id);
            $search = trim($request->query('search'));
            $startDate = $request->query('start_date');
            $endDate = $request->query('end_date');
            $filterBranch = $request->query('filter_branch_id');
            $filterUserId = $request->query('filter_user_id');
            $mainBranchId = Branch::where('type','main')->where('gym_id',$request->logged_gym_id)->first()?->id ?? null;
            $filterDepositMethod = $request->query('filter_deposit_method');
            $disablePaginateParam = $request->disable_page_param;
            $loggedGymId = $request->logged_gym_id;
            $planTransferQuery = PlanTransfer::with('member','createdByUser','transferedPlan','previousPlan','branch','feeCollection.transaction.branch','feeCollection.transaction.bank')->where('gym_id',$loggedGymId)
            ->when($search , function($query) use ($search){
                $query->where(function ($q) use ($search) {
                    $q->where('reference_num' , 'like' , "%{$search}%")
                    ->orWhereHas('member',function($q) use ($search){
                        $q->where('name','like',"%{$search}%")
                        ->orWhere('reference_num','like',"%{$search}%")
                        ->orWhere('email','like',"%{$search}%")
                        ->orWhereHas('roles',function($rq) use ($search){
                            $rq->where('name','like',"%{$search}%");
                        });
                    })->orWhereHas('createdByUser' , function($cq) use ($search){
                        $cq->where('name','like',"%{$search}%")
                        ->orWhere('reference_num','like',"%{$search}%");
                    })->orWhereHas('transferedPlan' , function($pq) use ($search){
                        $pq->where('name','like',"%{$search}%");
                    })->orWhereHas('previousPlan' , function($pq) use ($search){
                        $pq->where('name','like',"%{$search}%");
                    });
                });
               
            })->when($filterDepositMethod , function($query) use ($filterDepositMethod){
                $query->where('deposit_method' , $filterDepositMethod);
            })->when($filterUserId , function($query) use ($filterUserId){
                $query->where('user_id' , $filterUserId);
            })
            ->when($startDate && $endDate , function($query) use ($startDate , $endDate){
                $query->whereBetween('generate_date',[$startDate , $endDate]);
            })->when($filterBranch , function($query) use ($filterBranch){
                $query->where('branch_id',$filterBranch);
            })
            ->when(!($request->logged_branch_id == $mainBranchId && $request->user()->type == 'default'),
            function($query) use ($request){
                $query->where('branch_id', $request->logged_branch_id);
            })->orderBy('id','desc');
            if($request->user()->hasRole($gym->reference_num.' Member')){
                $planTransferQuery->where('user_id',$request->user()->id);
            }
            if($disablePaginateParam && $disablePaginateParam == 1){
                $planTransfers = $planTransferQuery->get();
            }else{
                $planTransfers = $planTransferQuery->paginate($request->limit ?? 10);
            }
            return apiSuccess($planTransfers , 'Plan transfers fetched successfully' , 200);
        }catch(Exception $e){
            return apiError('Failed to fetch plan transfers' , 500 , $e->getMessage());
        }
    }

    function generatePlanTransferRef($branchId){
        $branch = Branch::find($branchId);
        $branchCode = $branch->reference_num;  
        $prefix = $branchCode.'-PT';   
        // Get last for this branch
        $last = PlanTransfer::where('reference_num', 'LIKE', $prefix . '%') ->orderByRaw('CAST(SUBSTRING(reference_num, ? + 1) AS UNSIGNED) DESC', [strlen($prefix)])->first();
        if ($last) {
            $lastRef = $last->reference_num;
            // keep only number part
            $numberPart = substr($lastRef, strlen($prefix));
            $nextNumber = (int)$numberPart + 1;
            // Keep the same length as previous number part
            $newNumberPart = $nextNumber;
        
        } else {
            $newNumberPart = '1';
        }
        // Build new reference number
        $newRefNum = $prefix . $newNumberPart;
        return $newRefNum;
    }

    function createPlanTransferReference(Request $request){
        $newRef = $this->generatePlanTransferRef($request->logged_branch_id);
        return apiSuccess($newRef , 'Plan transfer new ID fetched successfully' , 200);
    }

    function planTransferStore(Request $request){
        $loggedGymId = $request->logged_gym_id;
        $gym = Gym::find($request->logged_gym_id);
        $validator = Validator::make($request->all(),[
            'user_id' => ['required', function ($attribute, $value, $fail) use ($gym) {
            $user = User::where('gym_id',$gym->id)->where('id',$value)->first();
            $memberProfile = MemberProfile::where('user_id',$value)->first();
            if (!$user || !$memberProfile || !$user->hasRole($gym->reference_num.' Member') || ($user->status != 'active' && $user->status != 'frozen')) {
                return $fail('The selected user is not a valid member or is not active in any other plan');
            }
            }], 
            'new_plan_id' => ['required', function ($attribute, $value, $fail) use ($gym) {
            $plan = Plan::where('gym_id',$gym->id)->where('id',$value)->first();
            if (!$plan || $plan->status != 'active') {
                return $fail('The selected plan not found or is not active');
            }
            }], 
            'deposit_method'    =>  'required|in:cash,bank',
            'transfer_status'   =>  'required|in:view,process',
            'bank_id' => ['nullable' , 'required_if:deposit_method,bank' , 'integer', function ($attribute, $value, $fail) use ($gym) {
            $bank = Bank::where('gym_id',$gym->id)->where('id',$value)->first();
            if (!$bank) {
                return $fail('The selected bank not found.');
            }
            }], 
        ]);

        if($validator->fails()){
            return apiError('Validation failed' , 422 , $validator->errors()->first());
        }

        try{
            DB::beginTransaction();
            $user = User::with('memberProfile')->whereHas('memberProfile')->where('id',$request->user_id)->first();
            if(!$user->memberProfile->current_plan_start_date || !$user->memberProfile->current_plan_start_date >= now()->toDateString()){
                DB::rollBack();
                return apiError('Plan transfer failed' , 422 , 'The new plan start date cannot be earlier than the current plan start date.');
            }
            $data = [];
            $currentPlan = Plan::where('id',$user->memberProfile->current_plan_id)->first();
            $newPlan = Plan::where('id',$request->new_plan_id)->first();
            $currentPlanStartDate = $user->memberProfile->current_plan_start_date;
            $currentPlanFee = $user->memberProfile->current_plan_fee;
            $lastActiveStatus = UserStatusDetail::where('user_id', $user->id)->where('plan_id',$user->memberProfile->current_plan_id)->where('plan_start_date',$user->memberProfile->current_plan_start_date) ->where('status', 'active') ->orderBy('id', 'desc') ->first();
            // $feeCollectionRec = FeeCollection::where('user_id' , $user->id)->where('plan_id',$user->memberProfile->current_plan_id)->where('plan_start_date',$user->memberProfile->current_plan_start_date)->orderBy('id','desc')->first();
            if(!$currentPlan || !$currentPlanStartDate || !$lastActiveStatus){
                DB::rollBack();
                return apiError('Plan transfer failed' , 422 , 'Member current plan not found');
            }
            if($currentPlan->id == $newPlan->id){
                DB::rollBack();
                return apiError('Plan transfer failed' , 422 , 'Member cannot transfer to the currently assigned plan');
            }
            $currentPlanTotalDays = $lastActiveStatus->plan_total_days;
            $lastStatusDate = Carbon::parse($lastActiveStatus->date);
            $today = Carbon::parse(now()->toDateString());
            $elapsedDays = $lastStatusDate->diffInDays($today);
            // Adjust remaining days to today
            $currentRemainingDays = $user->memberProfile->remaining_days_balance;
            // Used days in current plan
            $currentPlanUsedDays = $lastActiveStatus->plan_total_days - $currentRemainingDays;
            $currentPlanReceivedFee = $currentPlanFee;
            // $previousTransfersFee = PlanTransfer::where('user_id',$request->user_id)->orderBy('id','desc')->sum('current_plan_received_fee');
            // dd($currentPlanReceivedFee , $previousTransfersFee);
            $totalReceivedFee = $currentPlanReceivedFee;

            if($currentPlanTotalDays >= $newPlan->duration_days || $currentPlanReceivedFee >= $newPlan->fee){
                DB::rollBack();
                return apiError('Plan transfer failed' , 422 , 'The selected plan must have a longer duration and a higher price than the current plan.');
            }
            $newPlanTotalDays = $newPlan->duration_days;
            $newPlanRemainingDays = $newPlanTotalDays - $currentPlanUsedDays ;
            $newPlanRemainingFee = 0;
            // dd($totalReceivedFee , $newPlan->fee);
            if($totalReceivedFee < $newPlan->fee){
                $newPlanRemainingFee = $newPlan->fee - $totalReceivedFee ;
            }
            if($newPlanRemainingDays <= 0){
                DB::rollBack();
                return apiError('Plan transfer failed' , 422 , 'Member already used all the days in current plan');
            }
            $data = [
                'user_id'                   =>  $request->user_id,
                'current_plan_id'           =>  $currentPlan->id,
                'current_plan_start_date'   =>  $currentPlanStartDate,
                'current_plan_total_days'   =>  $currentPlanTotalDays,
                'current_plan_used_days'    =>  $currentPlanUsedDays,
                'current_plan_received_fee' =>  $currentPlanReceivedFee,
                'total_fee_received'        =>  $totalReceivedFee,
                'new_plan_id'               =>  $request->new_plan_id , 
                'new_plan_start_date'       =>  now()->toDateString() , 
                'new_plan_total_days'       =>  $newPlan->duration_days,
                'new_plan_remaining_days'   =>  $newPlanRemainingDays,
                'new_plan_total_fee'        =>  $newPlan->fee,
                'new_plan_remaining_fee'    =>  $newPlanRemainingFee,
                'deposit_method'            =>  $request->deposit_method , 
                'created_by_id'             =>  Auth::id(),
                'generate_date'             =>  now()->toDateString(),
                'generate_time'             =>  now()->toTimeString(),
                'branch_id'                 =>  $request->logged_branch_id,  
                'bank_id'                   =>  $request->bank_id,
                'gym_id'                    =>  $loggedGymId
            ];
            if($request->transfer_status == 'process'){
                //Create plan transfer record
                $planTransfer = PlanTransfer::create($data);
                // $transferRefNum = 'PT'.str_pad($planTransfer->id , 4 , '0' , STR_PAD_LEFT);
                $transferRefNum = $this->generatePlanTransferRef($planTransfer->branch_id);
                $newPlanStartDate = Carbon::parse(now()->toDateString());
                $newPlanExpireDate = $newPlanStartDate->copy()->addDays($newPlanRemainingDays)->toDateString();
                $newPlanFee = $newPlan->fee;
                // dump($newPlanRemainingFee);
                //Create voucher
                if($newPlanRemainingFee > 0){
                    $newPlanVoucher = FeeCollection::create(['user_id' => $request->user_id , 'plan_id' => $request->new_plan_id , 'plan_start_date' => now()->toDateString() , 'deposit_method' => $request->deposit_method , 'plan_expire_date' => $newPlanExpireDate , 'created_by_id' => Auth::id() , 'generate_date' => now()->toDateString() , 'generate_time' => now()->toTimeString() , 'branch_id' => $request->logged_branch_id , 'amount' => $newPlanRemainingFee , 'gym_id' => $request->logged_gym_id]);
                    // $newPlanVoucherRefNum = 'RV'.str_pad($newPlanVoucher->id , 6 , '0' , STR_PAD_LEFT);
                    $branch = Branch::find($request->logged_branch_id);
                    $branchCode = $branch->reference_num;  
                    $prefix = $branchCode.'-V';
                    // Get last member for this branch
                    $last = FeeCollection::where('reference_num', 'LIKE', $prefix . '%') ->orderByRaw('CAST(SUBSTRING(reference_num, ? + 1) AS UNSIGNED) DESC', [strlen($prefix)]) ->first();
                    if ($last) {
                        $lastRef = $last->reference_num;
                        // keep only number part
                        $numberPart = substr($lastRef, strlen($prefix));
                        $nextNumber = (int)$numberPart + 1;
                        // Keep the same length as previous number part
                        $newNumberPart = $nextNumber;
                    
                    } else {
                        $newNumberPart = '1';
                    }
                    // Build new reference number
                    $newPlanVoucherRefNum = $prefix . $newNumberPart;
                    $newPlanVoucher->update(['reference_num' => $newPlanVoucherRefNum ]);
                    //Create payment transaction
                    $description = 'Remaining fee after plan transfer collected by '.$request->user()->name.' '.$request->user()->reference_num.' of member '.$user->name.' '.$user->reference_num.'.';
                    createPaymentTransaction($newPlanVoucher->amount , $newPlanVoucher->deposit_method , 'income' , $newPlanVoucher->id , 'feeCollectionType' , $description , $request->logged_gym_id , $request->logged_branch_id  , now()->toDateString() ,  $request->bank_id);
                    //Generate System Log
                    GenerateSystemLogs('Remaining Fee Collected' , $description , $newPlanVoucher->id, 'FeeCollection' , $user->gym_id , $newPlanVoucher->branch_id , $request->ip());
                    GenerateSystemLogs('Remaining Fee Submitted' , $description , $request->user_id, 'User' , $user->gym_id , $newPlanVoucher->branch_id , $request->ip());
                    //Generate notification
                    $recipients = User::where('gym_id',$request->logged_gym_id)->where('id','<>',Auth::id())->whereNotIn('user_type',['employee','member'])->get(['id', 'reference_num', 'name']); 
                    foreach($recipients as $recipient){
                        generateNotification($recipient->id, 'Plan Transfer Fee Collected' , $description , 'payment' , 'PlanTransfer' , $planTransfer->id , $newPlanVoucher->branch_id , null);
                    }
                    //save voucher ref in transfer record
                    $planTransfer->update(['reference_num' => $transferRefNum , 'fee_collection_id' => $newPlanVoucher->id]);
                }else{
                    $planTransfer->update(['reference_num' => $transferRefNum]);
                }
                //Update current plan data and user
                $user = User::where('id',$request->user_id)->first();
                $user->update(['status' => 'active']);
                $memberProfile = MemberProfile::where('user_id',$request->user_id)->first();
                $memberProfile->update(['current_plan_id' => $request->new_plan_id , 'current_plan_start_date' => now()->toDateString() , 'current_plan_expire_date' => $newPlanExpireDate , 'current_plan_fee' =>  $newPlanFee]);
                //Create history of status
                UserStatusDetail::create(['user_id' => $request->user_id , 'status' => 'active' , 'plan_id' => $request->new_plan_id , 'plan_start_date' => now()->toDateString() , 'plan_expire_date' => $newPlanExpireDate , 'date' => now()->toDateString() , 'time' => now()->toTimeString() , 'remaining_days' => $newPlanRemainingDays , 'plan_total_days' => $newPlanTotalDays ,  'updated_by_id' => Auth::id()]);
                generateNotification($user->id, 'Plan Transfer Fee Collected' , 'Your membership plan transfer fee has been collected. Thank you for staying with us' , 'payment' , 'PlanTransfer' , $planTransfer->id , $request->logged_branch_id , null);
                //send push notification
                $userFcmToken = $user->device_fcm_token ?? null;
                if($userFcmToken){
                    sendFCM($userFcmToken ,'Plan Transfer Fee Collected' , 'Your membership plan transfer fee has been collected. Thank you for staying with us');
                }
                if($newPlan->branch_id != $user->base_branch_id){
                    $user->update(['base_branch_id' => $newPlan->branch_id]);
                }
                DB::commit();
                return apiSuccess($planTransfer , 'Member plan transferred successfully' , 200);
            }else{
                    $systemSettings  = SystemSetting::with('currency')->first();
                    $systemSettingCurrency = $systemSettings?->currency?->symbol ?? 'Rs';   
                    $bankName = null;
                    $bankRefNum = null; 
                    if(isset($data['bank_id'])){
                        $bank = Bank::where('id',$data['bank_id'])->first();      
                        $bankName = $bank->name ; 
                        $bankRefNum = $bank->reference_num ;      
                    }
                    $data = array_merge([
                    'current_plan_name' => $currentPlan->name,
                    'current_plan_reference_num'    =>  $currentPlan->reference_num,
                    'new_plan_name' =>  $newPlan->name,
                    'new_plan_reference_num'    => $newPlan->reference_num,
                    'current_plan_freeze_allowed_days' =>  $currentPlan->freeze_allowed_days,
                    'current_plan_freeze_allowed_count' =>  $currentPlan->freeze_allowed_count,
                    'new_plan_freeze_allowed_days' =>  $newPlan->freeze_allowed_days,
                    'new_plan_freeze_allowed_count' =>  $newPlan->freeze_allowed_count,
                    'system_currency'   =>  $systemSettingCurrency,
                    'bank_name' =>  $bankName,
                    'bank_reference_num'    =>  $bankRefNum
                ] , $data);
                return apiSuccess($data , 'Plan transfer data fetched successfully' , 200);
            }
        }catch(Exception $e){
            return apiError('Plan transfer failed' , 500 , $e->getMessage());
        }
    }

    function availablePlans(Request $request){
        $loggedGymId = $request->logged_gym_id;
        $validator = Validator::make($request->all() , [
            'current_plan_id' => ['required', function ($attribute, $value, $fail) use ($loggedGymId) {
            $plan = Plan::where('gym_id',$loggedGymId)->where('id',$value)->first();
            if (!$plan) {
                return $fail('The selected plan not found.');
            }
            }], 
        ]);

        if($validator->fails()){
            return apiError('Validation failed' , 422 , $validator->errors()->first());
        }

        try{
            $plan = Plan::where('id',$request->current_plan_id)->first();
            $mainBranchId = Branch::where('type','main')->where('gym_id',$request->logged_gym_id)->first()?->id ?? null;
            $availablePlans = Plan::where('gym_id',$loggedGymId)->where('id','<>',$request->current_plan_id)->where('status','active')->where('fee','>',$plan->fee)->where('duration_days','>',$plan->duration_days)->where('branch_id',$request->logged_branch_id)->orderBy('id','desc')->get();
            return apiSuccess($availablePlans , 'Available transfer plans fetched successfully' , 200);
        }catch(Exception $e){
            return apiError('Failed to fetch available plans' , 500 , $e->getMessage());
        }
    }
}
