<?php

namespace App\Http\Controllers;

use App\Helpers\FileUploadHelper;
use App\Models\Attendance;
use App\Models\Branch;
use App\Models\FeeCollection;
use App\Models\FreezeRequest;
use App\Models\Gym;
use App\Models\MemberProfile;
use App\Models\Plan;
use App\Models\PlanTransfer;
use App\Models\Shift;
use App\Models\User;
use App\Models\UserStatusDetail;
use Carbon\Carbon;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Spatie\Permission\Models\Role;

class MemberController extends Controller
{
    // public function calculateComprehensiveMemberStats(Request $request)
    // {
    //     try {
    //         $filterBranch = $request->query('filter_branch_id');
    //         $mainBranchId = Branch::where('type', 'main')->first()?->id ?? null;

    //         // Get all active shifts
    //         $shiftsQuery = Shift::where('status', 'active');

    //         if ($filterBranch) {
    //             $shiftsQuery->where('branch_id', $filterBranch);
    //         } elseif (! ($request->logged_branch_id == $mainBranchId && $request->user()->type == 'default')) {
    //             $shiftsQuery->where('branch_id', $request->logged_branch_id);
    //         }

    //         $shifts = $shiftsQuery->get();

    //         // Base query for members
    //         $query = User::whereHas('roles', function ($query) {
    //             $query->where('name', 'Member');
    //         })
    //             ->when($filterBranch, function ($query) use ($filterBranch) {
    //                 $query->where('base_branch_id', $filterBranch);
    //             })
    //             ->when(! ($request->logged_branch_id == $mainBranchId && $request->user()->type == 'default'),
    //                 function ($query) use ($request) {
    //                     $query->where('base_branch_id', $request->logged_branch_id);
    //                 });

    //         $members = $query->with(['memberProfile.plan'])->get();

    //         // Initialize stats
    //         $stats = [
    //             'gender' => [
    //                 'male' => 0,
    //                 'female' => 0,
    //                 'other' => 0,
    //                 'total' => $members->count(),
    //             ],
    //             'shift_wise' => [],
    //             'no_shift' => [
    //                 'count' => 0,
    //                 'fee_collected' => 0,
    //                 'fee_pending' => 0,
    //                 'freeze_count' => 0,
    //                 'attendance_count' => 0,
    //                 'gender_breakdown' => ['male' => 0, 'female' => 0, 'other' => 0],
    //             ],
    //             'overall' => [
    //                 'total_collected' => 0,
    //                 'total_pending' => 0,
    //                 'total_freezed' => 0,
    //                 'total_attendance' => 0,
    //             ],
    //         ];

    //         // Initialize shift_wise structure
    //         foreach ($shifts as $shift) {
    //             $stats['shift_wise'][$shift->id] = [
    //                 'shift_id' => $shift->id,
    //                 'shift_name' => $shift->name,
    //                 'shift_reference' => $shift->reference_num,
    //                 'count' => 0,
    //                 'fee_collected' => 0,
    //                 'fee_pending' => 0,
    //                 'freeze_count' => 0,
    //                 'attendance_count' => 0,
    //                 'gender_breakdown' => ['male' => 0, 'female' => 0, 'other' => 0],
    //             ];
    //         }

    //         foreach ($members as $member) {
    //             // 1. Gender Count
    //             $gender = $member->gender ?? 'other';

    //             if ($gender == 'male') {
    //                 $stats['gender']['male']++;
    //             } elseif ($gender == 'female') {
    //                 $stats['gender']['female']++;
    //             } else {
    //                 $stats['gender']['other']++;
    //             }

    //             $memberProfile = $member->memberProfile;

    //             if ($memberProfile) {
    //                 // 2. Get shift ID
    //                 $shiftId = $memberProfile->shift_id;

    //                 // 3. Calculate Fee Collection
    //                 $memberFeeCollected = FeeCollection::where('user_id', $member->id)
    //                     ->sum('amount');

    //                 // Calculate pending fee
    //                 $memberFeePending = 0;
    //                 if ($memberProfile->plan) {
    //                     $planFee = $memberProfile->plan->fee ?? 0;
    //                     $memberFeePending = max(0, $planFee - $memberFeeCollected);
    //                 }

    //                 // 4. Check Freeze Status
    //                 $isFreezed = FreezeRequest::where('user_id', $member->id)
    //                     ->where('status', 'approved')
    //                     ->where('process_status', 'active')
    //                     ->where('start_date', '<=', now()->toDateString())
    //                     ->where('end_date', '>=', now()->toDateString())
    //                     ->exists();

    //                 // 5. Get Attendance Count
    //                 $attendanceCount = Attendance::where('user_id', $member->id)->count();

    //                 // 6. Update stats based on shift
    //                 if ($shiftId && isset($stats['shift_wise'][$shiftId])) {
    //                     // Member has a valid shift
    //                     $stats['shift_wise'][$shiftId]['count']++;
    //                     $stats['shift_wise'][$shiftId]['fee_collected'] += $memberFeeCollected;
    //                     $stats['shift_wise'][$shiftId]['fee_pending'] += $memberFeePending;
    //                     $stats['shift_wise'][$shiftId]['attendance_count'] += $attendanceCount;
    //                     $stats['shift_wise'][$shiftId]['gender_breakdown'][$gender]++;

    //                     if ($isFreezed) {
    //                         $stats['shift_wise'][$shiftId]['freeze_count']++;
    //                         $stats['overall']['total_freezed']++;
    //                     }
    //                 } else {
    //                     // Member has no shift or shift not found
    //                     $stats['no_shift']['count']++;
    //                     $stats['no_shift']['fee_collected'] += $memberFeeCollected;
    //                     $stats['no_shift']['fee_pending'] += $memberFeePending;
    //                     $stats['no_shift']['attendance_count'] += $attendanceCount;
    //                     $stats['no_shift']['gender_breakdown'][$gender]++;

    //                     if ($isFreezed) {
    //                         $stats['no_shift']['freeze_count']++;
    //                         $stats['overall']['total_freezed']++;
    //                     }
    //                 }

    //                 // Update overall stats
    //                 $stats['overall']['total_collected'] += $memberFeeCollected;
    //                 $stats['overall']['total_pending'] += $memberFeePending;
    //                 $stats['overall']['total_attendance'] += $attendanceCount;
    //             }
    //         }

    //         // Calculate gender percentages
    //         if ($stats['gender']['total'] > 0) {
    //             $stats['gender']['male_percentage'] = round(($stats['gender']['male'] / $stats['gender']['total']) * 100, 2);
    //             $stats['gender']['female_percentage'] = round(($stats['gender']['female'] / $stats['gender']['total']) * 100, 2);
    //             $stats['gender']['other_percentage'] = round(($stats['gender']['other'] / $stats['gender']['total']) * 100, 2);
    //         }

    //         // Reindex shift_wise array
    //         $stats['shift_wise'] = array_values($stats['shift_wise']);

    //         return $stats;

    //     } catch (Exception $e) {
    //         Log::error('Error calculating member stats: '.$e->getMessage());
    //         return ['error' => 'Failed to calculate statistics'];
    //     }
    // }

    public function members(Request $request)
    {
        try {
            $search = trim($request->query('search'));
            $paginateParam = $request->disable_page_param;
            $filterBranch = $request->query('filter_branch_id');
            $filterStatus = $request->query('filter_status');
            $mainBranchId = Branch::where('type', 'main')->where('gym_id',$request->logged_gym_id)->first()?->id ?? null;
            $filterUserId = $request->query('filter_user_id');
            $startDate = $request->query('start_date');
            $endDate = $request->query('end_date');
            $users = null;
            $gym = Gym::find($request->logged_gym_id);
            $usersQuery = User::with('roles', 'memberProfile.plan', 'branch', 'statusHistory.createdBy', 'activityLogs.branch')->where('gym_id',$request->logged_gym_id)
                ->when($search, function ($query) use ($search) {
                    $query->where(function ($q) use ($search) {
                        $q->where('name', 'like', "%{$search}%")
                            ->orWhere('reference_num', 'like', "%{$search}%")
                            ->orWhere('email', 'like', "%{$search}%")
                            ->orWhere('phone','like',"%{$search}%")
                            ->orWhereHas('roles', function ($rq) use ($search) {
                                $rq->where('name', 'like', "%{$search}%");
                            });
                    });
                })
                ->whereHas('roles', function ($query) use ($gym) {
                    $query->where('name', $gym->reference_num.' Member');
                })->when($filterUserId, function ($query) use ($filterUserId) {
                    $query->where('id', $filterUserId);
                })
                ->when($filterBranch, function ($query) use ($filterBranch) {
                    $query->where('base_branch_id', $filterBranch);
                })
                ->when(! ($request->logged_branch_id == $mainBranchId && $request->user()->type == 'default'),
                    function ($query) use ($request) {
                        $query->where('base_branch_id', $request->logged_branch_id);
                    })
                ->when($filterStatus, function ($query) use ($filterStatus) {
                    $query->where('status', $filterStatus);
                })->when($startDate && $endDate , function($query) use ($startDate , $endDate){
                    $query->whereHas('memberProfile' , function($q) use ($startDate , $endDate){
                        $q->whereBetween('register_date',[$startDate , $endDate]);
                    });
                })
                ->orderBy('id', 'desc');
            if ($request->user()->hasRole($gym->reference_num.' Member')) {
                $usersQuery->where('id', $request->user()->id);
            }
            if ($paginateParam && $paginateParam == 1) {
                $users = $usersQuery->get();
            } else {
                $users = $usersQuery->paginate($request->limit ?? 10);
            }

            return apiSuccess($users, 'Members fetched successfully', 200);
        } catch (Exception $e) {
            return apiError('Failed to fetch members', 500, $e->getMessage());
        }
    }

