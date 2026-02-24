<?php

use App\Models\Attendance;
use App\Models\Branch;
use App\Models\EmployeeShift;
use App\Models\Gym;
use App\Models\Invoice;
use App\Models\Shift;
use App\Models\Transaction;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

if(!function_exists('fetchTodayAttendance')){
    function fetchTodayAttendance($userId , $attendanceType){
        $user = User::with('employeeProfile')->whereHas('employeeProfile')->where('id',$userId)->first();
        $todayAttendance = null;
        $now  = Carbon::now();
        $attendanceDate = $now->toDateString();
        $todayAttendance = Attendance::where('user_id',$user->id)->where('date',$attendanceDate)->where('attendance_type',$attendanceType)->first();
        if($todayAttendance){
            return [
                'today_attendance_exist' => true,
                'attendance'            =>  $todayAttendance
            ];
        }
        return [
            'today_attendance_exist' => false,
            'attendance'            =>  null
        ];
    }
}

function generatePaymentVoucherReferenceNum($branchId){
    $branch = Branch::find($branchId);
    $branchCode = $branch->reference_num;  
    $prefix = $branchCode.'-PV'; 
    // $prefix = 'PV' . $branchCode;          
    // Get last for this branch
    $last = Transaction::where('reference_num', 'LIKE', $prefix . '%') ->orderByRaw('CAST(SUBSTRING(reference_num, ? + 1) AS UNSIGNED) DESC', [strlen($prefix)])  ->first();
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
    return $newRefNum;
}

if(!function_exists('createPaymentTransaction')){
    function createPaymentTransaction($amount , $depositMethod , $trasactionType , $referenceId , $targetType , $description , $gymId , $branchId , $transactionDate , $bankId = null){
        $incomeId = null;
        $expenseId = null;
        $payrollId = null;
        $feeCollectionId = null;
        $source = null;
        $debitAmount = 0;
        $creditAmount = 0;
        if($targetType == 'expenseType'){
            $expenseId = $referenceId;
            $debitAmount = $amount;
            $source = 'expense';
        }elseif($targetType == 'incomeType'){
            $incomeId = $referenceId;
            $creditAmount = $amount;
            $source = 'income';
        }elseif($targetType == 'payrollType'){
            $payrollId = $referenceId;
            $debitAmount = $amount;
            $source = 'payroll_expense';
        }else{
            $feeCollectionId = $referenceId;
            $creditAmount = $amount;
            $source = 'membership';
        }
       
        $transaction = Transaction::create(['payment_method' => $depositMethod , 'debit_amount' => $debitAmount , 'credit_amount' => $creditAmount , 'date' => $transactionDate , 'time' => now()->toTimeString() , 'description' => $description , 'gym_id' => $gymId , 'transaction_type' => $trasactionType , 'expense_id' => $expenseId , 'payroll_id' => $payrollId , 'income_id' => $incomeId , 'fee_collection_id' => $feeCollectionId , 'created_by' => Auth::id() , 'source' => $source , 'branch_id' => $branchId , 'bank_id' => $bankId]);
        // $transRefNum = 'PV'.str_pad($transaction->id , 6 , '0' , STR_PAD_LEFT);
        $transRefNum = generatePaymentVoucherReferenceNum($branchId);                             
        $transaction->update(['reference_num' => $transRefNum]);
    }
}

if(!function_exists('updatePaymentTransaction')){
    function updatePaymentTransaction($previousTransaction ,  $amount , $depositMethod , $trasactionType , $referenceId , $targetType , $description , $branchId , $transactionDate, $bankId = null){
        $incomeId = null;
        $expenseId = null;
         $payrollId = null;
        $feeCollectionId = null;
        $source = null;
        $debitAmount = 0;
        $creditAmount = 0;
        if($targetType == 'expenseType'){
            $expenseId = $referenceId;
            $debitAmount = $amount;
            $source = 'expense';
        }elseif($targetType == 'incomeType'){
            $incomeId = $referenceId;
            $creditAmount = $amount;
            $source = 'income';
        }elseif($targetType == 'payrollType'){
            $payrollId = $referenceId;
            $debitAmount = $amount;
            $source = 'payroll_expense';
        }elseif($targetType == 'feeCollectionType'){
            $feeCollectionId = $referenceId;
            $creditAmount = $amount;
            $source = 'membership';
        }
        $previousTransaction->update(['payment_method' => $depositMethod , 'debit_amount' => $debitAmount , 'credit_amount' => $creditAmount , 'date' => $transactionDate , 'time' => now()->toTimeString() , 'description' => $description , 'transaction_type' => $trasactionType , 'expense_id' => $expenseId , 'income_id' => $incomeId , 'payroll_id' => $payrollId , 'fee_collection_id' => $feeCollectionId , 'created_by' => Auth::id() , 'source' => $source , 'branch_id' => $branchId , 'bank_id' => $bankId]);
       
    }
}

if(!function_exists('generateUserReferenceNum')){
    function generateUserReferenceNum($userType  , $loggedBranchId){
       
        $branch = Branch::find($loggedBranchId);
        $branchCode = $branch->reference_num; 
        if($userType == 'member'){
            $prefix = $branchCode.'-M';
        }else{
            $prefix = $branchCode.'-E';
        }
        // Get last user for this branch
        $lastUser = User::where('reference_num', 'LIKE', $prefix . '%')  ->orderByRaw('CAST(SUBSTRING(reference_num, ? + 1) AS UNSIGNED) DESC', [strlen($prefix)])  ->first();
        if ($lastUser) {
            $lastRef = $lastUser->reference_num;
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
        return $newRefNum;
    }
}

if(!function_exists('generateInvoiceRefNum')){
    function generateInvoiceRefNum($gym){
        $gymCode = $gym->reference_num; 
        $prefix = $gymCode.'-INV-';
        $lastInvoice = Invoice::where('reference_num', 'LIKE', $prefix . '%') ->orderByRaw('CAST(SUBSTRING(reference_num, ? + 1) AS UNSIGNED) DESC', [strlen($prefix)]) ->first();
        if ($lastInvoice) {
            $lastRef = $lastInvoice->reference_num;
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
        return $newRefNum;
    }
}

