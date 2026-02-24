<?php

namespace App\Http\Controllers;

use App\Helpers\FileUploadHelper;
use App\Helpers\FaceDetectionHelper;
use App\Models\Branch;
use App\Models\EmployeeProfile;
use App\Models\EmployeeShift;
use App\Models\Gym;
use App\Models\RoleGroup;
use App\Models\Shift;
use App\Models\User;
use App\Models\UserBranch;
use Carbon\Carbon;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Spatie\Permission\Models\Role;

class EmployeeController extends Controller
{
     function employees(Request $request){
        try{
            $loggedGymId = $request->logged_gym_id;
            $search = trim($request->query('search'));
            $paginateParam = $request->disable_page_param;
            $mainBranchId = Branch::where('type','main')->where('gym_id',$loggedGymId)->first()?->id ?? null;
            $filterBranch = $request->query('filter_branch_id');
            $filterStatus = $request->query('filter_status');
            $startDate = $request->query('start_date');
            $endDate = $request->query('end_date');
            $users = null;
            $usersQuery = User::with('roles','employeeProfile','branch','employeeShifts','assignBranches')->where('gym_id',$request->logged_gym_id)
            ->when($search , function($query) use ($search){
                $query->where(function($q) use ($search){
                    $q->where('name','like',"%{$search}%")
                    ->orWhere('reference_num','like',"%{$search}%")
                    ->orWhere('email','like',"%{$search}%")
                    ->orWhere('phone','like',"%{$search}%")
                    ->orWhereHas('roles',function($rq) use ($search){
                        $rq->where('name','like',"%{$search}%");
                    });
                });
            })
           ->where('user_type','employee')
           ->when($filterBranch , function($query) use ($filterBranch){
                $query->where('base_branch_id',$filterBranch);
            })
            ->when(!($request->logged_branch_id == $mainBranchId && $request->user()->type == 'default'),
            function($query) use ($request){
                $query->where('base_branch_id', $request->logged_branch_id);
            })->when($filterStatus , function($query) use ($filterStatus){
                $query->where('status',$filterStatus);
            })->when($startDate && $endDate , function($query) use ($startDate , $endDate){
                $query->whereHas('employeeProfile' , function($q) use ($startDate , $endDate){
                    $q->whereBetween('join_date' , [$startDate , $endDate]);
                });
            })
            ->orderBy('id','desc');
            if($request->user()->user_type == 'employee'){
                $usersQuery->where('id',$request->user()->id);
            }
           
            if($paginateParam && $paginateParam == 1){
                $users = $usersQuery->get();
            }else{
                $users = $usersQuery->paginate($request->limit ?? 10);
            }
            return apiSuccess($users , 'Employees fetched successfully' , 200);
        }catch(Exception $e){
            return apiError('Failed to fetch employees', 500, $e->getMessage());
        }
    }

    function createEmployeeReference(Request $request){
        try{
            $branch = Branch::find($request->logged_branch_id);
            $branchCode = $branch->reference_num; 
            $prefix = $branchCode.'-E'; 
            // $prefix = 'E' . $branchCode;          
            // Get last employee for this branch
            $last = User::where('reference_num', 'LIKE', $prefix . '%') ->orderByRaw('CAST(SUBSTRING(reference_num, ? + 1) AS UNSIGNED) DESC', [strlen($prefix)]) ->first();
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
            return apiSuccess($newRefNum , 'New employee ID fetched successfully', 200);
        }catch(Exception $e){
            return apiError('Failed to fetch new employee ID' , 500 , $e->getMessage());
        }   
    }