    public function createMemberReference(Request $request)
    {
        try {
            $branch = Branch::find($request->logged_branch_id);
            $branchCode = $branch->reference_num;  
            $prefix = $branchCode.'-M';
           
            // Get last member for this branch
            $lastMember = User::where('reference_num', 'LIKE', $prefix.'%')->orderByRaw('CAST(SUBSTRING(reference_num, ? + 1) AS UNSIGNED) DESC', [strlen($prefix)])->first();
            if ($lastMember) {
                $lastRef = $lastMember->reference_num;
                // keep only number part
                $numberPart = substr($lastRef, strlen($prefix));
                $nextNumber = (int) $numberPart + 1;
                // Keep the same length as previous number part
                $newNumberPart = $nextNumber;

            } else {
                $newNumberPart = '1';
            }
            // Build new reference number
            $newRefNum = $prefix.$newNumberPart;

            return apiSuccess($newRefNum, 'New member ID fetched successfully', 200);
        } catch (Exception $e) {
            return apiError('Failed to fetch new member ID', 500, $e->getMessage());
        }
    }

    public function memberStore(Request $request)
    {
        $loggedGymId = $request->logged_gym_id;
        $gym = Gym::find($loggedGymId);
        $validator = Validator::make($request->all(), [
            'name' => 'required|string',
            'phone' => 'required',
            'password' => empty($request->id) ? 'required' : 'nullable',
            'profile_image' => [empty($request->id) ? 'required' : 'nullable', 'image', 'mimes:jpeg,jpg,png'],
            'fingerprint_data' => 'nullable|image|mimes:png',
            'address' => 'nullable|string',
            'register_date' => 'required|date',
            'id' => ['nullable', 'integer', function ($attribute, $value, $fail) use($loggedGymId , $gym) {
                $user = User::where('gym_id',$loggedGymId)->where('id',$value)->first();
                $memberProfile = MemberProfile::with('user')->whereHas('user',function($query) use ($loggedGymId){
                    $query->where('gym_id',$loggedGymId);
                })->where('user_id', $value)->first();
                if (! $user || ! $memberProfile || ! $user->hasRole($gym->reference_num.' Member')) {
                    return $fail('The selected user is not a valid member.');
                }
            }],

        ]);

        if ($validator->fails()) {
            return apiError('Validation failed', 422, $validator->errors()->first());
        }
        try {
            DB::beginTransaction();
            if(!$request->id){
                $memberLimit = $gym->member_limit;
                $membersCount = User::where('gym_id',$request->logged_gym_id)->where('user_type','member')->count();
                if($memberLimit && ($membersCount == $memberLimit)){
                    return apiError('Members limit reached' , 422 , 'Members limit reached. Please contact the administrator to increase the allowed number of members.');
                }
            }

            if (empty($request->id)) {
                $referenceNum = generateUserReferenceNum('member', $request->logged_branch_id);
            } else {
                $user = User::find($request->id);
                $referenceNum = $user->reference_num;
            }

            $role = Role::where('name', $gym->reference_num.' Member')->first();
            if (!$role) {
                $role = Role::create(['name' =>  $gym->reference_num.' Member' , 'guard_name' => 'sanctum']);
            }
            if ($request->cnic) {
                $existingMemberProfileCnic = MemberProfile::with('user')->whereHas('user',function($query) use ($loggedGymId){
                    $query->where('gym_id',$loggedGymId);
                })->where('cnic', $request->cnic)->when($request->id, function ($query) use ($request) {
                    $query->where('user_id', '<>', $request->id);
                })->exists();
                if ($existingMemberProfileCnic) {
                    DB::rollBack();
                    return apiError('Unable to proceed', 422, 'This CNIC is already registered to another member.');
                }
            }

            if ($request->email) {
                $existingMemberEmail = User::where('gym_id',$loggedGymId)->where('email', $request->email)->when($request->id, function ($query) use ($request) {
                    $query->where('id', '<>', $request->id);
                })->where('user_type','member')->exists();
                if ($existingMemberEmail) {
                    DB::rollBack();
                    return apiError('Unable to proceed', 422, 'This email is already registered to another member.');
                }
            }

            $data = [];
            $data = array_reduce(['name', 'phone','email'], function ($carry, $input) use ($request) {
                $carry[$input] = $request->input($input);

                return $carry;
            });

            $existingMember = $request->id ? User::where('gym_id',$loggedGymId)->where('phone', $request->phone)->where('id', '<>', $request->id)->where('user_type', 'member')->first() : User::where('gym_id',$loggedGymId)->where('phone', $request->phone)->where('user_type', 'member')->first();
            if ($existingMember) {
                DB::rollBack();
                return apiError('Unable to proceed', 422, 'This phone number is already registered to another member '.$existingMember->reference_num.'.');
            }

            $data['role_id'] = $role->id;
            $data['user_type'] = 'member';

            if ($request->password) {
                $data['password'] = bcrypt($request->password);
                $data['password_string'] = $request->password;
            }
            $memberData = [];
            // Add face
            if ($request->hasFile('profile_image')) {
                $profilePic = FileUploadHelper::uploadFile($request->file('profile_image'), 'users/profile');
                $data['profile_image'] = $profilePic;
                // fetch face embedding
                $faceEmbedding = global_face_embedding($referenceNum);
                if (empty($faceEmbedding)) {
                    return apiError('Failed to store member', 422, 'Face data not captured. Make sure the image contains a clear face.');
                }
                $memberData['face_encoding'] = json_encode($faceEmbedding);
            }

            if (empty($request->id)) {
                $data['status'] = 'inactive';
                $data['base_branch_id'] = $request->logged_branch_id;
                 $data['gym_id'] = $loggedGymId;
            }
            User::updateOrInsert(['id' => $request->input('id')], $data);
            $latestUser = $request->id ? User::where('gym_id',$loggedGymId)->where('id', $request->id)->first() : User::where('gym_id',$loggedGymId)->orderBy('id', 'desc')->first();
            // Assign role
            $latestUser->syncRoles($role);
            // Add fingerprint
            if ($request->hasFile('fingerprint_data')) {
                $fingerprintEnroll = enrollFingerprint($latestUser->id, 'member', $request->file('fingerprint_data'));
                if ($fingerprintEnroll['success'] == false) {
                    return apiError('Failed to store member', 422, $fingerprintEnroll['message']);
                }
            }
            $memberData = array_reduce(['address', 'register_date', 'cnic', 'whatsapp_num'], function ($carry, $input) use ($request) {
                $carry[$input] = $request->input($input);

                return $carry;
            }, $memberData);

            $memberData['user_id'] = $latestUser->id;
            MemberProfile::updateOrInsert(['user_id' => $latestUser->id], $memberData);
            // Assign reference number when created
            if (empty($request->id)) {
                $latestUser->update(['reference_num' => $referenceNum]);
            }
            if ($request->id) {
                $logTitle = 'Member Profile Update';
                $logDes = 'Member '.$latestUser->name.' '.$latestUser->reference_num.' profile updated successfully';
            } else {
                $logTitle = 'Member Registration';
                $logDes = 'Member '.$latestUser->name.' '.$latestUser->reference_num.' registered successfully';
            }
            GenerateSystemLogs($logTitle, $logDes, $latestUser->id, 'User', $latestUser->gym_id , $request->logged_branch_id, $request->ip());
            // Clear face embedding
            global_face_embedding($referenceNum, null, true);
            DB::commit();
            if (empty($request->id)) {
                return apiSuccess($latestUser, 'Member created successfully', 200);
            } else {
                return apiSuccess($latestUser, 'Member updated successfully', 200);
            }
        } catch (Exception $e) {
            DB::rollBack();

            return apiError('Failed to store member', 500, $e->getMessage());
        }
    }

    public function createFreezeRequestReference(Request $request)
    {
        $newRef = $this->generateFreezeRequestRef($request->logged_branch_id);

        return apiSuccess($newRef, 'Freeze request new ID fetched successfully', 200);
    }

