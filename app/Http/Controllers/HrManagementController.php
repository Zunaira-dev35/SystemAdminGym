<?php

namespace App\Http\Controllers;

use App\Helpers\FileUploadHelper;
use App\Models\Attendance;
use App\Models\AttendanceDetails;
use App\Models\Branch;
use App\Models\EmployeeProfile;
use App\Models\Holiday;
use App\Models\Leave;
use App\Models\Shift;
use App\Models\User;
use Carbon\Carbon;
use App\Models\EmployeeLateArrival;
use App\Models\EmployeeShift;
use App\Models\FreezeRequest;
use App\Models\Gym;
use App\Models\MemberProfile;
use App\Models\Plan;
use App\Models\SystemSetting;
use App\Models\UserStatusDetail;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use PHPUnit\Framework\Constraint\ExceptionCode;

class HrManagementController extends Controller
{
    function attendances(Request $request){
        $loggedGymId = $request->logged_gym_id;
        $gym = Gym::find($loggedGymId);
        try{
            $search = trim($request->query('search'));
            $paginateParam = $request->disable_page_param;
            $mainBranchId = Branch::where('type','main')->where('gym_id',$loggedGymId)->first()?->id ?? null;
            $filterBranch = $request->query('filter_branch_id');
            $filterUserId = $request->query('filter_user_id');
            $userType = $request->query('user_type');
            $startDate = $request->query('start_date');
            $endDate = $request->query('end_date');
            $attendancesQuery = Attendance::with('user','branch','createdBy','attendanceDetails')->where('gym_id',$loggedGymId)
            ->when($search , function($query) use ($search , $loggedGymId){
                $query->where(function($q) use ($search , $loggedGymId){
                    $q->whereHas('user',function($uq) use ($search , $loggedGymId){
                        $uq->where('gym_id',$loggedGymId)->where('name','like',"%{$search}%")
                        ->orWhere('reference_num','like',"%{$search}%")
                        ->orWhere('email','like',"%{$search}%")
                        ->orWhereHas('roles',function($rq) use ($search){
                            $rq->where('name','like',"%{$search}%");
                        });
                    });
                   
                });
            })->when($filterUserId , function($query) use ($filterUserId){
                $query->where('user_id' , $filterUserId);
            })
            ->when($filterBranch , function($query) use ($filterBranch){
                $query->where('branch_id',$filterBranch);
            })
            ->when(!($request->logged_branch_id == $mainBranchId && $request->user()->type == 'default'),
            function($query) use ($request){
                $query->where('branch_id', $request->logged_branch_id);
            })->when($userType , function($query) use ($userType){
                $query->where('user_type',$userType);
            })->when($startDate && $endDate , function($query) use ($startDate , $endDate){
                $query->whereBetween('date',[$startDate , $endDate]);
            })
            ->orderBy('date','desc');
           
            if(($request->user()->user_type == 'employee' && $request->user_type == 'employee') || ($request->user()->hasRole($gym->reference_num.' Member') && $request->user_type == 'member')){
                $attendancesQuery->where('user_id',$request->user()->id);
            }
            
            if($paginateParam && $paginateParam == 1){
                $attendances = $attendancesQuery->get();
            }else{
                $attendances = $attendancesQuery->paginate($request->limit ?? 10);
            }
            return apiSuccess($attendances , 'Attendances fetched successfully' , 200);
        }catch(Exception $e){
            return apiError('Failed to fetch attendances', 500, $e->getMessage());
        }
    }

    function memberUnfreezeNow($user , $authUser){
        DB::beginTransaction();
        $memberProfile = MemberProfile::with('plan')->where('user_id',$user->id)->first();
        $latestFreezeRequest = FreezeRequest::where('user_id',$user->id)->where('status','approved')->where('plan_id',$memberProfile->current_plan_id)->where('plan_start_date',$memberProfile->current_plan_start_date)->whereNull('end_date')->orderBy('id','desc')->first();
        $lastFrozen = UserStatusDetail::where('user_id', $user->id) ->where('plan_id' , $memberProfile->current_plan_id)->where('plan_start_date' , $memberProfile->current_plan_start_date)->where('status' , 'frozen')->orderBy('id','desc') ->first();
        $remainingDays = $memberProfile->remaining_days_balance;
        $startDate = Carbon::parse($lastFrozen->date);
        $endDate = Carbon::parse(now()->toDateString());
        $durationDays = $startDate->copy()->diffInDays($endDate);
        if($latestFreezeRequest && ($latestFreezeRequest->start_date <= now()->toDateString())){
            //Update expire dates and user status
            $latestFreezeRequest->update(['end_date' => now()->toDateString() , 'duration_days' => $durationDays]);
        }
        
        $userLatestActiveStatus = UserStatusDetail::where('user_id',$user->id)->where('plan_id' , $memberProfile->current_plan_id)->where('plan_start_date' , $memberProfile->current_plan_start_date)->where('status' , 'active')->orderBy('id','desc')->first();
        if(!$userLatestActiveStatus){
            DB::rollBack();
            return apiError('Failed to unfreeze' , 422 , 'Member active status not found');
        }
        
        $newExpireDate = Carbon::parse($userLatestActiveStatus->plan_expire_date)->copy()->addDays($durationDays)->toDateString();
        
        $user->update(['status' => 'active']);
        $memberProfile->update(['current_plan_expire_date' => $newExpireDate]);
        //Maintian history
        UserStatusDetail::create(['user_id' => $user->id , 'status' => 'active' , 'plan_id' => $memberProfile->current_plan_id , 'plan_start_date' => $memberProfile->current_plan_start_date , 'plan_expire_date' => $newExpireDate , 'date' => now()->toDateString() , 'time' => now()->toTimeString() , 'updated_by_id' => Auth::id() , 'remaining_days' => $remainingDays , 'plan_total_days' => $userLatestActiveStatus->plan_total_days]);
        $currentPlan = Plan::where('id',$memberProfile->current_plan_id)->first();
        //Generate System Log
        GenerateSystemLogs('Member Account Unfrozen' , 'Member '.$user->reference_num.' account has been successfully unfrozen by user '.$authUser->reference_num.'.', $user->id, 'User' , $user->gym_id , $currentPlan->branch_id , null);
        //Generate notification
        $recipients = User::where('id','<>',Auth::id())->where('gym_id',$user->gym_id)->whereNotIn('user_type',['member'])
        ->get(['id', 'reference_num', 'name']); 
        foreach($recipients as $recipient){
            generateNotification($recipient->id, 'Member Account Unfrozen' , 'Member '.$user->reference_num.' account has been successfully unfrozen by user '.$authUser->reference_num.'.' , 'member' , 'Member' , $user->id  , $currentPlan->branch_id , null);
        }
        generateNotification($user->id, 'Your Account Unfrozen' , 'Your account has been successfully unfrozen.' , 'member' , 'Member' , $user->id , $currentPlan->branch_id , null);
        //send push notification
        $userFcmToken = $user->device_fcm_token ?? null;
         if($userFcmToken){
            sendFCM($userFcmToken ,'Your Account Unfrozen' , 'Your account has been successfully unfrozen');
        }
        DB::commit();

    }

