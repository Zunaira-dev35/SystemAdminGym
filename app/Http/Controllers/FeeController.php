<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use App\Models\FeeCollection;
use App\Models\MemberProfile;
use App\Models\Plan;
use App\Models\SystemSetting;
use App\Models\User;
use App\Models\UserStatusDetail;
use App\Models\PaymentRefund;
use App\Models\AdvancePayment;
use App\Models\Bank;
use App\Models\FreezeRequest;
use App\Models\Gym;
use App\Models\Transaction;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Bunny\Storage\Client;
use Bunny\Storage\Region;

class FeeController extends Controller
{
    function feeCollections(Request $request){
        try{
            $search = trim($request->query('search'));
            $startDate = $request->query('start_date');
            $endDate = $request->query('end_date');
            $filterBranch = $request->query('filter_branch_id');
            $mainBranchId = Branch::where('gym_id',$request->logged_gym_id)->where('type','main')->first()?->id ?? null;
            $filterDepositMethod = $request->query('filter_deposit_method');
            $filterUserId = $request->query('filter_user_id');
            $filterIsRefund = $request->query('filter_is_refund');
            $disablePaginateParam = $request->disable_page_param;
            $gym = Gym::find($request->logged_gym_id);
            $feeCollectionQuery = FeeCollection::with('member','createdByUser','plan','branch','transaction.branch','transaction.bank', 'advancePayment')->where('gym_id',$request->logged_gym_id)
            ->when($search , function($query) use ($search){
                $query->where(function ($q) use ($search) {
                    $q->whereHas('member',function($q) use ($search){
                        $q->where('name','like',"%{$search}%")
                        ->orWhere('reference_num','like',"%{$search}%")
                        ->orWhere('email','like',"%{$search}%")
                        ->orWhereHas('roles',function($rq) use ($search){
                            $rq->where('name','like',"%{$search}%");
                        });
                    })->orWhereHas('createdByUser' , function($cq) use ($search){
                        $cq->where('name','like',"%{$search}%")
                        ->orWhere('reference_num','like',"%{$search}%");
                    })->orWhereHas('plan' , function($pq) use ($search){
                        $pq->where('name','like',"%{$search}%");
                    });
                });
               
            })->when($filterDepositMethod , function($query) use ($filterDepositMethod){
                $query->where('deposit_method' , $filterDepositMethod);
            })
            ->when($startDate && $endDate , function($query) use ($startDate , $endDate){
                $query->whereBetween('generate_date',[$startDate , $endDate]);
            })
            ->when($filterUserId , function($query) use ($filterUserId){
                $query->where('user_id' , $filterUserId);
            })->when($filterIsRefund !== null, function ($query) use ($filterIsRefund) {
                    $query->where('is_refund', $filterIsRefund);
            })
            ->when($filterBranch , function($query) use ($filterBranch){
                $query->where('branch_id',$filterBranch);
            })
            ->when(!($request->logged_branch_id == $mainBranchId && $request->user()->type == 'default'),
            function($query) use ($request){
                $query->where('branch_id', $request->logged_branch_id);
            })->orderBy('id','desc');

            if($request->user()->hasRole($gym->reference_num.' Member')){
                $feeCollectionQuery->where('user_id',$request->user()->id);
            }

            // if($request->user()->hasRole('Employee')){
            //     $feeCollectionQuery->where('created_by_id' , $request->user()->id);
            // }

            if($disablePaginateParam && $disablePaginateParam == 1){
                $feeCollections = $feeCollectionQuery->get();
            }else{
                $feeCollections = $feeCollectionQuery->paginate($request->limit ?? 10);
            }
            $systemSettings = SystemSetting::where('gym_id',$request->logged_gym_id)->first();
            $systemSettingCurrency = $systemSettings?->currency?->symbol ?? 'Rs';
            $collectionStartDate = $request->query('collection_start_date');
            $collectionEndDate = $request->query('collection_end_date');
             $branchFilter = function($query) use ($request, $filterBranch, $mainBranchId) {
            if ($filterBranch) {
                $query->where('branch_id', $filterBranch);
            }
        
            if (!($request->logged_branch_id == $mainBranchId && $request->user()->type == 'default')) {
                $query->where('branch_id', $request->logged_branch_id);
            }
        };
            $totalIncomeQuery = Transaction::where('gym_id',$request->logged_gym_id)->when(
                $collectionStartDate && $collectionEndDate,
                fn ($q) => $q->whereBetween('date', [$collectionStartDate, $collectionEndDate])
            )->where('transaction_type','income')->when($filterBranch , function($query) use ($filterBranch){
                $query->where('branch_id',$filterBranch);
            })
            ->when(!($request->logged_branch_id == $mainBranchId && $request->user()->type == 'default'),
            function($query) use ($request){
                $query->where('branch_id', $request->logged_branch_id);
            });
            $totalExpenseQuery = Transaction::where('gym_id',$request->logged_gym_id)->when(
                $collectionStartDate && $collectionEndDate,
                fn ($q) => $q->whereBetween('date', [$collectionStartDate, $collectionEndDate])
            )->where('transaction_type','expense')->when($filterBranch , function($query) use ($filterBranch){
                $query->where('branch_id',$filterBranch);
            })
            ->when(!($request->logged_branch_id == $mainBranchId && $request->user()->type == 'default'),
            function($query) use ($request){
                $query->where('branch_id', $request->logged_branch_id);
            });
            $totalCollections = (clone $totalIncomeQuery)->sum('credit_amount') -  (clone $totalExpenseQuery)->sum('debit_amount');
            $totalCashCollections = (clone $totalIncomeQuery)->where('payment_method','cash')->sum('credit_amount') - (clone $totalExpenseQuery)->where('payment_method','cash')->sum('debit_amount');
            $totalBankCollections = (clone $totalIncomeQuery)->where('payment_method','bank')->sum('credit_amount') - (clone $totalExpenseQuery)->where('payment_method','bank')->sum('debit_amount');

            $baseQuery = FeeCollection::query()
            ->when(
                !($request->logged_branch_id == $mainBranchId && $request->user()->type === 'default'),
                fn ($q) => $q->where('branch_id', $request->logged_branch_id)
            )
            ->when(
                $collectionStartDate && $collectionEndDate,
                fn ($q) => $q->whereBetween('generate_date', [$collectionStartDate, $collectionEndDate])
            );
            // $totalCollections = (clone $baseQuery)->sum('amount');
            // $totalCashCollections = (clone $baseQuery) ->where('deposit_method', 'cash') ->sum('amount');
            // $totalBankCollections = (clone $baseQuery) ->where('deposit_method', 'bank') ->sum('amount');
            $data = [
                'fee_collections' => $feeCollections,
                'total_collections' =>  $totalCollections,
                'total_cash_collections' =>  $totalCashCollections,
                'total_bank_collections' => $totalBankCollections,
                'system_currency' => $systemSettingCurrency
            ];
            return apiSuccess($data , 'Fee collections fetched successfully' , 200);
        }catch(Exception $e){
            return apiError('Failed to fetch fee collections' , 500 , $e->getMessage());
        }
    }

    function createFeeCollectionReference(Request $request){
        $branch = Branch::find($request->logged_branch_id);
        $branchCode = $branch->reference_num;  
        $prefix = $branchCode.'-V';
        // $prefix = 'V' . $branchCode;          
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
        $newRefNum = $prefix . $newNumberPart;
        return apiSuccess($newRefNum , 'New fee collection voucher ID fetched successfully', 200);
    }

