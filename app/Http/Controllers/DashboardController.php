<?php

namespace App\Http\Controllers;

use App\Models\Attendance;
use App\Models\Branch;
use App\Models\FeeCollection;
use App\Models\FreezeRequest;
use App\Models\Gym;
use App\Models\Invoice;
use App\Models\MemberProfile;
use App\Models\Notification;
use App\Models\Plan;
use App\Models\SystemLog;
use App\Models\SystemSetting;
use App\Models\Transaction;
use App\Models\User;
use App\Models\UserStatusDetail;
use Carbon\Carbon;
use Carbon\CarbonPeriod;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class DashboardController extends Controller
{
    function dashboard(Request $request){
        $loggedGymId = $request->logged_gym_id;
        $gym = Gym::find($loggedGymId);
        $validator = Validator::make($request->all() , [
            'filter_branch_id' => [
            'nullable',
            Rule::exists('branches', 'id')->where(function ($query) use ($loggedGymId) {
                $query->where('gym_id', $loggedGymId);
            }),
            ],
        ]);

        if($validator->fails()){
            return apiError('Validation failed' , 422 , $validator->errors()->first());
        }

        $filterBranch = $request->query('filter_branch_id');
        $mainBranchId = Branch::where('gym_id',$request->logged_gym_id)->where('type','main')->first()?->id ?? null;
        $now = now();
        $currentMonthStart = $now->copy()->startOfMonth()->toDateString();
        $currentMonthEnd   = $now->copy()->endOfMonth()->toDateString();
        $lastMonthStart = $now->copy()->subMonth()->startOfMonth()->toDateString();
        $lastMonthEnd   = $now->copy()->subMonth()->endOfMonth()->toDateString();
        $totalMembersPercentageChange = null;
        $activeMembersPercentageChange = null;
        $attendancePercentageChange = null;
        $freezeRequestPercentageChange = null;
        $systemSettings  = SystemSetting::with('currency')->where('gym_id',$request->logged_gym_id)->first();
        $systemSettingCurrency = $systemSettings?->currency?->symbol ?? 'Rs';
        $today = now()->toDateString();
        $yesterday = now()->subDay()->toDateString();
        $weekStart = now()->subDays(6)->toDateString(); // last 7 days including today
        $twoWeekStart = now()->subDay(13)->toDateString(); //last 14 days including today
        $lastWeekStart = now()->subWeek()->startOfWeek()->toDateString(); // Last Monday
        $lastWeekEnd   = now()->subWeek()->endOfWeek()->toDateString(); 
        $branchFilter = function($query) use ($request, $filterBranch, $mainBranchId) {
            if ($filterBranch) {
                $query->where('branch_id', $filterBranch);
            }
        
            if (!($request->logged_branch_id == $mainBranchId && $request->user()->type == 'default')) {
                $query->where('branch_id', $request->logged_branch_id);
            }
        };
        $memberBranchFilter = function($query) use ($request, $filterBranch, $mainBranchId) {
            if ($filterBranch) {
                $query->where('base_branch_id', $filterBranch);
            }
        
            if (!($request->logged_branch_id == $mainBranchId && $request->user()->type == 'default')) {
                $query->where('base_branch_id', $request->logged_branch_id);
            }
        };
        //Current data
        $totalMembers = User::whereHas('roles',function($query) use ($gym) {
            $query->where('name',$gym->reference_num.' Member');
        })->when(true, $memberBranchFilter)->count();
        $activeMembers = User::whereHas('roles',function($query) use ($gym) {
            $query->where('name',$gym->reference_num.' Member');
        })->where('status','active')
        ->when(true, $memberBranchFilter)->count();
       $newMembersLast24Hours = User::whereHas('roles', function ($query) use ($gym) {
        $query->where('name', $gym->reference_num.' Member');
    })
    ->whereHas('memberProfile', function ($query) use ($yesterday, $today) {
        $query->whereBetween('register_date', [$yesterday, $today]);
    })
    ->when(true, $memberBranchFilter)
    ->count();
         //Current data
        $totalEmp = User::where('gym_id',$loggedGymId)->where('user_type','employee')->when(true, $memberBranchFilter)->count();
        $activeEmp = User::where('gym_id',$loggedGymId)->where('user_type','employee')->where('status','active')
        ->when(true, $memberBranchFilter)->count();
        $todayAttendances = Attendance::with('user')->whereHas('user',function($query) use ($loggedGymId){
            $query->where('user_type','member')->where('gym_id',$loggedGymId);
        })->where('date',now()->toDateString())->when(true, $branchFilter)->count();
        $freezeRequests = FreezeRequest::where('gym_id',$loggedGymId)->where('start_date',now()->toDateString())->when(true, $branchFilter)->count();
        //Last month/yesterday data
        $lastMonthTotalMembers = User::with('memberProfile')->where('gym_id',$loggedGymId)->whereHas('roles',function($query) use ($gym){
            $query->where('name', $gym->reference_num.' Member');
        })->whereHas('memberProfile',function($query) use ($lastMonthStart , $lastMonthEnd) {
            $query->where('register_date','<=', $lastMonthEnd);
        })->when(true, $memberBranchFilter)->count();
        $lastMonthActiveMembers = User::with('memberProfile')->where('gym_id',$loggedGymId)->whereHas('roles',function($query) use ($gym) {
            $query->where('name',$gym->reference_num.' Member');
        })->whereHas('memberProfile',function($query) use ($lastMonthStart , $lastMonthEnd) {
            $query->whereNotNull('current_plan_start_date')->where('current_plan_start_date','<=',$lastMonthEnd);
        })
        ->when(true, $memberBranchFilter)->count();
        $yesterdayAttendances = Attendance::with('user')->whereHas('user',function($query) use ($loggedGymId){
            $query->where('user_type','member')->where('gym_id',$loggedGymId);
        })->where('date',now()->subDay()->toDateString())->when(true, $branchFilter)->count();
        $yesterdayFreezeRequests = FreezeRequest::where('gym_id',$loggedGymId)->where('start_date',now()->subDay()->toDateString())->when(true, $branchFilter)->count();
        $totalMembersPercentageChange = $this->percentageChange($totalMembers, $lastMonthTotalMembers);
        $activeMembersPercentageChange = $this->percentageChange($activeMembers, $lastMonthActiveMembers);
        $attendancePercentageChange = $this->percentageChange($todayAttendances , $yesterdayAttendances);
        $freezeRequestPercentageChange = $this->percentageChange($freezeRequests , $yesterdayFreezeRequests);
        if($request->user()->getRoleNames()->first() == $gym->reference_num.' Member'){
            $memberCurrentMonthAttendances = Attendance::whereBetween('date', [$currentMonthStart , $currentMonthEnd])->where('user_id' , $request->user()->id)->when(true, $branchFilter)->count();
            $memberCurrentMonthFreezeRequests = FreezeRequest::whereBetween('start_date',[$currentMonthStart , $currentMonthEnd])->where('user_id' , $request->user()->id)->when(true, $branchFilter)->count();
            $memberLastMonthAttendances = Attendance::whereBetween('date', [$lastMonthStart , $lastMonthEnd])->where('user_id' , $request->user()->id)->when(true, $branchFilter)->count();
            $memberLastMonthFreezeRequests = FreezeRequest::whereBetween('start_date',[$lastMonthStart , $lastMonthEnd])->where('user_id' , $request->user()->id)->when(true, $branchFilter)->count();
            $attendancePercentageChange = $this->percentageChange($memberCurrentMonthAttendances , $memberLastMonthAttendances);
            $freezeRequestPercentageChange = $this->percentageChange($memberCurrentMonthFreezeRequests , $memberLastMonthFreezeRequests);
            $memberFeeCollections = FeeCollection::with('transaction.branch','plan')->where('user_id',$request->user()->id)->when(true, $branchFilter)->orderBy('id','desc')->get();
            $memberProfilePlan = MemberProfile::with('plan','user:id,reference_num,status,name,base_branch_id,profile_image','user.branch')->select('id','current_plan_id','current_plan_start_date','current_plan_expire_date','user_id','register_date','used_visit_days')->where('user_id',$request->user()->id)->first();
            $totalVisits = Attendance::where('user_id',$request->user()->id)->count();
            $attendances = Attendance::with('branch')->where('user_id',$request->user()->id)->orderBy('id','desc')->limit(5)->get();
            $notifications = Notification::where('user_id',$request->user()->id)->orderBy('id','desc')->limit(5)->get();
            $data = [
                'member_current_month_attendances' => $memberCurrentMonthAttendances,
                'member_last_month_attendances_percent_change'  =>  $attendancePercentageChange , 
                'member_current_month_freeze_requests'  =>  $memberCurrentMonthFreezeRequests,
                'member_last_month_freeze_request_percent_change' => $freezeRequestPercentageChange,
                'member_fee_collections' => $memberFeeCollections,
                'system_currency' => $systemSettingCurrency,
                'member_profile'  =>  $memberProfilePlan,
                'total_visits'  => $totalVisits,
                'attendances'   =>  $attendances,
                'notifications' =>  $notifications,
                'remaining_grace_days' => $request->user()->memberProfile->remaining_grace_days,
                'freeze_allow_count' => $request->user()->memberProfile->freeze_allow_count,
                'freeze_used_count' => $request->user()->memberProfile->freeze_used_count
            ];
            return apiSuccess($data , 'Dashboard data fetched successfully' , 200);
        }else if($request->user()->user_type == 'employee'){
            // $employeeFeeCollections = FeeCollection::with('transaction.branch','plan')->where('created_by_id' , $request->user()->id)->when(true, $branchFilter)->orderBy('id','desc')->paginate(10);
            $totalTodayIncomeQuery = Transaction::where('gym_id',$loggedGymId)->where('date',now()->toDateString())->where('transaction_type','income')->when(true, $branchFilter);
            $totalTodayExpenseQuery = Transaction::where('gym_id',$loggedGymId)->where('date',now()->toDateString())->where('transaction_type','expense')->when(true, $branchFilter);
            $todayCollections =  (clone $totalTodayIncomeQuery)->sum('credit_amount') -  (clone $totalTodayExpenseQuery)->sum('debit_amount');
            $todayCashCollections = (clone $totalTodayIncomeQuery)->where('payment_method','cash')->sum('credit_amount') - (clone $totalTodayExpenseQuery)->where('payment_method','cash')->sum('debit_amount');
            $todayBankCollections = (clone $totalTodayIncomeQuery)->where('payment_method','bank')->sum('credit_amount') - (clone $totalTodayExpenseQuery)->where('payment_method','bank')->sum('debit_amount');
            $attendances = Attendance::with('branch')->where('user_id',$request->user()->id)->orderBy('id','desc')->limit(5)->get();
            $notifications = Notification::where('user_id',$request->user()->id)->orderBy('id','desc')->limit(5)->get();
            $data = [
                'today_freeze_requests' => $freezeRequests , 
                'freeze_request_yesterday_percent_change' => $freezeRequestPercentageChange,
                'today_collections' => $todayCollections,
                'today_cash_collections' => $todayCashCollections,
                'today_bank_collections' => $todayBankCollections,
                'system_currency' => $systemSettingCurrency,
                'attendances'   =>  $attendances,
                'notifications' =>  $notifications
            ];
            return apiSuccess($data , 'Dashboard data fetched successfully' , 200);
        }else{
            $totalTodayIncomeQuery = Transaction::where('gym_id',$loggedGymId)->where('date',now()->toDateString())->where('transaction_type','income')->when(true, $branchFilter);
            $totalTodayExpenseQuery = Transaction::where('gym_id',$loggedGymId)->where('date',now()->toDateString())->where('transaction_type','expense')->when(true, $branchFilter);
            $todayCollections =  (clone $totalTodayIncomeQuery)->sum('credit_amount') -  (clone $totalTodayExpenseQuery)->sum('debit_amount');
            $todayCashCollections = (clone $totalTodayIncomeQuery)->where('payment_method','cash')->sum('credit_amount') - (clone $totalTodayExpenseQuery)->where('payment_method','cash')->sum('debit_amount');
            $todayBankCollections = (clone $totalTodayIncomeQuery)->where('payment_method','bank')->sum('credit_amount') - (clone $totalTodayExpenseQuery)->where('payment_method','bank')->sum('debit_amount');

            // $todayCollections = FeeCollection::where('generate_date',now()->toDateString())->when(true, $branchFilter)->sum('amount');
            // $todayCashCollections = FeeCollection::where('generate_date',now()->toDateString())->when(true, $branchFilter)->where('deposit_method','cash')->sum('amount');
            // $todayBankCollections = FeeCollection::where('generate_date',now()->toDateString())->when(true, $branchFilter)->where('deposit_method','bank')->sum('amount');
            $yesterdayCollections = FeeCollection::where('generate_date',now()->subDay()->toDateString())->when(true, $branchFilter)->sum('amount');
            $totalWeekCollections = FeeCollection::whereBetween('generate_date', [$weekStart, $today])->when(true, $branchFilter)->sum('amount');
            // Average for the week
            $averageWeeklyCollections = $totalWeekCollections / 7;
            
            $totalThisWeekIncomeQuery = Transaction::where('gym_id',$loggedGymId)->whereBetween('date', [$weekStart, $today])->where('transaction_type','income')->when(true, $branchFilter);
            $totalThisWeekExpenseQuery = Transaction::where('gym_id',$loggedGymId)->whereBetween('date', [$weekStart, $today])->where('transaction_type','expense')->when(true, $branchFilter);

            $thisWeekCollections = (clone $totalThisWeekIncomeQuery)->sum('credit_amount') -  (clone $totalThisWeekExpenseQuery)->sum('debit_amount');
            $thisWeekCashCollections = (clone $totalThisWeekIncomeQuery)->where('payment_method','cash')->sum('credit_amount') -  (clone $totalThisWeekExpenseQuery)->where('payment_method','cash')->sum('debit_amount');
            $thisWeekBankCollections = (clone $totalThisWeekIncomeQuery)->where('payment_method','bank')->sum('credit_amount') -  (clone $totalThisWeekExpenseQuery)->where('payment_method','bank')->sum('debit_amount');

            // $thisWeekCollections = $totalWeekCollections ;
            // $thisWeekCashCollections = FeeCollection::whereBetween('generate_date', [$weekStart, $today])->when(true, $branchFilter)->where('deposit_method','cash')->sum('amount');
            // $thisWeekBankCollections = FeeCollection::whereBetween('generate_date', [$weekStart, $today])->when(true, $branchFilter)->where('deposit_method','bank')->sum('amount');
            $lastWeekCollection = FeeCollection::whereBetween('generate_date',[$lastWeekStart , $lastWeekEnd])->when(true, $branchFilter)->sum('amount');
            $totalTwoWeekCollections = FeeCollection::whereBetween('generate_date', [$twoWeekStart, $today])->when(true, $branchFilter)->sum('amount');
            $averageLastTwoWeekCollections = $totalTwoWeekCollections / 14 ;

         $totalThisMonthIncomeQuery = Transaction::where('gym_id',$loggedGymId)->whereBetween('date', [$currentMonthStart, $currentMonthEnd])
    ->where('transaction_type','income')
    ->when(true, $branchFilter);

$totalThisMonthExpenseQuery = Transaction::where('gym_id',$loggedGymId)->whereBetween('date', [$currentMonthStart, $currentMonthEnd])
    ->where('transaction_type','expense')
    ->when(true, $branchFilter);

// Total
$thisMonthCollection =
    (clone $totalThisMonthIncomeQuery)->sum('credit_amount')
    - (clone $totalThisMonthExpenseQuery)->sum('debit_amount');

// Cash
$thisMonthCashCollection =
    (clone $totalThisMonthIncomeQuery)->where('payment_method','cash')->sum('credit_amount')
    - (clone $totalThisMonthExpenseQuery)->where('payment_method','cash')->sum('debit_amount');

// Bank
$thisMonthBankCollection =
    (clone $totalThisMonthIncomeQuery)->where('payment_method','bank')->sum('credit_amount')
    - (clone $totalThisMonthExpenseQuery)->where('payment_method','bank')->sum('debit_amount');
            // $thisMonthCollection = FeeCollection::whereBetween('generate_date', [$currentMonthStart, $currentMonthEnd])->when(true, $branchFilter)->sum('amount');
            // $thisMonthCashCollection = FeeCollection::whereBetween('generate_date', [$currentMonthStart, $currentMonthEnd])->when(true, $branchFilter)->where('deposit_method','cash')->sum('amount');
            // $thisMonthBankCollection = FeeCollection::whereBetween('generate_date', [$currentMonthStart, $currentMonthEnd])->when(true, $branchFilter)->where('deposit_method','bank')->sum('amount');
            
            $totalCollection = FeeCollection::sum('amount');
            $averagePayment = FeeCollection::avg('amount');
           $collectionStatsByUser = FeeCollection::where('gym_id',$loggedGymId)->select(
                'created_by_id',
                DB::raw('SUM(amount) as total_collection'),
                DB::raw('AVG(amount) as avg_collection'),
                DB::raw('COUNT(*) as total_records')
            )
            ->when(true, $branchFilter)
            ->groupBy('created_by_id')
            ->paginate(10);

// Load relationships after pagination
$collectionStatsByUser->load([
    'createdByUser:id,name,reference_num,base_branch_id',
    'createdByUser.branch:id,name,reference_num'
]);
            $systemLogs = SystemLog::with('referenceEntity','createdBy','branch')->where('gym_id',$loggedGymId)->when(true, $branchFilter)->orderBy('id','desc')->limit(5)->get();
            //Build Chart 


$chartFilter = $request->query('chart_filter', 'weekly');
$isMonthlyGroup = false;

/*
|--------------------------------------------------------------------------
| Resolve date range & grouping
|--------------------------------------------------------------------------
*/
switch ($chartFilter) {

    case 'monthly':
        $startDate = now()->startOfMonth()->toDateString();
        $endDate   = now()->endOfMonth()->toDateString();
       $groupFormat = '%Y-%m-%d';
        $labelFormat = 'j M y';
        $isMonthlyGroup = false;
        break;

    case 'yearly':
        $startDate = now()->startOfYear()->toDateString();
        $endDate   = now()->endOfYear()->toDateString();
        $groupFormat = '%Y-%m';
        $labelFormat = 'M y';
        $isMonthlyGroup = true;
        break;

    case 'custom_date_range':
        $startDate = $request->query('chart_start_date')
            ? Carbon::parse($request->query('chart_start_date'))->toDateString()
            : now()->subDays(6)->toDateString();

        $endDate = $request->query('chart_end_date')
            ? Carbon::parse($request->query('chart_end_date'))->toDateString()
            : now()->toDateString();

        $daysDiff = Carbon::parse($startDate)->diffInDays(Carbon::parse($endDate));

        if ($daysDiff <= 31) {
            $groupFormat = '%Y-%m-%d';
            $labelFormat = 'j M y';
            $isMonthlyGroup = false;
        } else {
            $groupFormat = '%Y-%m';
            $labelFormat = 'M y';
            $isMonthlyGroup = true;
        }

        $chartFilter = 'custom';
        break;

    default: // weekly
        $startDate = now()->subDays(6)->toDateString();
        $endDate   = now()->toDateString();
        $groupFormat = '%Y-%m-%d';
        $labelFormat = 'j M y';
        $isMonthlyGroup = false;
        $chartFilter = 'weekly';
        break;
}

/*
|--------------------------------------------------------------------------
| Fetch aggregated revenue
|--------------------------------------------------------------------------
*/
$transactionsRevenues = Transaction::where('gym_id',$loggedGymId)->selectRaw("
        DATE_FORMAT(`date`, '$groupFormat') as period,
        SUM(credit_amount) - SUM(debit_amount)  as total
    ")
    ->when(true, $branchFilter)
    ->whereDate('date', '>=', $startDate)
    ->whereDate('date', '<=', $endDate)
    ->groupBy('period')
    ->orderBy('period')
    ->get()
    ->keyBy('period');

/*
|--------------------------------------------------------------------------
| Build chart labels & data
|--------------------------------------------------------------------------
*/
$labels = [];
$dataPoints = [];

if ($isMonthlyGroup) {

    $period = CarbonPeriod::create(
        Carbon::parse($startDate)->startOfMonth(),
        '1 month',
        Carbon::parse($endDate)->endOfMonth()
    );

    foreach ($period as $date) {
        $key = $date->format('Y-m');
        $labels[] = $date->format($labelFormat);
        $dataPoints[] = (float) ($transactionsRevenues[$key]->total ?? 0);
    }

} else {

    $period = CarbonPeriod::create($startDate, $endDate);

    foreach ($period as $date) {
        $key = $date->format('Y-m-d');
        $labels[] = $date->format($labelFormat);
        $dataPoints[] = (float) ($transactionsRevenues[$key]->total ?? 0);
    }
}

/*
|--------------------------------------------------------------------------
| Final chart payload
|--------------------------------------------------------------------------
*/
$revenueChartData = [
    'labels' => $labels,
    'datasets' => [[
        'label' => 'Revenue (' . ucfirst($chartFilter) . ')',
        'data' => $dataPoints,
        'borderColor' => 'rgba(99, 185, 255, 1)',
        'backgroundColor' => 'rgba(39, 148, 251, 0.5)',
        'pointStyle' => 'circle',
        'pointRadius' => 10,
        'pointHoverRadius' => 15,
    ]]
];



            $data = [
                'total_members' => $totalMembers , 
                'active_members' => $activeMembers , 
                'total_employees'   =>  $totalEmp,
                'active_employees'  =>  $activeEmp,
                'new_members'   =>  $newMembersLast24Hours,
                'today_attendance' => $todayAttendances , 
                'today_freeze_requests' => $freezeRequests , 
                'total_member_last_month_percent_change' => $totalMembersPercentageChange , 
                'active_member_last_month_percent_change' => $activeMembersPercentageChange,
                'attendance_yesterday_percent_change' => $attendancePercentageChange , 
                'freeze_request_yesterday_percent_change' => $freezeRequestPercentageChange,
                'today_collections' => $todayCollections,
                'today_cash_collections' => $todayCashCollections,
                'today_bank_collections' => $todayBankCollections,
                'this_week_collections' => $thisWeekCollections,
                'this_week_cash_collections' => $thisWeekCashCollections,
                'this_week_bank_collections' => $thisWeekBankCollections,
                'this_month_collection' => $thisMonthCollection,
                'this_month_cash_collection' => $thisMonthCashCollection,
                'this_month_bank_collection' => $thisMonthBankCollection,
                'collection_stats_by_user' => $collectionStatsByUser ,
                'system_logs' => $systemLogs ,
                'system_currency' => $systemSettingCurrency,
                'revenue_chart_date'    =>  $revenueChartData
            ];
            return apiSuccess($data , 'Dashboard data fetched successfully' , 200);
        }
    }

    function percentageChange($current, $previous)
    {
        if ($previous == 0) {
            return $current > 0 ? 100 : 0; 
        }

        return round((($current - $previous) / $previous) * 100, 2);
    }

    function systemDashboard(){
        try{
            $systemSettings  = SystemSetting::with('currency')->where('type','system')->first();
            $systemSettingCurrency = $systemSettings?->currency?->symbol ?? 'Rs';        
            $invoicePaidTotal = Invoice::where('payment_status','paid')->sum('grand_total');
            $totalGyms = Gym::count();
            $activeGyms = Gym::where('status','active')->count();
            $pendingDues = Invoice::where('payment_status','pending')->count();
            $gyms = Gym::paginate(5);
            $data = [
                'system_currency'   =>  $systemSettingCurrency,
                'total_revenue'     =>  $invoicePaidTotal,
                'total_gyms'        =>  $totalGyms,
                'active_gyms'       =>  $activeGyms,
                'pending_dues'      =>  $pendingDues,
                'gyms'              =>  $gyms        
            ];
            return apiSuccess($data , 'System dashboard data fetched successfully', 200);
        }catch(Exception $e){
            return apiError('Failed to fetch dashboard data' , 500 , $e->getMessage());
        }
       
    }
}
