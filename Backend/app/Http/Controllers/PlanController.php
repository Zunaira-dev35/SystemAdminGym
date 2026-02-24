<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use App\Models\Gym;
use App\Models\MemberProfile;
use App\Models\Plan;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class PlanController extends Controller
{
    function plans(Request $request){
        try{
            $search = $request->query('search');
            $filterStatus = $request->query('filter_status');
            $disablePageParam = $request->query('disable_page_param');
            $filterBranch = $request->query('filter_branch_id');
            $mainBranchId = Branch::where('gym_id',$request->logged_gym_id)->where('type','main')->first()?->id ?? null;
            $limit = $request->limit;
            $plansQuery = Plan::where('gym_id',$request->logged_gym_id)->when($search , function($query) use ($search){
                $query->where('name','like',"%{$search}%")->orWhere('reference_num' , 'like' , "%{$search}%");
            })->when($filterStatus , function($query) use ($filterStatus){
                $query->where('status',$filterStatus);
            })->when($filterBranch , function($query) use ($filterBranch){
                $query->where('branch_id',$filterBranch);
            })
            ->when(!($request->logged_branch_id == $mainBranchId && $request->user()->type == 'default'),
            function($query) use ($request){
                $query->where('branch_id', $request->logged_branch_id);
            })
            ->orderBy('id','desc');
            if($disablePageParam && $disablePageParam == 1){
                $plans = $plansQuery->get();
            }else{
                $plans = $plansQuery->paginate($limit ?? 10);
            }
            return apiSuccess($plans , 'Plans fetched successfully' , 200);
        }catch(Exception $e){
            return apiError('Failed to fetch plans' , 500 , $e->getMessage());
        }
    }

    function createPlanReference(Request $request){
        try{
            $branch = Branch::find($request->logged_branch_id);
            $branchCode = $branch->reference_num;  
            $prefix = $branchCode.'-P';
            // $prefix = 'P' . $branchCode;          
            // Get last member for this branch
            $last = Plan::where('reference_num', 'LIKE', $prefix . '%') ->orderByRaw('CAST(SUBSTRING(reference_num, ? + 1) AS UNSIGNED) DESC', [strlen($prefix)])->first();
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
            return apiSuccess($newRefNum , 'New plan ID fetched successfully', 200);
        }catch(Exception $e){
            return apiError('Failed to fetch new plan ID' , 500 , $e->getMessage());
        }   
    }

    function planStore(Request $request){
        $loggedGymId = $request->logged_gym_id;
        $validator  = Validator::make($request->all() , [
            'name'          =>      'required',
            'fee'           =>      'required|integer|gt:0',
            'duration_days' =>      'required|integer|gt:0',
            'freeze_allowed_days'   =>  'nullable|integer|gte:0',
            'freeze_allowed_count'  =>  'nullable|integer|gte:0',
            'id' => [
            'nullable',
            Rule::exists('plans', 'id')->where(function ($query) use ($loggedGymId) {
                $query->where('gym_id', $loggedGymId);
            }),
            ],
        ]);

        if($validator->fails()){
            return apiError('Validation failed' , 422 , $validator->errors()->first());
        }

        try{
            DB::beginTransaction();
            $data = array_reduce(['name','description','fee','duration_days','freeze_allowed_days','freeze_allowed_count'],function ($carry, $input) use ($request) {
                $carry[$input] = $request->input($input);
                return $carry;
            });
            if(!$request->id){
                $data['status'] = 'active';
                $data['branch_id'] = $request->logged_branch_id;
                $data['gym_id'] = $request->logged_gym_id;
            }
            Plan::updateOrInsert(['id' => $request->input('id')] , $data);
            $latestPlan = $request->id ? Plan::where('gym_id',$request->logged_gym_id)->where('id',$request->id)->first() : Plan::where('gym_id',$request->logged_gym_id)->orderBy('id','desc')->first();
            if(empty($request->id)){
                $branch = Branch::find($request->logged_branch_id);
                $branchCode = $branch->reference_num;  
                $prefix = $branchCode.'-P';       
                // Get last member for this branch
                $last = Plan::where('reference_num', 'LIKE', $prefix . '%') ->orderByRaw('CAST(SUBSTRING(reference_num, ? + 1) AS UNSIGNED) DESC', [strlen($prefix)]) ->first();
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
                $latestPlan->update(['reference_num' => $newRefNum]);
            }
            $logTitle = $request->id ? 'Plan Updated' : 'Plan Added';
            $logDes = $request->id ? 'Plan updated successfully' : 'Plan added successfully';
            GenerateSystemLogs($logTitle , $logDes , $latestPlan->id, 'Plan' , $loggedGymId , $latestPlan->branch_id , $request->ip());
            DB::commit();
            return apiSuccess($latestPlan , 'Plan stored successfully' , 200);
        }catch(Exception $e){
            DB::rollBack();
            return apiError('Failed to store plan' , 500 , $e->getMessage());
        }
    }

    function planDelete(Request $request){
        $loggedGymId = $request->logged_gym_id;
        $validator = Validator::make($request->all(),[
            'plan_id' => [
            'required',
            Rule::exists('plans', 'id')->where(function ($query) use ($loggedGymId) {
                $query->where('gym_id', $loggedGymId);
            }),
            ],
        ]);

        if($validator->fails()){
            return apiError('Validation failed' , 422 , $validator->errors()->first());
        }

        try{
            $existingMember = MemberProfile::with('user')->whereHas('user')->where('current_plan_id',$request->plan_id)->exists();
            if($existingMember){
                return apiError('Failed to delete plan' , 422 , 'A member exists with this plan , cannot delete the plan');
            }
            Plan::where('id',$request->plan_id)->delete();
            return apiSuccess(null,'Plan deleted successfully' , 200);
        }catch(Exception $e){
            return apiError('Failed to delete plan' , 500 , $e->getMessage());
        }
    }

    function planUpdateStatus(Request $request){
        $loggedGymId = $request->logged_gym_id;
        $validator = Validator::make($request->all(),[
            'plan_id' => [
            'required',
            Rule::exists('plans', 'id')->where(function ($query) use ($loggedGymId) {
                $query->where('gym_id', $loggedGymId);
            }),
            ],
        ]);

        if($validator->fails()){
            return apiError('Validation failed' , 422 , $validator->errors()->first());
        }

        try{
            $plan = Plan::where('id',$request->plan_id)->first();
            if($plan->status == 'active'){
                $existingMember = MemberProfile::with('user')->whereHas('user')->where('current_plan_id', $request->plan_id)->exists();
                if($existingMember){
                    return apiError('Failed to disable plan' , 422 , 'A member exists with this plan , cannot disable the plan');
                }
                $status = 'inactive';
            }else{
                $status = 'active';
            }
            $plan->update(['status' => $status]);
            return apiSuccess($plan , 'Plan status updated successfully' , 200);
        }catch(Exception $e){
            return apiError('Failed to update plan status' , 500 , $e->getMessage());
        }
       
    }
}