    function checkAttendanceDatePeriod($user , $attendanceDate){
        $memberProfile = $user->memberProfile;
        $frozenRecords = UserStatusDetail::where('user_id', $user->id)->where('plan_id' , $memberProfile->current_plan_id)->where('plan_start_date' , $memberProfile->current_plan_start_date) ->where('status', 'frozen') ->orderBy('date') ->get();
        $frozenPeriods = [];
        foreach ($frozenRecords as $frozen) {
            // Find the next active record after this frozen
            $activeRecord = UserStatusDetail::where('user_id', $user->id)->where('plan_id' , $memberProfile->current_plan_id)->where('plan_start_date' , $memberProfile->current_plan_start_date)->where('status', 'active') ->where('date', '>', $frozen->date) ->orderBy('date') ->first();
            $periodEnd = $activeRecord ? $activeRecord->date : null;
            $frozenPeriods[] = [
                'from' => $frozen->date,
                'to' => $periodEnd
            ];
        }
        foreach ($frozenPeriods as $period) {
            if ( $attendanceDate >= $period['from'] && (!$period['to'] || $attendanceDate <= $period['to']) ) {
                return false; 
            }
        }
        return true;
    }

    function attendanceStore(Request $request)
    {
        $authUser = $request->user();
        $loggedGymId = $request->logged_gym_id;
        $gym = Gym::find($loggedGymId);
        $validator = Validator::make($request->all(), [
            'checkin_type' => ['required','in:manual,face,fingerprint'],
            'user_type'    => 'required|in:member,employee',
            'user_id'      => ['nullable', 'integer', 'required_if:checkin_type,manual', function ($attribute, $value, $fail) use ($loggedGymId , $gym) {
                $user = User::where('gym_id',$loggedGymId)->where('id',$value)->first();
                if (!$user || (!$user->hasRole($gym->reference_num.' Member') && $user->user_type !== 'employee')) {
                    return $fail('The selected user is not a valid member/employee');
                }
            }],
            'date'          => 'nullable|required_if:checkin_type,manual|date|before_or_equal:today',
            'checkin_time'  => 'nullable|required_if:checkin_type,manual',
            'profile_image' => 'nullable|required_if:checkin_type,face|image|mimes:jpeg,jpg,png',
            'attendance_type' => 'nullable|in:Morning,Evening',
            'fingerprint_data'  =>  'nullable|required_if:checkin_type,fingerprint',
            'base_branch_id'    =>  'nullable|exists:branches,id'
        ]);

        if ($validator->fails()) {
            return apiError('Validation failed', 422, $validator->errors()->first());
        }

        try {
            DB::beginTransaction();
            $userType = $request->user_type;
            $currentTime = now();
            $attendanceDate = $currentTime->toDateString();
            $data = [];
            $user = null;
            $shift = null;
            $shiftStartHM = null;
            $shiftEndHM = null;
            $attendanceType = null;
            // $isOvernight = false;
            $loggedBranchId = $request->logged_branch_id;
            $searchBranchId =  $request->base_branch_id ? $request->base_branch_id :  $request->logged_branch_id ;
            $loggedGymId = $request->logged_gym_id;
            // Determine user
            if ($request->checkin_type === 'face') {
                if($userType == 'member'){
                    $checkUserExist = checkUserFace($request->file('profile_image'), $userType , $loggedGymId , null , $searchBranchId);
                }else{
                    $checkUserExist = checkUserFace($request->file('profile_image'), $userType , $loggedGymId);
                }

                if (!$checkUserExist['matched']) {
                    DB::rollBack();
                    return apiError('Checkin failed', 422, 'Failed to checkin, ' . $userType . ' not found.');
                }
                $foundUserId = $checkUserExist['user_id'];
                $user = User::with('employeeProfile', 'memberProfile')->where('gym_id',$loggedGymId)->where('id',$foundUserId)->first();
                $attendanceDate = $currentTime->toDateString();
                $checkinTime = $currentTime->format('H:i:s');
            }elseif($request->checkin_type == 'fingerprint'){
                $fingerprintImage = $request->file('fingerprint_data');
                if($userType == 'member'){
                    $checkUserExist = checkUserFingerPrint($fingerprintImage , $userType , null ,  $searchBranchId);
                }else{
                    $checkUserExist = checkUserFingerPrint($fingerprintImage , $userType);
                }
                if(!$checkUserExist['matched']){
                    DB::rollBack();
                    return apiError('Checkin failed', 422, 'Failed to checkin , fingerprint not recognized.');
                }
                $foundUserId = $checkUserExist['user_id'];
                $user = User::with('employeeProfile', 'memberProfile')->where('gym_id',$loggedGymId)->where('id',$foundUserId)->first();
                $attendanceDate = $currentTime->toDateString();
                $checkinTime = $currentTime->format('H:i:s');
            } else {
                $user = User::with('employeeProfile', 'memberProfile')->where('gym_id',$loggedGymId)->where('id',$request->user_id)->first();
                $attendanceDate = $request->date;
                $checkinTime = $request->checkin_time;
            }
            
            if(!$user){
                DB::rollBack();
                return apiError('Failed to checkin' , 422 , 'User not found');
            }

            if($request->user()->hasRole($gym->reference_num.' Member') && ($request->user_type == 'member' || $request->user_type == 'employee')){
                if($user->id != $request->user()->id){
                    DB::rollBack();
                    return apiError('Failed to checkin' , 422 , 'Member can only checkin their own attendance');
                }
            }

            // Validate user status
            if ($request->user_type == 'employee' && $user->status !== 'active') {
                DB::rollBack();
                return apiError('Failed to checkin', 422, 'Employee must be active to checkin');
            }

            if($request->user_type == 'member' && in_array($user->status , ['inactive' , 'expired'])){
                DB::rollBack();
                return apiError('Failed to checkin' , 422 , 'Member must be active to checkin');
            }
           

            // Load shift if employee
            if ($user->user_type === 'employee') {
                $attendanceType = $request->attendance_type;
                if (empty($attendanceType)) {
                    DB::rollBack();
                    return apiError('Failed to checkin', 422, 'Please select Morning/Evening for employee attendance');
                }
                $attendanceDateDay = Carbon::parse($attendanceDate)->format('l');
                $shifts = EmployeeShift::where('user_id', $user->id)->get();
                // If today matches a rest_day record , use that / Else → fall back to week_day record
                $shift = $shifts->first(function ($s) use ($attendanceDateDay) {
                    return $s->type === 'rest_day' && $s->rest_day_name === $attendanceDateDay;
                });

                if (!$shift) {
                    $shift = $shifts->firstWhere('type', 'week_day');
                }

                if (!$shift) {
                    DB::rollBack();
                    return apiError('Failed to checkin', 422, 'Employee shift schedule not found');
                }
              
                // Morning rest check
                if( $attendanceType === 'Morning' && (empty($shift->morning_start_time) || empty($shift->morning_end_time))) {
                    DB::rollBack();
                    return apiError( 'Failed to checkin', 422, 'Employee is on rest for the morning shift' );
                }
                // Evening rest check
                if ( $attendanceType === 'Evening' && (empty($shift->evening_start_time) || empty($shift->evening_end_time)) ) {
                    DB::rollBack();
                    return apiError( 'Failed to checkin', 422, 'Employee is on rest for the evening shift' );
                }
               
                if($attendanceType == 'Morning'){
                    $startTime = Carbon::parse($shift->morning_start_time);
                    $endTime = Carbon::parse($shift->morning_end_time);
                }else{
                    $startTime = Carbon::parse($shift->evening_start_time);
                    $endTime = Carbon::parse($shift->evening_end_time);
                }
               
                // Check join date
                if ($user->employeeProfile?->join_date && $attendanceDate < $user->employeeProfile->join_date) {
                    DB::rollBack();
                    return apiError('Failed to checkin', 422, 'Attendance date must be on or after the employee’s joining date.');
                }

                //employee can only checkin within the shift time
                $checkinTime = Carbon::parse($checkinTime);
                if ($checkinTime->gt($endTime)) {
                    DB::rollBack();
                    return apiError('Failed to checkin', 422, 'You can only check in before your shift ends.');
                }
                $data['attendance_type'] = $attendanceType;
                $data['shift_start_time'] = $startTime;
                $data['shift_end_time']  = $endTime;
                $shiftStartHM = $startTime->format('H:i');
                $shiftEndHM = $endTime->format('H:i');
            }

            // Validate membership dates
            if ($user->hasRole($gym->reference_num.' Member')) {
                $memberProfile = $user->memberProfile;
                if ($memberProfile) {
                    if ($attendanceDate < $memberProfile->current_plan_start_date) {
                        DB::rollBack();
                        return apiError('Check-in failed', 422, 'Attendance date must be on or after the membership start date.');
                    }
                    if ($memberProfile->current_plan_expire_date && ($attendanceDate > $memberProfile->current_plan_expire_date)) {
                        DB::rollBack();
                        return apiError('Check-in failed', 422, 'Attendance date must be within the membership period.');
                    }
                }
            }

            // Branch access check for members
            if ($userType === 'member' && $user->base_branch_id != $loggedBranchId) {
                $systemSettings = SystemSetting::where('gym_id',$loggedGymId)->first();
                $allowHigherAccess = $systemSettings?->allow_higher_branch_access ?? false;
                 if (!$allowHigherAccess) {
                    DB::rollBack();
                    return apiError('Access denied', 403, 'Visiting other branches is currently not allowed.');
                }
             
                $allowedDays = $systemSettings?->higher_branch_allowed_days ?? null;
                $usedDays = $user->memberProfile?->used_visit_days ?? 0;
                if ($allowedDays && $usedDays >= $allowedDays) {
                    DB::rollBack();
                    return apiError('Access denied', 403, 'You have used all your allowed visits to premium branches this cycle.');
                }
                $user->memberProfile->increment('used_visit_days');
            }

            // Prevent duplicate attendance
            if($user->user_type == 'employee'){
                $attendanceExistsQuery = Attendance::where('user_id', $user->id) ->where('date', $attendanceDate)->where('attendance_type',$request->attendance_type);
                if ($attendanceExistsQuery->exists()) {
                    DB::rollBack();
                    return apiError('Attendance already exists', 422, 'Attendance already exists for the day');
                }
            }
           
            //Auto unfreeze
            if($user->status == 'frozen' && $request->user_type == 'member'){
                if($attendanceDate == now()->toDateString()){
                    $this->memberUnfreezeNow($user , $request->user());
                }
            }

            //Check if attendance date lie within frozen period
            if($attendanceDate < now()->toDateString() && $user->hasRole($gym->reference_num.' Member')){
                $canUnfreeze = $this->checkAttendanceDatePeriod($user , $attendanceDate);
                if($canUnfreeze == false){
                    DB::rollBack();
                    return apiError('Failed to checkin' , 422 , 'Member account was frozen on the selected attendance date');
                }
            }
            // attendance data
            $data = array_merge([
                'user_id'       => $user->id,
                'user_type'     => $user->user_type,
                'date'          => $attendanceDate,
                'checkin_type'  => $request->checkin_type,
                'checkin_time'  => $checkinTime,
                'checkout_time' => $request->checkout_time ?? null,
                'branch_id'     => $loggedBranchId,
                'created_by_id' => Auth::id(),
                'gym_id'    =>  $loggedGymId
            ] , $data);
            //For member if attendance repeated add in attendance details
            if($user->user_type == 'member'){
                $attendanceExistsQuery = Attendance::where('user_id', $user->id) ->where('date', $attendanceDate)->first();
                if ($attendanceExistsQuery) {
                    $data = array_merge(['attendance_id' => $attendanceExistsQuery->id],$data);
                    $attendance = AttendanceDetails::create($data);
                }else{
                    $attendance = Attendance::create($data);
                }
            }else{
                $attendance = Attendance::create($data);
            }
            
            $attendance->load('user.memberProfile.plan','user.branch','user.employeeProfile','branch');
            GenerateSystemLogs('Checked In' , $request->user_type == 'member' ? 'Member '.($attendance->user?->reference_num ?? '').' checked-in successfully' : 'Employee '.($attendance->user?->reference_num ?? '').' checked-in successfully' , $attendance->user_id, 'User' , $user->gym_id ,  $request->logged_branch_id  , $request->ip());
            // Handle employee late arrival
            if ($user->user_type === 'employee' && $shift && $shiftStartHM && $shiftEndHM) {
                $checkInHM = Carbon::parse($data['checkin_time'])->format('H:i');
               
                $checkInCarbon = Carbon::createFromFormat('Y-m-d H:i', $attendanceDate . ' ' . $checkInHM);
                $shiftStartCarbon = Carbon::createFromFormat('Y-m-d H:i', $attendanceDate . ' ' . $shiftStartHM);
                if ($shiftStartHM > $shiftEndHM && $checkInHM <= $shiftEndHM) {
                    $shiftStartCarbon->subDay();
                }
                $lateMinutes = $checkInCarbon->greaterThan($shiftStartCarbon) ? $shiftStartCarbon->diffInMinutes($checkInCarbon) : 0;
                if ($lateMinutes > 0) {
                    $monthKey = Carbon::parse($attendanceDate)->format('Y-m');
                    $lateRecord = EmployeeLateArrival::firstOrCreate(
                        ['user_id' => $user->id, 'month' => $monthKey, 'attendance_type' => $attendanceType],
                        ['late_arrivals' => []]
                    );

                    $lateArrivals = $lateRecord->late_arrivals ?? [];
                    $dateKey = $attendanceDate;
                    if (!isset($lateArrivals[$dateKey])) {
                        $lateArrivals[$dateKey] = ['checkIn' => 0, 'checkOut' => 0 , 'shift_day' => $shift->type , 'shift_start_time' => $attendanceType == 'Morning' ? $shift->morning_start_time : $shift->evening_start_time , 'shift_end_time' => $attendanceType == 'Morning' ? $shift->morning_end_time : $shift->evening_end_time];
                    }
                    $lateArrivals[$dateKey]['checkIn'] += $lateMinutes;
                    $lateRecord->late_arrivals = $lateArrivals;
                    $lateRecord->save();
                }
            }
            //send push notification
            $userFcmToken = $user->device_fcm_token ?? null;
             if($userFcmToken){
                sendFCM($userFcmToken ,'Checked In' , 'Welcome! You’re checked in at '.($attendance->branch?->name ?? '').' Branch.');
            }
            DB::commit();
            return apiSuccess($attendance, 'Attendance stored successfully', 200);

        } catch (Exception $e) {
            DB::rollBack();
            return apiError('Failed to store attendance.', 500, $e->getMessage());
        }
    }