    function feeCollectionStore(Request $request){
        $loggedGymId = $request->logged_gym_id;
        $gym = Gym::find($loggedGymId);
        $validator = Validator::make($request->all() , [
            'user_id' => ['required', 'integer', function ($attribute, $value, $fail) use ($loggedGymId , $gym) {
            $user = User::where('gym_id',$loggedGymId)->where('id',$value)->first();
            $memberProfile = MemberProfile::where('user_id',$value)->first();
            if (!$user || !$memberProfile || !$user->hasRole($gym->reference_num.' Member') || $user->status == 'frozen' || $user->status == 'active') {
                return $fail('The selected user is not a valid member or fee has already paid for the current plan period');
            }
            }], 
            'plan_id' => ['required', 'integer', function ($attribute, $value, $fail) use ($loggedGymId) {
            $plan = Plan::where('gym_id',$loggedGymId)->where('id',$value)->first();
            if (!$plan || $plan->status != 'active') {
                return $fail('The selected plan not found or is not active');
            }
            }], 
            'plan_start_date'   =>  'required|date',
            'deposit_method'    =>  'required|in:cash,bank',
            'bank_id' => ['nullable', 'integer' , 'required_if:deposit_method,bank', function ($attribute, $value, $fail) use ($loggedGymId) {
            $bank = Bank::where('gym_id',$loggedGymId)->where('id',$value)->first();
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
            $planStartDate = $request->plan_start_date ? Carbon::parse($request->plan_start_date) : Carbon::now();
            $today = Carbon::today();
            $user = User::where('id',$request->user_id)->first();
            $memberProfile = MemberProfile::where('user_id',$request->user_id)->first();
            if($user->status == 'inactive' && $memberProfile->current_plan_start_date && Carbon::parse($memberProfile->current_plan_start_date)->greaterThanOrEqualTo($today)){
                return apiError('Member already has an upcoming plan to activate.' , 422 , 'Member already has an upcoming plan to activate');
            }
            // if(Carbon::parse($memberProfile->register_date) > $planStartDate){
            //     return apiError('Plan start date must be after/equal the member registration date' , 422 , 'Plan start date must be after/equal the member registration date');
            // }
            $data = [];
            $data = array_reduce(['user_id' , 'plan_id' , 'deposit_method'] , function ($carry, $input) use ($request) {
                $carry[$input]  = $request->input($input);
                return $carry;
            });
            $plan = Plan::where('id',$request->plan_id)->first();
            $planDurationDays = $plan->duration_days;
            $planExpireDate = $planStartDate->copy()->addDays($planDurationDays);
            $data['plan_start_date'] = $planStartDate->toDateString();
            $data['plan_expire_date'] = $planExpireDate->toDateString();
            $data['created_by_id'] = Auth::id();
            $data['generate_date'] = now()->toDateString();
            $data['generate_time'] = now()->toTimeString();
            $data['branch_id'] = $request->logged_branch_id;
            $data['amount'] = $plan->fee;
            $data['bank_id'] = $request->bank_id;
            $data['gym_id'] = $request->logged_gym_id;
            //Create voucher
            $voucher = FeeCollection::create($data);
            // $voucherRefNum = 'V'.str_pad($voucher->id , 6 , '0' , STR_PAD_LEFT);
            //Generate reference num
            $branch = Branch::find($request->logged_branch_id);
            $branchCode = $branch->reference_num;
            $prefix = $branchCode.'-V';  
            // $prefix = 'V' . $branchCode;          
            // Get last member for this branch
            $last = FeeCollection::where('reference_num', 'LIKE', $prefix . '%')  ->orderByRaw('CAST(SUBSTRING(reference_num, ? + 1) AS UNSIGNED) DESC', [strlen($prefix)])  ->first();
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
            $voucher->update(['reference_num' => $newRefNum ]);
            //Create payment transaction
            $description = 'Fee collected by '.$request->user()->name.' '.$request->user()->reference_num.' of member '.$user->name.' '.$user->reference_num.'.';
            createPaymentTransaction($voucher->amount , $voucher->deposit_method , 'income' , $voucher->id , 'feeCollectionType' , $description , $user->gym_id , $request->logged_branch_id  , $voucher->generate_date ,  $voucher->bank_id);
            //Update current plan data and user
            $systemSettings = SystemSetting::where('gym_id',$request->logged_gym_id)->first();
            $allowHigherBranch = $systemSettings?->allow_higher_branch_access ?? false;
            $higherBranchVisitDays = $allowHigherBranch ? ($systemSettings->higher_branch_allowed_days ?? 0) : 0;
            $memberProfile->update(['current_plan_id' => $request->plan_id , 'current_plan_start_date' => $planStartDate->toDateString() ,
            'current_plan_expire_date' => $planExpireDate->toDateString() ,  'used_visit_days'=> 0 , 'current_plan_fee' => $plan->fee ]);
            //Create history of status
            if($planStartDate->lessThanOrEqualTo($today)){
                $user->update(['status' => 'active']);
                UserStatusDetail::create(['user_id' => $request->user_id , 'status' => 'active' , 'plan_id' => $request->plan_id , 'plan_start_date' => $planStartDate->toDateString() , 'plan_expire_date' => $planExpireDate->toDateString() , 'date' => $planStartDate->toDateString() , 'time' => now()->toTimeString() , 'remaining_days' => $plan->duration_days , 'plan_total_days' => $plan->duration_days ,  'updated_by_id' => Auth::id()]);
            }else{
                 $user->update(['status' => 'inactive']);
            }
            // $remainingDays = $memberProfile->remaining_days_balance;
            // $activeStatus->update(['remaining_days' => $remainingDays]);
            //Generate System Log
            GenerateSystemLogs('Fee Collected' , $description , $voucher->id, 'FeeCollection' , $user->gym_id , $voucher->branch_id ,  $request->ip());
            GenerateSystemLogs('Fee Submitted' , $description , $user->id, 'User' , $user->gym_id , $voucher->branch_id ,  $request->ip());
            //Generate notification
            $recipients = User::where('gym_id',$request->logged_gym_id)->where('id','<>',Auth::id())->whereNotIn('user_type',['employee','member'])->get(['id', 'reference_num', 'name']); 
            foreach($recipients as $recipient){
                generateNotification($recipient->id, 'Fee Collected' , $description , 'payment' , 'FeeCollection' , $voucher->id , $voucher->branch_id , null);
            }
            generateNotification($user->id, 'Fee Collected' , 'Your membership fee has been collected. Thank you for staying with us' , 'payment' , 'FeeCollection' , $voucher->id , $voucher->branch_id , null);
            //send push notification
            $userFcmToken = $user->device_fcm_token ?? null;
             if($userFcmToken){
                sendFCM($userFcmToken ,'Fee Collected' , 'Your membership fee has been collected. Thank you for staying with us');
            }
            DB::commit();
            return apiSuccess($voucher , 'Fee submitted successfully' , 200);
        }catch(Exception $e){
            DB::rollBack();
            return apiError('Failed to store fee receipt' , 500 , $e->getMessage());
        }
    }
    function feeCollectionRefund(Request $request){
        $loggedGymId = $request->logged_gym_id;
        $validator = Validator::make($request->all(), [
            'fee_collection_id' => ['required', 'integer', function ($attribute, $value, $fail)  use ($loggedGymId){
                $feeCollection = FeeCollection::where('gym_id',$loggedGymId)->where('id',$value)->first();
                if (!$feeCollection) {
                    return $fail('The selected fee collection not found');
                }
                
                // Check if already refunded
                if ($feeCollection->hasRefund()) {
                    return $fail('This fee collection has already been refunded');
                }
                
                // Check if member is currently active
                $memberProfile = MemberProfile::where('user_id', $feeCollection->user_id)->first();
                if (!$memberProfile || !$memberProfile->current_plan_id) {
                    return $fail('Member does not have an active plan to refund');
                }
            }],
            'refund_amount' => ['required', 'numeric', 'min:0'],
            'refund_method' => 'required|in:cash,bank',
            'bank_id' =>    'nullable|required_if:refund_method,bank|exists:banks,id',
            'notes' => 'nullable|string|max:500',
        ]);

        if ($validator->fails()) {
            return apiError('Validation failed', 422, $validator->errors()->first());
        }

        try {
            DB::beginTransaction();
            
            $feeCollection = FeeCollection::with('member', 'plan')->find($request->fee_collection_id);
            $user = User::find($feeCollection->user_id);
            $memberProfile = MemberProfile::where('user_id', $feeCollection->user_id)->first();
            
            // Validate refund amount
            if ($request->refund_amount > $feeCollection->amount) {
                return apiError('Refund amount cannot exceed original amount', 422);
            }
            
            // Generate refund reference number
            $branch = Branch::find($request->logged_branch_id);
            $branchCode = $branch->reference_num;
            $prefix = $branchCode.'-RF'; 
            // $prefix = 'RF' . $branchCode;
            
            $last = PaymentRefund::where('reference_num', 'LIKE', $prefix . '%')
               ->orderByRaw('CAST(SUBSTRING(reference_num, ? + 1) AS UNSIGNED) DESC', [strlen($prefix)])
                ->first();
            
            if ($last) {
                $lastRef = $last->reference_num;
                $numberPart = substr($lastRef, strlen($prefix));
                $nextNumber = (int)$numberPart + 1;
                $newNumberPart = $nextNumber;
            } else {
                $newNumberPart = '1';
            }
            
            $refundRefNum = $prefix . $newNumberPart;
            
            // Create refund record
            $refundData = [
                'reference_num' => $refundRefNum,
                'fee_collection_id' => $feeCollection->id,
                'user_id' => $feeCollection->user_id,
                'plan_id' => $feeCollection->plan_id,
                'refund_amount' => $request->refund_amount,
                'original_amount' => $feeCollection->amount,
                'refund_method' => $request->refund_method,
                'notes' => $request->notes,
                'refund_date' => now()->toDateString(),
                'refund_time' => now()->toTimeString(),
                'created_by_id' => Auth::id(),
                'branch_id' => $request->logged_branch_id,
                'bank_id'   =>  $request->bank_id,
                'gym_id'    =>  $loggedGymId
            ];
            
            $paymentRefund = PaymentRefund::create($refundData);
             $systemSettings = SystemSetting::with('currency')->where('gym_id',$loggedGymId)->first();
        $systemSettingCurrency = $systemSettings?->currency?->symbol ?? 'Rs'; 
            // Update member profile
            if($memberProfile->current_plan_id == $feeCollection->plan_id && $memberProfile->current_plan_start_date == $feeCollection->plan_start_date){
                $memberProfile->update([
                    'current_plan_id' => null,
                    'current_plan_start_date' => null,
                    'current_plan_expire_date' => null,
                    'current_plan_fee'  =>  null,
                    'used_visit_days' => 0,
                ]);
                // Update user status
                $user->update(['status' => 'inactive']);
                // Create user status detail entry
                UserStatusDetail::create([
                    'user_id' => $user->id,
                    'status' => 'inactive',
                    'plan_id' => $feeCollection->plan_id,
                    'plan_start_date' => $feeCollection->plan_start_date,
                    'plan_expire_date' => $feeCollection->plan_expire_date,
                    'date' => now()->toDateString(),
                    'time' => now()->toTimeString(),
                    'remaining_days' => 0,
                    'plan_total_days' => $feeCollection->plan->duration_days ?? 0,
                    'updated_by_id' => Auth::id(),
                ]);
                $userNotificationMsg = "Your payment of {$systemSettingCurrency} {$request->refund_amount} has been refunded and your membership has been cancelled.";
                GenerateSystemLogs('Membership Cancelled', "Membership cancelled due to refund for user {$user->name}", $user->id, 'User' , $user->gym_id , $request->logged_branch_id, $request->ip());
            } else{
                $userNotificationMsg = "Your payment of {$systemSettingCurrency} {$request->refund_amount} has been refunded";
            }
            
            
            
            // Create transaction for refund
            $description = "Payment refund of {$request->refund_amount} for fee collection {$feeCollection->reference_num}. ";
            $description .= "Refund method: {$request->refund_method}. ";
            $description .= $request->notes ? "Notes: {$request->notes}" : "";
            $transRefNum = generatePaymentVoucherReferenceNum($request->logged_branch_id);
            // Create expense transaction for refund
            $transactionData = [
                'payment_method' => $request->refund_method,
                'debit_amount' => $request->refund_amount,
                'credit_amount' => 0,
                'date' => $paymentRefund->refund_date,
                'time' => now()->toTimeString(),
                'description' => $description,
                'transaction_type' => 'expense',
                'reference_num' => $transRefNum,
                'created_by' => Auth::id(),
                'source' => 'refund_expense',
                'branch_id' => $request->logged_branch_id,
                'payment_refund_id' => $paymentRefund->id,
                'bank_id'   =>  $request->bank_id,
                'gym_id'    =>  $request->logged_gym_id
            ];

            Transaction::create($transactionData);
            
            // Generate system logs
            $logDescription = "Payment refund of {$systemSettingCurrency} {$request->refund_amount} processed for fee collection {$feeCollection->reference_num}";
            GenerateSystemLogs('Payment Refund', $logDescription, $paymentRefund->id, 'PaymentRefund' , $user->gym_id , $request->logged_branch_id, $request->ip());
            // Generate notifications
            $recipients = User::where('gym_id',$request->logged_gym_id)->where('id', '<>', Auth::id())
                ->whereNotIn('user_type', ['employee', 'member'])
                ->get(['id', 'reference_num', 'name']);
            
            foreach ($recipients as $recipient) {
                generateNotification( $recipient->id, 'Payment Refund', "Payment refund of {$systemSettingCurrency} {$request->refund_amount} processed for {$user->name}", 'refund', 'PaymentRefund' , $paymentRefund->id , $request->logged_branch_id, null );
            }
            
            generateNotification( $user->id, 'Payment Refund', $userNotificationMsg, 'refund', 'PaymentRefund' , $paymentRefund->id , $request->logged_branch_id, null );
            $feeCollection->update(['is_refund' => 1]);
            //send push notification
            $userFcmToken = $user->device_fcm_token ?? null;
             if($userFcmToken){
                sendFCM($userFcmToken ,'Payment Refund' , $userNotificationMsg);
            }
            DB::commit();
            
            return apiSuccess([
                'refund' => $paymentRefund,
                'user' => $user,
                'member_profile' => $memberProfile
            ], 'Payment refund processed successfully', 200);
            
        } catch (Exception $e) {
            DB::rollBack();
            return apiError('Failed to process refund', 500, $e->getMessage());
        }
    }
    function refundList(Request $request){
    try{
        $search = trim($request->query('search'));
        $startDate = $request->query('start_date');
        $endDate = $request->query('end_date');
        $filterBranch = $request->query('branch_id');
        $filterUserId = $request->query('filter_user_id');
        $filterRefundMethod = $request->query('filter_refund_method');
        $disablePaginateParam = $request->disable_page_param;
        
        // Get main branch ID
        $mainBranchId = Branch::where('gym_id',$request->logged_gym_id)->where('type','main')->first()?->id ?? null;
        
        $refundQuery = PaymentRefund::with([
            'transaction.bank',
            'user' => function($query) {
                $query->select('id', 'name', 'reference_num', 'phone', 'status');
            },
            'feeCollection' => function($query) {
                $query->select('id', 'reference_num', 'amount', 'deposit_method', 'generate_date', 'generate_time');
            },
            'plan' => function($query) {
                $query->select('id', 'name', 'fee','reference_num');
            },
            'branch' => function($query) {
                $query->select('id', 'name', 'reference_num');
            },
            'createdBy' => function($query) {
                $query->select('id', 'name', 'reference_num');
            }
        ])->where('gym_id',$request->logged_gym_id)
        ->when($search, function($query) use ($search){
            $query->where(function($q) use ($search){
                $q->where('reference_num', 'like', "%{$search}%")
                  ->orWhere('notes', 'like', "%{$search}%")
                  ->orWhereHas('user', function($uq) use ($search){
                      $uq->where('name', 'like', "%{$search}%")
                         ->orWhere('reference_num', 'like', "%{$search}%")
                         ->orWhere('phone', 'like', "%{$search}%");
                  })
                  ->orWhereHas('feeCollection', function($fq) use ($search){
                      $fq->where('reference_num', 'like', "%{$search}%");
                  })
                  ->orWhereHas('transaction', function($tq) use ($search){
                      $tq->where('reference_num', 'like', "%{$search}%")
                         ->orWhere('description', 'like', "%{$search}%");
                  });
            });
        })
        ->when($startDate && $endDate, function($query) use ($startDate, $endDate){
            $query->whereBetween('refund_date', [$startDate, $endDate]);
        })
        ->when($filterUserId, function($query) use ($filterUserId){
            $query->where('user_id', $filterUserId);
        })
        ->when($filterBranch, function($query) use ($filterBranch){
            $query->where('branch_id', $filterBranch);
        })
        ->when($filterRefundMethod, function($query) use ($filterRefundMethod){
            $query->where('refund_method', $filterRefundMethod);
        })
        ->when(!($request->logged_branch_id == $mainBranchId && $request->user()->type == 'default'),
        function($query) use ($request){
            $query->where('branch_id', $request->logged_branch_id);
        })
        ->orderBy('id', 'desc');

        if($disablePaginateParam && $disablePaginateParam == 1){
            $refunds = $refundQuery->get();
        } else {
            $refunds = $refundQuery->paginate($request->limit ?? 10);
        }
        $systemSettings = SystemSetting::where('gym_id',$request->logged_gym_id)->with('currency')->first();
        $systemSettingCurrency = $systemSettings?->currency?->symbol ?? 'Rs';
        // Transform data to minimal format
        $refunds->getCollection()->transform(function ($refund) use($systemSettingCurrency) {
            return [
                'id' => $refund->id,
                'reference_num' => $refund->reference_num,
                'refund_amount' => $refund->refund_amount,
                'original_amount' => $refund->original_amount,
                'refund_method' => $refund->refund_method,
                'notes' => $refund->notes,
                'refund_date' => $refund->refund_date,
                'refund_time' => $refund->refund_time,
                'created_at' => $refund->created_at,
                'updated_at' => $refund->updated_at,
                'system_setting_currency' => $systemSettingCurrency,
                
                // Minimal user info
                'user' => $refund->user ? [
                    'id' => $refund->user->id,
                    'name' => $refund->user->name,
                    'reference_num' => $refund->user->reference_num,
                    'phone' => $refund->user->phone,
                    'status' => $refund->user->status,
                ] : null,
                
                // Minimal fee collection info
                'fee_collection' => $refund->feeCollection ? [
                    'id' => $refund->feeCollection->id,
                    'reference_num' => $refund->feeCollection->reference_num,
                    'amount' => $refund->feeCollection->amount,
                    'deposit_method' => $refund->feeCollection->deposit_method,
                ] : null,
                
                // Minimal plan info
                'plan' => $refund->plan ? [
                    'id' => $refund->plan->id,
                    'name' => $refund->plan->name,
                    'fee' => $refund->plan->fee,
                    'reference_num' =>  $refund->plan->reference_num
                ] : null,
                
                // Minimal branch info
                'branch' => $refund->branch ? [
                    'id' => $refund->branch->id,
                    'name' => $refund->branch->name,
                    'reference_num' => $refund->branch->reference_num,
                ] : null,
                
                // Minimal created by info
                'created_by' => $refund->createdBy ? [
                    'id' => $refund->createdBy->id,
                    'name' => $refund->createdBy->name,
                    'reference_num' => $refund->createdBy->reference_num,
                ] : null,
                
                // Full transaction object
                'transaction' => $refund->transaction ? [
                    'id' => $refund->transaction->id,
                    'reference_num' => $refund->transaction->reference_num,
                    'transaction_type' => $refund->transaction->transaction_type,
                    'payment_method' => $refund->transaction->payment_method,
                    'debit_amount' => $refund->transaction->debit_amount,
                    'credit_amount' => $refund->transaction->credit_amount,
                    'date' => $refund->transaction->date,
                    'time' => $refund->transaction->time,
                    'description' => $refund->transaction->description,
                    'created_at' => $refund->transaction->created_at,
                    'updated_at' => $refund->transaction->updated_at,
                ] : null,
            ];
        });

        // Summary statistics
        $totalRefundsQuery = PaymentRefund::where('gym_id',$request->logged_gym_id);
        $todayRefundsQuery = PaymentRefund::where('gym_id',$request->logged_gym_id);
        
        // Apply branch filter if needed
        if(!($request->logged_branch_id == $mainBranchId && $request->user()->type == 'default')){
            $totalRefundsQuery->where('branch_id', $request->logged_branch_id);
            $todayRefundsQuery->where('branch_id', $request->logged_branch_id);
        }
        
        $totalRefunds = $totalRefundsQuery->sum('refund_amount');
        $todayRefunds = $todayRefundsQuery->where('refund_date', now()->toDateString())->sum('refund_amount');
        $totalRefundCount = $totalRefundsQuery->count();
        $todayRefundCount = $todayRefundsQuery->where('refund_date', now()->toDateString())->count();
        
        // Get system currency
        $systemSettings = SystemSetting::with('currency')->where('gym_id',$request->logged_gym_id)->first();
        $systemSettingCurrency = $systemSettings?->currency?->symbol ?? 'Rs';
        
        return apiSuccess([
            'refunds' => $refunds,
            'summary' => [
                'total_refunds' => $totalRefunds,
                'today_refunds' => $todayRefunds,
                'total_refund_count' => $totalRefundCount,
                'today_refund_count' => $todayRefundCount,
                'system_currency' => $systemSettingCurrency
            ]
        ], 'Refunds fetched successfully', 200);
        
    }catch(Exception $e){
        return apiError('Failed to fetch refunds', 500, $e->getMessage());
    }
}

function feeCollectionDelete(Request $request){
    $loggedGymId = $request->logged_gym_id;
    $validator = Validator::make($request->all() , [
         'fee_collection_id' => ['required', 'integer' , function ($attribute, $value, $fail) use ($loggedGymId) {
            $feeCollection = FeeCollection::where('gym_id',$loggedGymId)->where('id',$value)->first();
            if (!$feeCollection) {
                return $fail('The selected fee receipt found.');
            }
            }], 
    ]);

    if($validator->fails()){
        return apiError('Validation failed' , 422 , $validator->errors()->first());
    }

    try{
        DB::beginTransaction();
        $feeCollection = FeeCollection::where('id',$request->fee_collection_id)->first();
        if($feeCollection->is_refund == 1){
            DB::rollBack();
            return apiError('Fee voucher with fee refund cannot be deleted' , 422 , 'Fee voucher with fee refund cannot be deleted');
        }
        $user = User::with('memberProfile')->whereHas('memberProfile')->where('gym_id',$request->logged_gym_id)->where('id',$feeCollection->user_id)->first();
        $memberProfile = MemberProfile::where('user_id',$feeCollection->user_id)->first();
        if($user &&  $memberProfile && ($memberProfile->current_plan_id == $feeCollection->plan_id) && ($memberProfile->current_plan_start_date == $feeCollection->plan_start_date)){
                $userLatestActiveStatus = UserStatusDetail::where('user_id',$user->id)->where('plan_id' , $memberProfile->current_plan_id)->where('plan_start_date' , $memberProfile->current_plan_start_date)->where('status' , 'active')->orderBy('id','desc')->first();
                // Create user status detail entry
                UserStatusDetail::create([
                    'user_id' => $user->id,
                    'status' => 'inactive',
                    'plan_id' => $feeCollection->plan_id,
                    'plan_start_date' => $feeCollection->plan_start_date,
                    'plan_expire_date' => $feeCollection->plan_expire_date,
                    'date' => now()->toDateString(),
                    'time' => now()->toTimeString(),
                    'remaining_days' => 0,
                    'plan_total_days' => $userLatestActiveStatus->plan_total_days,
                    'updated_by_id' => Auth::id(),
                ]);
                 $memberProfile->update([
                    'current_plan_id' => null,
                    'current_plan_start_date' => null,
                    'current_plan_expire_date' => null,
                    'current_plan_fee'  =>  null,
                    'used_visit_days' => 0,
                ]);
                // Update user status
                $user->update(['status' => 'inactive']);
                GenerateSystemLogs('User inactivated' , 'User '.$user->name.' '.$user->reference_num.' was inactivated due to  fee voucher deletion by '.$request->user()->name.' '.$request->user()->reference_num.'.' , $user->id , 'User' , $user->gym_id , $request->logged_branch_id ,  $request->ip());
        }
        GenerateSystemLogs('Fee Voucher Deleted' , 'Fee voucher deleted by '.$request->user()->name.' '.$request->user()->reference_num.'.' , $feeCollection->id , 'FeeCollection' , $user->gym_id , $request->logged_branch_id ,  $request->ip());
        Transaction::where('fee_collection_id',$feeCollection->id)->delete();
        $feeCollection->delete();
        DB::commit();
        return apiSuccess(null , 'Fee voucher deleted successfully' , 200);
    }catch(Exception $e){
        DB::rollBack();
        return apiError('Failed to delete fee voucher' , 500 , $e->getMessage());
    }
}

function generateReceipt(Request $request){
    $loggedGymId = $request->logged_gym_id;
    $validator = Validator::make($request->all() , [
        'fee_collection_id' => ['required', 'integer' , function ($attribute, $value, $fail) use ($loggedGymId) {
            $feeCollection = FeeCollection::where('gym_id',$loggedGymId)->where('id',$value)->first();
            if (!$feeCollection) {
                return $fail('The selected fee receipt found.');
            }
            }], 
    ]);

    if($validator->fails()){
        return apiError('Validation failed' , 422 , $validator->errors()->first());
    }

    try{
        $feeCollection =  $feeCollectionQuery = FeeCollection::with('member','createdByUser','plan','branch','transaction.branch','transaction.bank')->where('id',$request->fee_collection_id)->first();
        // Delete previous receipt if exists
        // if($feeCollection->receipt_url && Storage::disk('public')->exists(str_replace('storage/', '', $feeCollection->receipt_url))){
        //     Storage::disk('public')->delete(str_replace('storage/', '', $feeCollection->receipt_url));
        // }
        $systemSettings = SystemSetting::first();
        $systemSettingCurrency = strtoupper($systemSettings?->currency?->iso ?? 'pkr');
        $systemSettingCompanyName = $systemSettings?->company_name ?? 'GYM ERP';
        $systemSettingCompanyEmail = $systemSettings?->company_email ?? 'test@gmail.com';
        $systemSettingCompanyPhone = $systemSettings?->company_phone ?? '123456789';
        $pdf = Pdf::loadView('fee_receipt', compact('feeCollection','systemSettingCurrency','systemSettingCompanyName','systemSettingCompanyEmail','systemSettingCompanyPhone')) ->setPaper('A4', 'portrait');
        // File path relative to storage/app/public
        $fileName = 'fee_receipts/' . $feeCollection->reference_num . '.pdf';
        $pdfContent = $pdf->output();
        $bunnycdnApiKey = config('services.bunnycdn.api_key');
        $bunnycdnStorageZone = config('services.bunnycdn.storage_zone');
        $client = new Client(
            $bunnycdnApiKey,
            $bunnycdnStorageZone,
            Region::SINGAPORE
        );
        // Save temp file
        $tempPath = tempnam(sys_get_temp_dir(), 'bunny_pdf_');
        file_put_contents($tempPath, $pdfContent);
        // Upload
        $client->upload($tempPath, $fileName);
        unlink($tempPath);

        // $publicPath = 'storage/' . $fileName;
        // Ensure the directory exists
        // Storage::disk('public')->makeDirectory('fee_receipts');
        // Storage::disk('public')->put($fileName, $pdf->output());
        $feeCollection->update(['receipt_url' => $fileName]);
        $data = ['receipt_url' => $fileName];
        return apiSuccess($data, "Fee receipt generated successfully", 200);
    }catch(Exception $e){
        return apiError('Failed to generate receipt' , 500 , $e->getMessage());
    }
}

    function feeCollectionEdit(Request $request){
        $loggedGymId = $request->logged_gym_id;
        $validator = Validator::make($request->all() , [
            'plan_start_date'           =>      'required|date',
            'fee_collection_id' => ['required', 'integer' , function ($attribute, $value, $fail) use ($loggedGymId) {
            $feeCollection = FeeCollection::where('gym_id',$loggedGymId)->where('id',$value)->first();
            if (!$feeCollection) {
                return $fail('The selected fee receipt not found.');
            }
            }], 
        ]);

        if($validator->fails()){
            return apiError('Validation failed' , 422 , $validator->errors()->first());
        }

        try{
            DB::beginTransaction();
            $feeCollection = FeeCollection::with('transaction')->whereHas('transaction')->where('id',$request->fee_collection_id)->first();
            $user = User::where('id',$feeCollection->user_id)->first();
            $memberProfile = MemberProfile::where('user_id',$feeCollection->user_id)->first();
            if(!$feeCollection){
                DB::rollBack();
                return apiError('Fee collection receipt not found.' , 422 , 'Fee collection receipt not found.');
            }
            if($feeCollection->is_refund == 1){
                DB::rollBack();
                return apiError('Refunded fee receipt cannot be updated' , 422 , 'Refunded fee receipt cannot be updated');
            }
            if($user && $memberProfile && $feeCollection && $memberProfile->current_plan_id && $memberProfile->current_plan_start_date && ($feeCollection->plan_id == $memberProfile->current_plan_id) && ($feeCollection->plan_start_date == $memberProfile->current_plan_start_date)){
                $userStatusDetails = UserStatusDetail::where('user_id',$feeCollection->user_id)->where('plan_id',$memberProfile->current_plan_id)->where('plan_start_date',$memberProfile->current_plan_start_date)->orderBy('date')->get();
                $freezeRequest = FreezeRequest::where('user_id',$feeCollection->user_id)->where('plan_id',$memberProfile->current_plan_id)->where('plan_start_date',$memberProfile->current_plan_start_date)->first();
                $memberProfileOldPlanStartDate = $memberProfile->current_plan_start_date;

                if($userStatusDetails->isNotEmpty()){
                    $planTotalDays = $userStatusDetails->first()->plan_total_days;
                }else{
                    $plan = Plan::where('id',$memberProfile->current_plan_id)->first();
                    $planTotalDays = $plan->duration_days;
                }
                $planStartDate = Carbon::parse($request->plan_start_date);
                $today = Carbon::parse(now()->toDateString());
                $planExpireDate = $planStartDate->copy()->addDays($planTotalDays);
                $firstActiveStatus = UserStatusDetail::where('user_id',$feeCollection->user_id)->where('plan_id',$memberProfile->current_plan_id)->where('plan_start_date',$memberProfile->current_plan_start_date)->where('status','active')->first();

                // Check if any status is frozen
                if($userStatusDetails->contains('status', 'frozen')) {
                    DB::rollBack();
                    return apiError('Cannot edit fee collection because member already has a frozen status in this plan.', 422 , 'Cannot edit fee collection because member already has a frozen status in this plan.');
                }
              
                if($freezeRequest){
                    DB::rollBack();
                    return apiError('Cannot edit fee collection because member already has a freeze request in this plan.', 422 , 'Cannot edit fee collection because member already has a freeze request in this plan.');
                }

                foreach($userStatusDetails as $usd){
                    if($usd->status == 'active' || $usd->status == 'expired' || $usd->status == 'inactive'){
                        $usd->update(['plan_start_date' => $request->plan_start_date , 'plan_expire_date' => $planExpireDate->toDateString()]);
                    }
                    if($usd->status == 'expired'){
                        $usd->update(['date' => $planExpireDate->toDateString()]);
                    }
                    // if($planStartDate > $today){
                    //     $usd->update(['status'=>'inactive']);

                    // }
                }
                if($firstActiveStatus){
                    $firstActiveStatus->update(['date' => $request->plan_start_date]);
                }
                $memberProfile->update(['current_plan_start_date' => $request->plan_start_date , 'current_plan_expire_date' => $planExpireDate->toDateString()]);
                if ($planStartDate->greaterThan($today)) {

    $user->update(['status' => 'inactive']);

    //  delete ALL user status details if any exist
    UserStatusDetail::where('user_id', $feeCollection->user_id)
        ->where('plan_id', $memberProfile->current_plan_id)
        ->where('plan_start_date', $memberProfileOldPlanStartDate)
        ->delete();

} else {

    $user->update(['status' => 'active']);

    if ($userStatusDetails->isEmpty()) {
        UserStatusDetail::create([
            'user_id'           => $user->id,
            'status'            => 'active',
            'plan_id'           => $memberProfile->current_plan_id,
            'plan_start_date'   => $request->plan_start_date,
            'plan_expire_date'  => $planExpireDate->toDateString(),
            'date'              => $request->plan_start_date,
            'time'              => now()->toTimeString(),
            'remaining_days'    => $planTotalDays,
            'plan_total_days'   => $planTotalDays,
            'updated_by_id'     => $request->user()->id,
        ]);
    }
}
            if($planExpireDate->lessThanOrEqualTo($today)){
                $user->update(['status' => 'expired']);
                $memberProfile->update(['current_plan_id' => null , 'current_plan_start_date' => null , 'current_plan_expire_date' => null , 'current_plan_fee' => null, 'must_complete_by_date' => null]);
                $expiredStatus = UserStatusDetail::where('user_id', $feeCollection->user_id) ->where('plan_id', $memberProfile->current_plan_id) ->where('plan_start_date', $memberProfile->current_plan_start_date)->where('status','expired')->first();
                if(!$expiredStatus){
                    UserStatusDetail::create([
                        'user_id'           => $user->id,
                        'status'            => 'expired',
                        'plan_id'           => $memberProfile->current_plan_id,
                        'plan_start_date'   => $request->plan_start_date,
                        'plan_expire_date'  => $planExpireDate->toDateString(),
                        'date'              => $planExpireDate->toDateString(),
                        'time'              => now()->toTimeString(),
                        'remaining_days'    => 0,
                        'plan_total_days'   => $planTotalDays,
                        'updated_by_id'     => $request->user()->id,
                    ]);
                }
            }
                  $feeCollection->update(['plan_start_date' => $request->plan_start_date , 'plan_expire_date' => $planExpireDate->toDateString()]);
            }else{
                return apiError('Failed to update because member not active in this fee receipt plan' , 422 , 'Failed to update because member not active in this fee receipt plan');
            }
            DB::commit();
            return apiSuccess(null , 'Fee collection receipt plan start date updated successfully' , 200);
        }catch(Exception $e){
            DB::rollBack();
            return apiError('Failed to update fee receipt' , 500 , $e->getMessage());
        }
    }
      /**
     * Create Advance Payment
     */
    function createAdvancePayment(Request $request)
    {
        $loggedGymId = $request->logged_gym_id;
        $gym = Gym::find($loggedGymId);
        $validator = Validator::make($request->all(), [
            'user_id' => ['required', 'integer', function ($attribute, $value, $fail) use ($loggedGymId , $gym){
                $user = User::where('gym_id', $loggedGymId) ->where('id', $value) ->first();
                if (!$user || !$user->hasRole($gym->reference_num.' Member')) {
                    return $fail('The selected user is not a valid member');
                }
                
            }],
            'plan_id' => ['required', 'integer', function ($attribute, $value, $fail) use ($loggedGymId) {
                $plan = Plan::where('gym_id',$loggedGymId)->where('id',$value)->first();
                if (!$plan || $plan->status != 'active') {
                    return $fail('The selected plan not found or is not active');
                }
            }],
            'amount' => 'required|numeric|min:0',
            'deposit_method' => 'required|in:cash,bank',
            'bank_id' => ['nullable', 'integer' , 'required_if:deposit_method,bank', function ($attribute, $value, $fail) use ($loggedGymId) {
                $bank = Bank::where('gym_id',$loggedGymId)->where('id',$value)->first();
                if (!$bank) {
                    return $fail('The selected bank not found.');
                }
            }],
            // 'bank_id' => 'nullable|required_if:deposit_method,bank|exists:banks,id',
            'payment_date' => 'required|date',
            'notes' => 'nullable|string|max:500',
            'is_auto_renew' => 'string|required:in:true,false',
        ]);

        if ($validator->fails()) {
            return apiError('Validation failed', 422, $validator->errors()->first());
        }

        try {
            DB::beginTransaction();

            $plan = Plan::find($request->plan_id);
            $paymentDate = Carbon::parse($request->payment_date);
            $today = now();
            
            // Generate advance payment reference number
            $branch = Branch::find($request->logged_branch_id);
            $branchCode = $branch->reference_num;
            $prefix = $branchCode.'-AP'; 
            // $prefix = 'AP' . $branchCode;
            
            $last = AdvancePayment::where('reference_num', 'LIKE', $prefix . '%')
                ->orderByRaw('CAST(SUBSTRING(reference_num, ? + 1) AS UNSIGNED) DESC', [strlen($prefix)])
                ->first();
                
            if ($last) {
                $lastRef = $last->reference_num;
                $numberPart = substr($lastRef, strlen($prefix));
                $nextNumber = (int)$numberPart + 1;
                $newNumberPart = $nextNumber;
            } else {
                $newNumberPart = '1';
            }
            
            $referenceNum = $prefix . $newNumberPart;
            
            // CREATE FEE COLLECTION RECORD IMMEDIATELY
            // Generate fee voucher reference
            $feePrefix = $branchCode.'-V'; 
            // $feePrefix = 'V' . $branchCode;
            $lastFee = FeeCollection::where('reference_num', 'LIKE', $feePrefix . '%')
                ->orderBy('reference_num', 'desc')
                ->first();
                
            if ($lastFee) {
                $lastFeeRef = $lastFee->reference_num;
                $feeNumberPart = substr($lastFeeRef, strlen($feePrefix));
                $nextFeeNumber = (int)$feeNumberPart + 1;
                $newFeeNumberPart = $nextFeeNumber;
            } else {
                $newFeeNumberPart = '1';
            }
            
            $feeReferenceNum = $feePrefix . $newFeeNumberPart;
            
            // Create fee collection with empty plan dates
            $feeCollection = FeeCollection::create([
                'reference_num' => $feeReferenceNum,
                'user_id' => $request->user_id,
                'plan_id' => $request->plan_id,
                'plan_start_date' => null,
                'plan_expire_date' => null,
                'amount' => $plan->fee,
                'deposit_method' => $request->deposit_method,
                'created_by_id' => Auth::id(),
                'generate_date' => $paymentDate,
                'generate_time' => $today->toTimeString(),
                'branch_id' => $request->logged_branch_id,
                'bank_id' => $request->bank_id,
                'is_advance' => 1,
                'status' => 'pending',
                'gym_id'    =>  $request->logged_gym_id
            ]);
            
            // Create advance payment record
            $advancePayment = AdvancePayment::create([
                'reference_num' => $referenceNum,
                'user_id' => $request->user_id,
                'plan_id' => $request->plan_id,
                'amount' => $request->amount,
                'deposit_method' => $request->deposit_method,
                'bank_id' => $request->bank_id,
                'payment_date' => $paymentDate->toDateString(),
                'payment_time' => $today->toTimeString(),
                'created_by_id' => Auth::id(),
                'branch_id' => $request->logged_branch_id,
                'notes' => $request->notes,
                'is_auto_renew' => $request->boolean('is_auto_renew', true),
                'status' => 'pending',
                'fee_collection_id' => $feeCollection->id,
                'gym_id'    =>  $request->logged_gym_id
            ]);
            // Update fee collection with advance payment ID
            $feeCollection->update(['advance_payment_id' => $advancePayment->id]);
            
            // Create transaction record
            $user = User::find($request->user_id);
            $description = "Advance payment received from {$user->name} ({$user->reference_num}) for plan {$plan->name}. Payment date: {$paymentDate->toDateString()}, Voucher: {$feeReferenceNum}";
            
            $transRefNum = generatePaymentVoucherReferenceNum($request->logged_branch_id);
            $transactionData = [
                'payment_method' => $request->deposit_method,
                'debit_amount' => 0,
                'credit_amount' => $request->amount,
                'date' => $paymentDate,
                'payment_date' => $paymentDate->toDateString(),
                'time' => $today->toTimeString(),
                'description' => $description,
                'transaction_type' => 'income',
                'reference_num' => $transRefNum,
                'created_by' => Auth::id(),
                'source' => 'advance_payment',
                'branch_id' => $request->logged_branch_id,
                // 'bank_id' => $request->bank_id,
                'fee_collection_id' => $feeCollection->id,
                'advance_payment_id' => $advancePayment->id,
                'gym_id'    =>  $request->logged_gym_id
            ];
            
            Transaction::create($transactionData);
            
            // Generate system logs
            GenerateSystemLogs(
                'Advance Payment Received',
                $description,
                $feeCollection->id,
                'FeeCollection',
                $user->gym_id,
                $request->logged_branch_id,
                $request->ip()
            );
            
            // Send notifications
            $recipients = User::where('gym_id',$request->logged_gym_id)->where('id', '<>', Auth::id())
                ->whereNotIn('user_type', ['employee', 'member'])
                ->get(['id', 'reference_num', 'name']);
                
            foreach ($recipients as $recipient) {
                generateNotification(
                    $recipient->id,
                    'Advance Payment Received',
                    $description,
                    'payment',
                    $request->logged_branch_id,
                    null
                );
            }
            
            generateNotification(
                $user->id,
                'Advance Payment Received',
                "Your advance payment of {$request->amount} has been received on {$paymentDate->toDateString()} (Voucher: {$feeReferenceNum}). It will be applied when your current plan expires or when you choose to start.",
                'payment',
                $request->logged_branch_id,
                null
            );
            
            // Send push notification
            $userFcmToken = $user->device_fcm_token ?? null;
            if($userFcmToken){
                sendFCM($userFcmToken ,'Advance Payment Received' , "Your advance payment of {$request->amount} has been received. Voucher: {$feeReferenceNum}");
            }
            
            DB::commit();
            
            return apiSuccess([
                'advance_payment' => $advancePayment,
                'fee_collection' => $feeCollection
            ], 'Advance payment recorded successfully', 200);
            
        } catch (Exception $e) {
            DB::rollBack();
            return apiError('Failed to record advance payment', 500, $e->getMessage());
        }
    }

    /**
     * Apply Advance Payment (manual application)
     */
    function applyAdvancePayment(Request $request)
    {
        $loggedGymId = $request->logged_gym_id;
        $validator = Validator::make($request->all(), [
            'advance_payment_id' => ['required', 'integer', function ($attribute, $value, $fail) use ($loggedGymId) {
                $advancePayment = AdvancePayment::where('gym_id',$loggedGymId)->where('id',$value)->first();
                if (!$advancePayment) {
                    return $fail('The selected advance payment not found.');
                }
            }],
            // 'advance_payment_id' => 'required|exists:advance_payments,id',
            'plan_start_date' => 'required|date'
        ]);

        if ($validator->fails()) {
            return apiError('Validation failed', 422, $validator->errors()->first());
        }

        try {
            DB::beginTransaction();
            
            $advancePayment = AdvancePayment::with(['user', 'plan', 'feeCollection'])->find($request->advance_payment_id);
            
            if ($advancePayment->status !== 'pending') {
                return apiError('This advance payment has already been applied or cancelled', 422);
            }
            
            if (!$advancePayment->feeCollection) {
                return apiError('Associated fee collection not found', 422);
            }
            
            // If user already has an active plan
            $memberProfile = MemberProfile::where('user_id', $advancePayment->user_id)->first();
            if ($memberProfile && $memberProfile->current_plan_id) {
                $user = User::find($advancePayment->user_id);
                if ($user && $user->status == 'active') {
                    DB::rollBack();
                    return apiError('Member already has an active plan. Cannot apply advance payment while plan is active.', 422);
                }
            }
            
            $planStartDate = Carbon::parse($request->plan_start_date);
            $planDurationDays = $advancePayment->plan->duration_days;
            $planExpireDate = $planStartDate->copy()->addDays($planDurationDays)->toDateString();
            $today = now();
            
            // Plan start date must be after/equal member registration date
            if ($memberProfile && $memberProfile->register_date) {
                if (Carbon::parse($memberProfile->register_date) > $planStartDate) {
                    DB::rollBack();
                    return apiError('Plan start date must be after/equal the member registration date', 422);
                }
            }
            
            //  Plan start date should not be in the past
            if ($planStartDate->lt(now()->startOfDay())) {
                DB::rollBack();
                return apiError('Plan start date cannot be in the past', 422);
            }
            
            // UPDATE EXISTING FEE COLLECTION with plan dates
            $advancePayment->feeCollection->update([
                'plan_start_date' => $planStartDate,
                'plan_expire_date' => $planExpireDate,
                'status' => 'applied'
            ]);

            $todayDate = Carbon::parse(now()->toDateString());
            // Update advance payment status
            $advancePayment->update([
                'status' => 'applied',
                'process_date' => $todayDate
            ]);
            
            // Update the transaction with application date
            Transaction::where('fee_collection_id', $advancePayment->feeCollection->id)
                ->update([
                    'application_date' => $today->toDateString(),
                    'description' => DB::raw("CONCAT(description, ' | Applied on: " . $today->toDateString() . " for plan starting: " . $planStartDate->toDateString() . "')")
                ]);
            
            // Update user status and member profile
            $user = $advancePayment->user;
            if($planStartDate->gt($todayDate)){
                $user->update(['status' => 'inactive']);
            }else{
                $user->update(['status' => 'active']);
            }
            
            if ($memberProfile) {
                $memberProfile->update([
                    'current_plan_id' => $advancePayment->plan_id,
                    'current_plan_start_date' => $planStartDate,
                    'current_plan_expire_date' => $planExpireDate,
                    'used_visit_days' => 0,
                    'current_plan_fee' => $advancePayment->amount
                ]);
            }
            
            // Create user status history
            UserStatusDetail::create([
                'user_id' => $advancePayment->user_id,
                'status' => $planStartDate->gt($todayDate) ? 'inactive' : 'active',
                'plan_id' => $advancePayment->plan_id,
                'plan_start_date' => $planStartDate,
                'plan_expire_date' => $planExpireDate,
                'date' => $planStartDate,
                'time' => $today->toTimeString(),
                'remaining_days' => $planDurationDays,
                'plan_total_days' => $planDurationDays,
                'updated_by_id' => Auth::id()
            ]);
            
            // Generate system logs
            $description = "Advance payment {$advancePayment->reference_num} applied for user {$user->name} ({$user->reference_num}). ";
            $description .= "Payment was received on {$advancePayment->payment_date} (Voucher: {$advancePayment->feeCollection->reference_num}), plan starts on {$planStartDate}.";
            GenerateSystemLogs(
                'Advance Payment Applied',
                $description,
                $advancePayment->feeCollection->id,
                'FeeCollection',
                $user->gym_id,
                $advancePayment->branch_id,
                $request->ip()
            );
            
            // Send notification to member
            generateNotification(
                $user->id,
                'Advance Payment Applied',
                "Your advance payment (Voucher: {$advancePayment->feeCollection->reference_num}) has been applied. Your plan is now active from {$planStartDate} to {$planExpireDate}.",
                'payment',
                $advancePayment->branch_id,
                null
            );
            
            // Send push notification
            $userFcmToken = $user->device_fcm_token ?? null;
            if($userFcmToken){
                sendFCM($userFcmToken ,'Advance Payment Applied' , "Your advance payment has been applied. Plan active from {$planStartDate} to {$planExpireDate}");
            }
            
            DB::commit();
            
            return apiSuccess([
                'advance_payment' => $advancePayment,
                'fee_collection' => $advancePayment->feeCollection,
                'member_profile' => $memberProfile
            ], 'Advance payment applied successfully', 200);
            
        } catch (Exception $e) {
            DB::rollBack();
            return apiError('Failed to apply advance payment', 500, $e->getMessage());
        }
    }

    /**
     * Get user's advance payments
     */
    function getUserAdvancePayments(Request $request)
    {
        $loggedGymId = $request->logged_gym_id;
        $validator = Validator::make($request->all(), [
            'user_id' => ['required', 'integer', function ($attribute, $value, $fail) use ($loggedGymId) {
                $user = User::where('gym_id',$loggedGymId)->where('id',$value)->first();
                if (!$user) {
                    return $fail('The selected user not found.');
                }
            }],
            // 'user_id' => 'required|exists:users,id'
        ]);

        if ($validator->fails()) {
            return apiError('Validation failed', 422, $validator->errors()->first());
        }

        try {
            $advancePayments = AdvancePayment::with(['plan', 'feeCollection'])
                ->where('user_id', $request->user_id)
                ->orderBy('id', 'desc')
                ->paginate($request->limit ?? 10);
                
            return apiSuccess($advancePayments, 'Advance payments fetched successfully', 200);
            
        } catch (Exception $e) {
            return apiError('Failed to fetch advance payments', 500, $e->getMessage());
        }
    }

    /**
    * Get all advance payments
    */
   function getAllAdvancePayments(Request $request)
    {
        try {
            $loggedGymId = $request->logged_gym_id;
            $gym = Gym::find($loggedGymId);
            $search = trim($request->query('search'));
            $status = $request->query('filter_status');
            $startDate = $request->query('start_date');
            $endDate = $request->query('end_date');
            $filterUserId = $request->query('filter_user_id');
            $filterBranch = $request->query('filter_branch_id');
            $disablePaginateParam = $request->disable_page_param;
            
            $mainBranchId = Branch::where('gym_id',$request->logged_gym_id)->where('type', 'main')->first()?->id ?? null;
            
            $advancePaymentQuery = AdvancePayment::with([
                'user' => function($query) {
                    $query->select('id', 'name', 'reference_num', 'email', 'phone', 'status','profile_image');
                },
                'plan' => function($query) {
                    $query->select('id', 'name', 'fee', 'duration_days', 'reference_num');
                },
                'branch' => function($query) {
                    $query->select('id', 'name', 'reference_num');
                },
                'createdBy' => function($query) {
                    $query->select('id', 'name', 'reference_num');
                },
                'bank' => function($query) {
                    $query->select('id', 'name', 'account_number','reference_num');
                },
                'feeCollection' => function($query) {
                    $query->select('id', 'reference_num', 'amount', 'status', 'deposit_method', 'generate_date');
                },
                
                'transaction' => function($query) {
                    $query->select('id', 'reference_num', 'transaction_type', 'payment_method', 
                                'debit_amount', 'credit_amount', 'date', 'time', 'description', 
                                'created_by', 'branch_id', 'advance_payment_id','gym_id');
                }
            ])->where('gym_id',$loggedGymId);
             if($request->user()->hasRole($gym->reference_num.' Member')){
                $advancePaymentQuery->where('user_id',$request->user()->id);
            }
            
            // Apply filters to the main query
            $advancePaymentQuery->when($search, function($query) use ($search) {
                $query->where(function($q) use ($search) {
                    $q->where('reference_num', 'like', "%{$search}%")
                    ->orWhere('notes', 'like', "%{$search}%")
                    ->orWhereHas('user', function($uq) use ($search) {
                        $uq->where('name', 'like', "%{$search}%")
                            ->orWhere('reference_num', 'like', "%{$search}%")
                            ->orWhere('email', 'like', "%{$search}%")
                            ->orWhere('phone', 'like', "%{$search}%");
                    })
                    ->orWhereHas('plan', function($pq) use ($search) {
                        $pq->where('name', 'like', "%{$search}%")
                            ->orWhere('reference_num', 'like', "%{$search}%");
                    })
                    ->orWhereHas('branch', function($bq) use ($search) {
                        $bq->where('name', 'like', "%{$search}%")
                            ->orWhere('reference_num', 'like', "%{$search}%");
                    })
                    ->orWhereHas('feeCollection', function($fq) use ($search) {
                        $fq->where('reference_num', 'like', "%{$search}%");
                    })
                    ->orWhereHas('transaction', function($tq) use ($search) {
                        $tq->where('reference_num', 'like', "%{$search}%")
                            ->orWhere('description', 'like', "%{$search}%");
                    });
                });
            })
            ->when($status, function($query) use ($status) {
                $query->where('status', $status);
            })
            ->when($startDate && $endDate, function($query) use ($startDate, $endDate) {
                $query->whereBetween('payment_date', [$startDate, $endDate]);
            })
            ->when($filterUserId, function($query) use ($filterUserId) {
                $query->where('user_id', $filterUserId);
            })
            ->when($filterBranch, function($query) use ($filterBranch) {
                $query->where('branch_id', $filterBranch);
            })
            // Apply branch filtering based on user's branch access
            ->when(!($request->logged_branch_id == $mainBranchId && $request->user()->type == 'default'),
                function($query) use ($request) {
                    $query->where('branch_id', $request->logged_branch_id);
                }
            );

            // Clone the filtered query for statistics
            $filteredQueryForStats = clone $advancePaymentQuery;
            
            // Apply ordering for main query
            $advancePaymentQuery->orderBy('id', 'desc');

            // Handle pagination based on disable_page_param
            if($request->has('disable_page_param') && $disablePaginateParam == 1) {
                $advancePayments = $advancePaymentQuery->get();
            } else {
                $advancePayments = $advancePaymentQuery->paginate($request->limit ?? 10);
            }
            $systemSettings = SystemSetting::with('currency')->where('gym_id',$loggedGymId)->first();
            $systemSettingCurrency = $systemSettings?->currency?->symbol ?? 'Rs';
            // Transform data for cleaner response
            $advancePayments->getCollection()->transform(function ($payment) use($systemSettingCurrency) {
                return [
                    'id' => $payment->id,
                    'reference_num' => $payment->reference_num,
                    'amount' => $payment->amount,
                    'deposit_method' => $payment->deposit_method,
                    'payment_date' => $payment->payment_date,
                    'payment_time' => $payment->payment_time,
                    'status' => $payment->status,
                    'notes' => $payment->notes,
                    'is_auto_renew' => $payment->is_auto_renew,
                    'created_at' => $payment->created_at,
                    'updated_at' => $payment->updated_at,
                    'system_setting_currency' => $systemSettingCurrency,
                    
                    'user' => $payment->user ? [
                        'id' => $payment->user->id,
                        'name' => $payment->user->name,
                        'reference_num' => $payment->user->reference_num,
                        'email' => $payment->user->email,
                        'phone' => $payment->user->phone,
                        'status' => $payment->user->status,
                        'profile_image' => $payment->user->profile_image,
                    ] : null,
                    
                    'plan' => $payment->plan ? [
                        'id' => $payment->plan->id,
                        'name' => $payment->plan->name,
                        'fee' => $payment->plan->fee,
                        'duration_days' => $payment->plan->duration_days,
                        'reference_num' => $payment->plan->reference_num
                    ] : null,
                    
                    'branch' => $payment->branch ? [
                        'id' => $payment->branch->id,
                        'name' => $payment->branch->name,
                        'reference_num' => $payment->branch->reference_num
                    ] : null,
                    
                    'created_by' => $payment->createdBy ? [
                        'id' => $payment->createdBy->id,
                        'name' => $payment->createdBy->name,
                        'reference_num' => $payment->createdBy->reference_num
                    ] : null,
                    
                    'bank' => $payment->bank ? [
                        'id' => $payment->bank->id,
                        'name' => $payment->bank->name,
                        'account_number' => $payment->bank->account_number,
                        'reference_num' => $payment->bank->reference_num
                    ] : null,
                    
                    'fee_collection' => $payment->feeCollection ? [
                        'id' => $payment->feeCollection->id,
                        'reference_num' => $payment->feeCollection->reference_num,
                        'amount' => $payment->feeCollection->amount,
                        'status' => $payment->feeCollection->status,
                        'deposit_method' => $payment->feeCollection->deposit_method,
                        'generate_date' => $payment->feeCollection->generate_date
                    ] : null,
                    
                    // transaction data
                    'transaction' => $payment->transaction ? [
                        'id' => $payment->transaction->id,
                        'reference_num' => $payment->transaction->reference_num,
                        'transaction_type' => $payment->transaction->transaction_type,
                        'payment_method' => $payment->transaction->payment_method,
                        'debit_amount' => $payment->transaction->debit_amount,
                        'credit_amount' => $payment->transaction->credit_amount,
                        'date' => $payment->transaction->date,
                        'time' => $payment->transaction->time,
                        'description' => $payment->transaction->description,
                        'created_by' => $payment->transaction->created_by,
                        'branch_id' => $payment->transaction->branch_id
                    ] : null
                ];
            });
            
            // Statistics - Apply same filters as main query
            $statsQuery = clone $filteredQueryForStats;
            
            $totalPending = (clone $statsQuery)->where('status', 'pending')->sum('amount');
            $totalApplied = (clone $statsQuery)->where('status', 'applied')->sum('amount');
            $totalCancelled = (clone $statsQuery)->where('status', 'cancelled')->sum('amount');
            $totalAmount = $totalPending + $totalApplied;
            $totalCount = (clone $statsQuery)->count();
            
            // Get system currency
            $systemSettings = SystemSetting::with('currency')->where('gym_id',$loggedGymId)->first();
            $systemSettingCurrency = $systemSettings?->currency?->symbol ?? 'Rs';
            
            return apiSuccess([
                'advance_payments' => $advancePayments,
                'summary' => [
                    'total_amount' => $totalAmount,
                    'total_pending' => $totalPending,
                    'total_applied' => $totalApplied,
                    'total_cancelled' => $totalCancelled,
                    'total_count' => $totalCount,
            
                    'system_currency' => $systemSettingCurrency
                ]
            ], 'Advance payments fetched successfully', 200);
            
        } catch (Exception $e) {
            return apiError('Failed to fetch advance payments', 500, $e->getMessage());
        }
    }

    /**
     * Cancel advance payment (refund)
     */
    function cancelAdvancePayment(Request $request)
    {
        $loggedGymId = $request->logged_gym_id;
        $validator = Validator::make($request->all(), [
            'advance_payment_id' => ['required', 'exists:advance_payments,id', function ($attribute, $value, $fail) use ($loggedGymId) {
                $advancePayment = AdvancePayment::where('gym_id',$loggedGymId)->where('id',$value)->first();
                if (!$advancePayment) {
                    return $fail('The selected advance payment not found');
                }
                
                // Check if already applied
                if ($advancePayment->status === 'applied') {
                    return $fail('This advance payment has already been applied and cannot be cancelled');
                }
                
                // Check if already cancelled
                if ($advancePayment->status === 'cancelled') {
                    return $fail('This advance payment has already been cancelled');
                }
                
                // Check if fee collection already refunded
                if ($advancePayment->feeCollection && $advancePayment->feeCollection->is_refund == 1) {
                    return $fail('This advance payment has already been refunded');
                }
            }],
            'refund_method' => 'required|in:cash,bank',
            'bank_id' => 'nullable|required_if:refund_method,bank|exists:banks,id',
            'notes' => 'nullable|string|max:500'
        ]);

        if ($validator->fails()) {
            return apiError('Validation failed', 422, $validator->errors()->first());
        }

        try {
            DB::beginTransaction();
            
            $advancePayment = AdvancePayment::with(['user', 'feeCollection'])->find($request->advance_payment_id);
            $user = User::find($advancePayment->user_id);
            $feeCollection = $advancePayment->feeCollection;
            
            // Generate refund reference number (similar to feeCollectionRefund)
            $branch = Branch::find($request->logged_branch_id);
            $branchCode = $branch->reference_num;
             $prefix = $branchCode.'-RF'; 
            // $prefix = 'RF' . $branchCode;
            
            $last = PaymentRefund::where('reference_num', 'LIKE', $prefix . '%')
                ->orderByRaw('CAST(SUBSTRING(reference_num, ? + 1) AS UNSIGNED) DESC', [strlen($prefix)])
                ->first();
            
            if ($last) {
                $lastRef = $last->reference_num;
                $numberPart = substr($lastRef, strlen($prefix));
                $nextNumber = (int)$numberPart + 1;
                $newNumberPart = $nextNumber;
            } else {
                $newNumberPart = '1';
            }
            
            $refundRefNum = $prefix . $newNumberPart;
            
            // Create payment refund record
            $refundData = [
                'reference_num' => $refundRefNum,
                'fee_collection_id' => $feeCollection->id,
                'user_id' => $advancePayment->user_id,
                'plan_id' => $advancePayment->plan_id,
                'refund_amount' => $advancePayment->amount,
                'original_amount' => $advancePayment->amount,
                'refund_method' => $request->refund_method,
                'notes' => $request->notes,
                'refund_date' => now()->toDateString(),
                'refund_time' => now()->toTimeString(),
                'created_by_id' => Auth::id(),
                'branch_id' => $request->logged_branch_id,
                'bank_id' => $request->bank_id,
                'is_advance_refund' => true,
                'advance_payment_id' => $advancePayment->id,
                'gym_id'    =>  $loggedGymId
            ];
            
            $paymentRefund = PaymentRefund::create($refundData);
            
            // Get system currency
            $systemSettings = SystemSetting::with('currency')->where('gym_id',$loggedGymId)->first();
            $systemSettingCurrency = $systemSettings?->currency?->symbol ?? 'Rs';
            $todayDate = Carbon::parse(now()->toDateString());
            
            // Update advance payment status
            $advancePayment->update([
                'status' => 'cancelled',
                'process_date' => $todayDate
            ]);
            
            // Update fee collection status and mark as refunded
            if ($feeCollection) {
                $feeCollection->update([
                    'is_refund' => 1,
                    'status' => 'cancelled'
                ]);
            }
            
            // Create transaction for refund
            $description = "Advance payment refund of {$advancePayment->amount} for advance payment {$advancePayment->reference_num} (Voucher: {$feeCollection->reference_num}). ";
            $description .= "Refund method: {$request->refund_method}. ";
            $description .= $request->notes ? "Notes: {$request->notes}" : "";
            
            $transRefNum = generatePaymentVoucherReferenceNum($request->logged_branch_id);
            
            // Create expense transaction for refund
            $transactionData = [
                'payment_method' => $request->refund_method,
                'debit_amount' => $advancePayment->amount,
                'credit_amount' => 0,
                'date' => $paymentRefund->refund_date,
                'time' => now()->toTimeString(),
                'description' => $description,
                'transaction_type' => 'expense',
                'reference_num' => $transRefNum,
                'created_by' => Auth::id(),
                'source' => 'refund_expense',
                'branch_id' => $request->logged_branch_id,
                'payment_refund_id' => $paymentRefund->id,
                'advance_payment_id' => $advancePayment->id,
                'fee_collection_id' => $feeCollection->id,
                'gym_id'    =>  $loggedGymId
            ];

            Transaction::create($transactionData);
            
            // Generate system logs (similar to feeCollectionRefund)
            $logDescription = "Advance payment refund of {$systemSettingCurrency} {$advancePayment->amount} processed for advance payment {$advancePayment->reference_num}";
            GenerateSystemLogs(
                'Advance Payment Refund', 
                $logDescription, 
                $paymentRefund->id, 
                'PaymentRefund', 
                $user->gym_id,
                $request->logged_branch_id, 
                $request->ip()
            );
            
            GenerateSystemLogs(
                'Advance Payment Cancelled',
                "Advance payment {$advancePayment->reference_num} cancelled and refunded for user {$user->name}",
                $advancePayment->id,
                'AdvancePayment',
                $user->gym_id,
                $request->logged_branch_id,
                $request->ip()
            );
            
            // Generate notifications (similar to feeCollectionRefund)
            $recipients = User::where('gym_id',$loggedGymId)->where('id', '<>', Auth::id())
                ->whereNotIn('user_type', ['employee', 'member'])
                ->get(['id', 'reference_num', 'name']);
            
            foreach ($recipients as $recipient) {
                generateNotification(
                    $recipient->id,
                    'Advance Payment Refund',
                    "Advance payment refund of {$systemSettingCurrency} {$advancePayment->amount} processed for {$user->name}",
                    'refund',
                    'PaymentRefund',
                    $paymentRefund->id,
                    $request->logged_branch_id,
                    null
                );
            }
            
            $userNotificationMsg = "Your advance payment of {$systemSettingCurrency} {$advancePayment->amount} has been refunded via {$request->refund_method}.";
            generateNotification(
                $user->id,
                'Advance Payment Refund',
                $userNotificationMsg,
                'refund',
                'PaymentRefund',
                $paymentRefund->id,
                $request->logged_branch_id,
                null
            );
            
            // Send push notification
            $userFcmToken = $user->device_fcm_token ?? null;
            if($userFcmToken){
                sendFCM($userFcmToken, 'Advance Payment Refund', $userNotificationMsg);
            }
            
            DB::commit();
            
            return apiSuccess([
                'refund' => $paymentRefund,
                'advance_payment' => $advancePayment,
                'user' => $user,
                'fee_collection' => $feeCollection
            ], 'Advance payment refund processed successfully', 200);
            
        } catch (Exception $e) {
            DB::rollBack();
            return apiError('Failed to process advance payment refund', 500, $e->getMessage());
        }
    }
}