    public function generateFreezeRequestRef($branchId)
    {
        $branch = Branch::find($branchId);
        $branchCode = $branch->reference_num;
        $prefix = $branchCode.'-FR';
        // $prefix = 'FR'.$branchCode;
        // Get last for this branch
        $last = FreezeRequest::where('reference_num', 'LIKE', $prefix.'%')->orderByRaw('CAST(SUBSTRING(reference_num, ? + 1) AS UNSIGNED) DESC', [strlen($prefix)])->first();
        if ($last) {
            $lastRef = $last->reference_num;
            // keep only number part
            $numberPart = substr($lastRef, strlen($prefix));
            $nextNumber = (int) $numberPart + 1;
            // Keep the same length as previous number part
            $newNumberPart = $nextNumber;
        } else {
            $newNumberPart = '1';
        }
        // Build new reference number
        $newRefNum = $prefix.$newNumberPart;

        return $newRefNum;
    }

    public function freezeRequestStore(Request $request)
    {
        $loggedGymId = $request->logged_gym_id;
        $gym = Gym::find($loggedGymId);
        $validator = Validator::make($request->all(), [
            'user_id' => ['required', 'integer', function ($attribute, $value, $fail) use ($loggedGymId , $gym) {
                $user = User::where('gym_id',$loggedGymId)->where('id',$value)->first();
                $memberProfile = MemberProfile::where('user_id', $value)->first();
                if (! $user || ! $memberProfile || ! $user->hasRole($gym->reference_num.' Member') || ! $user->status == 'active') {
                    return $fail('The selected user is not a valid member or is not active');
                }
            }],
            'start_date' => 'required|date',
            'reason' => 'nullable|string',
            'id' => [
            'nullable',
            Rule::exists('freeze_requests', 'id')->where(function ($query) use ($loggedGymId) {
                $query->where('gym_id', $loggedGymId);
            }),
            ],
          
        ]);

        if ($validator->fails()) {
            return apiError('Validation failed', 422, $validator->errors()->first());
        }

        try {
            if ($request->user()->hasRole($gym->reference_num.' Member')) {
                $user = User::where('id', $request->user()->id)->first();
            } else {
                $user = User::where('id', $request->user_id)->first();
            }
            $userPlan = MemberProfile::where('user_id', $request->user_id)->first();
            if (!$userPlan->current_plan_id || !$userPlan->current_plan_start_date || ! $userPlan->current_plan_expire_date) {
                return apiError('Unable to create freeze request', 422, 'User plan not started yet so cannot create freeze request');
            }
            // Freeze request start date must be greater than plan start date
            $userPlanStartDate = $userPlan->current_plan_start_date;
            $userPlanExpireDate = $userPlan->current_plan_expire_date;
            if ($request->start_date < $userPlanStartDate || $request->start_date > $userPlanExpireDate) {
                return apiError('Invalid freeze request', 422, 'Freeze request dates must fall within the member’s active plan period.');
            }

            // Validate attendace exist for that member for that date
            $existingAttendance = Attendance::where('user_id', $user->id)->where('date', $request->start_date)->exists();
            if ($existingAttendance) {
                return apiError('Unable to create freeze request', 422, 'Member attendance already exist for the selected date');
            }
             // Check freeze count limit for CURRENT plan only
           if(empty($request->id)){
                 $currentPlan = Plan::find($userPlan->current_plan_id);
                 if (!$currentPlan) {
                     DB::rollBack();
                     return apiError('Current plan not found', 422, 'Current plan not found');
                 }
                 $existingFreezeCount = FreezeRequest::where('user_id', $request->user_id)
                     ->where('plan_id', $userPlan->current_plan_id)
                     ->where('plan_start_date', $userPlan->current_plan_start_date) // Current plan instance
                     ->count();
                 if ($currentPlan->freeze_allowed_count &&$existingFreezeCount >= $currentPlan->freeze_allowed_count) {
                     DB::rollBack();
                     return apiError('Freeze limit exceeded', 422, 'Maximum freeze requests ('.$currentPlan->freeze_allowed_count.') reached for current plan');
                 }
             }
            // User existing pending freeze request
            $existingFreezeRequest = FreezeRequest::where('user_id', $request->user_id)->where('status', 'pending')->where('id', '<>', $request->id)->exists();
            if ($existingFreezeRequest) {
                return apiError('Failed to create freeze request', 422, 'Member freeze request already exists with status pending');
            }
            // Validate if freeze request already processed
            if ($request->id) {
                $freezeRequest = FreezeRequest::where('id', $request->id)->first();
                if ($freezeRequest->status == 'approved' || $freezeRequest->status == 'rejected') {
                    return apiError('Failed to update freeze request', 422, 'Freeze request already processed and cannot be updated');
                }
            }
            $data = [];
            $data = array_reduce(['user_id', 'start_date', 'reason'], function ($carry, $input) use ($request) {
                $carry[$input] = $request->input($input);

                return $carry;
            });
            if (empty($request->id)) {
                $data['generate_date'] = now()->toDateString();
                $data['generate_time'] = now()->toTimeString();
                $data['created_by_id'] = Auth::id();
                $data['branch_id'] = $request->logged_branch_id;
                $data['gym_id'] = $request->logged_gym_id;
            }
            $data['plan_id'] = $userPlan->current_plan_id;
            $data['plan_start_date'] = $userPlan->current_plan_start_date;
            $data['plan_expire_date'] = $userPlan->current_plan_expire_date;
            $data['status'] = 'pending';
            FreezeRequest::updateOrCreate(['id' => $request->input('id')], $data);
            $latestFreezeReq = $request->id ? FreezeRequest::where('id', $request->id)->first() : FreezeRequest::orderBy('id', 'desc')->first();
            // get reference num
            $freezeRequestRefNum = $this->generateFreezeRequestRef($latestFreezeReq->branch_id);
            $latestFreezeReq->update(['reference_num' => $freezeRequestRefNum]);
            if (empty($request->id)) {
                $description = 'Freeze request '.$latestFreezeReq->reference_num.' generated for member '.$user->name.' '.$user->reference_num.' by user '.$request->user()->reference_num.'.';
                // Generate notification
                $recipients = User::where('id', '<>', Auth::id())->where('gym_id',$loggedGymId)->whereNotIn('user_type', ['employee', 'member'])->get(['id', 'reference_num', 'name']);
                foreach ($recipients as $recipient) {
                    generateNotification($recipient->id, 'Freeze Request Generated', $description, 'member' , 'FreezeRequest' , $latestFreezeReq->id , $latestFreezeReq->branch_id, null);
                }
                // Generate system log
                GenerateSystemLogs('Freeze Request Generated', $description, $latestFreezeReq->id, 'FreezeRequest' , $user->gym_id , $request->logged_branch_id, $request->ip());
                GenerateSystemLogs('Member Freeze Request Generated', $description, $latestFreezeReq->user_id, 'User' , $user->gym_id  , $request->logged_branch_id, $request->ip());
            }

            return apiSuccess($latestFreezeReq, 'Freeze request stored successfully', 200);
        } catch (Exception $e) {
            return apiError('Failed to create freeze request', 500, $e->getMessage());
        }
    }