    function attendanceCheckout(Request $request)
    {
        $loggedGymId = $request->logged_gym_id;
        $validator = Validator::make($request->all(), [
            'attendance_type' => 'required|in:Morning,Evening',
            'checkout_type'  => ['required', 'in:face,fingerprint'],
            'profile_image'  => 'nullable|required_if:checkout_type,face|image|mimes:jpeg,jpg,png',
            'fingerprint_data'  =>  'nullable|required_if:checkout_type,fingerprint',
        ]);

        if ($validator->fails()) {
            return apiError('Validation failed', 422, $validator->errors()->first());
        }

        try {
            DB::beginTransaction();
            $loggedGymId = $request->logged_gym_id;
            if ($request->checkout_type == 'face') {
                $checkUserExist = checkUserFace($request->file('profile_image'), 'employee' , $loggedGymId);
                if (!$checkUserExist['matched']) {
                    DB::rollBack();
                    return apiError('Checkout failed', 422, 'Failed to checkout, employee not found.');
                }
                $foundUserId = $checkUserExist['user_id'];
                $user = User::where('gym_id',$loggedGymId)->where('id',$foundUserId)->first();
                if(!$user){
                    DB::rollBack();
                    return apiError('Failed to checkout', 422, 'User not found.');
                }
                // $user = User::find($foundUserId);
                if ($user->status !== 'active') {
                    DB::rollBack();
                    return apiError('Failed to checkout', 422, 'User must be active to checkout');
                }
                if (!($user->user_type == 'employee')) {
                    DB::rollBack();
                    return apiError('Failed to checkout', 422, 'User must be an employee to checkout');
                }
            }elseif($request->checkout_type == 'fingerprint'){
                $fingerprintImage = $request->file('fingerprint_data');
                $checkUserExist = checkUserFingerPrint($fingerprintImage , 'employee');
                if(!$checkUserExist['matched']){
                    DB::rollBack();
                    return apiError('Checkin failed', 422, 'Failed to checkout , fingerprint not recognized.');
                }
                $foundUserId = $checkUserExist['user_id'];
                $user = User::where('gym_id',$loggedGymId)->where('id',$foundUserId)->first();
                if(!$user){
                    DB::rollBack();
                    return apiError('Failed to checkout', 422, 'User not found.');
                }
            }
            $todayAttendance = fetchTodayAttendance($user->id , $request->attendance_type);
            if (!$todayAttendance['today_attendance_exist']) {
                DB::rollBack();
                return apiError('Failed to checkout', 422, 'Employee must check in first to checkout');
            }

            $attendance = $todayAttendance['attendance'];
            $attendanceType = $request->attendance_type;
            $checkoutTimeStr = now()->format('H:i:s');
            $attendanceDate = $attendance->date; // This is the correct date of attendance

            // Load shift with proper relation
            $user = User::with('employeeProfile')->find($user->id);
             $attendanceDateDay = Carbon::parse($attendanceDate)->format('l');
                $shifts = EmployeeShift::where('user_id', $user->id)->get();
                // If today matches a rest_day record , use that / Else → fall back to week_day record
                $shift = $shifts->first(function ($s) use ($attendanceDateDay) {
                    return $s->type === 'rest_day' && $s->rest_day_name === $attendanceDateDay;
                });

                if (!$shift) {
                    $shift = $shifts->firstWhere('type', 'week_day');
                }

                if (!$shift) {
                    DB::rollBack();
                    return apiError('Failed to checkout', 422, 'Employee shift schedule not found');
                }
              
                // Morning rest check
                if( $attendanceType === 'Morning' && (empty($shift->morning_start_time) || empty($shift->morning_end_time))) {
                    DB::rollBack();
                    return apiError( 'Failed to checkout', 422, 'Employee is on rest for the morning shift' );
                }
                // Evening rest check
                if ( $attendanceType === 'Evening' && (empty($shift->evening_start_time) || empty($shift->evening_end_time)) ) {
                    DB::rollBack();
                    return apiError( 'Failed to checkout', 422, 'Employee is on rest for the evening shift' );
                }
               
                if($attendanceType == 'Morning'){
                    $startTime = Carbon::parse($shift->morning_start_time);
                    $endTime = Carbon::parse($shift->morning_end_time);
                }else{
                    $startTime = Carbon::parse($shift->evening_start_time);
                    $endTime = Carbon::parse($shift->evening_end_time);
                }
           

            // === EARLY CHECKOUT DETECTION (Same logic as late arrival, but reverse) ===
            $checkoutHM   = Carbon::now()->format('H:i');
            $shiftEndHM   = $endTime->format('H:i');
            $shiftStartHM = $startTime->format('H:i');

            $attendanceDateCarbon = Carbon::parse($attendanceDate);

            // Build checkout time with correct date
            $checkoutCarbon = Carbon::createFromFormat(
                'Y-m-d H:i',
                $attendanceDateCarbon->format('Y-m-d') . ' ' . $checkoutHM
            );

            // Build shift end time
            $shiftEndCarbon = Carbon::createFromFormat(
                'Y-m-d H:i',
                $attendanceDateCarbon->format('Y-m-d') . ' ' . $shiftEndHM
            );

           
            $earlyMinutes = 0;
            if ($checkoutCarbon->lessThan($shiftEndCarbon)) {
                $earlyMinutes = $shiftEndCarbon->diffInMinutes($checkoutCarbon);
            }

            if ($earlyMinutes > 0) {
                $monthKey = $attendanceDateCarbon->format('Y-m');

                // Get or create late record for this user, month, and shift
                $lateRecord = EmployeeLateArrival::firstOrCreate( [ 'user_id' => $user->id, 'month' => $monthKey, 'attendance_type' => $attendanceType ], ['late_arrivals' => []] );
                $lateArrivals = $lateRecord->late_arrivals ?? [];
                $dateKey = $attendanceDateCarbon->format('Y-m-d');

                if (!isset($lateArrivals[$dateKey])) {
                    $lateArrivals[$dateKey] = ['checkIn' => 0, 'checkOut' => 0 , 'shift_day' => $shift->type , 'shift_start_time' => $attendanceType == 'Morning' ? $shift->morning_start_time : $shift->evening_start_time , 'shift_end_time' => $attendanceType == 'Morning' ? $shift->morning_end_time : $shift->evening_end_time];
                }

                $lateArrivals[$dateKey]['checkOut'] += $earlyMinutes;

                $lateRecord->late_arrivals = $lateArrivals;
                $lateRecord->save();
            }

            // Finally update checkout time
            $attendance->update([ 'checkout_time' => $checkoutTimeStr ]);
            DB::commit();
            return apiSuccess($attendance, 'Employee checked out successfully', 200);

        } catch (Exception $e) {
            DB::rollBack();
            return apiError('Failed to checkout', 500, $e->getMessage());
        }
    }

