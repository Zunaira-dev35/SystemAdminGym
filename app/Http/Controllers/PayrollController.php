<?php

namespace App\Http\Controllers;

use App\Models\Attendance;
use App\Models\Bank;
use App\Models\Branch;
use App\Models\EmployeeLateArrival;
use App\Models\EmployeeShift;
use App\Models\Gym;
use App\Models\Holiday;
use App\Models\Leave;
use App\Models\Payroll;
use App\Models\User;
use Carbon\Carbon;
use Carbon\CarbonPeriod;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class PayrollController extends Controller
{
    private function generatePayrollReferenceNumber($branchId)
    {
        $branch = Branch::find($branchId);
        $branchCode = $branch->reference_num;
         $prefix = $branchCode.'-PR';

        // Get last payroll for this branch
        $last = Payroll::where('reference_num', 'LIKE', $prefix.'%')
            ->orderByRaw('CAST(SUBSTRING(reference_num, ? + 1) AS UNSIGNED) DESC', [strlen($prefix)])
            ->first();

        if ($last) {
            $lastRef = $last->reference_num;
            $numberPart = substr($lastRef, strlen($prefix));
            $nextNumber = (int) $numberPart + 1;
            $newNumberPart = $nextNumber;
        } else {
            $newNumberPart = '1';
        }

        return $prefix.$newNumberPart;
    }

    public function generate(Request $request)
    {
        $loggedGymId = $request->logged_gym_id;
        $validator = Validator::make($request->all(), [
            'start_date' => 'required|date_format:Y-m-d',
            'end_date' => 'required|date_format:Y-m-d',
            'user_id' => ['nullable', 'integer', function ($attribute, $value, $fail) use($loggedGymId) {
                $user = User::where('gym_id',$loggedGymId)->where('id',$value)->first();
                if (! $user || $user->user_type != 'employee') {
                    return $fail('The selected user is not a valid employee.');
                }
            }],
            'branch_id' => ['nullable', 'integer', function ($attribute, $value, $fail) use($loggedGymId) {
                $branch = Branch::where('gym_id',$loggedGymId)->where('id',$value)->first();
                if (!$branch) {
                    return $fail('Branch not found.');
                }
            }],
        ]);

        if ($validator->fails()) {
            return apiError('Validation failed', 422, $validator->errors()->first());
        }
        $startDate = Carbon::parse($request->start_date);
        $endDate = Carbon::parse($request->end_date);

        // Validate date range
        if ($startDate->gt($endDate)) {
            return apiError('Invalid date range', 422, 'Start date must be before or equal to end date');
        }

        $specificUserId = $request->user_id;
        $specificBranchId = $request->branch_id;

        // Get main branch ID
        $mainBranch = Branch::where('type', 'main')->where('gym_id',$request->logged_gym_id)->first();
        $mainBranchId = $mainBranch ? $mainBranch->id : null;

        $isFromMainBranch = ($request->logged_branch_id == $mainBranchId);

        // If specific user ID is provided
        if ($specificUserId) {
            $user = User::with('employeeProfile')->findOrFail($specificUserId);
            if (! ($user->user_type == 'employee')) {
                return apiError('Employee not found', 422 , 'Employee not found.');
            }
            $results = $this->processEmployee($user, $startDate, $endDate);

            return apiSuccess($results, 'Payroll generated successfully',200);
        } 
        // If specific branch ID is provided (but no user ID)
        elseif ($specificBranchId) {
            $employees = User::where('gym_id',$loggedGymId)->where('user_type', 'employee')
                ->where('base_branch_id', $specificBranchId)
                ->where('status', 'active')
                ->with('employeeProfile')
                ->get();

            if ($employees->isEmpty()) {
                return apiError('No employees found', 404, 'No active employees found in the specified branch');
            }

            $results = [];
            foreach ($employees as $employee) {
                try {
                    $result = $this->processEmployee($employee, $startDate, $endDate);
                    $results[$employee->id] = $result;
                } catch (\Exception $e) {
                    $results[$employee->id] = ['error' => $e->getMessage()];
                }
            }

            return apiSuccess($results, 'Payroll generated for all employees in branch');
        }
        // If neither user ID nor branch ID is provided
        else {
            // If request is from main branch, generate for ALL employees
            if ($isFromMainBranch) {
                $employees = User::where('gym_id',$loggedGymId)->where('user_type', 'employee')
                    ->where('status', 'active')
                    ->with('employeeProfile')
                    ->get();

                if ($employees->isEmpty()) {
                    return apiError('No employees found', 404, 'No active employees found in the system');
                }

                $results = [];
                foreach ($employees as $employee) {
                    try {
                        $result = $this->processEmployee($employee, $startDate, $endDate);
                        $results[$employee->id] = $result;
                    } catch (\Exception $e) {
                        $results[$employee->id] = ['error' => $e->getMessage()];
                    }
                }

                return apiSuccess($results, 'Payroll generated for all employees in all branches (main branch request)');
            }
            // If not from main branch, generate only for employees in the logged branch
            else {
                $employees = User::where('gym_id',$loggedGymId)->where('user_type', 'employee')
                    ->where('base_branch_id', $request->logged_branch_id)
                    ->where('status', 'active')
                    ->with('employeeProfile')
                    ->get();

                if ($employees->isEmpty()) {
                    return apiError('No employees found', 404, 'No active employees found in your branch');
                }

                $results = [];
                foreach ($employees as $employee) {
                    try {
                        $result = $this->processEmployee($employee, $startDate, $endDate);
                        $results[$employee->id] = $result;
                    } catch (\Exception $e) {
                        $results[$employee->id] = ['error' => $e->getMessage()];
                    }
                }

                return apiSuccess($results, 'Payroll generated for all employees in logged branch');
            }
        }
    }

    private function processEmployee($user, $startDate, $endDate)
    {
        $basicSalary = $user->employeeProfile->salary ?? 0;
        if ($basicSalary <= 0) {
            throw new \Exception('No salary defined');
        }

        // Get employee shifts configuration
        $employeeShifts = EmployeeShift::where('user_id', $user->id)
            ->orderBy('rest_day_name')
            ->get();

        if ($employeeShifts->isEmpty()) {
            throw new \Exception('No shifts defined for employee');
        }

        // Calculate daily rate (using 30 days as standard)
        $dailyRate = $basicSalary / 30;

        // Build shift configuration by day with per-minute rate
        $shiftConfigByDay = [];
        
        // First, find week_day configuration (applies to all non-rest days)
        $weekDayShift = $employeeShifts->firstWhere('type', 'week_day');
        
        // Then, find all rest_day configurations
        $restDayShifts = $employeeShifts->where('type', 'rest_day');

        // Process week_day configuration (applies to Monday-Friday by default, excluding rest days)
        if ($weekDayShift) {
            // Get all days of week
            $daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
            
            // Get rest day names to exclude
            $restDayNames = $restDayShifts->pluck('rest_day_name')->map(function($name) {
                return ucfirst(strtolower(trim($name)));
            })->toArray();
            
            foreach ($daysOfWeek as $dayName) {
                // Skip if this day is a rest day
                if (in_array($dayName, $restDayNames)) {
                    continue;
                }
                
                // Calculate daily total minutes for this day
                $dailyTotalMinutes = 0;

                $morningDuration = 0;
                if (! empty($weekDayShift->morning_start_time) && ! empty($weekDayShift->morning_end_time)) {
                    $morningDuration = $this->calculateShiftDuration(
                        $weekDayShift->morning_start_time,
                        $weekDayShift->morning_end_time
                    );
                    $dailyTotalMinutes += $morningDuration;
                }

                $eveningDuration = 0;
                if (! empty($weekDayShift->evening_start_time) && ! empty($weekDayShift->evening_end_time)) {
                    $eveningDuration = $this->calculateShiftDuration(
                        $weekDayShift->evening_start_time,
                        $weekDayShift->evening_end_time
                    );
                    $dailyTotalMinutes += $eveningDuration;
                }

                // Calculate per-minute rate for this day
                $perMinuteRateForDay = ($dailyTotalMinutes > 0) ? ($dailyRate / $dailyTotalMinutes) : 0;

                $shiftConfigByDay[$dayName] = [
                    'day_type' => 'week_day', 
                    'daily_rate' => round($dailyRate, 2),
                    'per_minute_rate' => round($perMinuteRateForDay, 4),
                    'total_minutes' => $dailyTotalMinutes,
                    'morning' => [
                        'active' => ! empty($weekDayShift->morning_start_time) && ! empty($weekDayShift->morning_end_time),
                        'start_time' => $weekDayShift->morning_start_time,
                        'end_time' => $weekDayShift->morning_end_time,
                        'duration_minutes' => $morningDuration,
                    ],
                    'evening' => [
                        'active' => ! empty($weekDayShift->evening_start_time) && ! empty($weekDayShift->evening_end_time),
                        'start_time' => $weekDayShift->evening_start_time,
                        'end_time' => $weekDayShift->evening_end_time,
                        'duration_minutes' => $eveningDuration,
                    ],
                ];
            }
        }

        // Process rest_day configurations
        foreach ($restDayShifts as $restDayShift) {
            $dayName = ucfirst(strtolower(trim($restDayShift->rest_day_name)));
            
            if ($dayName) {
                // Calculate daily total minutes for this rest day
                $dailyTotalMinutes = 0;

                $morningDuration = 0;
                if (! empty($restDayShift->morning_start_time) && ! empty($restDayShift->morning_end_time)) {
                    $morningDuration = $this->calculateShiftDuration(
                        $restDayShift->morning_start_time,
                        $restDayShift->morning_end_time
                    );
                    $dailyTotalMinutes += $morningDuration;
                }

                $eveningDuration = 0;
                if (! empty($restDayShift->evening_start_time) && ! empty($restDayShift->evening_end_time)) {
                    $eveningDuration = $this->calculateShiftDuration(
                        $restDayShift->evening_start_time,
                        $restDayShift->evening_end_time
                    );
                    $dailyTotalMinutes += $eveningDuration;
                }

                // Calculate per-minute rate for this day
                $perMinuteRateForDay = ($dailyTotalMinutes > 0) ? ($dailyRate / $dailyTotalMinutes) : 0;

                $shiftConfigByDay[$dayName] = [
                    'day_type' => 'rest_day',
                    'daily_rate' => round($dailyRate, 2),
                    'per_minute_rate' => round($perMinuteRateForDay, 4),
                    'total_minutes' => $dailyTotalMinutes,
                    'morning' => [
                        'active' => ! empty($restDayShift->morning_start_time) && ! empty($restDayShift->morning_end_time),
                        'start_time' => $restDayShift->morning_start_time,
                        'end_time' => $restDayShift->morning_end_time,
                        'duration_minutes' => $morningDuration,
                    ],
                    'evening' => [
                        'active' => ! empty($restDayShift->evening_start_time) && ! empty($restDayShift->evening_end_time),
                        'start_time' => $restDayShift->evening_start_time,
                        'end_time' => $restDayShift->evening_end_time,
                        'duration_minutes' => $eveningDuration,
                    ],
                ];
            }
        }

        // Calculate number of days in the period
        $periodDays = $startDate->diffInDays($endDate) + 1;

        // Get the actual calendar days in the month
        $startMonth = $startDate->format('Y-m');
        $endMonth = $endDate->format('Y-m');

        // Check if this is a full month period
        $isFullMonth = false;
        if ($startMonth === $endMonth) {
            // Check if start date is 1st of month and end date is last day of month
            $firstDayOfMonth = Carbon::parse($startDate)->startOfMonth();
            $lastDayOfMonth = Carbon::parse($endDate)->endOfMonth();

            if ($startDate->isSameDay($firstDayOfMonth) && $endDate->isSameDay($lastDayOfMonth)) {
                $isFullMonth = true;
            }
        }

        // Calculate period salary based on actual days in period
        // For full months (28, 30, or 31 days), always use 30 days
        // For partial periods, use actual days
        if ($isFullMonth) {
            // For full months, always use 30 days regardless of actual calendar days
            $periodSalary = $basicSalary; // Same as $basicSalary/30 * 30
            $effectivePeriodDays = 30;
        } else {
            // For partial periods, use actual days
            $periodSalary = ($basicSalary / 30) * $periodDays;
            $effectivePeriodDays = $periodDays;
        }

        // === 1. Holidays (Fully Paid) ===
        $holidays = Holiday::where(function ($q) use ($startDate, $endDate) {
            $q->whereBetween('start_date', [$startDate, $endDate])
                ->orWhereBetween('end_date', [$startDate, $endDate])
                ->orWhere(function ($q) use ($startDate, $endDate) {
                    $q->where('start_date', '<=', $startDate)
                        ->where('end_date', '>=', $endDate);
                });
        })->get();

        $holidayDates = [];
        foreach ($holidays as $h) {
            $period = CarbonPeriod::create($h->start_date, $h->end_date);
            foreach ($period as $d) {
                if ($d->between($startDate, $endDate)) {
                    $holidayDates[$d->format('Y-m-d')] = true;
                }
            }
        }
        $holidayDays = count($holidayDates);

        // === 2. Approved Leaves ===
        $leaves = Leave::where('user_id', $user->id)
            ->where('status', 'approved')
            ->where(function ($q) use ($startDate, $endDate) {
                $q->whereBetween('start_date', [$startDate, $endDate])
                    ->orWhereBetween('end_date', [$startDate, $endDate])
                    ->orWhere(function ($q) use ($startDate, $endDate) {
                        $q->where('start_date', '<=', $startDate)
                            ->where('end_date', '>=', $endDate);
                    });
            })->get();

        $leaveDates = [];
        foreach ($leaves as $leave) {
            $period = CarbonPeriod::create($leave->start_date, $leave->end_date);
            foreach ($period as $d) {
                if ($d->between($startDate, $endDate)) {
                    $leaveDates[$d->format('Y-m-d')] = true;
                }
            }
        }
        $leaveDays = count($leaveDates);

        // === 3. Cheat Minutes - Updated for attendance_type ===
        $cheatMinutes = 0;
        $cheatDeduction = 0;
        $cheatDetails = []; // New array to store cheat details

        // Get all months that overlap with our date range
        $startMonth = $startDate->format('Y-m');
        $endMonth = $endDate->format('Y-m');

        // If start and end are in the same month
        if ($startMonth === $endMonth) {
            $lateRecords = EmployeeLateArrival::where('user_id', $user->id)
                ->where('month', $startMonth)
                ->get();

        } else {
            // Get records for all months in the range
            $months = [];
            $currentMonth = Carbon::createFromFormat('Y-m', $startMonth);
            $endMonthObj = Carbon::createFromFormat('Y-m', $endMonth);

            while ($currentMonth->lte($endMonthObj)) {
                $months[] = $currentMonth->format('Y-m');
                $currentMonth->addMonth();
            }

            $lateRecords = EmployeeLateArrival::where('user_id', $user->id)
                ->whereIn('month', $months)
                ->get();
        }

        // Process late records for each shift type
        foreach ($lateRecords as $lateRecord) {
            if (is_array($lateRecord->late_arrivals)) {
                foreach ($lateRecord->late_arrivals as $date => $data) {
                    $recordDate = Carbon::parse($date);

                    // Check if the date is within our payroll period
                    if ($recordDate->between($startDate, $endDate)) {
                        // Check attendance_type to see if deduction should be made
                        $attendanceType = strtolower($lateRecord->attendance_type ?? '');

                        // Only count if attendance_type indicates deduction should be made
                        if ($this->shouldDeductForAttendanceType($attendanceType)) {
                            $checkInMinutes = $data['checkIn'] ?? 0;
                            $checkOutMinutes = $data['checkOut'] ?? 0;
                            $cheatMinutesForDay = $checkInMinutes + $checkOutMinutes;
                            $cheatMinutes += $cheatMinutesForDay;

                            // Calculate cheat deduction for this specific day
                            $dayName = $recordDate->format('l');
                            $dayConfig = $shiftConfigByDay[$dayName] ?? null;

                            $dayCheatDeduction = 0;
                            if ($dayConfig && $dayConfig['per_minute_rate'] > 0) {
                                $dayCheatDeduction = $cheatMinutesForDay * $dayConfig['per_minute_rate'];
                                $cheatDeduction += $dayCheatDeduction;
                            }

                            // Store cheat details for this day (as simple array, not associative)
                            $cheatDetails[] = [
                                'date' => $date,
                                'checkIn' => $checkInMinutes,
                                'checkOut' => $checkOutMinutes,
                                'total_minutes' => $cheatMinutesForDay,
                                'day_name' => $dayName,
                                'per_minute_rate' => $dayConfig ? round($dayConfig['per_minute_rate'], 4) : 0,
                                'deduction' => round($dayCheatDeduction, 2),
                                'attendance_type' => $lateRecord->attendance_type ?? 'unknown',
                            ];
                        }
                    }
                }
            }
        }
        usort($cheatDetails, function($a, $b) {
            return strcmp($a['date'], $b['date']);
        });


        // === 4. Calculate absent minutes, days and deduction ===
        $absentMinutes = 0;
        $absentDays = 0;
        $presentDays = 0;
        $absentDeduction = 0;
        $absentDetails = [];

        // Create period for iteration
        $period = CarbonPeriod::create($startDate, $endDate);

        // For each day in the period
        foreach ($period as $currentDate) {
            $dateStr = $currentDate->format('Y-m-d');
            $dayName = $currentDate->format('l');

            // Check if this is a holiday
            $isHoliday = isset($holidayDates[$dateStr]);
            // Check if this is a leave day
            $isLeave = isset($leaveDates[$dateStr]);

            // Get shift configuration for this day
            $dayConfig = $shiftConfigByDay[$dayName] ?? null;
            if (! $dayConfig) {
                // No shift configured for this day, skip
                continue;
            }

            $totalExpectedMinutesToday = 0;
            $totalMissedMinutesToday = 0;
            $workedAnyShift = false;

            // Get per-minute rate for this day from config
            $perMinuteRateForDay = $dayConfig['per_minute_rate'] ?? 0;

            // Check morning shift
            if ($dayConfig['morning']['active']) {
                $morningDuration = $dayConfig['morning']['duration_minutes'];
                $totalExpectedMinutesToday += $morningDuration;

                // Check attendance for morning shift
                $hasMorningAttendance = Attendance::where('user_id', $user->id)
                    ->where('date', $dateStr)
                    ->where('attendance_type', 'morning')
                    ->exists();

                if ($hasMorningAttendance) {
                    $workedAnyShift = true;
                } elseif (! $isHoliday && ! $isLeave) {
                    // Only count as absent if not holiday or leave
                    $totalMissedMinutesToday += $morningDuration;
                    $absentDeduction += $morningDuration * $perMinuteRateForDay;
                    $absentDetails[] = [
                        'date' => $dateStr,
                        'shift_type' => 'morning',
                        'duration_minutes' => $morningDuration,
                        'day_name' => $dayName,
                        'per_minute_rate' => round($perMinuteRateForDay, 4),
                        'deduction' => round($morningDuration * $perMinuteRateForDay, 2),
                    ];
                }
            }

            // Check evening shift
            if ($dayConfig['evening']['active']) {
                $eveningDuration = $dayConfig['evening']['duration_minutes'];
                $totalExpectedMinutesToday += $eveningDuration;

                // Check attendance for evening shift
                $hasEveningAttendance = Attendance::where('user_id', $user->id)
                    ->where('date', $dateStr)
                    ->where('attendance_type', 'evening')
                    ->exists();

                if ($hasEveningAttendance) {
                    $workedAnyShift = true;
                } elseif (! $isHoliday && ! $isLeave) {
                    // Only count as absent if not holiday or leave
                    $totalMissedMinutesToday += $eveningDuration;
                    $absentDeduction += $eveningDuration * $perMinuteRateForDay;
                    $absentDetails[] = [
                        'date' => $dateStr,
                        'shift_type' => 'evening',
                        'duration_minutes' => $eveningDuration,
                        'day_name' => $dayName,
                        'per_minute_rate' => round($perMinuteRateForDay, 4),
                        'deduction' => round($eveningDuration * $perMinuteRateForDay, 2),
                    ];
                }
            }

            // Determine if this day is absent
            if ($totalExpectedMinutesToday > 0) {
                if (! $workedAnyShift && ! $isHoliday && ! $isLeave) {
                    // Employee didn't work ANY shift on this day → full day absent
                    $absentMinutes += $totalExpectedMinutesToday;
                    $absentDays++;
                } elseif ($totalMissedMinutesToday > 0) {
                    // Employee worked some shifts but missed others → partial day absent
                    $absentMinutes += $totalMissedMinutesToday;
                    // Count as partial absence (not a full absent day for reporting)
                }
            }

            // Count present days
            if ($workedAnyShift) {
                $presentDays++;
            }
        }

        // === 5. Calculate Deductions with Safety Limits ===

        // Round deductions
        $cheatDeduction = round($cheatDeduction, 0);
        $absentDeduction = round($absentDeduction, 0);

        // Calculate total deductions
        $totalDeductions = $cheatDeduction + $absentDeduction;

        // Calculate net payable BEFORE applying safety limit
        $rawNetPayable = $periodSalary - $totalDeductions;

        // Apply safety limit: Net payable should not be less than 0
        $netPayable = max(0, round($rawNetPayable, 0));

        // If deductions exceed period salary, cap them
        $actualTotalDeductions = $periodSalary - $netPayable;

        // If deductions were capped, recalculate cheat and absent deductions proportionally
        if ($totalDeductions > $actualTotalDeductions && $totalDeductions > 0) {
            $reductionRatio = $actualTotalDeductions / $totalDeductions;
            $cheatDeduction = round($cheatDeduction * $reductionRatio, 0);
            $absentDeduction = round($absentDeduction * $reductionRatio, 0);
        }

        // Generate reference number
        $referenceNum = $this->generatePayrollReferenceNumber($user->base_branch_id);

        // Generate payroll period string
        $payrollPeriod = $startDate->format('Y-m');

        // Prepare absent summary by shift type
        $absentSummary = [];
        foreach ($absentDetails as $detail) {
            $shiftType = $detail['shift_type'];
            if (! isset($absentSummary[$shiftType])) {
                $absentSummary[$shiftType] = [
                    'shift_type' => $shiftType,
                    'count' => 0,
                    'total_minutes' => 0,
                    'total_deduction' => 0,
                ];
            }
            $absentSummary[$shiftType]['count']++;
            $absentSummary[$shiftType]['total_minutes'] += $detail['duration_minutes'];
            $absentSummary[$shiftType]['total_deduction'] += $detail['deduction'];
        }

        // Round total deduction in summary
        foreach ($absentSummary as &$summary) {
            $summary['total_deduction'] = round($summary['total_deduction'], 0);
        }
        unset($summary);

        $absentSummary = array_values($absentSummary);

        // Calculate total shift minutes for the period (for reporting only)
        $totalShiftDurationMinutes = 0;
        $period = CarbonPeriod::create($startDate, $endDate);
        foreach ($period as $currentDate) {
            $dayName = $currentDate->format('l');
            $dayConfig = $shiftConfigByDay[$dayName] ?? null;

            if ($dayConfig) {
                $totalShiftDurationMinutes += $dayConfig['total_minutes'];
            }
        }

        // === 6. Save Payroll ===
        Payroll::updateOrCreate(
            [
                'user_id' => $user->id,
                'payroll_month' => $payrollPeriod,
            ],
            [
                'basic_salary' => $basicSalary,
                'cheat_minutes' => $cheatMinutes,
                'cheat_deduction' => $cheatDeduction,
                'absent_deduction' => $absentDeduction,
                'leave_days' => $leaveDays,
                'holiday_days' => $holidayDays,
                'net_payable' => $netPayable,
                'present_days' => $presentDays,
                'reference_num' => $referenceNum,
                'shift_absent' => $absentSummary,
                'absent_days' => $absentDays,
                'status' => 'unpaid',
                'period_start' => $startDate->toDateString(),
                'period_end' => $endDate->toDateString(),
                'period_days' => $periodDays,
                'period_salary' => $periodSalary,
                'shift_config' => $shiftConfigByDay,
                'absent_details' => $absentDetails,
                'cheat_details' => $cheatDetails,
                'is_full_month' => $isFullMonth,
                'effective_period_days' => $effectivePeriodDays,
                'gym_id'    =>  $user->gym_id
            ]
        );

        return [
            'user_id' => $user->id,
            'name' => $user->name,
            'payroll_period' => $payrollPeriod,
            'period_start' => $startDate,
            'period_end' => $endDate,
            'period_days' => $periodDays,
            'effective_period_days' => $effectivePeriodDays,
            'is_full_month' => $isFullMonth,
            'basic_salary' => $basicSalary,
            'period_salary' => round($periodSalary, 2),
            'daily_rate' => round($dailyRate, 2),
            'total_shift_minutes' => $totalShiftDurationMinutes,
            'cheat_minutes' => $cheatMinutes,
            'cheat_deduction' => $cheatDeduction,
            'cheat_details' => $cheatDetails,
            'absent_minutes' => $absentMinutes,
            'absent_days' => $absentDays,
            'absent_summary' => $absentSummary,
            'absent_deduction' => $absentDeduction,
            'leave_days' => $leaveDays,
            'holiday_days' => $holidayDays,
            'net_payable' => $netPayable,
            'present_days' => $presentDays,
            'absent_details' => $absentDetails,
            'reference_num' => $referenceNum,
            'status' => 'unpaid',
            'shift_config' => $shiftConfigByDay,
            'max_deduction_applied' => ($totalDeductions > $actualTotalDeductions) ? 'yes' : 'no',
            'total_deductions_before_cap' => $totalDeductions,
            'total_deductions_after_cap' => $actualTotalDeductions,
            'gym_id'    =>  $user->gym_id
        ];
    }
    private function buildDayConfig($employeeShift, $dailyRate)
    {
        // Calculate daily total minutes
        $dailyTotalMinutes = 0;
        
        $morningDuration = 0;
        if (!empty($employeeShift->morning_start_time) && !empty($employeeShift->morning_end_time)) {
            $morningDuration = $this->calculateShiftDuration(
                $employeeShift->morning_start_time,
                $employeeShift->morning_end_time
            );
            $dailyTotalMinutes += $morningDuration;
        }

        $eveningDuration = 0;
        if (!empty($employeeShift->evening_start_time) && !empty($employeeShift->evening_end_time)) {
            $eveningDuration = $this->calculateShiftDuration(
                $employeeShift->evening_start_time,
                $employeeShift->evening_end_time
            );
            $dailyTotalMinutes += $eveningDuration;
        }

        // Calculate per-minute rate for this day
        $perMinuteRateForDay = ($dailyTotalMinutes > 0) ? ($dailyRate / $dailyTotalMinutes) : 0;

        return [
            'daily_rate' => round($dailyRate, 2),
            'per_minute_rate' => round($perMinuteRateForDay, 4),
            'total_minutes' => $dailyTotalMinutes,
            'morning' => [
                'active' => !empty($employeeShift->morning_start_time) && !empty($employeeShift->morning_end_time),
                'start_time' => $employeeShift->morning_start_time,
                'end_time' => $employeeShift->morning_end_time,
                'duration_minutes' => $morningDuration,
            ],
            'evening' => [
                'active' => !empty($employeeShift->evening_start_time) && !empty($employeeShift->evening_end_time),
                'start_time' => $employeeShift->evening_start_time,
                'end_time' => $employeeShift->evening_end_time,
                'duration_minutes' => $eveningDuration,
            ],
        ];
    }

    /**
     * Calculate shift duration in minutes
     */
    private function calculateShiftDuration($startTime, $endTime)
    {
        if (empty($startTime) || empty($endTime)) {
            return 0;
        }

        $start = Carbon::parse($startTime);
        $end = Carbon::parse($endTime);

        if ($end->lessThan($start)) {
            $end->addDay();
        }

        return $start->diffInMinutes($end);
    }

    /**
     * Check if deduction should be made based on attendance_type
     */
    private function shouldDeductForAttendanceType($attendanceType)
    {
        $attendanceType = strtolower($attendanceType);

        // Define which attendance types should trigger deduction
        // Adjust this logic based on your business rules
        $deductibleTypes = ['morning', 'evening', 'full']; // Example: deduct for all types

        return in_array($attendanceType, $deductibleTypes);
    }

    public function payrolls(Request $request)
    {
        try {
            $user = $request->user();
            $search = trim($request->query('search'));
            $paginateParam = $request->disable_page_param;
            $filterPeriod = $request->query('payroll_month'); // e.g., "2024-01-01_to_2024-01-31"
            $filterStartDate = $request->query('start_date');
            $filterEndDate = $request->query('end_date');
            $filterBranch = $request->query('filter_branch_id');
            $loggedGymId = $request->logged_gym_id;
            $mainBranchId = Branch::where('type', 'main')->where('gym_id',$request->logged_gym_id)->first()?->id ?? null;

            // =============================================
            // 1. Query for LIST (with search + pagination)
            // =============================================
            $payrollsQuery = Payroll::with(['user', 'processedBy', 'transaction'])->where('gym_id',$loggedGymId)
                ->when($search, function ($query) use ($search) {
                    $query->whereHas('user', function ($q) use ($search) {
                        $q->where('name', 'like', "%{$search}%")
                            ->orWhere('reference_num', 'like', "%{$search}%")
                            ->orWhere('email', 'like', "%{$search}%");
                    });
                })
                ->when($filterPeriod, function ($query) use ($filterPeriod) {
                    $query->where('payroll_month', $filterPeriod);
                })
                ->when($filterStartDate && $filterEndDate, function ($query) use ($filterStartDate, $filterEndDate) {
                    $query->where('period_start', '>=', $filterStartDate)
                        ->where('period_end', '<=', $filterEndDate);
                })
                ->when($filterBranch, function ($query) use ($filterBranch) {
                    $query->whereHas('user', function ($q) use ($filterBranch) {
                        $q->where('base_branch_id', $filterBranch);
                    });
                })
                // Restrict query based on user type
                ->when($user->user_type === 'employee', function ($query) use ($user) {
                    // If employee, show only their own payrolls
                    $query->where('user_id', $user->id);
                })
                // If default user in main branch, show all (no restriction)
                // If not in main branch or not default user, show only payrolls of that branch
                ->when(! ($request->logged_branch_id == $mainBranchId && $user->type == 'default'),
                    function ($query) use ($request) {
                        $query->whereHas('user', function ($q) use ($request) {
                            // dd($request->logged_branch_id);
                            $q->where('base_branch_id', $request->logged_branch_id);
                        });
                    })
                ->orderBy('period_start', 'desc')
                ->orderBy('id', 'desc');

            if ($paginateParam && $paginateParam == 1) {
                $payrolls = $payrollsQuery->get();
            } else {
                $payrolls = $payrollsQuery->paginate($request->limit ?? 10);
            }

            // =============================================
            // 2. Query for SUMMARY (independent of search & pagination)
            //    Apply same user type and branch restrictions
            // =============================================
            $summaryQuery = Payroll::where('gym_id',$loggedGymId);
            // Apply same restrictions as above
            if ($user->user_type === 'employee') {
                $summaryQuery->where('user_id', $user->id);
            }

            if (! ($request->logged_branch_id == $mainBranchId && $user->type == 'default')) {
                $summaryQuery->whereHas('user', function ($q) use ($request) {
                    $q->where('base_branch_id', $request->logged_branch_id);
                });
            }

            // Only apply period filter if provided
            if ($filterPeriod) {
                $summaryQuery->where('payroll_month', $filterPeriod);
            }

            if ($filterStartDate && $filterEndDate) {
                $summaryQuery->where('period_start', '>=', $filterStartDate)
                    ->where('period_end', '<=', $filterEndDate);
            }

            if ($filterBranch) {
                $summaryQuery->whereHas('user', function ($q) use ($filterBranch) {
                    $q->where('base_branch_id', $filterBranch);
                });
            }

            $totalPayroll = $summaryQuery->sum('net_payable');
            $totalEmployees = $summaryQuery->count();

            // Calculate average attendance days
            $avgAttendance = $totalEmployees > 0
                ? round(
                    $summaryQuery
                        ->selectRaw('AVG(present_days) as avg_att')
                        ->value('avg_att') ?? 0
                )
                : 0;

            // Calculate paid vs unpaid
            $paidPayrolls = $summaryQuery->clone()->where('status', 'paid')->sum('net_payable');
            $unpaidPayrolls = $summaryQuery->clone()->where('status', 'unpaid')->sum('net_payable');
            $paidCount = $summaryQuery->clone()->where('status', 'paid')->count();
            $unpaidCount = $summaryQuery->clone()->where('status', 'unpaid')->count();

            $summary = [
                'total_payroll' => (float) $totalPayroll,
                'total_employees_paid' => (int) $totalEmployees,
                'avg_attendance_days' => (int) round($avgAttendance),
                'paid_payrolls_amount' => (float) $paidPayrolls,
                'unpaid_payrolls_amount' => (float) $unpaidPayrolls,
                'paid_payrolls_count' => (int) $paidCount,
                'unpaid_payrolls_count' => (int) $unpaidCount,
            ];

            // =============================================
            // 3. Inject summary into paginated response
            // =============================================
            $responseData = $payrolls->toArray();
            $responseData['summary'] = $summary;

            return apiSuccess($responseData, 'Payrolls fetched successfully', 200);

        } catch (Exception $e) {
            return apiError('Failed to fetch payrolls', 500, $e->getMessage());
        }
    }

    public function editPayroll(Request $request)
    {
        $loggedGymId = $request->logged_gym_id;
        $validator = Validator::make($request->all(), [
             'user_id' => ['required', 'integer', function ($attribute, $value, $fail) use ($loggedGymId ) {
                $user = User::where('gym_id',$loggedGymId)->where('id',$value)->first();
                if (!$user) {
                    return $fail('User not found');
                }
            }],
            'payroll_month' => 'required|string', // Now this is the period string
            'basic_salary' => 'nullable|numeric|min:0',
            'cheat_minutes' => 'nullable|integer|min:0',
            'cheat_deduction' => 'nullable|numeric|min:0',
            'absent_deduction' => 'nullable|numeric|min:0',
            'leave_days' => 'nullable|integer|min:0',
            'holiday_days' => 'nullable|integer|min:0',
            'net_payable' => 'nullable|numeric|min:0',
            'present_days' => 'nullable|integer|min:0',
            'reference_num' => 'nullable|string|max:255',
            'status' => 'nullable|in:unpaid,paid',
            'period_start' => 'nullable|date_format:Y-m-d',
            'period_end' => 'nullable|date_format:Y-m-d',
        ]);

        if ($validator->fails()) {
            return apiError('Validation failed', 422, $validator->errors()->first());
        }

        try {
            $userId = $request->user_id;
            $payrollMonth = $request->payroll_month;

            // Check employee
            $user = User::find($userId);
            if (! $user || ! ($user->user_type == 'employee')) {
                return apiError('Invalid employee', 422, 'The selected user is not an employee.');
            }

            // Find existing payroll record
            $payroll = Payroll::where('user_id', $userId)
                ->where('payroll_month', $payrollMonth)
                ->first();

            if (! $payroll) {
                return apiError('Payroll not found', 404, 'No payroll record found for this employee and period.');
            }
             // Check if already paid
            if ($payroll->status == 'paid') {
                return apiError('Payroll already paid', 422, 'This payroll has already been processed.');
            }
            
            if($request->filled('net_payable') && $request->net_payable > $payroll->basic_salary){
                return apiError('Invalid amount', 422, 'Net Payable cannot be greater than Basic Salary.');
            }

            // Build update array
            $updateData = [];

            if ($request->filled('basic_salary')) {
                $updateData['basic_salary'] = $request->basic_salary;
            }
            if ($request->filled('cheat_minutes')) {
                $updateData['cheat_minutes'] = $request->cheat_minutes;
            }
            if ($request->filled('cheat_deduction')) {
                $updateData['cheat_deduction'] = $request->cheat_deduction;
            }
            if ($request->filled('absent_deduction')) {
                $updateData['absent_deduction'] = $request->absent_deduction;
            }
            if ($request->filled('leave_days')) {
                $updateData['leave_days'] = $request->leave_days;
            }
            if ($request->filled('holiday_days')) {
                $updateData['holiday_days'] = $request->holiday_days;
            }
            if ($request->filled('net_payable')) {
                $updateData['net_payable'] = round($request->net_payable, 2);
            }
            if ($request->filled('present_days')) {
                $updateData['present_days'] = $request->present_days;
            }
            if ($request->filled('reference_num')) {
                $updateData['reference_num'] = $request->reference_num;
            }
            if ($request->filled('status')) {
                $updateData['status'] = $request->status;
            }
            if ($request->filled('period_start')) {
                $updateData['period_start'] = $request->period_start;
            }
            if ($request->filled('period_end')) {
                $updateData['period_end'] = $request->period_end;
            }

            if (empty($updateData)) {
                return apiSuccess($payroll, 'No changes made', 200);
            }

            $payroll->update($updateData);

            return apiSuccess($payroll->refresh(), 'Payroll updated successfully', 200);

        } catch (Exception $e) {
            return apiError('Failed to update payroll', 500, $e->getMessage());
        }
    }

    public function payPayroll(Request $request)
    {
        $loggedGymId = $request->logged_gym_id;
        $validator = Validator::make($request->all(), [
            'payroll_id' => ['required', 'integer', function ($attribute, $value, $fail) use ($loggedGymId) {
                $payroll = Payroll::where('gym_id',$loggedGymId)->where('id',$value)->first();
                if (! $payroll) {
                    return $fail('Payroll not found.');
                }
            }],
            'payment_method' => 'required|string|in:cash,bank',
             'bank_id' => ['nullable' , 'required_if:payment_method,bank' , 'integer', function ($attribute, $value, $fail) use ($loggedGymId) {
                $bank = Bank::where('gym_id',$loggedGymId)->where('id',$value)->first();
                if (! $bank) {
                    return $fail('Bank not found.');
                }
            }],
        ]);

        if ($validator->fails()) {
            return apiError('Validation failed', 422, $validator->errors()->first());
        }

        try {
            DB::beginTransaction();

            $payroll = Payroll::with('user')->findOrFail($request->payroll_id);

            // Check if already paid
            if ($payroll->status == 'paid') {
                return apiError('Payroll already paid', 422, 'This payroll has already been processed.');
            }

            // Check if net payable is valid
            if ($payroll->net_payable <= 0) {
                return apiError('Invalid amount', 422, 'Net payable amount is invalid.');
            }

            $user = $request->user();
            $branchId = $payroll->user->base_branch_id ?? $request->logged_branch_id;

            // Update payroll status
            $payroll->update([
                'status' => 'paid',
                'processed_by' => $user->id,
                'processed_at' => now(),
            ]);

            $processedAtFormattedDate = $payroll->processed_at->format('Y-m-d');
            // Create transaction record
            $description = "Salary payment for {$payroll->user->name} - {$payroll->payroll_month} (Ref: {$payroll->reference_num})";

            createPaymentTransaction(
                $payroll->net_payable,
                $request->payment_method,
                'expense',
                $payroll->id,
                'payrollType',
                $description,
                $request->logged_gym_id,
                $branchId,
                $processedAtFormattedDate,
                $request->bank_id
            );

            DB::commit();

            return apiSuccess($payroll->refresh(), 'Payroll paid successfully', 200);

        } catch (Exception $e) {
            DB::rollBack();

            return apiError('Failed to process payroll payment', 500, $e->getMessage());
        }
    }
}