    public function freezeRequestUpdateStatus(Request $request)
    {
        $loggedGymId = $request->logged_gym_id;
        $validator = Validator::make($request->all(), [
            'status' => 'required|in:approved,rejected',
            'freeze_request_id' => ['required', 'integer', function ($attribute, $value, $fail) use ($loggedGymId) {
                $freezeRequest = FreezeRequest::where('gym_id',$loggedGymId)->where('id',$value)->first();
                if (! $freezeRequest || $freezeRequest->status !== 'pending') {
                    return $fail('Freeze request must be in pending state to approve/reject it.');
                }
                $user = User::where('gym_id',$loggedGymId)->where('id',$freezeRequest->user_id)->first();
                $userProfile = MemberProfile::with('plan')->whereHas('plan')->where('user_id', $freezeRequest->user_id)->first();
                if (! $user || ! $userProfile) {
                    return $fail('Member not found.');
                }
            }],
        ]);

        if ($validator->fails()) {
            return apiError('Validation failed', 422, $validator->errors()->first());
        }

        try {
            DB::beginTransaction();
            $freezeRequestRec = FreezeRequest::where('id', $request->freeze_request_id)->first();
            // new start
            // Get CURRENT member profile to check against current plan
            $memberProfile = MemberProfile::where('user_id', $freezeRequestRec->user_id)->first();
            if (!$memberProfile) {
                DB::rollBack();
                return apiError('Member profile not found', 422, 'Member profile not found');
            }
            
            // Get the CURRENT plan (may be different from freeze request's plan if plan was changed)
            $currentPlan = Plan::find($memberProfile->current_plan_id);
            if (!$currentPlan) {
                DB::rollBack();
                return apiError('Current plan not found', 422, 'Current plan not found');
            }
            
           
            // new end
            $data = [
                'status' => $request->status,
                'approve_date' => $request->status == 'approved' ? now()->toDateString() : null,
                'approve_time' => $request->status == 'approved' ? now()->toTimeString() : null,
                'approve_by_id' => $request->status == 'approved' ? Auth::id() : null,
                'reject_date' => $request->status == 'rejected' ? now()->toDateString() : null,
                'reject_time' => $request->status == 'rejected' ? now()->toTimeString() : null,
                'rejected_by_id' => $request->status == 'rejected' ? Auth::id() : null,
            ];

            if (($freezeRequestRec->plan_id == $memberProfile->current_plan_id) && ($freezeRequestRec->plan_start_date == $memberProfile->current_plan_start_date) && ($request->status == 'approved') && (now()->toDateString() >= $freezeRequestRec->start_date)) {
                $user = User::with('memberProfile')->where('id', $freezeRequestRec->user_id)->first();
                $memberProfile = $user->memberProfile;
                // Get last active status before freezing
                $lastActiveStatus = UserStatusDetail::where('user_id', $user->id)->where('plan_id', $memberProfile->current_plan_id)->where('plan_start_date', $memberProfile->current_plan_start_date)->where('status', 'active')->orderBy('id', 'desc')->first();
                if (! $lastActiveStatus) {
                    DB::rollBack();

                    return apiError('Last active status not found', 422, 'Last active status not found');
                }
                $freezeStartDate = Carbon::parse($freezeRequestRec->start_date);
                $remainingDays = 0;
                if ($lastActiveStatus && $lastActiveStatus->date) {
                    $lastActiveDate = Carbon::parse($lastActiveStatus->date);
                    $diffDays = $lastActiveDate->diffInDays($freezeStartDate);
                    $remainingDays = $lastActiveStatus->remaining_days - $diffDays;
                    if ($remainingDays <= 0) {
                        $remainingDays = 0;
                    }
                }
                // new start
                // Check if this is the FIRST freeze approval for CURRENT plan
                $firstFreezeApproval = FreezeRequest::where('user_id', $user->id)
                    ->where('plan_id', $memberProfile->current_plan_id)
                    ->where('plan_start_date', $memberProfile->current_plan_start_date)
                    ->where('status', 'approved')
                    ->whereNotNull('must_complete_by_date')
                    ->orderBy('approve_date', 'asc')
                    ->first();
                
                $mustCompleteByDate = null;
                
                if($currentPlan->freeze_allowed_days) {
                    if (!$firstFreezeApproval) {
                        // This is the FIRST freeze approval for CURRENT plan - set the deadline
                        $freezeAllowedDays = $currentPlan->freeze_allowed_days ?? 0;
                        $mustCompleteByDate = $freezeStartDate->copy()->addDays($freezeAllowedDays);
                        $data['must_complete_by_date'] = $mustCompleteByDate->toDateString();
                        $data['is_first_freeze'] = 1; // Mark as first freeze for this plan
                        
                        // Update plan_id and plan dates in freeze request to match current plan
                        $data['plan_id'] = $memberProfile->current_plan_id;
                        $data['plan_start_date'] = $memberProfile->current_plan_start_date;
                        $data['plan_expire_date'] = $memberProfile->current_plan_expire_date;
                    } else {
                        // NOT the first freeze for CURRENT plan - use the existing deadline
                        $mustCompleteByDate = Carbon::parse($firstFreezeApproval->must_complete_by_date);
                        $data['must_complete_by_date'] = $mustCompleteByDate->toDateString();
                        $data['is_first_freeze'] = 0;
                        
                        // Check if freeze start date is before the existing deadline
                        if ($freezeStartDate->greaterThan($mustCompleteByDate)) {
                            DB::rollBack();
                            return apiError('Cannot freeze after deadline', 422, 'Cannot create freeze request after the deadline ('.$mustCompleteByDate->toDateString().')');
                        }
                        
                        // Update plan_id and plan dates in freeze request to match current plan
                        $data['plan_id'] = $memberProfile->current_plan_id;
                        $data['plan_start_date'] = $memberProfile->current_plan_start_date;
                        $data['plan_expire_date'] = $memberProfile->current_plan_expire_date;
                    }
                }

                // new end
                $user->update(['status' => 'frozen']);
                UserStatusDetail::create(['user_id' => $user->id, 'status' => 'frozen', 'plan_id' => $memberProfile->current_plan_id, 'plan_start_date' => $memberProfile->current_plan_start_date, 'plan_expire_date' => null, 'date' => $freezeRequestRec->start_date, 'time' => now()->toTimeString(), 'updated_by_id' => Auth::id(), 'remaining_days' => $remainingDays, 'plan_total_days' => $lastActiveStatus->plan_total_days,'must_complete_by_date' => $mustCompleteByDate ?  $mustCompleteByDate->toDateString() : null]);
                $user->memberProfile->update(['current_plan_expire_date' => null, 'must_complete_by_date' => $mustCompleteByDate ? $mustCompleteByDate->toDateString() : null]);
                $data['process_status'] = 1;
                $description = 'Member '.$user->name.' '.$user->reference_num.' account frozen successfully by user '.$request->user()->reference_num.'.';
                // Generate system log
                GenerateSystemLogs('Member Account Frozen', $description, $user->id, 'User' , $user->gym_id , $freezeRequestRec->branch_id, null);

                // Generate notification
                $recipients = User::where('gym_id',$loggedGymId)->where('id', '<>', Auth::id())->where('gym_id',$loggedGymId)->whereNotIn('user_type', ['member'])
                    ->get(['id', 'reference_num', 'name']);
                foreach ($recipients as $recipient) {
                    generateNotification($recipient->id, 'Member Account Frozen', $description, 'member' , 'Member' , $user->id , $freezeRequestRec->branch_id, null);
                }
                generateNotification($freezeRequestRec->user_id, 'Account Frozen', 'Your account frozen successfully', 'member' , 'Member' , $user->id , $freezeRequestRec->branch_id, null);
                //send push notification
                $userFcmToken = $user->device_fcm_token ?? null;
                 if($userFcmToken){
                    sendFCM($userFcmToken ,'Account Frozen' , 'Your account frozen successfully.');
                }
            }
            $freezeRequestRec->update($data);
            DB::commit();

            return apiSuccess($freezeRequestRec, 'Freeze request '.$request->status.' successfully', 200);

        } catch (Exception $e) {
            DB::rollBack();

            return apiError('Failed to update freeze request', 500, $e->getMessage());
        }
    }

    public function freezeRequests(Request $request)
    {
        $gym = Gym::find($request->logged_gym_id);
        try {
            $search = trim($request->query('search'));
            $paginateParam = $request->disable_page_param;
            $filterBranch = $request->query('filter_branch_id');
            $mainBranchId = Branch::where('type', 'main')->where('gym_id',$gym->id)->first()?->id ?? null;
            $filterUserId = $request->query('filter_user_id');
            $freezeRequestQuery = FreezeRequest::with('member', 'createdByUser', 'approvedByUser', 'rejectedByUser', 'branch')->where('gym_id',$request->logged_gym_id)
                ->when($search, function ($query) use ($search) {
                    $query->where('reference_num', 'like', "%{$search}%")->
                    orWhereHas('member', function ($mq) use ($search) {
                        $mq->where('name', 'like', "%{$search}%")
                            ->orWhere('reference_num', 'like', "%{$search}%")
                            ->orWhere('email', 'like', "%{$search}%");
                    })->orWhereHas('createdByUser', function ($cq) use ($search) {
                        $cq->where('name', 'like', "%{$search}%")
                            ->orWhere('reference_num', 'like', "%{$search}%")
                            ->orWhere('email', 'like', "%{$search}%");
                    })->orWhereHas('approvedByUser', function ($aq) use ($search) {
                        $aq->where('name', 'like', "%{$search}%")
                            ->orWhere('reference_num', 'like', "%{$search}%")
                            ->orWhere('email', 'like', "%{$search}%");
                    })->orWhereHas('rejectedByUser', function ($rq) use ($search) {
                        $rq->where('name', 'like', "%{$search}%")
                            ->orWhere('reference_num', 'like', "%{$search}%")
                            ->orWhere('email', 'like', "%{$search}%");
                    });
                })->when($filterUserId, function ($query) use ($filterUserId) {
                    $query->where('user_id', $filterUserId);
                })
                ->when($filterBranch, function ($query) use ($filterBranch) {
                    $query->where('branch_id', $filterBranch);
                })
                ->when(! ($request->logged_branch_id == $mainBranchId && $request->user()->type == 'default'),
                    function ($query) use ($request) {
                        $query->where('branch_id', $request->logged_branch_id);
                    })
                ->orderBy('id', 'desc');
            if ($request->user()->hasRole($gym->reference_num.' Member')) {
                $freezeRequestQuery->where('user_id', Auth::id());
            }
            if ($paginateParam && $paginateParam == 1) {
                $freezeRequests = $freezeRequestQuery->get();
            } else {
                $freezeRequests = $freezeRequestQuery->paginate($request->limit ?? 10);
            }
            $totalFreezeRequestsQuery = FreezeRequest::when(!($request->logged_branch_id == $mainBranchId && $request->user()->type == 'default'),
                function ($query) use ($request) {
                    $query->where('branch_id', $request->logged_branch_id);
                });
            $pendingFreezeRequestsQuery = FreezeRequest::when(! ($request->logged_branch_id == $mainBranchId && $request->user()->type == 'default'),
                function ($query) use ($request) {
                    $query->where('branch_id', $request->logged_branch_id);
                })->where('status', 'pending');
            $approveFreezeRequestsQuery = FreezeRequest::when(! ($request->logged_branch_id == $mainBranchId && $request->user()->type == 'default'),
                function ($query) use ($request) {
                    $query->where('branch_id', $request->logged_branch_id);
                })->where('status', 'approved');
            $rejectFreezeRequestsQuery = FreezeRequest::when(! ($request->logged_branch_id == $mainBranchId && $request->user()->type == 'default'),
                function ($query) use ($request) {
                    $query->where('branch_id', $request->logged_branch_id);
                })->where('status', 'rejected');
            if ($request->user()->hasRole($gym->reference_num.' Member')) {
                $totalFreezeRequestsQuery->where('user_id', $request->user()->id);
                $pendingFreezeRequestsQuery->where('user_id', $request->user()->id);
                $approveFreezeRequestsQuery->where('user_id', $request->user()->id);
                $rejectFreezeRequestsQuery->where('user_id', $request->user()->id);
            }

            $totalFreezeRequests = $totalFreezeRequestsQuery->count();
            $pendingFreezeRequests = $pendingFreezeRequestsQuery->count();
            $approveFreezeRequests = $approveFreezeRequestsQuery->count();
            $rejectFreezeRequests = $rejectFreezeRequestsQuery->count();
            $data = [
                'freeze_requests' => $freezeRequests,
                'total_freeze_requests' => $totalFreezeRequests,
                'pending_freeze_requests' => $pendingFreezeRequests,
                'approve_freeze_requests' => $approveFreezeRequests,
                'rejected_freeze_requests' => $rejectFreezeRequests,
            ];

            return apiSuccess($data, 'Freeze requests fetched successfully', 200);
        } catch (Exception $e) {
            return apiError('Failed to fetch freeze requests', 500, $e->getMessage());
        }

    }