    function attendanceUpdate(Request $request){
        $loggedGymId = $request->logged_gym_id;
        $validator = Validator::make($request->all() , [
            'attendance_id' => [
                'required',
                Rule::exists('attendances', 'id')->where(function ($query) use ($loggedGymId) {
                    $query->where('gym_id', $loggedGymId);
                }),
            ],
            'date'  =>  'required|date|before_or_equal:today',
            'checkin_time'  =>  'required'
        ]);

        if($validator->fails()){
            return apiError('Validation failed' , 422 , $validator->errors()->first());
        }

        try{
            $attendance = Attendance::where('id',$request->attendance_id)->first();
           
            $attendance->update(['date' =>  $request->date , 'checkin_time' => $request->checkin_time , 'checkout_time' => $request->checkout_time]);
            return apiSuccess($attendance , 'Attendance updated successfully' , 200);             
        }catch(Exception $e){
            return apiError('Failed to update attendance' , 500 , $e->getMessage());
        }
    }

    function attendanceDelete(Request $request){
        $loggedGymId = $request->logged_gym_id;
        $validator = Validator::make($request->all() , [
             'attendance_id' => [
                'required',
                Rule::exists('attendances', 'id')->where(function ($query) use ($loggedGymId) {
                    $query->where('gym_id', $loggedGymId);
                }),
            ],
        ]);

        if($validator->fails()){
            return apiError('Validation failed' , 422 , $validator->errors()->first());
        }

        try{
            $attendance = Attendance::where('id',$request->id)->first();
            $attendance->delete();
            return apiSuccess(null , 'Attendance deleted successfully' , 200);
        }catch(Exception $e){
            return apiError('Failed to delete attendance' , 500 , $e->getMessage());
        }
    }

