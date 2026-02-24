<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use App\Models\Gym;
use App\Models\User;
use App\Models\UserBranch;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class BranchController extends Controller
{
    function branches(Request $request){
        $validator = Validator::make($request->all(),[
            'gym_id' => 'required|exists:gyms,id'
        ]);

        if($validator->fails()){
            return apiError('Validation failed' , 422 , $validator->errors()->first());
        }

        try{
            $search = $request->query('search');
            $filterStatus = $request->query('filter_status');
            $disablePageParam = $request->query('disable_page_param');
            $limit = $request->limit;
            $branchesQuery = Branch::where('gym_id',$request->gym_id)->when($search , function($query) use ($search){
                $query->where(function($q) use ($search){
                    $q->where('name','like',"%{$search}%")->orWhere('reference_num','like',"%{$search}%");
                });
                
            })->when($filterStatus , function($query) use ($filterStatus){
                $query->where('status',$filterStatus);
            })
            ->orderBy('id','desc');
            if($disablePageParam && $disablePageParam == 1){
                $branches = $branchesQuery->get();
            }else{
                $branches = $branchesQuery->paginate($limit ?? 10);
            }
            return apiSuccess($branches , 'Branches fetched successfully' , 200);
        }catch(Exception $e){
            return apiError('Failed to fetch branches' , 500 , $e->getMessage());
        }
    }

    function allBranches(Request $request){
        try{
            $search = $request->query('search');
            $filterStatus = $request->query('filter_status');
            $disablePageParam = $request->query('disable_page_param');
            $limit = $request->limit;
            $branchesQuery = Branch::where('gym_id',$request->logged_gym_id)->when($search , function($query) use ($search){
                $query->where('name','like',"%{$search}%")->orWhere('reference_num','like',"%{$search}%");
            })->when($filterStatus , function($query) use ($filterStatus){
                $query->where('status',$filterStatus);
            })
            ->orderBy('id','desc');
            if($disablePageParam && $disablePageParam == 1){
                $branches = $branchesQuery->get();
            }else{
                $branches = $branchesQuery->paginate($limit ?? 10);
            }
            return apiSuccess($branches , 'Branches fetched successfully' , 200);
        }catch(Exception $e){
            return apiError('Failed to fetch branches' , 500 , $e->getMessage());
        }
    }

    function createBranchReference(Request $request){
        $gym = Gym::where('id',$request->logged_gym_id)->first();
        $totalBranchCount = (Branch::where('gym_id',$gym->id)->count()) + 1;
        $brRefNum = $gym->reference_num.'-B'.$totalBranchCount;
        // $latestBranch = Branch::orderBy('id','desc')->first();
        // $brRefNum = str_pad( (int) $latestBranch->id + 1 , 2 , '0' , STR_PAD_LEFT);
        return apiSuccess($brRefNum , 'New branch ID fetched successfully', 200);
    }

    function branchStore(Request $request){
        $loggedGymId = $request->logged_gym_id;
        $validator  = Validator::make($request->all() , [
            'name'          =>      'required',
            'phone'         =>      'required',
            'id' => [
            'nullable',
            Rule::exists('branches', 'id')->where(function ($query) use ($loggedGymId) {
                $query->where('gym_id', $loggedGymId);
            }),
            ],
        ]);

        if($validator->fails()){
            return apiError('Validation failed' , 422 , $validator->errors()->first());
        }

        try{
            //Validate if gym exist and if branch limit reached
            $gym = Gym::where('id',$request->logged_gym_id)->first();
            if(!$gym){
                return apiError('Failed to store branch' , 422 , 'Failed to store branch , associated gym not found.');
            }
            if(!$request->id){
                $branchLimit = $gym->branch_limit;
                $branchesCount = Branch::where('gym_id',$request->logged_gym_id)->count();
                if($branchLimit && ($branchesCount == $branchLimit)){
                    return apiError('Branch limit reached' , 422 , 'Branch limit reached. Please contact the administrator to increase the allowed number of branches.');
                }
            }
            $data = array_reduce(['name','address','phone','branch_ip'],function ($carry, $input) use ($request) {
                $carry[$input] = $request->input($input);
                return $carry;
            });
            if(!$request->id){
                $data['status'] = 'active';
                $data['type'] = 'other';
                $data['gym_id'] = $request->logged_gym_id;
            }
           
            Branch::updateOrInsert(['id' => $request->input('id')] , $data);
            $latestBranch = $request->id ? Branch::where('id',$request->id)->first() : Branch::orderBy('id','desc')->first();
            if($request->user()->assignBranches()->exists()) {
                $branchExists = UserBranch::where('branch_id',$latestBranch->id)->where('user_id',$request->user()->id)->exists();
                if(!$branchExists){
                    UserBranch::create(['user_id' => $request->user()->id , 'branch_id' => $latestBranch->id]);
                }
            }
            $gym = Gym::where('id',$request->logged_gym_id)->first();
            $totalBranchCount = Branch::where('gym_id',$gym->id)->count();
            $brRefNum = $gym->reference_num.'-B'.$totalBranchCount;
            $latestBranch->update(['reference_num' => $brRefNum ]);
            return apiSuccess($latestBranch , 'Branch stored successfully' , 200);
        }catch(Exception $e){
            return apiError('Failed to store branch' , 500 , $e->getMessage());
        }
    }

    function branchDelete(Request $request){
        $loggedGymId = $request->logged_gym_id;
        $validator = Validator::make($request->all(),[
            'branch_id' => [
            'required',
            Rule::exists('branches', 'id')->where(function ($query) use ($loggedGymId) {
                $query->where('gym_id', $loggedGymId);
            }),
            ],
        ]);

        if($validator->fails()){
            return apiError('Validation failed' , 422 , $validator->errors()->first());
        }

        try{
            $branch = Branch::where('id',$request->branch_id)->first();
            if($branch->type == 'main'){
                return apiError('Failed to delete' , 422 , 'Main branch cannot be deleted');
            }
          
            if($request->branch_id == $request->logged_branch_id){
                return apiError('Failed to delete',422,'You cannot delete the current logged in branch.');
            }
            Branch::where('id',$request->branch_id)->delete();
            return apiSuccess(null,'Branch deleted successfully' , 200);
        }catch(Exception $e){
            return apiError('Failed to delete branch' , 500 , $e->getMessage());
        }
    }

    function branchUpdateStatus(Request $request){
        $loggedGymId = $request->logged_gym_id;
        $validator = Validator::make($request->all(),[
            'branch_id' => [
            'required',
            Rule::exists('branches', 'id')->where(function ($query) use ($loggedGymId) {
                $query->where('gym_id', $loggedGymId);
            }),
            ],
        ]);

        if($validator->fails()){
            return apiError('Validation failed' , 422 , $validator->errors()->first());
        }

        try{
            $branch = Branch::where('id',$request->branch_id)->first();
            if($branch->status == 'active'){
                if($branch->type == 'main'){
                    return apiError('Failed to disable' , 422 , 'Main branch cannot be disabled');
                }
             
                if($request->branch_id == $request->logged_branch_id){
                    return apiError('Failed to delete',422,'You cannot delete the current logged in branch.');
                }
                $status = 'inactive';
            }else{
                $status = 'active';
            }
            $branch->update(['status' => $status]);
            return apiSuccess($branch , 'Branch status updated successfully' , 200);
        }catch(Exception $e){
            return apiError('Failed to update branch status' , 500 , $e->getMessage());
        }
       
    }

    function loggedBranch(Request $request){
        $branch = Branch::where('gym_id',$request->logged_gym_id)->where('id',$request->logged_branch_id)->first();
        return apiSuccess($branch , 'Logged branch fetched successfully');
    }
}