    public function unfreezeMember(Request $request)
    {
        $loggedGymId = $request->logged_gym_id;
        $gym = Gym::find($request->logged_gym_id);
        $validator = Validator::make($request->all(), [
            'user_id' => ['required', 'integer', function ($attribute, $value, $fail) use ($loggedGymId , $gym) {
                $user = User::where('gym_id',$loggedGymId)->where('id',$value)->first();
                $memberProfile = MemberProfile::with('plan')->whereHas('plan')->where('user_id', $value)->first();
                if (! $user || ! $memberProfile || ! $user->hasRole($gym->reference_num.' Member')) {
                    return $fail('The selected user is not a valid member, or no active membership plan was found');
                }
            }],
        ]);

        if ($validator->fails()) {
            return apiError('Validation failed', 422, $validator->errors()->first());
        }

        try {
            DB::beginTransaction();
            $user = User::find($request->user_id);
            if ($user->status != 'frozen') {
                DB::rollBack();

                return apiError('Unfreeze not allowed', 422, 'This member is not currently frozen and cannot be unfrozen.');
            }
            $memberProfile = MemberProfile::with('plan')->where('user_id', $user->id)->first();
            // new start
            
            // Get active freeze for CURRENT plan
            $latestFreezeRequest = FreezeRequest::where('user_id', $user->id)
                ->where('plan_id', $memberProfile->current_plan_id)
                ->where('plan_start_date', $memberProfile->current_plan_start_date) // Current plan instance
                ->where('status', 'approved')
                ->whereNull('end_date')
                ->orderBy('id', 'desc')
                ->first();

            // if (!$latestFreezeRequest) {
            //     DB::rollBack();
            //     return apiError('No active freeze found', 422, 'No active freeze record found for current plan.');
            // }
            $lastFrozen = UserStatusDetail::where('user_id', $user->id)->where('plan_id', $memberProfile->current_plan_id)->where('plan_start_date', $memberProfile->current_plan_start_date)->where('status', 'frozen')->orderBy('id', 'desc')->first();
            if (!$lastFrozen) {
                DB::rollBack();
                return apiError('Frozen status not found', 422, 'Frozen status record not found for current plan.');
            }
            // new end
            // $lastFrozen = UserStatusDetail::where('user_id', $user->id)->where('plan_id', $memberProfile->current_plan_id)->where('plan_start_date', $memberProfile->current_plan_start_date)->where('status', 'frozen')->orderBy('id', 'desc')->first();
            $remainingDays = $memberProfile->remaining_days_balance;
            // if($latestFreezeRequest  && ($latestFreezeRequest->start_date > now()->toDateString())) {
            //     DB::rollBack();
            //     return apiError( 'Unfreeze failed', 422, 'Unfreeze operation failed because no active freeze record was found for this member.' );
            // }
            $startDate = Carbon::parse($lastFrozen->date);
            $endDate = Carbon::parse(now()->toDateString());
            $durationDays = $startDate->diffInDays($endDate);
            if ($latestFreezeRequest && ($latestFreezeRequest->start_date <= now()->toDateString())) {
                // Update expire dates and user status
                $latestFreezeRequest->update(['end_date' => now()->toDateString(), 'duration_days' => $durationDays]);
            }

            $userLatestActiveStatus = UserStatusDetail::where('user_id', $user->id)->where('plan_id', $memberProfile->current_plan_id)->where('plan_start_date', $memberProfile->current_plan_start_date)->where('status', 'active')->orderBy('id', 'desc')->first();
            if (! $userLatestActiveStatus) {
                DB::rollBack();
                return apiError('Failed to unfreeze', 422, 'Member active status not found');
            }

            // new start
            $firstFreezeApproval = FreezeRequest::where('user_id', $user->id)
            ->where('plan_id', $memberProfile->current_plan_id)
            ->where('plan_start_date', $memberProfile->current_plan_start_date)
            ->where('status', 'approved')
            ->orderBy('approve_date', 'asc')
            ->first();
        
            // Calculate new expiry date: from now + remaining days
            $newExpireDate = $endDate->copy()->addDays($remainingDays);
            $mustCompleteByDate = null;
            $lostDays = 0;
            
            // ONLY apply constraint if must_complete_by_date exists
            if ($firstFreezeApproval && $firstFreezeApproval->must_complete_by_date) {
                $mustCompleteByDate = Carbon::parse($firstFreezeApproval->must_complete_by_date);
                
                // If the deadline has already passed
                if ($endDate->greaterThan($mustCompleteByDate)) {
                    DB::rollBack();
                    return apiError('Freeze deadline passed', 422, 
                        'The deadline to use remaining days ('.$mustCompleteByDate->toDateString().') has already passed.');
                }
                
                // Apply constraint: cannot go beyond the original must_complete_by_date
                if ($newExpireDate->greaterThan($mustCompleteByDate)) {
                    $newExpireDate = $mustCompleteByDate;
                    
                    // Calculate lost days
                    $actualUsableDays = $endDate->diffInDays($mustCompleteByDate);
                    if ($actualUsableDays < $remainingDays) {
                        $lostDays = $remainingDays - $actualUsableDays;
                    }
                }
            }
            // end end
            $user->update(['status' => 'active']);
            $memberProfile->update(['current_plan_expire_date' => $newExpireDate]);
            // Maintian history
            UserStatusDetail::create(['user_id' => $user->id, 'status' => 'active', 'plan_id' => $memberProfile->current_plan_id, 'plan_start_date' => $memberProfile->current_plan_start_date, 'plan_expire_date' => $newExpireDate, 'date' => now()->toDateString(), 'time' => now()->toTimeString(), 'updated_by_id' => Auth::id(), 'remaining_days' => $remainingDays, 'plan_total_days' => $userLatestActiveStatus->plan_total_days,'must_complete_by_date' => $mustCompleteByDate ? $mustCompleteByDate->toDateString() : null,]);
            $currentPlan = Plan::where('id', $memberProfile->current_plan_id)->first();
            // Generate System Log
            GenerateSystemLogs('Member Account Unfrozen', 'Member '.$user->reference_num.' account has been successfully unfrozen by user '.$request->user()->reference_num.'.', $user->id, 'User', $user->gym_id , $currentPlan->branch_id, $request->ip());
            // Generate notification
            $recipients = User::where('gym_id',$user->gym_id)->where('id', '<>', Auth::id())->whereNotIn('user_type', ['member'])
                ->get(['id', 'reference_num', 'name']);
            foreach ($recipients as $recipient) {
                generateNotification($recipient->id, 'Member Account Unfrozen', 'Member '.$user->reference_num.' account has been successfully unfrozen by user '.$request->user()->reference_num.'.', 'member' , 'Member' , $user->id , $currentPlan->branch_id, null);
            }
            generateNotification($user->id, 'Your Account Unfrozen', 'Your account has been successfully unfrozen.' , 'member' , 'Member' , $user->id , $currentPlan->branch_id, null);
            //send push notification
            $userFcmToken = $user->device_fcm_token ?? null;
             if($userFcmToken){
                sendFCM($userFcmToken ,'Your Account Unfrozen' , 'Your account has been successfully unfrozen.');
            }
            DB::commit();

            return apiSuccess(null, 'Member unfrozen successfully', 200);

        } catch (Exception $e) {
            DB::rollBack();

            return apiError('Unfreeze failed', 500, $e->getMessage());
        }
    }