    function holidayStore(Request $request){
        $loggedGymId = $request->logged_gym_id;
        $validator = Validator::make($request->all() , [
            'start_date'    =>  ['required','date'],
            'end_date'      =>  ['required','date','after_or_equal:start_date'],
            'id' => [
                'nullable',
                Rule::exists('holidays', 'id')->where(function ($query) use ($loggedGymId) {
                    $query->where('gym_id', $loggedGymId);
                }),
            ],
        ]);

        if($validator->fails()){
            return apiError('Validation failed',422,$validator->errors()->first());
        }

        try{
             // Prevent duplicate or overlapping holidays
            $exists = Holiday::where('gym_id',$loggedGymId)->where(function ($query) use ($request) {
            $query->whereBetween('start_date', [$request->start_date, $request->end_date])
                  ->orWhereBetween('end_date', [$request->start_date, $request->end_date])
                  ->orWhere(function ($q) use ($request) {
                      $q->where('start_date', '<=', $request->start_date)
                        ->where('end_date', '>=', $request->end_date);
                  });
            })
            ->when($request->id, function ($query) use ($request) {
            $query->where('id', '!=', $request->id); 
            })->exists();

            if ($exists) {
                return apiError('Holiday already exists for the selected dates.', 422 , 'Holiday already exists for the selected dates');
            }
            
            $data = [];
            $data = array_reduce(['start_date','end_date','note'],function($carry , $input) use ($request){
                $carry[$input] = $request->input($input);
                return $carry;
            });
            $data['created_by'] = Auth::id();
            $data['gym_id'] = $loggedGymId;
            Holiday::updateOrInsert(['id' => $request->input('id')] , $data);
            $latestHoliday = $request->id ? Holiday::where('gym_id',$loggedGymId)->where('id',$request->id)->first() : Holiday::where('gym_id',$loggedGymId)->orderBy('id','desc')->first();
            if(empty($request->id)){
                return apiSuccess($latestHoliday, 'Holiday created successfully.', 200);
            }else{
                return apiSuccess($latestHoliday, 'Holiday updated successfully.', 200);
            }
        }catch(Exception $e){
            return apiError('Failed to store holiday', 500, $e->getMessage());
        }
    }

