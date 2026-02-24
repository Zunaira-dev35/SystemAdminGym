<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use App\Models\Gym;
use App\Models\MemberProfile;
use App\Models\MembershipTransfer;
use App\Models\Plan;
use App\Models\User;
use App\Models\UserStatusDetail;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class MembershipTransferController extends Controller
{
    /**
     * Get all membership transfers with filters
     */
    public function index(Request $request)
    {
        try {
            $search = trim($request->query('search'));
            $startDate = $request->query('start_date');
            $endDate = $request->query('end_date');
            $filterBranch = $request->query('filter_branch_id');
            $fromMemberId = $request->query('from_member_id');
            $toMemberId = $request->query('to_member_id');
            $filterTransferredBy = $request->query('filter_transferred_by');
            $loggedGymId = $request->logged_gym_id;
            $mainBranchId = Branch::where('type', 'main')->where('gym_id',$request->logged_gym_id)->first()?->id ?? null;
            $disablePaginateParam = $request->disable_page_param ?? false;

            // Simple query to get all transfers with selected fields
            $query = MembershipTransfer::with([
                'fromUser:id,name,reference_num,base_branch_id',
                'toUser:id,name,reference_num,base_branch_id',
                'plan:id,name,reference_num',
                'transferredBy:id,name',
                'branch:id,name,reference_num', // Add branch relationship
            ])->select([
                'id',
                'from_user_id',
                'to_user_id',
                'plan_id',
                'transferred_days',
                'from_remaining_days_before',
                'from_remaining_days_after',
                'to_remaining_days_before',
                'to_remaining_days_after',
                'notes',
                'transferred_by',
                'branch_id',
                'created_at',
            ])->where('gym_id',$loggedGymId);

            // Apply search filter
            if ($search) {
                $query->where(function ($q) use ($search) {
                    $q->whereHas('fromUser', function ($q) use ($search) {
                        $q->where('name', 'like', "%{$search}%")
                            ->orWhere('reference_num', 'like', "%{$search}%");
                    })
                    ->orWhereHas('toUser', function ($q) use ($search) {
                        $q->where('name', 'like', "%{$search}%")
                            ->orWhere('reference_num', 'like', "%{$search}%");
                    })
                    ->orWhereHas('plan', function ($q) use ($search) {
                        $q->where('name', 'like', "%{$search}%")
                            ->orWhere('reference_num', 'like', "%{$search}%");
                    })
                    ->orWhere('notes', 'like', "%{$search}%");
                   
                });
            }

            // Apply date filters
            if ($startDate && $endDate) {
                $query->whereBetween('created_at', [$startDate, $endDate]);
            } elseif ($startDate) {
                $query->whereDate('created_at', '>=', $startDate);
            } elseif ($endDate) {
                $query->whereDate('created_at', '<=', $endDate);
            }

            // Apply branch filter
            if ($filterBranch) {
                $query->where('branch_id', $filterBranch);
            }

            // Apply user-based branch filtering for non-main branch users
            $user = $request->user();
            $loggedBranchId = $request->logged_branch_id;
            
            if (!($loggedBranchId == $mainBranchId && $user->type == 'default')) {
                $query->where('branch_id', $loggedBranchId);
            }

            // Apply other filters
            if ($fromMemberId) {
                $query->where('from_user_id', $fromMemberId);
            }

            if ($toMemberId) {
                $query->where('to_user_id', $toMemberId);
            }

            if ($filterTransferredBy) {
                $query->where('transferred_by', $filterTransferredBy);
            }


            $query->orderBy('created_at', 'desc');

            // Check if pagination is disabled
            if ($disablePaginateParam && $disablePaginateParam == 1) {
                $transfers = $query->get()->map(function ($transfer) {
                    return [
                        'id' => $transfer->id,
                        'transfer_date' => $transfer->created_at->format('Y-m-d H:i'),
                        'from_member' => $transfer->fromUser ? [
                            'id' => $transfer->fromUser->id,
                            'name' => $transfer->fromUser->name,
                            'reference_num' => $transfer->fromUser->reference_num,
                        ] : null,
                        'to_member' => $transfer->toUser ? [
                            'id' => $transfer->toUser->id,
                            'name' => $transfer->toUser->name,
                            'reference_num' => $transfer->toUser->reference_num,
                        ] : null,
                        'plan' => $transfer->plan ? [
                            'id' => $transfer->plan->id,
                            'name' => $transfer->plan->name,
                            'reference_num' => $transfer->plan->reference_num,
                        ] : null,
                        'days_transferred' => $transfer->transferred_days,
                        'from_days_before' => $transfer->from_remaining_days_before,
                        'from_days_after' => $transfer->from_remaining_days_after,
                        'to_days_before' => $transfer->to_remaining_days_before,
                        'to_days_after' => $transfer->to_remaining_days_after,
                        'notes' => $transfer->notes,
                        'transferred_by' => $transfer->transferredBy ? [
                            'id' => $transfer->transferredBy->id,
                            'name' => $transfer->transferredBy->name,
                        ] : null,
                        'branch' => $transfer->branch ? [
                            'id' => $transfer->branch->id,
                            'name' => $transfer->branch->name,
                            'reference_num' => $transfer->branch->reference_num,
                        ] : null,
                    ];
                });

                return apiSuccess([
                    'current_page' => 1,
                    'data' => $transfers,
                    'first_page_url' => null,
                    'from' => 1,
                    'last_page' => 1,
                    'last_page_url' => null,
                    'links' => [],
                    'next_page_url' => null,
                    'path' => $request->url(),
                    'per_page' => $transfers->count(),
                    'prev_page_url' => null,
                    'to' => $transfers->count(),
                    'total' => $transfers->count(),
                ], 'Membership transfers fetched successfully', 200);
            } else {
                $transfers = $query->paginate($request->limit ?? 10);

                // Transform paginated data
                $transfers->getCollection()->transform(function ($transfer) {
                    return [
                        'id' => $transfer->id,
                        'transfer_date' => $transfer->created_at->format('Y-m-d H:i'),
                        'from_member' => $transfer->fromUser ? [
                            'id' => $transfer->fromUser->id,
                            'name' => $transfer->fromUser->name,
                            'reference_num' => $transfer->fromUser->reference_num,
                        ] : null,
                        'to_member' => $transfer->toUser ? [
                            'id' => $transfer->toUser->id,
                            'name' => $transfer->toUser->name,
                            'reference_num' => $transfer->toUser->reference_num,
                        ] : null,
                        'plan' => $transfer->plan ? [
                            'id' => $transfer->plan->id,
                            'name' => $transfer->plan->name,
                            'reference_num' => $transfer->plan->reference_num,
                        ] : null,
                        'days_transferred' => $transfer->transferred_days,
                        'from_days_before' => $transfer->from_remaining_days_before,
                        'from_days_after' => $transfer->from_remaining_days_after,
                        'to_days_before' => $transfer->to_remaining_days_before,
                        'to_days_after' => $transfer->to_remaining_days_after,
                        'notes' => $transfer->notes,
                        'transferred_by' => $transfer->transferredBy ? [
                            'id' => $transfer->transferredBy->id,
                            'name' => $transfer->transferredBy->name,
                        ] : null,
                        'branch' => $transfer->branch ? [
                            'id' => $transfer->branch->id,
                            'name' => $transfer->branch->name,
                            'reference_num' => $transfer->branch->reference_num,
                        ] : null,
                    ];
                });

                return apiSuccess($transfers, 'Membership transfers fetched successfully', 200);
            }

        } catch (Exception $e) {
            return apiError('Failed to fetch membership transfers', 500, $e->getMessage());
        }
    }

    
    public function membershipTransfer(Request $request)
    {
        $loggedGymId = $request->logged_gym_id;
        $gym = Gym::find($loggedGymId);
        $validator = Validator::make($request->all(), [
            'from_member_id' => ['required', 'integer','different:to_member_id', function ($attribute, $value, $fail) use ($loggedGymId , $gym) {
                $user = User::where('gym_id',$loggedGymId)->where('id',$value)->first();
                $memberProfile = MemberProfile::with('plan')->where('user_id', $value)->first();
                if (! $user || ! $memberProfile || ! $user->hasRole($gym->reference_num.' Member')) {
                    return $fail('The selected user is not a valid member, or no active membership plan was found');
                }
            }],
            'to_member_id' => ['required', 'integer', function ($attribute, $value, $fail) use ($loggedGymId , $gym) {
                $user = User::where('gym_id',$loggedGymId)->where('id',$value)->first();
                $memberProfile = MemberProfile::with('plan')->where('user_id', $value)->first();
                if (! $user || ! $memberProfile || ! $user->hasRole($gym->reference_num.' Member')) {
                    return $fail('The selected user is not a valid member, or no active membership plan was found');
                }
            }],
            'notes' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return apiError('Validation failed' , 422 , $validator->errors()->first());
        }

        
        try {
            DB::beginTransaction();
            $fromUser = User::with('memberProfile')->lockForUpdate()->find($request->from_member_id);
            $fromProfile = $fromUser->memberProfile;
            $toUser = User::with('memberProfile')->lockForUpdate()->find($request->to_member_id);
            $toProfile = $toUser->memberProfile;

            if ($toUser->user_type != 'member' || $fromUser->user_type != 'member') {
                DB::rollBack();
                return apiError('Only members can transfer membership' , 400 , 'Only members can transfer membership');
            }

            if($fromUser->status != 'active' && $fromUser->status != 'frozen'){
                DB::rollBack();
                return apiError('Member must be active/frozen to transfer membership' , 422 , 'Member must be active/frozen to transfer membership');
            }

           
            $fromStatus = UserStatusDetail::where('user_id', $fromUser->id)->where('plan_id' , $fromProfile->current_plan_id)->where('plan_start_date',$fromProfile->current_plan_start_date)->where('status', 'active') ->orderBy('id','desc') ->lockForUpdate() ->first();
            if (!$fromStatus || $fromProfile->remaining_days_balance <= 0) {
                return apiError('No remaining days available for transfer' , 400 , 'No remaining days available for transfer');
            }

            $remainingDays = $fromProfile->remaining_days_balance;
            
            //Check TO member status
            if($toUser->status != 'inactive' && $toUser->status != 'expired'){
                DB::rollBack();
                return apiError('Member already has an active plan' , 400 , 'Member already has an active plan');
            }
            if($toUser->status == 'inactive' && $toUser->current_plan_start_date){
                DB::rollBack();
                return apiError('Member already has an upcoming plan to activate.' , 400 , 'Member already has an upcoming plan to activate.');
            }
            // $toStatus = UserStatusDetail::where('user_id', $toUser->id) ->latest() ->lockForUpdate() ->first();
            // if ($toStatus && $toStatus->status != 'inactive' && $toStatus->status != 'expired') {
            //     return apiError('Member already has an active plan' , 400 , 'Member already has an active plan');
            // }

            //EXPIRE FROM MEMBER
            UserStatusDetail::create([
                'user_id' => $fromUser->id,
                'status' => 'inactive',
                'plan_id' => $fromProfile->current_plan_id,
                'plan_start_date' => $fromProfile->current_plan_start_date,
                'plan_expire_date' => now()->toDateString(),
                'plan_total_days' => $fromStatus->plan_total_days,
                'remaining_days' => 0,
                'date' => now()->toDateString(),
                'time' => now()->toTimeString(),
                'updated_by_id' => Auth::id(),
            ]);

            $fromUser->update(['status' => 'inactive']);
            /**
             *  ACTIVATE / EXTEND TO MEMBER
             */
            $newRemainingDays = $remainingDays;
            $newPlanTotalDays = $fromStatus->plan_total_days;
            $newExpireDate = now()->copy()->addDays($newRemainingDays)->toDateString();

            // Create new status for TO member
            $toNewStatus = UserStatusDetail::create([
                'user_id' => $toUser->id,
                'status' => 'active',
                'plan_id' => $fromStatus->plan_id,
                'plan_start_date' => now()->toDateString(),
                'plan_expire_date' => $newExpireDate,
                'plan_total_days' => $newPlanTotalDays,
                'remaining_days' => $newRemainingDays,
                'date' => now()->toDateString(),
                'time' => now()->toTimeString(),
                'updated_by_id' => Auth::id(),
            ]);

            $fromPlan = Plan::where('id',$fromStatus->plan_id)->first();
            // Update TO member's profile
            if($fromPlan->branch_id != $toUser->base_branch_id){
                 $fromUserBranch = Branch::where('id',$fromPlan->branch_id)->first();
                $toUserBranch = Branch::where('id',$toUser->base_branch_id)->first();
                $toUser->update(['status' => 'active' , 'base_branch_id' => $fromPlan->branch_id]);
                GenerateSystemLogs(
                'Branch Transfer',
                'Member branch changed from branch '.$toUserBranch->reference_num.' '.$toUserBranch->name.' to branch '.$fromUserBranch->reference_num.' '.$fromUserBranch->name.' due to membership transfer from member '.$fromUser->reference_num.' '.$fromUser->name,
                $toUser->id,
                'User',
                $request->logged_branch_id,
                $request->ip()
            );
            }else{
                $toUser->update(['status' => 'active']);
            }

            $toProfile->update([
                'current_plan_id' => $fromProfile->current_plan_id,
                'current_plan_start_date' => now()->toDateString(),
                'current_plan_expire_date' => $newExpireDate,
                'current_plan_fee' => $fromProfile->current_plan_fee
            ]);

              $fromProfile->update([
                'current_plan_id' => null,
                'current_plan_start_date' => null,
                'current_plan_expire_date' => null,
                'current_plan_fee' => null
            ]);
            /**
             *  RECORD THE TRANSFER - Store branch_id from from_user
             */
            $membershipTransfer = MembershipTransfer::create([
                'from_user_id' => $fromUser->id,
                'from_profile_id' => $fromProfile->id,
                'from_status_detail_id' => $fromStatus->id,
                'to_user_id' => $toUser->id,
                'to_profile_id' => $toProfile->id,
                'to_status_detail_id' => $toNewStatus->id,
                'transferred_days' => $remainingDays,
                'from_remaining_days_before' => $fromProfile->remaining_days_balance,
                'from_remaining_days_after' => 0,
                'to_remaining_days_before' => 0,
                'to_remaining_days_after' => $newRemainingDays,
                'plan_id' => $fromStatus->plan_id,
                'plan_start_date' => now()->toDateString(),
                'plan_expire_date_before' => null,
                'plan_expire_date_after' => $newExpireDate,
                'notes' => $request->notes,
                'transferred_by' => Auth::id(),
                'branch_id' => $request->logged_branch_id,
                'gym_id'    =>  $fromUser->gym_id
            ]);

            //Generate reference num
            $branch = Branch::find($request->logged_branch_id);
            $branchCode = $branch->reference_num; 
            $prefix = $branchCode.'-MT'; 
            // Get last member for this branch
            $last = MembershipTransfer::where('reference_num', 'LIKE', $prefix . '%') ->orderByRaw('CAST(SUBSTRING(reference_num, ? + 1) AS UNSIGNED) DESC', [strlen($prefix)]) ->first();
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
            $membershipTransfer->update(['reference_num' => $newRefNum]);
            /**
             *  GENERATE SYSTEM LOGS (Added based on reference code)
             */
            $loggedBranchId = $request->logged_branch_id; 
            
            // Log for membership transfer
            $transferLogDescription = "Membership transfer of {$remainingDays} days from {$fromUser->name} to {$toUser->name}";
            if ($request->notes) {
                $transferLogDescription .= " - Notes: {$request->notes}";
            }
            GenerateSystemLogs(
                'Membership Transfer',
                $transferLogDescription,
                $membershipTransfer->id,
                'MembershipTransfer',
                $fromUser->gym_id,
                $loggedBranchId,
                $request->ip()
            );
            
            // Log for from user status change
            GenerateSystemLogs(
                'Membership Inactive',
                "Membership inactive for user {$fromUser->name} due to transfer to {$toUser->name}",
                $fromUser->id,
                'User',
                $fromUser->gym_id,
                $loggedBranchId,
                $request->ip()
            );
            
            // Log for to user status change
            GenerateSystemLogs(
                'Membership Activated',
                "Membership activated for user {$toUser->name} with {$newRemainingDays} days transferred from {$fromUser->name}",
                $toUser->id,
                'User',
                $fromUser->gym_id,
                $loggedBranchId,
                $request->ip()
            );

            
            // Get recipients - staff users excluding the current user and member/employee types
            $recipients = User::where('gym_id',$loggedGymId)->where('id', '<>', Auth::id())
                ->whereNotIn('user_type', ['employee', 'member'])
                ->get(['id', 'reference_num', 'name']);
            
            // Notify staff about the transfer
            foreach ($recipients as $recipient) {
                $response = generateNotification( $recipient->id, 'Membership Transfer', "Membership transfer of {$remainingDays} days from {$fromUser->name} {$fromUser->reference_num} to {$toUser->name} {$toUser->reference_num}", 'others' , 'MembershipTransfer' , $membershipTransfer->id , $loggedBranchId, null );
            }
            
            // Notify the from member
            generateNotification( $fromUser->id, 'Membership Transferred', "Your membership of {$remainingDays} days has been transferred to {$toUser->name} {$toUser->reference_num}. Your membership is now inactive.", 'others' , 'MembershipTransfer' , $membershipTransfer->id , $loggedBranchId, null );
            //send push notification
            $fromUserFcmToken = $fromUser->device_fcm_token ?? null;
             if($fromUserFcmToken){
                sendFCM($fromUserFcmToken ,'Membership Transferred' , "Your membership of {$remainingDays} days has been transferred to {$toUser->name} {$toUser->reference_num}. Your membership is now inactive.");
            }
            // Notify the to member
            generateNotification(
                $toUser->id,
                'Membership Received',
                "You have received {$remainingDays} days membership from {$fromUser->name} {$fromUser->reference_num}. Your new membership balance is {$newRemainingDays} days.",
                'others',
                'MembershipTransfer',
                $membershipTransfer->id ,
                $loggedBranchId,
                null
            );
            //send push notification
            $toUserFcmToken = $toUser->device_fcm_token ?? null;
            if($toUserFcmToken){
                sendFCM($toUserFcmToken ,'Membership Received' , "You have received {$remainingDays} days membership from {$fromUser->name} {$fromUser->reference_num}. Your new membership balance is {$newRemainingDays} days.");
            }
            DB::commit();

        return apiSuccess(['membership_transfer' => $membershipTransfer] , 'Membership transfer successful', 200);
        
        } catch (\Exception $e) {
            DB::rollBack();
            return apiError('Failed to transfer membership', 500, $e->getMessage());
        }
    }
}