    public function freezeMember(Request $request)
    {
        $loggedGymId = $request->logged_gym_id;
        $gym = Gym::find($loggedGymId);
        $validator = Validator::make($request->all(), [
            'user_id' => ['required', 'integer', function ($attribute, $value, $fail) use ($loggedGymId , $gym) {
                $user = User::where('gym_id',$loggedGymId)->where('id',$value)->first();
                $memberProfile = MemberProfile::with('plan')->whereHas('plan')->where('user_id', $value)->first();
                if (! $user || ! $memberProfile || ! $user->hasRole($gym->reference_num.' Member') || $user->status != 'active') {
                    return $fail('The selected user is not a valid member, or no active membership plan was found');
                }
            }],
        ]);

        if ($validator->fails()) {
            return apiError('Validation failed', 422, $validator->errors()->first());
        }

        try {
            DB::beginTransaction();
            $user = User::with('memberProfile')->where('id', $request->user_id)->first();
            $memberProfile = $user->memberProfile;
            // Get last active status before freezing
            $lastActiveStatus = UserStatusDetail::where('user_id', $user->id)->where('plan_id', $memberProfile->current_plan_id)->where('plan_start_date', $memberProfile->current_plan_start_date)->where('status', 'active')->orderBy('id', 'desc')->first();
            if (! $lastActiveStatus) {
                DB::rollBack();

                return apiError('Last active status not found', 422, 'Last active status not found');
            }
            $freezeStartDate = Carbon::parse(now()->toDateString());
            // Validate attendace exist for that member for that date
            $existingAttendance = Attendance::where('user_id', $user->id)->where('date', $freezeStartDate)->exists();
            if ($existingAttendance) {
                return apiError('Failed to freeze member', 422, 'Member attendance already exist for today');
            }
            $remainingDays = 0;
            if ($lastActiveStatus && $lastActiveStatus->date) {
                $lastActiveDate = Carbon::parse($lastActiveStatus->date);
                $diffDays = $lastActiveDate->diffInDays($freezeStartDate);
                $remainingDays = $lastActiveStatus->remaining_days - $diffDays;
                if ($remainingDays <= 0) {
                    $remainingDays = 0;
                }
            }
            $user->update(['status' => 'frozen']);
            UserStatusDetail::create(['user_id' => $user->id, 'status' => 'frozen', 'plan_id' => $memberProfile->current_plan_id, 'plan_start_date' => $memberProfile->current_plan_start_date, 'plan_expire_date' => null, 'date' => now()->toDateString(), 'time' => now()->toTimeString(), 'updated_by_id' => Auth::id(), 'remaining_days' => $remainingDays, 'plan_total_days' => $lastActiveStatus->plan_total_days]);
            $user->memberProfile->update(['current_plan_expire_date' => null]);
            $currentPlan = Plan::where('id', $memberProfile->current_plan_id)->first();
            // Generate System Log
            GenerateSystemLogs('Member Account Frozen', 'Member '.$user->reference_num.' account has been successfully frozen.', $user->id, 'User', $user->gym_id , $currentPlan->branch_id, $request->ip());
            // Generate notification
            $description = 'Member '.$user->name.' '.$user->reference_num.' account frozen successfully by user '.$request->user()->reference_num.'.';
            $recipients = User::where('id', '<>', Auth::id())->where('gym_id',$loggedGymId)->whereNotIn('user_type', ['member'])
                ->get(['id', 'reference_num', 'name']);
            foreach ($recipients as $recipient) {
                generateNotification($recipient->id, 'Member Account Frozen', $description, 'member' , 'Member' , $user->id , $currentPlan->branch_id, null);
            }
            generateNotification($user->id, 'Account Frozen', 'Your account frozen successfully', 'member' , 'Member' , $user->id , $currentPlan->branch_id, null);
            //send push notification
            $userFcmToken = $user->device_fcm_token ?? null;
             if($userFcmToken){
                sendFCM($userFcmToken ,'Account Frozen' , 'Your account frozen successfully.');
            }
            DB::commit();

            return apiSuccess($user, 'Member frozen successfully', 200);
        } catch (Exception $e) {
            return apiError('Failed to freeze member', 500, $e->getMessage());
        }
    }

    public function importMemberCsv(Request $request)
    {
        $existingMemberArr = [];
        $existingMemberCnicArr = [];
        $branchId = $request->logged_branch_id;
        if ($request->hasFile('member_csv')) {
            $uploadedFile = $request->file('member_csv');

            $fileContents = file($uploadedFile->path());
            $header = null;
            foreach ($fileContents as $row) {
                DB::beginTransaction();
                $data = str_getcsv($row);
                if (! $header) {
                    $header = $data;
                } else {
                    $userData = [];
                    $memberData = [];
                    $phone = $data[0];
                    $name = $data[1];
                    $password = $data[2];
                    $profileImageUrl = $data[3];
                    $address = $data[4];
                    $registerDate = $data[5];
                    $cnic = $data[6];
                    $whatsappNum = $data[7];
                    $role = Role::where('name', 'Member')->first();
                    if (! $role) {
                        DB::rollBack();

                        return apiError('Invalid role', 422, 'Default role not found');
                    }
                    $userData['name'] = $name;
                    $userData['phone'] = $phone;
                    $userData['password'] = bcrypt($password);
                    $userData['role_id'] = $role->id;
                    $userData['user_type'] = 'member';
                    $userData['status'] = 'inactive';
                    $userData['base_branch_id'] = $branchId;
                    $memberData['address'] = $address;
                    $memberData['register_date'] = $registerDate;
                    $memberData['cnic'] = $cnic;
                    $memberData['whatsapp_num'] = $whatsappNum;

                    $existingMember = User::where('phone', $phone)->where('user_type', 'member')->first();
                    $existingMemberCnic = MemberProfile::where('cnic', $cnic)->where('user_type', 'member')->first();
                    if ($existingMember) {
                        $existingMemberArr[] = $phone;
                    } elseif ($existingMemberCnic) {
                        $existingMemberCnicArr = $cnic;
                    } else {
                        // Store profile image and save face encoding
                        $profileImagePath = null;
                        if (! empty($profileImageUrl)) {
                            try {
                                // Fetch image
                                $response = Http::timeout(20)->get($profileImageUrl);
                                if ($response->successful()) {
                                    // Generate unique filename
                                    $extension = 'jpg';
                                    $filename = 'member_'.Str::random(10).'.'.$extension;
                                    // Save image to storage
                                    Storage::put('public/users/profile'.$filename, $response->body());
                                    // Store image path for DB
                                    $profileImagePath = 'storage/users/profile'.$filename;
                                    $userData['profile_image'] = $profileImagePath;
                                    $tempPath = asset($profileImagePath);
                                    $embedding = getEmbedding($tempPath);
                                    $memberData['face_encoding'] = json_encode($embedding);
                                }
                            } catch (\Exception $e) {
                                DB::rollBack();

                                return apiError('Failed to import members', 500, $e->getMessage());
                            }
                        }
                        $branch = Branch::find($request->logged_branch_id);
                        $branchCode = $branch->reference_num;
                        $prefix = $branchCode.'-M';
                        // Get last member for this branch
                        $lastMember = User::where('reference_num', 'LIKE', $prefix.'%')->orderByRaw('CAST(SUBSTRING(reference_num, ? + 1) AS UNSIGNED) DESC', [strlen($prefix)])->first();
                        if ($lastMember) {
                            $lastRef = $lastMember->reference_num;
                            // keep only number part
                            $numberPart = substr($lastRef, strlen($prefix));
                            $nextNumber = (int) $numberPart + 1;
                            // Keep the same length as previous number part
                            $newNumberPart = $nextNumber;

                        } else {
                            $newNumberPart = '1';
                        }
                        // Build new reference number
                        $newRefNum = $prefix.$newNumberPart;
                        $userData['reference_num'] = $newRefNum;
                        $user = User::create($userData);
                        $memberData['user_id'] = $user->id;
                        MemberProfile::create($memberData);
                        DB::commit();

                        return apiSuccess(null, 'Members imported successfuly', 200);
                    }
                }
            }

            if (! empty($existingClientArr)) {
                $existingClientEmailsString = implode(', ', $existingClientArr);

                return apiError('Partial members added', 409, 'Members with emails '.$existingClientEmailsString.' already exist');
            }

            if (! empty($existingMemberCnicArr)) {
                $existingMemberCnicString = implode(', ', $existingMemberCnicArr);

                return apiError('Partial members added', 409, 'Members with CNIC '.$existingMemberCnicString.' already exist');
            }

            return apiSuccess(null, 'Members added successfully', 200);
        } else {
            return apiError('Member CSV file not found', 500, 'Member CSV file not found');
        }
    }