    public function holidays(Request $request)
    {
        $loggedGymId = $request->logged_gym_id;
        $createdById = $request->query('created_by_id');
        $search = trim($request->query('search'));
        $month = $request->query('month');
        $limit = $request->query('limit');
        $paginateParam = $request->disable_page_param;
        $validator = Validator::make(
            ['month' => $month, 'limit' => $limit],
            [
                'month' => ['nullable', 'regex:/^\d{4}-(0[1-9]|1[0-2])$/'], // format YYYY-MM
                'limit' => 'nullable|integer|min:1',
            ]
        );
    
        if ($validator->fails()) {
            return apiError('Validation failed', 422, $validator->errors()->first());
        }

        if ($month) {
            $parsedMonth = Carbon::createFromFormat('Y-m', $month);
        } else {
            $parsedMonth = Carbon::now();
        }

        $filterMonth = $parsedMonth->month;
        $filterYear  = $parsedMonth->year;
        $startDate   = Carbon::create($filterYear, $filterMonth, 1)->startOfDay();
        $endDate     = $startDate->copy()->endOfMonth()->endOfDay();

        try {
            $holidaysQuery = Holiday::with(['createdByUser'])->where('gym_id',$loggedGymId)
            ->where(function ($query) use ($startDate, $endDate) {
                $query->whereBetween('start_date', [$startDate, $endDate])
                      ->orWhereBetween('end_date', [$startDate, $endDate])
                      ->orWhere(function ($q) use ($startDate, $endDate) {
                          $q->where('start_date', '<=', $startDate)
                            ->where('end_date', '>=', $endDate);
                      });
            })
            ->when($createdById, fn($query) => $query->where('created_by', $createdById))
            ->when($search, function ($query) use ($search) {
                $query->where(function ($q) use ($search) {
                    $q->where('note', 'like', "%{$search}%")
                      ->orWhereHas('createdByUser', function ($cq) use ($search) {
                          $cq->where('name', 'like', "%{$search}%")
                             ->orWhere('reference_num', 'like', "%{$search}%");
                      });
                });
            })
            ->orderBy('start_date', 'asc');
            if($paginateParam && $paginateParam == 1){
                $holidays = $holidaysQuery->get();
            }else{
                $holidays = $holidaysQuery->paginate($limit ?? 10);
            }
            return apiSuccess($holidays, 'Holidays fetched successfully.', 200);
        } catch (\Exception $e) {
            return apiError('Failed to fetch holidays' , 500 , $e->getMessage());
        }
    }