    function employeeStore(Request $request){
        $loggedGymId = $request->logged_gym_id;
        $gym = Gym::find($loggedGymId);
        $validator = Validator::make($request->all(),[
            'name'            =>      'required|string',
            'phone'                 =>      'required',
            'password'              =>       empty($request->id) ? 'required' : 'nullable',
            // 'profile_image'         =>      [empty($request->id) ? 'required' : 'nullable','image','mimes:jpeg,jpg,png'],
            'designation'           =>      'required|string',
            'salary'                =>      'required|numeric',
            'join_date'             =>      'required|date',
            'role_group_id' => ['required', 'integer', function ($attribute, $value, $fail) use ($loggedGymId , $gym) {
                $roleGroup = RoleGroup::where('gym_id',$loggedGymId)->where('id',$value)->first();
                if (!$roleGroup) {
                    return $fail('Role group not found.');
                }
            }],
            // 'role_group_id'         =>      'required|exists:role_groups,id',
            'branch_id'             =>      'nullable|array',
            'branch_id.*'           =>      ['nullable', 'integer', function ($attribute, $value, $fail) use ($loggedGymId){
                $branch = Branch::where('gym_id',$loggedGymId)->where('id',$value)->first();
                if (!$branch || $branch->status != 'active') {
                    return $fail('The selected branch not found or is not active.');
                }
            }],
            'shift_schedule'              =>      'required|array',
            'id' => ['nullable', 'integer', function ($attribute, $value, $fail) use ($loggedGymId) {
            $user = User::where('gym_id',$loggedGymId)->where('id',$value)->first();
            $employeeProfile = EmployeeProfile::with('user')->whereHas('user')->where('user_id',$value)->first();
            if (!$user || !$employeeProfile || !($user->user_type == 'employee')) {
                return $fail('The selected user is not a valid employee.');
            }
            }]
        ]);

        if($validator->fails()){
            return apiError('Validation failed' , 422 , $validator->errors()->first());
        }

        try{
            DB::beginTransaction();  
            if(!$request->id){
                $employeeLimit = $gym->employee_limit;
                $employeeCount = User::where('gym_id',$request->logged_gym_id)->where('user_type','employee')->count();
                if($employeeLimit && ($employeeCount == $employeeLimit)){
                    return apiError('Employee limit reached' , 422 , 'Employee limit reached. Please contact the administrator to increase the allowed number of employees.');
                }
            }
            if(empty($request->id)){
                $referenceNum = generateUserReferenceNum('employee' , $request->logged_branch_id);
            }else{
                $user  = User::find($request->id);
                $referenceNum = $user->reference_num;
            }
           
            $roleGroup = RoleGroup::where('id',$request->role_group_id)->first();
            $role = Role::where('id',$roleGroup->role_id)->first();
            if(!$role){
                DB::rollBack();
                return apiError('Invalid role' , 422 , 'Role not found');
            }
            if($role->name == $gym->reference_num.' Member'){
                DB::rollBack();
                return apiError('Unable to create user' , 422 ,  'Employee with the role member must be created through their respective module.');
            }
          
            if($request->cnic){
                $existingMemberProfileCnic = EmployeeProfile::with('user')->whereHas('user',function($query) use ($loggedGymId){
                    $query->where('gym_id',$loggedGymId);
                })->where('cnic',$request->cnic)->when($request->id , function($query) use ($request){
                    $query->where('user_id','<>',$request->id);
                })->exists();
                if($existingMemberProfileCnic){
                    DB::rollBack();
                    return apiError('Unable to proceed' , 422 , 'This CNIC is already registered to another employee.');
                }
            }
            if ($request->email) {
                $existingEmployeeEmail = User::where('gym_id',$loggedGymId)->where('email', $request->email)->when($request->id, function ($query) use ($request) {
                    $query->where('id', '<>', $request->id);
                })->where('user_type','employee')->exists();
                if ($existingEmployeeEmail) {
                    DB::rollBack();
                    return apiError('Unable to proceed', 422, 'This email is already registered to another employee.');
                }
            }
            $existingEmployee = $request->id ? User::where('gym_id',$loggedGymId)->where('phone',$request->phone)->where('id','<>',$request->id)->where('user_type','employee')->first() : User::where('gym_id',$loggedGymId)->where('phone',$request->phone)->where('user_type','employee')->first();
            if($existingEmployee){
                DB::rollBack();
                return apiError('Unable to proceed' , 422 , 'This phone number is already registered to another employee.');
            }
            $data = [];
            $data = array_reduce(['name','phone','email'] , function($carry , $input) use ($request){
                $carry[$input] = $request->input($input);
                return $carry;
            });
            $data['role_id'] = $role->id;
            $data['user_type'] = 'employee';
            $data['gym_id'] = $loggedGymId;
            if($request->password){
                $data['password'] = bcrypt($request->password);
                $data['password_string'] = $request->password;
            }
            $employeeData = [];
            //Add face
            if($request->hasFile('profile_image')){
                $profilePic = FileUploadHelper::uploadFile($request->file('profile_image'), 'users/profile');
                $data['profile_image'] = $profilePic;
                 //fetch face embedding
                $faceEmbedding =  global_face_embedding($referenceNum);
                if(empty($faceEmbedding)){
                    DB::rollBack();
                    return apiError('Failed to store employee' , 422 , 'Face data not captured. Make sure the image contains a clear face.');
                }
                $employeeData['face_encoding'] = json_encode($faceEmbedding);
            }
            if(empty($request->id)){
                $data['status'] = 'active';
                $data['base_branch_id'] = $request->logged_branch_id;
            }
            User::updateOrCreate(['id' => $request->input('id')] , $data);
            $latestUser = $request->id ? User::where('gym_id',$loggedGymId)->where('id',$request->id)->first() : User::where('gym_id',$loggedGymId)->orderBy('id','desc')->first();
            //Assign role
            $latestUser->syncRoles($role);
             //Add fingerprint
            if($request->hasFile('fingerprint_data')){
                $fingerprintEnroll = enrollFingerprint($latestUser->id , 'employee' , $request->file('fingerprint_data'));
                if($fingerprintEnroll['success'] == false){
                    DB::rollBack();
                    return apiError('Failed to store employee' , 422 , $fingerprintEnroll['message']);
                }
            }
            $employeeData = array_reduce(['designation','salary','join_date','address','cnic'] , function($carry , $input) use ($request){
                $carry[$input] = $request->input($input);
                return $carry;
            } , $employeeData);
            $employeeData['user_id'] = $latestUser->id;
            EmployeeProfile::updateOrCreate(['user_id' => $latestUser->id] , $employeeData);
             //Assign branches
            $userBranches = $request->branch_id;
            //Delete previous assign branches
            UserBranch::where('user_id' , $latestUser->id)->delete();
            //assign again
            if($userBranches){
                foreach($userBranches as $userBranch){
                    UserBranch::create(['user_id' => $latestUser->id , 'branch_id' => $userBranch]);
                }
                $existingLoggedBranch = UserBranch::where('user_id',$latestUser->id)->where('branch_id',$request->logged_branch_id)->exists();
                if(!$existingLoggedBranch){
                    UserBranch::create(['user_id' => $latestUser->id , 'branch_id' => $request->logged_branch_id]);
                }
            }
            //Delete previous assign shifts
            EmployeeShift::where('user_id' , $latestUser->id)->delete();
            $employeeShiftSchedules = $request->shift_schedule;
            //assign again
            if($employeeShiftSchedules){
                foreach($employeeShiftSchedules as $empShift){
                    // dump($empShift);
                    $type = $empShift['type'] ?? null;
                    if (!in_array($type, ['week_day', 'rest_day'], true)) {
                        DB::rollBack();
                        return apiError('Employee shift schedule is invalid' , 422 , 'Employee shift schedule is invalid');
                    }
                    $restDayName = $empShift['rest_day_name'] ?? null;
                    if($type == 'rest_day' && (!in_array($restDayName , ['Saturday','Sunday','Monday','Tuesday','Wednesday','Thursday','Friday']))){
                        DB::rollBack();
                        return apiError('Employee shift schedule is invalid' , 422 , 'Employee shift schedule is invalid');
                    }
                    $morningStartTime = $empShift['morning_start_time'] ?? null;
                    $morningEndTime = $empShift['morning_end_time'] ?? null;
                    $eveningStartTime = $empShift['evening_start_time'] ?? null;
                    $eveningEndTime = $empShift['evening_end_time'] ?? null;
                    $hasMorning = $morningStartTime && $morningEndTime;
                    $hasEvening = $eveningStartTime && $eveningEndTime;
                    // At least one complete pair must exist
                    if($type == 'week_day'){
                        if(!$hasMorning && !$hasEvening) {
                            DB::rollBack();
                            return apiError('Employee shift schedule is invalid', 422, 'At least one shift timing is required');
                        }
                    }
                    // Morning timing must be a complete pair
                    if (($morningStartTime && !$morningEndTime) || (!$morningStartTime && $morningEndTime)) {
                        DB::rollBack();
                        return apiError('Employee shift schedule is invalid', 422, 'Incomplete morning timing');
                    }
                    // Evening timing must be a complete pair
                    if (($eveningStartTime && !$eveningEndTime) || (!$eveningStartTime && $eveningEndTime)) {
                        DB::rollBack();
                        return apiError('Employee shift schedule is invalid', 422, 'Incomplete evening timing');
                    }
                    EmployeeShift::create(['user_id' => $latestUser->id , 'type' => $type , 'rest_day_name'  => $restDayName , 'morning_start_time' => $morningStartTime , 'morning_end_time' => $morningEndTime , 'evening_start_time' => $eveningStartTime , 'evening_end_time' => $eveningEndTime]);
                } 
            }
              //Assign reference number when created
            if(empty($request->id)){
                $latestUser->update(['reference_num' => $referenceNum]);
            }
            if($request->id){
                GenerateSystemLogs('Employee Profile Update' , 'Employee profile updated successfully', $latestUser->id, 'User' , $latestUser->gym_id , $request->logged_branch_id ,  $request->ip());
            }
            //Clear face embedding
            global_face_embedding($referenceNum , null , true);
            DB::commit();
            if(empty($request->id)){
                return apiSuccess($latestUser , 'Employee created successfully' , 200);
            }else{
                return apiSuccess($latestUser , 'Employee updated successfully' , 200);
            }
        }catch(Exception $e){
            DB::rollBack();
            return apiError('Failed to store employee', 500, $e->getMessage());
        }
    }

   
}