    public function memberDetails(Request $request)
    {
        $loggedGymId = $request->logged_gym_id;
        $gym = Gym::find($loggedGymId);
        $validator = Validator::make($request->all(), [
            'filter_user_id' => ['required', 'integer', function ($attribute, $value, $fail) use ($loggedGymId , $gym) {
                $user = User::where('gym_id',$loggedGymId)->where('id',$value)->first();
                if (!$user) {
                    return $fail('User not found.');
                }
            }],
        ]);

        if ($validator->fails()) {
            return apiError('Validation failed', 422, $validator->errors()->first());
        }

        try {
            $search = trim($request->query('search'));
            $paginateParam = $request->disable_page_param;
            $filterUserId = $request->query('filter_user_id');
            $users = null;
            $usersQuery = User::with('roles', 'memberProfile.plan', 'branch', 'statusHistory.createdBy', 'activityLogs.branch')
                ->when($search, function ($query) use ($search) {
                    $query->where(function ($q) use ($search) {
                        $q->where('name', 'like', "%{$search}%")
                            ->orWhere('reference_num', 'like', "%{$search}%")
                            ->orWhere('email', 'like', "%{$search}%")
                            ->orWhereHas('roles', function ($rq) use ($search) {
                                $rq->where('name', 'like', "%{$search}%");
                            });
                    });
                })
                ->whereHas('roles', function ($query) use ($gym) {
                    $query->where('name', $gym->reference_num.' Member');
                })->when($filterUserId, function ($query) use ($filterUserId) {
                    $query->where('id', $filterUserId);
                })
                ->orderBy('id', 'desc');
            if ($request->user()->hasRole($gym->reference_num.' Member')) {
                $usersQuery->where('id', $request->user()->id);
            }
            if ($paginateParam && $paginateParam == 1) {
                $users = $usersQuery->get();
            } else {
                $users = $usersQuery->paginate($request->limit ?? 10);
            }

            return apiSuccess($users, 'Member fetched successfully', 200);
        } catch (Exception $e) {
            return apiError('Failed to fetch member', 500, $e->getMessage());
        }
    }

    public function memberFeeCollections(Request $request)
    {
        $loggedGymId = $request->logged_gym_id;
        $gym = Gym::find($loggedGymId);
        $validator = Validator::make($request->all(), [
            'filter_user_id' => ['required', 'integer', function ($attribute, $value, $fail) use ($loggedGymId , $gym) {
                $user = User::where('gym_id',$loggedGymId)->where('id',$value)->first();
                if (!$user) {
                    return $fail('User not found.');
                }
            }],
        ]);

        if ($validator->fails()) {
            return apiError('Validation failed', 422, $validator->errors()->first());
        }

        try {
            $search = trim($request->query('search'));
            $startDate = $request->query('start_date');
            $endDate = $request->query('end_date');
            $filterDepositMethod = $request->query('filter_deposit_method');
            $filterUserId = $request->query('filter_user_id');
            $disablePaginateParam = $request->disable_page_param;
            $filterBranchId = $request->query('filter_branch_id');
            $feeCollectionQuery = FeeCollection::with('member', 'createdByUser', 'plan', 'branch', 'transaction.branch','transaction.bank')->where('gym_id',$request->logged_gym_id)
                ->when($search, function ($query) use ($search) {
                    $query->where(function ($q) use ($search) {
                        $q->whereHas('member', function ($q) use ($search) {
                            $q->where('name', 'like', "%{$search}%")
                                ->orWhere('reference_num', 'like', "%{$search}%")
                                ->orWhere('email', 'like', "%{$search}%")
                                ->orWhereHas('roles', function ($rq) use ($search) {
                                    $rq->where('name', 'like', "%{$search}%");
                                });
                        })->orWhereHas('createdByUser', function ($cq) use ($search) {
                            $cq->where('name', 'like', "%{$search}%")
                                ->orWhere('reference_num', 'like', "%{$search}%");
                        })->orWhereHas('plan', function ($pq) use ($search) {
                            $pq->where('name', 'like', "%{$search}%");
                        });
                    });

                })->when($filterDepositMethod, function ($query) use ($filterDepositMethod) {
                    $query->where('deposit_method', $filterDepositMethod);
                })
                ->when($startDate && $endDate, function ($query) use ($startDate, $endDate) {
                    $query->whereBetween('generate_date', [$startDate, $endDate]);
                })
                ->when($filterUserId, function ($query) use ($filterUserId) {
                    $query->where('user_id', $filterUserId);
                })->when($filterBranchId, function ($query) use ($filterBranchId) {
                    $query->where('branch_id', $filterBranchId);
                })->orderBy('id', 'desc');

            if ($request->user()->hasRole($gym->reference_num.' Member')) {
                $feeCollectionQuery->where('user_id', $request->user()->id);
            }

            if ($disablePaginateParam && $disablePaginateParam == 1) {
                $feeCollections = $feeCollectionQuery->get();
            } else {
                $feeCollections = $feeCollectionQuery->paginate($request->limit ?? 10);
            }
            $systemSettingCurrency = $systemSettings?->currency?->symbol ?? 'Rs';
            $data = [
                'fee_collections' => $feeCollections,
                'system_currency' => $systemSettingCurrency,
            ];

            return apiSuccess($data, 'Fee collections fetched successfully', 200);
        } catch (Exception $e) {
            return apiError('Failed to fetch fee collections', 500, $e->getMessage());
        }
    }

    public function memberFreezeRequests(Request $request)
    {
        $loggedGymId = $request->logged_gym_id;
        $gym = Gym::find($loggedGymId);
        $validator = Validator::make($request->all(), [
            'filter_user_id' => ['required', 'integer', function ($attribute, $value, $fail) use ($loggedGymId , $gym) {
                $user = User::where('gym_id',$loggedGymId)->where('id',$value)->first();
                if (!$user) {
                    return $fail('User not found.');
                }
            }],
        ]);

        if ($validator->fails()) {
            return apiError('Validation failed', 422, $validator->errors()->first());
        }
        try {
            $isMember = false;
            $search = trim($request->query('search'));
            $paginateParam = $request->disable_page_param;
            $filterUserId = $request->query('filter_user_id');
            $filterBranchId = $request->query('filter_branch_id');
             $mainBranchId = Branch::where('type', 'main')->where('gym_id',$gym->id)->first()?->id ?? null;
            $freezeRequestQuery = FreezeRequest::with('member', 'createdByUser', 'approvedByUser', 'rejectedByUser', 'branch')->where('gym_id',$request->logged_gym_id)
                ->when($search, function ($query) use ($search) {
                    $query->whereHas('member', function ($mq) use ($search) {
                        $mq->where('name', 'like', "%{$search}%")
                            ->orWhere('reference_num', 'like', "%{$search}%")
                            ->orWhere('email', 'like', "%{$search}%");
                    })->orWhereHas('createdByUser', function ($cq) use ($search) {
                        $cq->where('name', 'like', "%{$search}%")
                            ->orWhere('reference_num', 'like', "%{$search}%")
                            ->orWhere('email', 'like', "%{$search}%");
                    })->orWhereHas('approvedByUser', function ($aq) use ($search) {
                        $aq->where('name', 'like', "%{$search}%")
                            ->orWhere('reference_num', 'like', "%{$search}%")
                            ->orWhere('email', 'like', "%{$search}%");
                    })->orWhereHas('rejectedByUser', function ($rq) use ($search) {
                        $rq->where('name', 'like', "%{$search}%")
                            ->orWhere('reference_num', 'like', "%{$search}%")
                            ->orWhere('email', 'like', "%{$search}%");
                    });
                })->when($filterUserId, function ($query) use ($filterUserId) {
                    $query->where('user_id', $filterUserId);
                })->when($filterBranchId, function ($query) use ($filterBranchId) {
                    $query->where('branch_id', $filterBranchId);
                }) 
                ->orderBy('id', 'desc');

            if ($request->user()->hasRole($gym->reference_num.' Member')) {
                $freezeRequestQuery->where('user_id', Auth::id());
                $isMember = true;
            }
            if ($paginateParam && $paginateParam == 1) {
                $freezeRequests = $freezeRequestQuery->get();
            } else {
                $freezeRequests = $freezeRequestQuery->paginate($request->limit ?? 10);
            }
            $totalFreezeRequestsQuery = FreezeRequest::where('user_id',$request->filter_user_id);
            $pendingFreezeRequestsQuery = FreezeRequest::where('user_id',$request->filter_user_id)->where('status', 'pending');
            $approveFreezeRequestsQuery = FreezeRequest::where('user_id',$request->filter_user_id)->where('status', 'approved');
            $rejectFreezeRequestsQuery = FreezeRequest::where('user_id',$request->filter_user_id)->where('status', 'rejected');

            if ($request->user()->hasRole($gym->reference_num.' Member')) {
                $totalFreezeRequestsQuery->where('user_id', $request->user()->id);
                $pendingFreezeRequestsQuery->where('user_id', $request->user()->id);
                $approveFreezeRequestsQuery->where('user_id', $request->user()->id);
                $rejectFreezeRequestsQuery->where('user_id', $request->user()->id);
            }

            $totalFreezeRequests = $totalFreezeRequestsQuery->count();
            $pendingFreezeRequests = $pendingFreezeRequestsQuery->count();
            $approveFreezeRequests = $approveFreezeRequestsQuery->count();
            $rejectFreezeRequests = $rejectFreezeRequestsQuery->count();
            $data = [
                'freeze_requests' => $freezeRequests,
                'total_freeze_requests' => $totalFreezeRequests,
                'pending_freeze_requests' => $pendingFreezeRequests,
                'approve_freeze_requests' => $approveFreezeRequests,
                'rejected_freeze_requests' => $rejectFreezeRequests,
            ];

            if ($isMember) {
                $data['remaining_grace_days'] = $request->user()->memberProfile->remaining_grace_days;
                $data['freeze_allow_count'] = $request->user()->memberProfile->freeze_allow_count;
                $data['freeze_used_count'] = $request->user()->memberProfile->freeze_used_count;

            }

            return apiSuccess($data, 'Freeze requests fetched successfully', 200);
        } catch (Exception $e) {
            return apiError('Failed to fetch freeze requests', 500, $e->getMessage());
        }

    }

