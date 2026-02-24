<?php

namespace App\Http\Controllers;

use App\Helpers\FileUploadHelper;
use App\Models\Branch;
use App\Models\Gym;
use App\Models\PermissionGroup;
use App\Models\RoleGroup;
use App\Models\User;
use App\Models\UserBranch;
use App\Models\UserStatusDetail;
use App\Services\TwilioService;
use Carbon\Carbon;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class UserController extends Controller
{
    protected $twilioService;

    function __construct(TwilioService $twilioService){
        $this->twilioService = $twilioService;
    }

    function login(Request $request){
        $validator = Validator::make($request->all(), [
            'reference_num'         =>      'required',
            'branch_id'     => [
                'nullable',
                'exists:branches,id', 
                function ($attribute, $value, $fail) {
                    $branch = Branch::find($value);
                    if (!$branch || $branch->status !== 'active') {
                        $fail('The selected branch is inactive.');
                    }
                }
            ],
            'password'  =>  'required'
        ]);

        if ($validator->fails()) {
            return apiError('Validation failed', 422, $validator->errors()->first());
        }

        try{
            // $user = User::where('reference_num',$request->reference_num)->first();
            $user = User::whereRaw( 'BINARY reference_num = ?', [$request->reference_num] )->first();
            //Check user exist or not
            if (!$user || !Hash::check($request->password, $user['password'])) {
                return apiError('Invalid ID or password', 401 , 'Invalid ID or password');
            }
            
            //Check if user is active
            if($user->status == 'inactive'){
                return apiError('Failed to login' , 422 , 'Your account is inactive. Please contact support to activate your account.');
            }

            if($user->type == 'system_admin'){
                $token = $user->createToken('auth_token')->plainTextToken;
                $data = ['user' => $user, 'access_token' => $token, 'access_token_type' => 'Bearer'];
                GenerateSystemLogs('Login' , 'User logged in successfully', $user->id, 'User' , $user->gym_id , $request->branch_id , $request->ip());
                return apiSuccess($data , 'User login successfully' , 200);
            }else{
                //Check if loggedIn user branch belong to the user gym
                $userGym = $user->gym_id;
                if(!$userGym){
                    return apiError('Failed to login' , 422 , 'You must be associated with a gym to log in as a gym user.');
                }
                $gym = Gym::where('id',$user->gym_id)->first();
                if(!$gym || $gym->status == 'inactive'){
                    return apiError('Failed to login' , 422 , 'Gym not found or is inactive.');
                }

                if($user->user_type == 'member'){
                    $branchId = $user->base_branch_id;
                }else{
                    $branchId = $request->branch_id;
                }

           
                // $branchId = $request->branch_id;
                if($branchId){
                    $branch = Branch::where('id',$request->branch_id)->first();
                    //Check if selected branch gym and user gym matches
                    if(!$branch || ($branch->gym_id != $user->gym_id)){
                        return apiError('Failed to login' , 422 , 'You can only log in to branches associated with your gym.');
                    }
                    //Check if user has assigned branches
                    $user->load('assignBranches');
                    if($user->assignBranches->isNotEmpty()){
                        if (!$user->assignBranches->contains('branch_id', $request->branch_id)) {
                            return apiError('You do not have access to this branch', 403 , 'You do not have access to this branch');
                        }
                    }
                    $token = $user->createToken('auth_token', ['branch:' . $request->branch_id , 'gym:'.$user->gym_id] )->plainTextToken;
                    $data = ['user' => $user, 'access_token' => $token, 'access_token_type' => 'Bearer'];
                    GenerateSystemLogs('Login' , 'User logged in successfully', $user->id, 'User' , $user->gym_id , $request->branch_id , $request->ip());
                    return apiSuccess($data , 'User login successfully' , 200);
                }else{
                    $data = ['user' => $user];
                    return apiSuccess($data , 'User authenticated successfully , please select branch to login' , 200);
                }
            }   
        }catch(Exception $e){
            return apiError('Failed to login' , 500, $e->getMessage());
        }
    }

    // dumping token and logout user
    public function logout(Request $request)
    {
        try {
            // Revoke the current user's token
            $request->user()->currentAccessToken()->delete();
            return apiSuccess(null, 'Logged out successfully');
        } catch (\Exception $e) {
            return apiError('Logout failed', 500, $e->getMessage());
        }
    }

    function permissionsDefault(){
        $permissions = Permission::all();
        return apiSuccess($permissions , 'Default permissions fetched successfully');
    }
  
     function permissionGroups(Request $request){
        try{
            $search = trim($request->query('search'));
            $paginateParam = $request->disable_page_param;
            $permissionGroups = null;
            $permissionGroupsQuery = PermissionGroup::where('gym_id',$request->logged_gym_id)->
            when($search , function($query) use ($search){
                $query->where(function($q) use ($search){
                    $q->where('name','like',"%{$search}%");
                });
            })
            ->orderBy('id','desc');
            if($paginateParam && $paginateParam == 1){
                $permissionGroups = $permissionGroupsQuery->get();
            }else{
                $permissionGroups = $permissionGroupsQuery->paginate($request->limit ?? 10)->through(function($group){
                return [
                    'id'    =>  $group->id,
                    'name' => $group->name , 
                    'permissions'   =>  $group->permissions ? json_decode($group->permissions) : [],
                    'type'  =>  $group->type,
                    'gym_id'    =>  $group->gym_id
                ];
            });
            }
            
            return apiSuccess($permissionGroups , 'Permission Groups fetched successfully' , 200);
        }catch(Exception $e){
            return apiError('Failed to fetch permission groups', 500, $e->getMessage());
        }
    }

    function permissionGroupStore(Request $request){
        $loggedGymId = $request->logged_gym_id;
        $validator = Validator::make($request->all(),[
            'name' => 'required',
            'id' => [
            'nullable',
            Rule::exists('permission_groups', 'id')->where(function ($query) use ($loggedGymId) {
                $query->where('gym_id', $loggedGymId);
            }),
            ],
            
        ]);

        if($validator->fails()){
            return apiError('Validation failed' , 422 , $validator->errors()->first());
        }
       
        try{
            DB::beginTransaction();
            if($request->id){
                $permissionGroupEdit = PermissionGroup::where('gym_id',$request->logged_gym_id)->where('id',$request->id)->first();
                if(!$permissionGroupEdit){
                    return apiError('Permission group not found' , 404 , 'Permission group not found');
                }
                if($permissionGroupEdit && $permissionGroupEdit->type == 'default' && $permissionGroupEdit->name == 'Default Group'){
                    DB::rollBack();
                    return apiError('Default permission group is not editable', 422, 'Default permission group is not editable');
                }
            }
            $existingGroup = $request->id ? PermissionGroup::where('gym_id',$request->logged_gym_id)->where('name',$request->name)->where('id','<>',$request->id)->first() : PermissionGroup::where('gym_id',$request->logged_gym_id)->where('name',$request->name)->first();
            if($existingGroup){
                return apiError('Permission group name must be unique', 422,'Permission group name must be unique');
            }
            $systemPermissions = Permission::pluck('name')->toArray(); 
            $data = [];
            $data = array_reduce(['name'],function($carry , $input) use ($request){
                $carry[$input] = $request->input($input);
                return $carry;
            });
            if($request->permissions){
                $invalidPermissions = array_diff($request->permissions, $systemPermissions);
                if(count($invalidPermissions) > 0){
                    DB::rollBack();
                    return apiError( 'Invalid permissions detected', 422, ['invalid_permissions' => array_values($invalidPermissions)] );
                }
                $data['permissions'] = json_encode($request->permissions);
            }
            
            $data['gym_id'] = $request->logged_gym_id;
            $query = PermissionGroup::updateOrInsert(['id' => $request->input('id')] , $data);
            $latestPermissionGroup = $request->id ? PermissionGroup::where('gym_id',$request->logged_gym_id)->where('id',$request->id)->first() : PermissionGroup::where('gym_id',$request->logged_gym_id)->orderBy('id','desc')->first();
            if($latestPermissionGroup){
                $existingRoleWithGroup = RoleGroup::where('assign_group_id',$latestPermissionGroup->id)->get();
                $latestPermissionGroupPermissions = $latestPermissionGroup->permissions ? json_decode($latestPermissionGroup->permissions) : [];
                if($existingRoleWithGroup){
                    foreach($existingRoleWithGroup as $role){
                        $spatieRole = Role::where('id',$role->role_id)->first();
                        if($spatieRole){
                            $spatieRole->syncPermissions($latestPermissionGroupPermissions);
                        }
                    }
                }
            }
            Db::commit();
            if(empty($request->id)){
                return apiSuccess($latestPermissionGroup , 'Permission Groups created successfully' , 200);
            }else{
                return apiSuccess($latestPermissionGroup , 'Permission Groups updated successfully' , 200);
            }
        }catch(Exception $e){
            DB::rollBack();
            return apiError('Failed to store permission group', 500, $e->getMessage());
        }
    }

    function permissionGroupEdit(Request $request , $id){
    try {
        $permissionGroup = PermissionGroup::where('gym_id',$request->logged_gym_id)->where('id', $id)->first();
        if (!$permissionGroup) {
            return apiError('Permission group not found', 404 , 'Permission group not found');
        }
        // Decode permissions if present
        $permissionGroup->permissions = $permissionGroup->permissions ? json_decode($permissionGroup->permissions, true) : [];
        return apiSuccess($permissionGroup, 'Permission group fetched successfully.', 200);
    } catch (Exception $e) {
        return apiError('Failed to fetch permission group', 500, $e->getMessage());
    }
    }

    function permissionGroupDelete(Request $request){
        $loggedGymId = $request->logged_gym_id;
         $validator = Validator::make($request->all(),[
            'permission_group_id' => [
            'required',
            Rule::exists('permission_groups', 'id')->where(function ($query) use ($loggedGymId) {
                $query->where('gym_id', $loggedGymId);
            }),
            ],
        ]);

        if($validator->fails()){
            return apiError('Validation failed' , 422 , $validator->errors()->first());
        }

        try{
            DB::beginTransaction();
            $permissionGroup = PermissionGroup::where('gym_id',$request->logged_gym_id)->where('id',$request->permission_group_id)->first();
            if(!$permissionGroup){
                DB::rollBack();
                return apiError('Unable to delete', 422 , 'Permission group not found.');
            }
            //Validate default permission group
            if($permissionGroup->type == 'default'){
                DB::rollBack();
                return apiError('Unable to delete', 422 , 'The system default permission group cannot be deleted.');
            }

            //Validate Existing Role
            $existingRoleWithGroup = RoleGroup::where('assign_group_id',$request->permission_group_id)->first();
            if($existingRoleWithGroup){
                DB::rollBack();
                return apiError('Unable to delete', 422 , 'This permission group is assigned to an existing role and cannot be deleted.');
            }
            DB::commit();
            $permissionGroup->delete();
        }catch(Exception $e){
            DB::rollBack();
            return apiError('Failed to delete permission group', 500, $e->getMessage());
        }

        return apiSuccess(null , 'Permission Group deleted successfully' , 200);
    }

    function roles(Request $request)
    {
        try {
            $search = trim($request->query('search'));
            $paginateParam = $request->disable_page_param;
            $roles = null;
            $rolesQuery = RoleGroup::with('permissionGroup','role')->where('gym_id',$request->logged_gym_id)->when($search, function ($query) use ($search) {
                    $query->where(function ($q) use ($search) {
                        $q->where('role_name', 'like', "%{$search}%")
                            ->orWhereHas('permissionGroup', function ($pq) use ($search) {
                                $pq->where('name', 'like', "%{$search}%");
                            });
                    });
                })
                ->orderBy('id', 'desc');
            if($paginateParam && $paginateParam == 1){
                $roles = $rolesQuery->get();
            }else{
                $roles = $rolesQuery->paginate($request->limit ?? 10)->through(function($role){
                    return [
                        'id' => $role->id,
                        'name' => $role->role_name,
                        'permission_group_id' => $role->assign_group_id,
                        'permission_group_name' => $role->permissionGroup ? $role->permissionGroup->name : 'Deleted Permission Group',
                        'role_group_permissions' => $role->permissionGroup ? ($role->permissionGroup->permissions ? json_decode($role->permissionGroup->permissions) : []) : 'Deleted Permission Group',
                        'assign_role_id'    =>  $role->role_id,
                        'type'  =>  $role->type,
                        'gym_id'    =>  $role->gym_id
                    ];
                });
            }
        
            return apiSuccess($roles, 'Roles fetched successfully', 200);

        } catch (Exception $e) {
            return apiError('Failed to fetch roles', 500, $e->getMessage());
        }
    }


     function roleStore(Request $request){
        $loggedGymId = $request->logged_gym_id;
         $validator = Validator::make($request->all(),[
            'role_name' => 'required|string|max:255',
            'assign_group_id' => 'required|exists:permission_groups,id',
            'id' => [
            'nullable',
            Rule::exists('role_groups', 'id')->where(function ($query) use ($loggedGymId) {
                $query->where('gym_id', $loggedGymId);
            }),
            ],

           
        ]);

        if($validator->fails()){
            return apiError('Validation failed' , 422 , $validator->errors()->first());
        }
     
        try{
            DB::beginTransaction();
            $gym = Gym::where('id',$request->logged_gym_id)->first();
            $roleGroup = null;
            if($request->id && $request->logged_gym_id){
                $roleGroup = RoleGroup::where('gym_id',$request->logged_gym_id)->where('id',$request->id)->first();
                if(!$roleGroup){
                    DB::rollBack();
                    return apiError('Role group not found' , 404 , 'Role group not found');
                }
                if($roleGroup && $roleGroup->type == 'default' && $roleGroup->name == 'Super Admin'){
                    DB::rollBack();
                    return apiError('Default role group is not editable', 422, 'Default role group is not editable');
                }
            }
            $existingRole = $request->id ? RoleGroup::where('gym_id',$request->logged_gym_id)->where('role_name',$request->role_name)->where('id','<>',$request->id)->first() : RoleGroup::where('gym_id',$request->logged_gym_id)->where('role_name',$request->role_name)->first();
            if($existingRole){
                DB::rollBack();
                return apiError('Invalid role name', 422 , 'Role name must be unique');
            }
            
           
            if($roleGroup){
                $role = Role::where('id',$roleGroup->role_id)->first();
                $role ? $role->update(['name' =>  $gym->reference_num.' '.$request->role_name]) : ''; 
            }else{
                $role = Role::create(['name' => $gym->reference_num.' '.$request->role_name , 'guard_name' => 'sanctum']);
            }
            $permissionGroup = PermissionGroup::where('gym_id',$request->logged_gym_id)->where('id',$request->assign_group_id)->first();
            if(!$permissionGroup){
                DB::rollBack();
                return apiError('Failed to store role group' , 422 , 'The selected permission group does not exist');
            }
            $permissionGroupPermissions = $permissionGroup->permissions ? json_decode($permissionGroup->permissions) : [];
            $role->syncPermissions($permissionGroupPermissions);

            $data = [];
            $data = array_reduce(['role_name'] , function($carry , $input) use ($request){
                $carry[$input] = $request->input($input);
                return $carry;
            });
            $data['role_id'] = $role->id;
            $data['assign_group_id'] = $request->assign_group_id;
            $data['gym_id'] = $request->logged_gym_id;
            RoleGroup::updateOrInsert(['id' => $request->input('id')] , $data);
            $latestRole = $request->id ? RoleGroup::where('gym_id',$request->logged_gym_id)->where('id',$request->id)->first() : RoleGroup::where('gym_id',$request->logged_gym_id)->orderBy('id','desc')->first();
            DB::commit();
            if(empty($request->id)){
                return apiSuccess($latestRole, 'Role created successfully', 200);
            }else{
                return apiSuccess($latestRole, 'Role updated successfully', 200);
            }
            
        }catch(Exception $e){
            DB::rollBack();
            return apiError('Failed to store role', 500, $e->getMessage());
        }
    }

    function roleDelete(Request $request){
        $loggedGymId = $request->logged_gym_id;
         $validator = Validator::make($request->all(),[
            'role_group_id' => [
            'nullable',
            Rule::exists('role_groups', 'id')->where(function ($query) use ($loggedGymId) {
                $query->where('gym_id', $loggedGymId);
            }),
            ],
        ]);

        if($validator->fails()){
            return apiError('Validation failed' , 422 , $validator->errors()->first());
        }

        try{
            DB::beginTransaction();
            $roleGroup = RoleGroup::where('gym_id',$request->logged_gym_id)->where('id',$request->role_group_id)->first();
            if(!$roleGroup){
                DB::rollBack();
                return apiError('Role group not found' , 404 , 'Role group not found');
            }
             //Validate default role group
            if($roleGroup->type == 'default'){
                DB::rollBack();
                return apiError('Unable to delete', 422 , 'The system default role cannot be deleted.');
            }
            //Validate existing user
            $existingUserWithRole = User::where('role_id',$roleGroup->role_id)->first();
            if($existingUserWithRole){
                DB::rollBack();
                return apiError('Unable to delete', 422 , 'This role is assigned to an existing user and cannot be deleted.');
            }
            $roleGroup->delete();
            $spatieRole = Role::where('id',$roleGroup->role_id)->first();
            $spatieRole->delete();
            DB::commit();
            return apiSuccess(null ,'Role deleted successfully' , 200);
        }catch(Exception $e){
            DB::rollBack();
            return apiError('Failed to delete role', 500, $e->getMessage());
        }
    }

    function allUsers(Request $request){
        try{
            $search = trim($request->query('search'));
            $paginateParam = $request->disable_page_param;
            $users = null;
            $usersQuery = User::with('roles','assignBranches')->where('gym_id',$request->logged_gym_id)
            ->when($search , function($query) use ($search){
                $query->where(function($q) use ($search){
                    $q->where('name','like',"%{$search}%")
                    ->orWhere('reference_num','like',"%{$search}%")
                    ->orWhere('email','like',"%{$search}%")
                    ->orWhereHas('roles',function($rq) use ($search){
                        $rq->where('name','like',"%{$search}%");
                    });
                });
            })
          ->whereNotIn('user_type',['employee','member'])
            // ->where(function($query) use ($request){
            //     $query->where('type','default');
            //     // ->orWhere('type','default');
            // })
            ->orderBy('id','desc');
            if($paginateParam && $paginateParam == 1){
                $users = $usersQuery->get();
            }else{
                $users = $usersQuery->paginate($request->limit ?? 10);
            }
            return apiSuccess($users , 'Users fetched successfully' , 200);
        }catch(Exception $e){
            return apiError('Failed to fetch users', 500, $e->getMessage());
        }
    }

    function createUserReference(Request $request){
        $gym = Gym::where('id',$request->logged_gym_id)->first();
        $totalUserCount = (User::where('gym_id',$gym->id)->where('user_type','other')->count()) + 1;
        $userRefNum = $gym->reference_num.'-U'.$totalUserCount;
        return apiSuccess($userRefNum , 'New user ID fetched successfully' , 200);
    }

    function userStore(Request $request){
        $loggedGymId = $request->logged_gym_id;
        $validator = Validator::make($request->all(),[
            'name'            =>      'required|string',
            'phone'                 =>      'required',
            'password'              =>      empty($request->id) ? 'required' : 'nullable',
            'role_group_id' => [
            'nullable',
            Rule::exists('role_groups', 'id')->where(function ($query) use ($loggedGymId) {
                $query->where('gym_id', $loggedGymId);
            }),
            ],

            'profile_image'         =>      'nullable|image|mimes:jpg,jpeg,png|max:10240',
            'branch_id'             =>      'nullable|array',
            'branch_id.*'           =>      ['nullable', 'integer', function ($attribute, $value, $fail) use ($loggedGymId){
                $branch = Branch::where('gym_id',$loggedGymId)->where('id',$value)->first();
                if (!$branch || $branch->status != 'active' || $branch->gym_id != $loggedGymId) {
                    return $fail('The selected branch not found or is not active.');
                }
            }],
            'id' => ['nullable', 'integer', function ($attribute, $value, $fail) use($loggedGymId) {
            $user = User::where('gym_id',$loggedGymId)->where('id',$value)->first();
            if (!$user || $user->user_type != 'other') {
                return $fail('The selected user is not a valid user.');
            }
            }]
        ]);

        if($validator->fails()){
            return apiError('Validation failed' , 422 , $validator->errors()->first());
        }

        try{
            DB::beginTransaction();
            $gym = Gym::where('id',$request->logged_gym_id)->first(); 
            if(!$request->id){
                $userLimit = $gym->user_limit;
                $usersCount = User::where('gym_id',$request->logged_gym_id)->count();
                if($userLimit && ($usersCount == $userLimit)){
                    return apiError('Users limit reached' , 422 , 'Users limit reached. Please contact the administrator to increase the allowed number of users.');
                }
            }
            if($request->id){
                $user = User::find($request->id);
                if($user->type == 'default'){
                    return apiError('Default system user cannot be updated' , 422 , 'Default system user cannot be updated');
                }
            } 
            $roleGroup = RoleGroup::where('gym_id',$request->logged_gym_id)->where('id',$request->role_group_id)->first();
            if(!$roleGroup){
                DB::rollBack();
                return apiError('Role group not found' , 422 , 'Role group not found');
            }
            $role = Role::where('id',$roleGroup->role_id)->first(); 
            if(!$role){
                DB::rollBack();
                return apiError('Invalid role' , 422 , 'Role not found');
            }
            if($role->name == $gym->reference_num.' Member'){
                DB::rollBack();
                return apiError('Unable to create user' , 422 ,  'Users with the Employee or Member role must be created through their respective modules.');
            }
            $existingUser = $request->id ? User::where('gym_id',$request->logged_gym_id)->where('phone',$request->phone)->where('id','<>',$request->id)->where('user_type','other')->first() : User::where('gym_id',$request->logged_gym_id)->where('phone',$request->phone)->where('user_type','other')->first();
            if($existingUser){
                DB::rollBack();
                return apiError('Unable to proceed' , 422 , 'This phone number is already registered to another user.');
            }
            $data = [];
            $data = array_reduce(['name','email','phone'] , function($carry , $input) use ($request){
                $carry[$input] = $request->input($input);
                return $carry;
            });
            $data['role_id'] = $role->id;
            $data['user_type'] = 'other';
            $data['gym_id'] = $request->logged_gym_id;
            // $data['base_branch_id'] = $request->logged_branch_id;
            if($request->password){
                $data['password'] = bcrypt($request->password);
                $data['password_string'] = $request->password;
            }
            if($request->hasFile('profile_image')){
                $profilePic = FileUploadHelper::uploadFile($request->file('profile_image'), 'users/profile');
                $data['profile_image'] = $profilePic;
            }
            if(empty($request->id)){
                $data['status'] = 'active';
            }
          
            User::updateOrInsert(['id' => $request->input('id')] , $data);
            $latestUser = $request->id ? User::where('gym_id',$request->logged_gym_id)->where('id',$request->id)->first() : User::where('gym_id',$request->logged_gym_id)->orderBy('id','desc')->first();
            //Assign role
            $latestUser->syncRoles($role);
            //Assign branches
            $userBranches = $request->branch_id;
            //Delete previous assign branches
            UserBranch::where('user_id' , $latestUser->id)->delete();
            //assign again
            if($userBranches){
                foreach($userBranches as $userBranch){
                    UserBranch::create(['user_id' => $latestUser->id , 'branch_id' => $userBranch]);
                }
            }
            $totalUserCount = User::where('gym_id',$request->logged_gym_id)->where('user_type','other')->count();
            //Assign reference number when created
            if(empty($request->id)){
                $userRefNum = $gym->reference_num.'-U'.$totalUserCount;
                $latestUser->update(['reference_num' => $userRefNum ]);
            }
            //Generate system log
            $logTitle = $request->id ? 'User Updated' : 'User Added';
            $logDes = $request->id ? 'User '.$latestUser->reference_num.' updated successfully' : 'User '.$latestUser->reference_num.' added successfully';
            GenerateSystemLogs($logTitle , $logDes , $latestUser->id, 'User' , $latestUser->gym_id  , null , $request->ip());
            DB::commit();
            if(empty($request->id)){
                return apiSuccess($latestUser , 'User created successfully' , 200);
            }else{
                return apiSuccess($latestUser , 'User updated successfully' , 200);
            }
        }catch(Exception $e){
            DB::rollBack();
            return apiError('Failed to store user', 500, $e->getMessage());
        }
    }

    function userUpdateStatus(Request $request){
        $loggedGymId = $request->logged_gym_id;
        //blacklisted will be 0 or 1
        $validator = Validator::make($request->all() , [
            'user_id' => ['required', 'integer', function ($attribute, $value, $fail) use($loggedGymId) {
            $user = User::where('gym_id',$loggedGymId)->where('id',$value)->first();
            if (!$user) {
                return $fail('The selected user is not a valid user.');
            }
            }]
        ]);

        if($validator->fails()){
            return apiError('Valdation failed' , 422 , $validator->errors()->first());
        }

        $userId = $request->user_id;
        try{
            DB::beginTransaction();
            $user = User::where('id',$userId)->first();
            //Validate if default user
            if($user->type == 'default'){
                return apiError('Unable to update status' , 422 , 'System default user cannot be updated');
            }
            if($user->status == 'frozen'){
                return apiError('Unable to update status' , 422 , 'User is currently frozen. Only active or inactive users can be updated.');
            }
            $successMessage = null;
            if($user->status == 'inactive'){
                $user->update(['status' => 'active', 'blacklisted' => 0]);
                $successMessage = 'User enabled successfully.';
                $userStatus = 'active';
            }else{
                $user->update(['status' => 'inactive', 'blacklisted' => $request->blacklisted ?? 0]);               
                $successMessage = 'User disabled successfully.';
                $userStatus = 'inactive';
            }
            UserStatusDetail::create(['user_id' => $user->id , 'status' => $userStatus , 'date' => now()->toDateString() , 'time' => now()->toTimeString() , 'updated_by_id' => Auth::id()]);
             //Generate system log
            GenerateSystemLogs('User Status Update' , $successMessage , $user->id, 'User' , $user->gym_id , null , $request->ip());
            DB::commit();
            return apiSuccess($user , $successMessage , 200);
        }catch(Exception $e){
            DB::rollBack();
            return apiError('Failed to update user status', 500, $e->getMessage());
        }
    }

    function currentUser(Request $request){
         return response()->json($request->user()->load('roles.permissions'));
    }

    // public function forgotPassword(Request $request)
    // {
    //     $validator = Validator::make($request->all(),[
    //         'phone' => 'required|exists:users,phone',
    //         'user_type' =>  'required|in:employee,member,other'
    //     ]);
      
    //     if($validator->fails()){
    //         return apiError('Validation failed',422,$validator->errors()->first());
    //     }

        
    //     $user = User::where('phone', $request->phone)->where('user_type',$request->user_type)->first();
       
    //     if (!$user) {
    //         return response()->json(['message' => 'User not found'], 404);
    //     }
       
    //     $code = rand(100000, 999999);
    //     $expiresAt = Carbon::now()->addMinutes(30);
    //     PasswordResetToken::updateOrCreate(
    //         ['email' => $user->email],
    //         [
    //             'user_id'    => $user->id,
    //             'email'      => $user->email,
    //             'token'      => $code, 
    //             'expires_at' => $expiresAt,
    //         ]
    //     );
    //     Mail::raw("Your password reset code is: $code. It will expire in 30 minutes.", function ($message) use ($user) {
    //         $message->to($user->email)->subject('Password Reset Code');
    //     });
    //     return response()->json(['message' => 'Password reset code sent to your email']);
    // }



    // public function resetPassword(Request $request)
    // {
    //     $request->validate([
    //         'code'      => 'required|numeric|digits:6', 
    //         'password'  => 'required|min:6|confirmed',
    //     ]);

    //     $record = PasswordResetToken::where([
    //         'token'   => $request->code, 
    //     ])->first();
    //     if (!$record) {
    //         return response()->json(['message' => 'Invalid code entered'], 400);
    //     }

    //     if (Carbon::now()->greaterThan(Carbon::parse($record->expires_at))) {
    //         return response()->json(['message' => 'Code expired'], 400);
    //     }

    //     $userData = User::where('id', $record->user_id)->first();
    //     if (!$userData) {
    //         return response()->json(['message' => 'User not found'], 400);
    //     }

    //     User::where('id', $userData->id)->update([
    //         'password' => Hash::make($request->password)
    //     ]);

    //     $record->delete();
    //     return response()->json(['message' => 'Password reset successfully']);
    // }
    

     public function deleteUser(Request $request, $id = null)
    {
        // If no ID provided, assume user wants to delete their own account
        $targetUserId = $id ?? $request->user()->id;
        $user = User::findOrFail($targetUserId);
        $requestUser = $request->user();

        // Authorization checks
        if ($requestUser->id !== $user->id && !$requestUser->hasRole('Super Admin')) {
            return apiError('Unauthorized: You can only delete your own account unless you are an admin', 403);
        }

        // Prevent admin from deleting themselves
        if ($user->id === $requestUser->id && $requestUser->hasRole('Super Admin')) {
            return apiError('Admins cannot delete their own accounts for security reasons', 403);
        }

        // Delete the user
        // $user->delete();

        // If user deleted themselves, revoke their tokens
        if ($requestUser->id === $user->id) {
            $requestUser->tokens()->delete();
        }
        return apiSuccess(null, 'Your account will be permanently deleted in 7 Days', 200);
    }

  

    function verifyUserFace(Request $request){
        $validator = Validator::make($request->all() , [
            'profile_image' =>  'required|image|mimes:jpeg,jpg,png',
            'user_type' =>  'required|in:member,employee',
            'id'    =>  'nullable|exists:users,id'
        ]);
    

        if($validator->fails()){
            return apiError('Validation failed' , 422 , $validator->errors()->first());
        }

        try{
            $userType = $request->user_type;
            $loggedGymId = $request->logged_gym_id;
            // normal check 
            $checkMemberExist = checkUserFace($request->file('profile_image') , $userType , $loggedGymId , $request->id);
            if($checkMemberExist['matched'] == true){
                $foundUserId = $checkMemberExist['user_id'];
                $foundUser = User::find($foundUserId);
                return apiError('Failed to save face encoding' , 422 , 'This face is already registered in the system with ID ' . $foundUser->reference_num . '.');
            }

            // blacklisted employee can't resgistered as member
            if ($userType == 'member') {
                $checkEmployeeExist = checkUserFace($request->file('profile_image') , "employee" , $loggedGymId , $request->id);
                if($checkEmployeeExist['matched'] == true){
                $foundUserId = $checkEmployeeExist['user_id'];
                $foundUser = User::find($foundUserId);
                if($foundUser->blacklisted)
                return apiError('Failed to save face encoding' , 422 , 'This user is blacklisted in the system with ID ' . $foundUser->reference_num . '.');
                }
            }

            // blacklisted member can't resgistered as employee
            if ($userType == 'employee') {
                $checkMemberExist = checkUserFace($request->file('profile_image') , "member" , $loggedGymId , $request->id);
                if($checkMemberExist['matched'] == true){
                $foundUserId = $checkMemberExist['user_id'];
                $foundUser = User::find($foundUserId);
                if($foundUser->blacklisted)
                    return apiError('Failed to save face encoding' , 422 , 'This user is blacklisted in the system with ID ' . $foundUser->reference_num . '.');
                }
            }
            
            $faceEmbedding = $checkMemberExist['embedding'];
            if($request->id){
                $user = User::find($request->id);
                $referenceNum = $user->reference_num;
            }else{
                $referenceNum = generateUserReferenceNum($userType , $request->logged_branch_id);
            }
            global_face_embedding($referenceNum ,  $faceEmbedding);
            return apiSuccess(null , 'Face encoding fetched successfully' , 200);
        }catch(Exception $e){
            return apiError('Failed to save face encoding' , 500 , $e->getMessage());
        }
    }

    function verifyUserFingerprint(Request $request){
         $validator = Validator::make($request->all() , [
            'fingerprint_data' =>  'required|image|mimes:png',
            'user_type' =>  'required|in:member,employee',
            'id'    =>  'nullable|exists:users,id'
        ]);
    

        if($validator->fails()){
            return apiError('Validation failed' , 422 , $validator->errors()->first());
        }

        try{
            $userType = $request->user_type;
            $fingerprintImage = $request->file('fingerprint_data');
            $checkUserExist = checkUserFingerPrint($fingerprintImage , $userType , $request->id);
            if($checkUserExist['matched'] == true){
                if($checkUserExist['user_id'] != $request->id){
                    $foundUserId = $checkUserExist['user_id'];
                    $foundUser = User::find($foundUserId);
                    return apiError('Failed to save fingerprint encoding' , 422 , 'This fingerprint is already registered in the system with ID ' . $foundUser->reference_num . '.');
                }
            }
           
            return apiSuccess(null , 'Fingerprint verified successfully' , 200);
        }catch(Exception $e){
            return apiError('Failed to verify fingerprint' , 500 , $e->getMessage());
        }
    }

    function deviceFcmToken(Request $request){
        $validator = Validator::make($request->all(),[
            'device_fcm_token'  =>  'required|string'
        ]);

        if($validator->fails()){
            return apiError('Validation failed',422,$validator->errors()->first());
        }

        try{
            $user = $request->user();
            $user->update(['device_fcm_token' => $request->device_fcm_token]);
            return apiSuccess(null ,'User device token stored successfully',200);
        }catch(Exception $e){
            return apiError('Failed to store device fcm token' , 500 , $e->getMessage());
        }
    }
}