     function holidayDelete(Request $request){
        $loggedGymId = $request->logged_gym_id;
        $validator = Validator::make($request->all() , [
            'holiday_id' => [
                'required',
                Rule::exists('holidays', 'id')->where(function ($query) use ($loggedGymId) {
                    $query->where('gym_id', $loggedGymId);
                }),
            ],
        ]);

        if($validator->fails()){
            return apiError('Validation failed',422,$validator->errors()->first());
        }

        try{
            $holiday = Holiday::where('id',$request->holiday_id)->first();
            $holiday->delete();
            return apiSuccess(null , 'Holiday deleted successfully.', 200);
        }catch(Exception $e){
            return apiError('Failed to delete holiday', 500, $e->getMessage());
        }
    }

    function leaveStore(Request $request){
        $loggedGymId = $request->logged_gym_id;
        $validator = Validator::make($request->all() , [
            'user_id' => ['required', 'integer', function ($attribute, $value, $fail) use ($loggedGymId){
            $user = User::where('gym_id',$loggedGymId)->where('id' , $value)->first();
            $employeeProfile = EmployeeProfile::where('user_id',$value)->first();
            if (!$user || !$employeeProfile || !($user->user_type == 'employee') || !$user->status == 'active') {
                return $fail('The selected user is not a valid employee or is not active');
            }
            }],
            'start_date'    =>  'required|date',
            'end_date'      =>  'required|after_or_equal:start_date',
            'leave_title'   =>  'required|string',
            'apply_reason'  =>  'required|string',
            'doc_url'       =>  'nullable|file|mimes:pdf,docx',
            'leave_mode'    =>  'required|in:single,multiple',
            'id' => [
                'nullable',
                Rule::exists('leaves', 'id')->where(function ($query) use ($loggedGymId) {
                    $query->where('gym_id', $loggedGymId);
                }),
            ],
        ]);

        if($validator->fails()){
            return apiError('Validation failed' , 422 , $validator->errors()->first());
        }

        try{
            $data = [];
            if($request->user()->user_type == 'employee'){
                $userId = $request->user()->id;
            }else{
                $userId = $request->user_id;
            }
            $data = array_reduce(['leave_title' , 'apply_reason' , 'leave_mode'] , function ($carry, $input) use ($request) {
                $carry[$input] = $request->input($input);
                return $carry;
            });
            if($request->hasFile('doc_url')){
                $docUrl = FileUploadHelper::uploadFile($request->file('doc_url'), 'leave/documents');
                $data['doc_url'] = $docUrl;
            }
            if($request->id){
                $leave = Leave::where('id',$request->id)->first();
                if ($leave && in_array($leave->status, ['approved', 'rejected'])) {
                    return apiError( 'Action not allowed', 409, 'This leave request has already been processed and cannot be edited now.' );
                }
               
            }
            $startDate = $request->start_date;
            if($request->leave_mode == 'multiple'){
                $endDate =  $request->end_date;
            }else{
                $endDate = $request->start_date;
            }
             // Check if a leave already exists within the applied date range
            $existingLeave = Leave::where('user_id', $request->user_id)->when($request->id , function($query) use ($request){
                $query->where('id','<>',$request->id);
            })->where(function ($query) use ($startDate, $endDate) {
            $query->whereBetween('start_date', [$startDate, $endDate])
                  ->orWhereBetween('end_date', [$startDate, $endDate])
                  ->orWhere(function ($q) use ($startDate, $endDate) {
                      $q->where('start_date', '<=', $startDate)
                        ->where('end_date', '>=', $endDate);
                  });
            })->first();
            if ($existingLeave) {
                return apiError( 'Action not allowed', 409, 'You already have a leave applied that overlaps with the selected dates.' );
            }
            //Validate attendance exist
            $existingAttendance = Attendance::where('user_id',$request->user_id)->whereBetween('date',[$startDate,$endDate])->exists();
            if($existingAttendance){
                return apiError('Action not allowed', 409, 'Attendance records already exist for the selected dates. You can’t add leave for days with existing attendance');
            }
            $data['start_date'] = $startDate;
            $data['end_date'] = $endDate;
            $data['status'] = 'pending';
            $data['created_by'] = Auth::id();
            $data['user_id'] = $userId;
            $data['gym_id'] = $loggedGymId;
            Leave::updateOrCreate(['id' => $request->input('id')] , $data);
            $latestLeave = $request->id ? Leave::where('id',$request->id)->first() : Leave::orderBy('id','desc')->first();
            $recipients = User::where('gym_id',$latestLeave->gym_id)->whereNotIn('id',[$latestLeave->user_id , Auth::id()])->whereNotIn('user_type',['employee','member'])->get(['id', 'reference_num', 'name']); 
            foreach ($recipients as $recipient) {
                $applicantName = $latestLeave->user?->name ?? 'Unknown user';
                $leavePeriod = $latestLeave->leave_mode === 'multiple' ? 'from ' . date('M d, Y', strtotime($latestLeave->start_date)) . ' to ' . date('M d, Y', strtotime($latestLeave->end_date)) : 'dated ' . date('M d, Y', strtotime($latestLeave->start_date));
                generateNotification( $recipient->id, 'Leave Application Submitted', $applicantName . ' has applied for leave ' . $leavePeriod . '. Please review the request.', 'employee' , 'Employee' , $latestLeave->user_id , null , null );
            }           
            return apiSuccess($latestLeave , 'Leave stored successfully' , 200);
        }catch(Exception $e){
            return apiError('Failed to store leave' , 500 , $e->getMessage());
        }
    }