    public function memberAttendances(Request $request)
    {
        $loggedGymId = $request->logged_gym_id;
        $gym = Gym::find($loggedGymId);
        $validator = Validator::make($request->all(), [
            'filter_user_id' => ['required', 'integer', function ($attribute, $value, $fail) use ($loggedGymId , $gym) {
                $user = User::where('gym_id',$loggedGymId)->where('id',$value)->first();
                if (!$user) {
                    return $fail('User not found.');
                }
            }],
            // 'filter_user_id' => 'required|exists:users,id',
        ]);

        if ($validator->fails()) {
            return apiError('Validation failed', 422, $validator->errors()->first());
        }

        try {
            $search = trim($request->query('search'));
            $paginateParam = $request->disable_page_param;
            $filterUserId = $request->query('filter_user_id');
            $filterBranchId = $request->query('filter_branch_id');
            $startDate = $request->query('start_date');
            $endDate = $request->query('end_date');
            $attendancesQuery = Attendance::with('user', 'branch', 'createdBy','attendanceDetails')->where('gym_id',$loggedGymId)
                ->when($search, function ($query) use ($search) {
                    $query->where(function ($q) use ($search) {
                        $q->whereHas('user', function ($uq) use ($search) {
                            $uq->where('name', 'like', "%{$search}%")
                                ->orWhere('reference_num', 'like', "%{$search}%")
                                ->orWhere('email', 'like', "%{$search}%")
                                ->orWhereHas('roles', function ($rq) use ($search) {
                                    $rq->where('name', 'like', "%{$search}%");
                                });
                        });

                    });
                })->when($filterUserId, function ($query) use ($filterUserId) {
                    $query->where('user_id', $filterUserId);
                })
                ->where('user_type', 'member')->when($startDate && $endDate, function ($query) use ($startDate, $endDate) {
                    $query->whereBetween('date', [$startDate, $endDate]);
                })->when($filterBranchId, function ($query) use ($filterBranchId) {
                    $query->where('branch_id', $filterBranchId);
                })
                ->orderBy('id', 'desc');

            if (($request->user()->user_type == 'employee' && $request->user_type == 'employee') || ($request->user()->hasRole($gym->reference_num.' Member') && $request->user_type == 'member')) {
                $attendancesQuery->where('user_id', $request->user()->id);
            }

            if ($paginateParam && $paginateParam == 1) {
                $attendances = $attendancesQuery->get();
            } else {
                $attendances = $attendancesQuery->paginate($request->limit ?? 10);
            }

            return apiSuccess($attendances, 'Attendances fetched successfully', 200);
        } catch (Exception $e) {
            return apiError('Failed to fetch attendances', 500, $e->getMessage());
        }
    }

    public function memberPlanTransfers(Request $request)
    {
        $loggedGymId = $request->logged_gym_id;
        $gym = Gym::find($loggedGymId);
        $validator = Validator::make($request->all(), [
            'filter_user_id' => ['required', 'integer', function ($attribute, $value, $fail) use ($loggedGymId , $gym) {
                $user = User::where('gym_id',$loggedGymId)->where('id',$value)->first();
                if (!$user) {
                    return $fail('User not found.');
                }
            }],
            // 'filter_user_id' => 'required|exists:users,id',
        ]);

        if ($validator->fails()) {
            return apiError('Validation failed', 422, $validator->errors()->first());
        }

        try {
            $search = trim($request->query('search'));
            $startDate = $request->query('start_date');
            $endDate = $request->query('end_date');
            $filterUserId = $request->query('filter_user_id');
            $filterDepositMethod = $request->query('filter_deposit_method');
            $disablePaginateParam = $request->disable_page_param;
            $filterBranchId = $request->query('filter_branch_id');
            $planTransferQuery = PlanTransfer::with('member', 'createdByUser', 'transferedPlan', 'previousPlan', 'branch')->where('gym_id',$loggedGymId)
                ->when($search, function ($query) use ($search) {
                    $query->where(function ($q) use ($search) {
                        $q->whereHas('member', function ($q) use ($search) {
                            $q->where('name', 'like', "%{$search}%")
                                ->orWhere('reference_num', 'like', "%{$search}%")
                                ->orWhere('email', 'like', "%{$search}%")
                                ->orWhereHas('roles', function ($rq) use ($search) {
                                    $rq->where('name', 'like', "%{$search}%");
                                });
                        })->orWhereHas('createdByUser', function ($cq) use ($search) {
                            $cq->where('name', 'like', "%{$search}%")
                                ->orWhere('reference_num', 'like', "%{$search}%");
                        })->orWhereHas('transferedPlan', function ($pq) use ($search) {
                            $pq->where('name', 'like', "%{$search}%");
                        })->orWhereHas('previousPlan', function ($pq) use ($search) {
                            $pq->where('name', 'like', "%{$search}%");
                        });
                    });

                })->when($filterDepositMethod, function ($query) use ($filterDepositMethod) {
                    $query->where('deposit_method', $filterDepositMethod);
                })->when($filterUserId, function ($query) use ($filterUserId) {
                    $query->where('user_id', $filterUserId);
                })
                ->when($startDate && $endDate, function ($query) use ($startDate, $endDate) {
                    $query->whereBetween('generate_date', [$startDate, $endDate]);
                })->when($filterBranchId, function ($query) use ($filterBranchId) {
                    $query->where('branch_id', $filterBranchId);
                })->orderBy('id', 'desc');

            if ($request->user()->hasRole($gym->reference_num.' Member')) {
                $planTransferQuery->where('user_id', $request->user()->id);
            }

            if ($disablePaginateParam && $disablePaginateParam == 1) {
                $planTransfers = $planTransferQuery->get();
            } else {
                $planTransfers = $planTransferQuery->paginate($request->limit ?? 10);
            }

            return apiSuccess($planTransfers, 'Plan transfers fetched successfully', 200);
        } catch (Exception $e) {
            return apiError('Failed to fetch plan transfers', 500, $e->getMessage());
        }
    }

    function memberDelete(Request $request){
        $loggedGymId = $request->logged_gym_id;
        $gym = Gym::find($loggedGymId);
        $validator = Validator::make($request->all() , [
            'user_id' => ['required', 'integer', function ($attribute, $value, $fail) use ($loggedGymId , $gym) {
                $user = User::where('gym_id',$loggedGymId)->where('id',$value)->first();
                if (!$user) {
                    return $fail('User not found.');
                }
            }],
            // 'user_id'   =>  'required|exists:users,id'
        ]);

        if($validator->fails()){
            return apiError('Validation failed' , 422 , $validator->errors()->first());
        }

        try{
            DB::beginTransaction();
            $user = User::where('id',$request->user_id)->first();
            if($user->user_type != 'member'){
                return apiError('Invalid member' , 422 , 'Only member can be deleted');
            }
            GenerateSystemLogs('Member Deleted' , 'Member deleted by '.$request->user()->name.' '.$request->user()->reference_num.'.' , $user->id , 'User' , $user->gym_id , $request->logged_branch_id ,  $request->ip());
            $user->delete();
            DB::commit();
            return apiSuccess(null , 'Member deleted successfully' , 200);
        }catch(Exception $e){
            DB::rollBack();
            return apiError('Failed to delete member' , 500 ,$e->getMessage());
        }
    }

    function memberSearch(Request $request){
        $loggedGymId = $request->logged_gym_id;
        $gym = Gym::find($loggedGymId);
        $validator = Validator::make($request->all() , [
            'reference_num' => ['required', function ($attribute, $value, $fail) use ($loggedGymId , $gym) {
                $user = User::where('gym_id',$loggedGymId)->where('reference_num',$value)->first();
                if (!$user) {
                    return $fail('Member not found.');
                }
            }],
            // 'reference_num' => 'required|exists:users,reference_num'
        ]);

        if($validator->fails()){
            return apiError('Validation failed' , 422 , $validator->errors()->first());
        }

        try{
            $user = User::with('roles', 'memberProfile.plan', 'branch', 'statusHistory.createdBy', 'activityLogs.branch')->where('gym_id',$request->logged_gym_id)->where('reference_num',$request->reference_num)->first();
            return apiSuccess($user , 'Member found successfully' , 200);
        }catch(Exception $e){
            return apiError('Failed to find member' , 500 , $e->getMessage());
        }
    }
}