    function leaves(Request $request){
        try{
            $loggedGymId = $request->logged_gym_id;
            $search = trim($request->query('search'));
            $paginateParam = $request->disable_page_param;
            $mainBranchId = Branch::where('type','main')->where('gym_id',$loggedGymId)->first()?->id ?? null;
            $filterBranch = $request->query('filter_branch_id');
            $filterStatus = $request->query('filter_status');
            $leavesQuery = Leave::with('user')->where('gym_id',$loggedGymId)
            ->when($search , function($query) use ($search){
                $query->where(function($q) use ($search){
                    $q->whereHas('user',function($uq) use ($search){
                        $uq->where('name','like',"%{$search}%")
                        ->orWhere('reference_num','like',"%{$search}%")
                        ->orWhere('email','like',"%{$search}%")
                        ->orWhereHas('roles',function($rq) use ($search){
                            $rq->where('name','like',"%{$search}%");
                        });
                    });
                   
                });
            })
            ->when($filterStatus , function($query) use ($filterStatus){
                $query->where('status',$filterStatus);
            })->when($filterBranch , function($query) use ($filterBranch){
                $query->whereHas('user',function($uq) use ($filterBranch){
                    $uq->where('base_branch_id',$filterBranch);
                });
            })
            ->orderBy('id','desc');

            if($request->user()->user_type == 'employee'){
                $leavesQuery->where('user_id',$request->user()->id);
            }
            if($paginateParam && $paginateParam == 1){
                $leaves = $leavesQuery->get();
            }else{
                $leaves = $leavesQuery->paginate($request->limit ?? 10);
            }
            return apiSuccess($leaves , 'Leaves fetched successfully' , 200);
        }catch(Exception $e){
            return apiError('Failed to fetch leaves', 500, $e->getMessage());
        }
    }

    function leaveProcess(Request $request){
        $loggedGymId = $request->logged_gym_id;
        $validator = Validator::make($request->all() , [
            'leave_id' => [
                'required',
                Rule::exists('leaves', 'id')->where(function ($query) use ($loggedGymId) {
                    $query->where('gym_id', $loggedGymId);
                }),
            ],
            'status'    =>  'required|in:on-hold,approved,rejected',
            'hold_reason'   =>  'nullable|required_if:status,on-hold',
            'reject_reason' =>  'nullable|required_if:status,rejected'
        ]);

        if($validator->fails()){
            return apiError('Validation failed' , 422 , $validator->errors()->first());
        }

        try{
            $leave = Leave::where('id',$request->leave_id)->first();

            $leave->update([
                'status' => $request->status,
                'hold_reason' => $request->status == 'on-hold' ? $request->hold_reason : null,
                'reject_reason' =>  $request->status == 'rejected' ? $request->reject_reason : null,
                'verify_by' => Auth::user()->id ?? null,
                'verify_at' => now(),
            ]);
            // Build leave period text
            $leavePeriod = $leave->leave_mode === 'multiple' ? 'from ' . date('M d, Y', strtotime($leave->start_date)) . ' to ' . date('M d, Y', strtotime($leave->end_date)) : 'dated ' . date('M d, Y', strtotime($leave->start_date));
            // Build message based on status
            $statusMessage = match ($request->status) {
                'approved' => 'has been approved. Please check your leave details for confirmation.',
                'rejected' => 'has been rejected. Please view details for more information.',
                'on-hold'  => 'is currently on hold pending further information. Please view details.',
                default => 'has been updated. Please view details.',
            };
            $notificationMessage = "Your leave request {$leavePeriod} {$statusMessage}";
            // Send notification
            generateNotification($leave->user_id, 'Leave Status Update', $notificationMessage, 'employee' , 'Employee' , $leave->user_id , null , null );
            //send push notification
            $userFcmToken = $user->device_fcm_token ?? null;
             if($userFcmToken){
                sendFCM($userFcmToken ,'Leave Status Update' , $notificationMessage);
            }
            return apiSuccess($leave, 'Leave updated successfully.', 200);
        }catch(Exception $e){
            return apiError('Failed to process leave' , 500 , $e->getMessage());
        }
    }
}
