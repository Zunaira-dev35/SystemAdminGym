<?php

namespace App\Http\Controllers;

use App\Models\Bank;
use App\Models\Branch;
use App\Models\Expense;
use App\Models\ExpenseCategory;
use App\Models\Income;
use App\Models\IncomeCategory;
use App\Models\SystemSetting;
use App\Models\Transaction;
use Carbon\Carbon;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class FinanceController extends Controller
{
    function expenseCategories(Request $request){
        try{
            $validator = Validator::make($request->all() , [
                'disable_page_param' => 'nullable|in:1,0',
                'limit' =>  'nullable|integer'
            ]);

            if($validator->fails()){
                return apiError('Validation failed' , 422 , $validator->errors()->first());
            }

            $search = $request->query('search');
            $paginateParam = $request->query('disable_page_param');
            $filterBranch = $request->query('filter_branch_id');
            $mainBranchId = Branch::where('type','main')->where('gym_id',$request->logged_gym_id)->first()?->id ?? null;
            $expenseCategoriesQuery = ExpenseCategory::with('createdBy')->where('gym_id',$request->logged_gym_id)->when($search , function($query) use ($search){
                $query->where('title','like',"%{$search}%");
            })->when($filterBranch , function($query) use ($filterBranch){
                $query->where('branch_id',$filterBranch);
            })
            ->when(!($request->logged_branch_id == $mainBranchId && $request->user()->type == 'default'),
            function($query) use ($request){
                $query->where('branch_id', $request->logged_branch_id);
            })
            ->orderby('id','desc');
            if($paginateParam && $paginateParam == 1){
                $expenseCategories = $expenseCategoriesQuery->get();
            }else{
                $expenseCategories = $expenseCategoriesQuery->paginate($request->limit ?? 10);
            }
            return apiSuccess($expenseCategories , 'Expense categories fetched successfully' , 200);
        }catch(Exception $e){
            return apiError('Failed to fetch expense categories' , 500 , $e->getMessage());
        }
    }

    function expenseCategoryDelete(Request $request){
        $loggedGymId = $request->logged_gym_id;
        $validator = Validator::make($request->all() , [
            'category_id' => ['required', 'integer', function ($attribute, $value, $fail) use ($loggedGymId) {
                $expenseCategory = ExpenseCategory::where('gym_id',$loggedGymId)->where('id',$value)->first();
                if (!$expenseCategory) {
                    return $fail('Expense category not found.');
                }
            }],
            // 'category_id'   =>  'required|exists:expense_categories,id'
        ]);

        if($validator->fails()){
            return apiError('Validation failed' , 422 , $validator->errors()->first());
        }

        try{
            $existingExpense = Expense::where('category_id',$request->category_id)->exists();
            if($existingExpense){
                return apiError('Failed to delete',422,'Delete failed , category has existing expense');
            }
            $category = ExpenseCategory::where('id',$request->category_id)->first();
            $category->delete();
            return apiSuccess(null,'Expense category deleted sucessfully' ,200);
        }catch(Exception $e){
            return apiError('Failed to delete expense category' , 500 , $e->getMessage());
        }
    }

    function expenseCategoryStore(Request $request){
        $loggedGymId = $request->logged_gym_id;
        $validator = Validator::make($request->all() , [
            'title' => [
                'required',
                'string',
                Rule::unique('expense_categories', 'title')
                    ->where(fn ($query) => $query->where('gym_id', $request->logged_gym_id))
                    ->ignore($request->id)
            ],
            // 'title'             =>      'required|string|unique:expense_categories,title,'.$request->id,
            'id' => [
                'nullable',
                Rule::exists('expense_categories', 'id')->where(function ($query) use ($loggedGymId) {
                    $query->where('gym_id', $loggedGymId);
                }),
            ],
            // 'id'                =>      'nullable|exists:expense_categories,id',
            'description'       =>      'nullable|string'
        ]);

        if($validator->fails()){
            return apiError('Validation failed' , 422 , $validator->errors()->first());
        }

        try{
            $data = [];
            $data = array_reduce(['title','description'] , function($carry , $input) use ($request){
                $carry[$input] = $request->input($input);
                return $carry;
            });
            $data['created_by'] = Auth::id();
            $data['branch_id'] = $request->logged_branch_id;
            $data['gym_id'] = $loggedGymId;
            ExpenseCategory::updateOrInsert(['id' => $request->input('id')] , $data);
            $latestExpenseCategory = $request->id ? ExpenseCategory::where('gym_id',$request->logged_gym_id)->where('id',$request->id)->first() : ExpenseCategory::where('gym_id',$request->logged_gym_id)->orderBy('id','desc')->first();
            return apiSuccess($latestExpenseCategory , 'Expense category stored successfully' , 200);
        }catch(Exception $e){
            return apiError('Failed to store expense category' , 500 , $e->getMessage());
        }
    }

     function expenses(Request $request){
        try{
            $validator = Validator::make($request->all() , [
                'disable_page_param' => 'nullable|in:1,0',
                'limit' =>  'nullable|integer'
            ]);

            if($validator->fails()){
                return apiError('Validation failed' , 422 , $validator->errors()->first());
            }

            $search = $request->query('search');
            $startDate = $request->query('start_date');
            $endDate = $request->query('end_date');
            $paginateParam = $request->query('disable_page_param');
            $filterBranch = $request->query('filter_branch_id');
            $mainBranchId = Branch::where('type','main')->where('gym_id',$request->logged_gym_id)->first()?->id ?? null;
           
            $expenseQuery = Expense::with('category','transaction.createdBy','transaction.branch','createdBy','branch','transaction.bank')->where('gym_id',$request->logged_gym_id)->when($search , function($query) use ($search){
                $query->where(function ($q) use ($search) {
                    $q->where('title','like',"%{$search}%")
                    ->orWhere('reference_num','like',"%{$search}%")
                    ->orWhereHas('category',function($cq) use ($search){
                    $cq->where('title','like',"%{$search}%");
                    });
                });
            })
            ->when($startDate && $endDate , function($query) use ($startDate , $endDate){
                $query->whereBetween('date',[$startDate , $endDate]);
            })->when($filterBranch , function($query) use ($filterBranch){
                $query->where('branch_id',$filterBranch);
            })
           ->when(!($request->logged_branch_id == $mainBranchId && $request->user()->type == 'default'),
            function($query) use ($request){
                $query->where('branch_id', $request->logged_branch_id);
            })
            ->orderby('id','desc');
            if($paginateParam && $paginateParam == 1){
                $expenses = $expenseQuery->get();
            }else{
                $expenses = $expenseQuery->paginate($request->limit ?? 10);
            }
            return apiSuccess($expenses , 'Expenses fetched successfully' , 200);
        }catch(Exception $e){
            return apiError('Failed to fetch expenses' , 500 , $e->getMessage());
        }
    }

    function expenseDelete(Request $request){
        $loggedGymId = $request->logged_gym_id;
        $validator = Validator::make($request->all() , [
            'expense_id' => [
                'required',
                Rule::exists('expenses', 'id')->where(function ($query) use ($loggedGymId) {
                    $query->where('gym_id', $loggedGymId);
                }),
            ],
        ]);

        if($validator->fails()){
            return apiError('Validation failed' , 422 , $validator->errors()->first());
        }

        try{
            DB::beginTransaction();
            $expense = Expense::where('id',$request->expense_id)->first();
            //Delete transaction
            Transaction::where('expense_id',$expense->id)->delete();
            $expense->delete();
            DB::commit();
            return apiSuccess(null,'Expense deleted sucessfully' ,200);
        }catch(Exception $e){
            DB::rollBack();
            return apiError('Failed to delete expense' , 500 , $e->getMessage());
        }
    }

    function expenseStore(Request $request){
        $loggedGymId = $request->logged_gym_id;
        $validator = Validator::make($request->all() , [
            'title'             =>      'required|string',
            'category_id' => [
                'required',
                Rule::exists('expense_categories', 'id')->where(function ($query) use ($loggedGymId) {
                    $query->where('gym_id', $loggedGymId);
                }),
            ],
            'amount'            =>      'required|numeric|gt:0',
            'deposit_method'     =>      'required|in:cash,bank',
            'notes'             =>      'nullable|string',
            'date'              =>      'required|date',
            'id' => [
                'nullable',
                Rule::exists('expenses', 'id')->where(function ($query) use ($loggedGymId) {
                    $query->where('gym_id', $loggedGymId);
                }),
            ],
             'bank_id' => [
                'nullable','required_if:deposit_method,bank',
                Rule::exists('banks', 'id')->where(function ($query) use ($loggedGymId) {
                    $query->where('gym_id', $loggedGymId);
                }),
            ],
        ]);

        if($validator->fails()){
            return apiError('Validation failed' , 422 , $validator->errors()->first());
        }

        try{
            DB::beginTransaction();
            $data = [];
            $data = array_reduce(['title','category_id','amount','deposit_method','notes','date'] , function($carry , $input) use ($request){
                $carry[$input] = $request->input($input);
                return $carry;
            });
            $data['created_by'] = Auth::id();
            $data['time'] = now()->toTimeString();
            $branchId = $request->logged_branch_id;
            $data['branch_id'] = $branchId;
            $data['bank_id'] = $request->bank_id;
            $data['gym_id'] = $request->logged_gym_id;
            Expense::updateOrInsert(['id' => $request->input('id')] , $data);
            $latestExpense = $request->id ? Expense::where('id',$request->id)->first() : Expense::orderBy('id','desc')->first();
            if(empty($request->id)){
                $catRefNum = $this->generateExpenseRefNum($branchId);              
                $latestExpense->update(['reference_num' => $catRefNum]);
            }
            $description = 'Expense added by '.$request->user()->name.' '.$request->user()->reference_num;
            $previousTransaction = Transaction::where('expense_id',$latestExpense->id)->first();
            if($previousTransaction){
                //Update previous transaction
                updatePaymentTransaction($previousTransaction ,  $request->amount , $request->deposit_method , 'expense' , $latestExpense->id , 'expenseType' , $description , $branchId ,  $latestExpense->date , $request->bank_id);
            }else{
                //Create Transaction
                createPaymentTransaction($request->amount , $request->deposit_method , 'expense' , $latestExpense->id , 'expenseType' , $description , $request->logged_gym_id , $branchId , $latestExpense->date , $request->bank_id);
            }
             //Generate system log
            $logTitle = $request->id ? 'Expense Updated' : 'Expense Added';
            $logDes = $request->id ? 'Expense '.$latestExpense->reference_num.' updated successfully' : 'Expense '.$latestExpense->reference_num.' added successfully';
            GenerateSystemLogs($logTitle , $logDes , $latestExpense->id, 'Expense' , $request->logged_gym_id, $request->logged_branch_id , $request->ip());
            DB::commit();
            return apiSuccess($latestExpense , 'Expense stored successfully' , 200);
        }catch(Exception $e){
            DB::rollBack();
            return apiError('Failed to store expense' , 500 , $e->getMessage());
        }
    }
    
    function incomeCategories(Request $request){
        try{
            $validator = Validator::make($request->all() , [
                'disable_page_param' => 'nullable|in:1,0',
                'limit' =>  'nullable|integer'
            ]);

            if($validator->fails()){
                return apiError('Validation failed' , 422 , $validator->errors()->first());
            }

            $search = $request->query('search');
            $paginateParam = $request->query('disable_page_param');
             $filterBranch = $request->query('filter_branch_id');
            $mainBranchId = Branch::where('type','main')->where('gym_id',$request->logged_gym_id)->first()?->id ?? null;
            $incomeCategoriesQuery = IncomeCategory::with('createdBy')->where('gym_id',$request->logged_gym_id)->when($search , function($query) use ($search){
                $query->where('title','like',"%{$search}%");
                
            })->when($filterBranch , function($query) use ($filterBranch){
                $query->where('branch_id',$filterBranch);
            })
            ->when(!($request->logged_branch_id == $mainBranchId && $request->user()->type == 'default'),
            function($query) use ($request){
                $query->where('branch_id', $request->logged_branch_id);
            })
            ->orderby('id','desc');
            if($paginateParam && $paginateParam == 1){
                $incomeCategories = $incomeCategoriesQuery->get();
            }else{
                $incomeCategories = $incomeCategoriesQuery->paginate($request->limit ?? 10);
            }
            return apiSuccess($incomeCategories , 'Income categories fetched successfully' , 200);
        }catch(Exception $e){
            return apiError('Failed to fetch income categories' , 500 , $e->getMessage());
        }
    }

    function incomeCategoryDelete(Request $request){
        $loggedGymId = $request->logged_gym_id;
        $validator = Validator::make($request->all() , [
            'category_id' => [
                'required',
                Rule::exists('income_categories', 'id')->where(function ($query) use ($loggedGymId) {
                    $query->where('gym_id', $loggedGymId);
                }),
            ],
        ]);

        if($validator->fails()){
            return apiError('Validation failed' , 422 , $validator->errors()->first());
        }

        try{
            $existingIncome = Income::where('category_id',$request->category_id)->exists();
            if($existingIncome){
                return apiError('Failed to delete',422,'Delete failed , category has existing income');
            }
            $category = IncomeCategory::where('id',$request->category_id)->first();
            $category->delete();
            return apiSuccess(null,'Income category deleted sucessfully' ,200);
        }catch(Exception $e){
            return apiError('Failed to delete income category' , 500 , $e->getMessage());
        }
    }

    function incomeCategoryStore(Request $request){
        $loggedGymId = $request->logged_gym_id;
        $validator = Validator::make($request->all() , [
            'title' => [
                'required',
                'string',
                Rule::unique('income_categories', 'title')
                    ->where(fn ($query) => $query->where('gym_id', $request->logged_gym_id))
                    ->ignore($request->id)
            ],
            'id' => [
                'nullable',
                Rule::exists('income_categories', 'id')->where(function ($query) use ($loggedGymId) {
                    $query->where('gym_id', $loggedGymId);
                }),
            ],
            'description'       =>      'nullable|string'
        ]);

        if($validator->fails()){
            return apiError('Validation failed' , 422 , $validator->errors()->first());
        }

        try{
            $data = [];
            $data = array_reduce(['title','description'] , function($carry , $input) use ($request){
                $carry[$input] = $request->input($input);
                return $carry;
            });
            $data['created_by'] = Auth::id();
            $data['branch_id'] = $request->logged_branch_id;
            $data['gym_id'] = $loggedGymId;
            IncomeCategory::updateOrInsert(['id' => $request->input('id')] , $data);
            $latestIncomeCategory = $request->id ? IncomeCategory::where('gym_id', $loggedGymId)->where('id',$request->id)->first() : IncomeCategory::where('gym_id', $loggedGymId)->orderBy('id','desc')->first();
            return apiSuccess($latestIncomeCategory , 'Income category stored successfully' , 200);
        }catch(Exception $e){
            return apiError('Failed to store income category' , 500 , $e->getMessage());
        }
    }

     function incomes(Request $request){
        $loggedGymId = $request->logged_gym_id;
         $validator = Validator::make($request->all() , [
             'disable_page_param' => 'nullable|in:1,0',
             'limit' =>  'nullable|integer'
         ]);

         if($validator->fails()){
             return apiError('Validation failed' , 422 , $validator->errors()->first());
         }
        try{

            $search = $request->query('search');
            $startDate = $request->query('start_date');
            $endDate = $request->query('end_date');
            $paginateParam = $request->query('disable_page_param');
            $filterBranch = $request->query('filter_branch_id');
            $mainBranchId = Branch::where('type','main')->where('gym_id', $loggedGymId)->first()?->id ?? null;
            $incomeQuery = Income::with('category','transaction.createdBy','transaction.branch','createdBy','branch','transaction.bank')->where('gym_id', $loggedGymId)->when($search , function($query) use ($search){
                $query->where(function ($q) use ($search) {
                    $q->where('title','like',"%{$search}%")
                    ->orWhere('reference_num','like',"%{$search}%")
                    ->orWhereHas('category',function($cq) use ($search){
                    $cq->where('title','like',"%{$search}%");
                    });
                });
            })
            ->when($startDate && $endDate , function($query) use ($startDate , $endDate){
                $query->whereBetween('date',[$startDate , $endDate]);
            })->when($filterBranch , function($query) use ($filterBranch){
                $query->where('branch_id',$filterBranch);
            })
            ->when(!($request->logged_branch_id == $mainBranchId && $request->user()->type == 'default'),
            function($query) use ($request){
                $query->where('branch_id', $request->logged_branch_id);
            })
            ->orderby('id','desc');
            if($paginateParam && $paginateParam == 1){
                $incomes = $incomeQuery->get();
            }else{
                $incomes = $incomeQuery->paginate($request->limit ?? 10);
            }
            return apiSuccess($incomes , 'Incomes fetched successfully' , 200);
        }catch(Exception $e){
            return apiError('Failed to fetch incomes' , 500 , $e->getMessage());
        }
    }

    function incomeDelete(Request $request){
        $loggedGymId = $request->logged_gym_id;
        $validator = Validator::make($request->all() , [
            'income_id' => [
                'required',
                Rule::exists('incomes', 'id')->where(function ($query) use ($loggedGymId) {
                    $query->where('gym_id', $loggedGymId);
                }),
            ],
        ]);

        if($validator->fails()){
            return apiError('Validation failed' , 422 , $validator->errors()->first());
        }

        try{
            DB::beginTransaction();
            $income = Income::where('id',$request->income_id)->first();
            //Delete transaction
            Transaction::where('income_id',$income->id)->delete();
            $income->delete();
            DB::commit();
            return apiSuccess(null,'Income deleted sucessfully' ,200);
        }catch(Exception $e){
            DB::rollback();
            return apiError('Failed to delete income' , 500 , $e->getMessage());
        }
    }

    function generateIncomeRefNum($branchId){
        $branch = Branch::find($branchId);
        $branchCode = $branch->reference_num;  
        $prefix = $branchCode.'-IN'; 
        // $prefix = 'IN' . $branchCode;          
        // Get last for this branch
        $last = Income::where('reference_num', 'LIKE', $prefix . '%') ->orderByRaw('CAST(SUBSTRING(reference_num, ? + 1) AS UNSIGNED) DESC', [strlen($prefix)]) ->first();
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

    function generateExpenseRefNum($branchId){
        $branch = Branch::find($branchId);
        $branchCode = $branch->reference_num;  
        $prefix = $branchCode.'-EX'; 
    // $prefix = 'EX' . $branchCode;          
    // Get last for this branch
    $last = Expense::where('reference_num', 'LIKE', $prefix . '%')->orderByRaw('CAST(SUBSTRING(reference_num, ? + 1) AS UNSIGNED) DESC', [strlen($prefix)]) ->first();
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

    function incomeStore(Request $request){
        $loggedGymId = $request->logged_gym_id;
        $validator = Validator::make($request->all() , [
            'title'             =>      'required|string',
            'category_id' => [
                'required',
                Rule::exists('income_categories', 'id')->where(function ($query) use ($loggedGymId) {
                    $query->where('gym_id', $loggedGymId);
                }),
            ],
            'amount'            =>      'required|numeric|gt:0',
            'deposit_method'     =>      'required|in:cash,bank',
            'notes'             =>      'nullable|string',
            'date'              =>      'required|date',
            'id' => [
                'nullable',
                Rule::exists('incomes', 'id')->where(function ($query) use ($loggedGymId) {
                    $query->where('gym_id', $loggedGymId);
                }),
            ],
            'bank_id' => [
                'nullable','required_if:deposit_method,bank',
                Rule::exists('banks', 'id')->where(function ($query) use ($loggedGymId) {
                    $query->where('gym_id', $loggedGymId);
                }),
            ],
        ]);

        if($validator->fails()){
            return apiError('Validation failed' , 422 , $validator->errors()->first());
        }

        try{
            DB::beginTransaction();
            $data = [];
            $data = array_reduce(['title','category_id','amount','deposit_method','notes','date'] , function($carry , $input) use ($request){
                $carry[$input] = $request->input($input);
                return $carry;
            });
            $data['created_by'] = Auth::id();
            $data['time'] = now()->toTimeString();
            $branchId = $request->logged_branch_id;
            $data['branch_id'] = $branchId;
            $data['bank_id'] = $request->bank_id;
            $data['gym_id'] = $loggedGymId;
            Income::updateOrInsert(['id' => $request->input('id')] , $data);
            $latestIncome = $request->id ? Income::where('gym_id',$loggedGymId)->where('id',$request->id)->first() : Income::where('gym_id',$loggedGymId)->orderBy('id','desc')->first();
            if(empty($request->id)){
                $catRefNum = $this->generateIncomeRefNum($branchId);             
                $latestIncome->update(['reference_num' => $catRefNum]);
            }
            $description = 'Income added by '.$request->user()->name.' '.$request->user()->reference_num;
            $previousTransaction = Transaction::where('income_id',$latestIncome->id)->first();
            if($previousTransaction){
                //Update previous transaction
                updatePaymentTransaction($previousTransaction ,  $request->amount , $request->deposit_method , 'income' , $latestIncome->id , 'incomeType' , $description , $branchId  , $latestIncome->date , $request->bank_id);
            }else{
                //Create Transaction
                createPaymentTransaction($request->amount , $request->deposit_method , 'income' , $latestIncome->id , 'incomeType' , $description , $request->logged_gym_id , $branchId  , $latestIncome->date , $request->bank_id);
            }
            //Generate system log
            $logTitle = $request->id ? 'Income Updated' : 'Income Added';
            $logDes = $request->id ? 'Income '.$latestIncome->reference_num.' updated successfully' : 'Income '.$latestIncome->reference_num.' added successfully';
            GenerateSystemLogs($logTitle , $logDes , $latestIncome->id, 'Income' , $request->logged_gym_id , $request->logged_branch_id , $request->ip());
            DB::commit();
            return apiSuccess($latestIncome , 'Income stored successfully' , 200);
        }catch(Exception $e){
            DB::rollBack();
            return apiError('Failed to store income' , 500 , $e->getMessage());
        }
    }

    function paymentVouchers(Request $request){
        $loggedGymId = $request->logged_gym_id;
        $validator = Validator::make($request->all() , [
            'start_date'    =>  'nullable|date',
            'end_date'      =>  'nullable|date',
            'transaction_type'  =>  'nullable|in:income,expense',
            'source'  =>  'nullable|in:income,expense,membership,payroll_expense'
        ]);
        if($validator->fails()){
            return apiError('Validation failed' , 422 , $validator->errors()->first());
        }
        try{
            $filterBranch = $request->query('filter_branch_id');
            $mainBranchId = Branch::where('type','main')->where('gym_id',$loggedGymId)->first()?->id ?? null;
            $totalIncome = Transaction::where('transaction_type','income')->where('gym_id',$loggedGymId)->when($filterBranch , function($query) use ($filterBranch){
                $query->where('branch_id',$filterBranch);
            })
            ->when(!($request->logged_branch_id == $mainBranchId && $request->user()->type == 'default'),
            function($query) use ($request){
                $query->where('branch_id', $request->logged_branch_id);
            })->sum('credit_amount');
            $totalExpense = Transaction::where('transaction_type','expense')->where('gym_id',$loggedGymId)->when($filterBranch , function($query) use ($filterBranch){
                $query->where('branch_id',$filterBranch);
            })
            ->when(!($request->logged_branch_id == $mainBranchId && $request->user()->type == 'default'),
            function($query) use ($request){
                $query->where('branch_id', $request->logged_branch_id);
            })->sum('debit_amount');
            $finalBalance = $totalIncome - $totalExpense;
            $systemSettings = SystemSetting::with('currency')->where('gym_id',$loggedGymId)->first();
            $systemSettingCurrency = $systemSettings?->currency?->symbol ?? 'Rs'; 
            $search = $request->query('search');
            $startDate = $request->query('start_date');
            $endDate = $request->query('end_date');
            $transactionType = $request->query('transaction_type');
            $source = $request->query('source');
            $paginateParam = $request->query('disable_page_param');
            $voucherQuery = Transaction::with('createdBy','income','expense','feeCollection','branch','bank')->where('gym_id',$loggedGymId)->when($search , function($query) use ($search){
                $query->where('reference_num' , 'like' , "%{$search}%");
            })
            ->when($startDate && $endDate , function($query) use ($startDate , $endDate){
                $query->whereBetween('date' , [$startDate , $endDate]);
            })->when($transactionType  , function($query) use ($transactionType){
                $query->where('transaction_type' , $transactionType);
            })->when($source  , function($query) use ($source){
                $query->where('source' , $source);
            })->when($filterBranch , function($query) use ($filterBranch){
                $query->where('branch_id',$filterBranch);
            })
            ->when(!($request->logged_branch_id == $mainBranchId && $request->user()->type == 'default'),
            function($query) use ($request){
                $query->where('branch_id', $request->logged_branch_id);
            })
            ->orderBy('id','desc');
            if($paginateParam && $paginateParam == 1){
                $vouchers = $voucherQuery->get();
            }else{
                $vouchers = $voucherQuery->paginate($request->limit ?? 10);
            }
            $data = [
                'system_currency' => $systemSettingCurrency , 
                'total_income'  =>  $totalIncome , 
                'total_expense' =>  $totalExpense,
                'final_balance' =>  $finalBalance , 
                'vouchers'  =>  $vouchers
            ];
            return apiSuccess($data , 'Payment vouchers fetched successfully' , 200);
        }catch(Exception $e){
            return apiError('Failed to fetch payment vouchers' , 500 , $e->getMessage());
        }
    }

    function cashBook(Request $request){
        $loggedGymId = $request->logged_gym_id;
        try{
            $startDate = $request->get('start_date');
            $endDate = $request->get('end_date');
            $filterBranch = $request->query('filter_branch_id');
            $mainBranchId = Branch::where('type','main')->where('gym_id',$loggedGymId)->first()?->id ?? null;
            $systemSettings = SystemSetting::with('currency')->where('gym_id',$loggedGymId)->first();
            $systemSettingCurrency = $systemSettings?->currency?->symbol ?? 'Rs'; 
            //if no date provided use current month dates
            if (!$startDate || !$endDate) {
                $now = Carbon::now();
                $startDate = $now->startOfMonth()->toDateString();
                $endDate = $now->endOfMonth()->toDateString();  
            }
            //Opening Balance
            $openingBalance = Transaction::where('payment_method', 'cash')->where('gym_id',$loggedGymId)
            ->whereDate('date', '<', $startDate)->when($filterBranch , function($query) use ($filterBranch){
                $query->where('branch_id',$filterBranch);
            })
            ->when(!($request->logged_branch_id == $mainBranchId && $request->user()->type == 'default'),
            function($query) use ($request){
                $query->where('branch_id', $request->logged_branch_id);
            })
            ->sum(DB::raw('credit_amount - debit_amount'));
            //Closing Balance
            $closingBalance = Transaction::where('payment_method', 'cash')->where('gym_id',$loggedGymId)->where(function($query) use ($startDate , $endDate){
                $query->whereDate('date', '<', $startDate)
                ->orWhereBetween('date',[$startDate , $endDate]);
            })
            ->when($filterBranch , function($query) use ($filterBranch){
                $query->where('branch_id',$filterBranch);
            })
            ->when(!($request->logged_branch_id == $mainBranchId && $request->user()->type == 'default'),
            function($query) use ($request){
                $query->where('branch_id', $request->logged_branch_id);
            })
            ->sum(DB::raw('credit_amount - debit_amount'));
            //Within date range transactions
            $transactionsInRange = Transaction::with('branch','createdBy')->where('gym_id',$loggedGymId)->where('payment_method', 'cash')
            ->whereDate('date', '>=', $startDate)
            ->whereDate('date', '<=', $endDate)->when($filterBranch , function($query) use ($filterBranch){
                $query->where('branch_id',$filterBranch);
            })
            ->when(!($request->logged_branch_id == $mainBranchId && $request->user()->type == 'default'),
            function($query) use ($request){
                $query->where('branch_id', $request->logged_branch_id);
            });
            $selectQuery = $transactionsInRange
            ->select(
                '*', 
                DB::raw("
                    (
                        SUM(credit_amount - debit_amount) 
                        OVER (ORDER BY date ASC, time ASC, id ASC)
                    ) 
                    + ? AS running_balance
                ")
            )
            ->setBindings([$openingBalance], 'select')
            ->orderBy('date', 'asc')
            ->orderBy('time', 'asc')
            ->orderBy('id', 'asc');
            $cashTransactions = $selectQuery->paginate($request->limit ?? 10);
            $data = [
                'system_currency'   =>  $systemSettingCurrency,
                'opening_balance' =>    $openingBalance,
                'cash_transactions' =>  $cashTransactions,
                'closing_balance'   =>  $closingBalance
            ];
            return apiSuccess($data , 'Cash transactions fetched successfully' , 200);
        }catch(Exception $e){
            return apiError('Failed to fetch cash book' , 500 , $e->getMessage());
        }
    }

       function bankBook(Request $request){
        $loggedGymId = $request->logged_gym_id;
        try{
            $startDate = $request->get('start_date');
            $endDate = $request->get('end_date');
            $filterBranch = $request->query('filter_branch_id');
            $filterBankId = $request->query('filter_bank_id');
            $mainBranchId = Branch::where('type','main')->where('gym_id',$loggedGymId)->first()?->id ?? null;
            $systemSettings = SystemSetting::with('currency')->where('gym_id',$loggedGymId)->first();
            $systemSettingCurrency = $systemSettings?->currency?->symbol ?? 'Rs'; 
            //if no date provided use current month dates
            if (!$startDate || !$endDate) {
                $now = Carbon::now();
                $startDate = $now->startOfMonth()->toDateString();
                $endDate = $now->endOfMonth()->toDateString();  
            }
            //Opening Balance
            $openingBalance = Transaction::where('payment_method', 'bank')->where('gym_id',$loggedGymId)
            ->whereDate('date', '<', $startDate)->when($filterBranch , function($query) use ($filterBranch){
                $query->where('branch_id',$filterBranch);
            })
            ->when(!($request->logged_branch_id == $mainBranchId && $request->user()->type == 'default'),
            function($query) use ($request){
                $query->where('branch_id', $request->logged_branch_id);
            })->when($filterBankId , function($query) use ($filterBankId){
                $query->where('bank_id' , $filterBankId);
            })
            ->sum(DB::raw('credit_amount - debit_amount'));
              //Closing Balance
            $closingBalance = Transaction::where('payment_method', 'bank')->where('gym_id',$loggedGymId)
            ->where(function($query) use ($startDate , $endDate){
                $query->whereDate('date', '<', $startDate)
                ->orWhereBetween('date',[$startDate , $endDate]);
            })
            ->when($filterBranch , function($query) use ($filterBranch){
                $query->where('branch_id',$filterBranch);
            })
            ->when(!($request->logged_branch_id == $mainBranchId && $request->user()->type == 'default'),
            function($query) use ($request){
                $query->where('branch_id', $request->logged_branch_id);
            })->when($filterBankId , function($query) use ($filterBankId){
                $query->where('bank_id' , $filterBankId);
            })
            ->sum(DB::raw('credit_amount - debit_amount'));
            //Within date range transactions
            $transactionsInRange = Transaction::with('branch','createdBy','bank')->where('gym_id',$loggedGymId)->where('payment_method', 'bank')
            ->whereDate('date', '>=', $startDate)
            ->whereDate('date', '<=', $endDate)->when($filterBranch , function($query) use ($filterBranch){
                $query->where('branch_id',$filterBranch);
            })
           ->when(!($request->logged_branch_id == $mainBranchId && $request->user()->type == 'default'),
            function($query) use ($request){
                $query->where('branch_id', $request->logged_branch_id);
            })->when($filterBankId , function($query) use ($filterBankId){
                $query->where('bank_id' , $filterBankId);
            });
            $selectQuery = $transactionsInRange
            ->select(
                '*', 
                DB::raw("
                    (
                        SUM(credit_amount - debit_amount) 
                        OVER (ORDER BY date ASC, time ASC, id ASC)
                    ) 
                    + ? AS running_balance
                ")
            )
            ->setBindings([$openingBalance], 'select')
            ->orderBy('date', 'asc')
            ->orderBy('time', 'asc')
            ->orderBy('id', 'asc');
            $bankTransactions = $selectQuery->paginate($request->limit ?? 10);
            $data = [
                'system_currency'   =>  $systemSettingCurrency,
                'opening_balance' =>    $openingBalance,
                'bank_transactions' =>  $bankTransactions,
                'closing_balance'   =>  $closingBalance
            ];
            return apiSuccess($data , 'Bank transactions fetched successfully' , 200);
        }catch(Exception $e){
            return apiError('Failed to fetch bank book' , 500 , $e->getMessage());
        }
    }

    function generateBankRefNum($branchId){
        $branch = Branch::find($branchId);
        $branchCode = $branch->reference_num;  
        $prefix = $branchCode.'-BA'; 
        // $prefix = 'BA' . $branchCode;          
        // Get last for this branch
        $last = Bank::where('reference_num', 'LIKE', $prefix . '%') ->orderByRaw('CAST(SUBSTRING(reference_num, ? + 1) AS UNSIGNED) DESC', [strlen($prefix)])->first();
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

    function bankStore(Request $request){
        $loggedGymId = $request->logged_gym_id;
         $validator = Validator::make($request->all() , [
            'name'              =>      'required|string',
            'account_number'    =>      'required',
             'id' => [
                'nullable',
                Rule::exists('banks', 'id')->where(function ($query) use ($loggedGymId) {
                    $query->where('gym_id', $loggedGymId);
                }),
            ],
        ]);

        if($validator->fails()){
            return apiError('Validation failed' , 422 , $validator->errors()->first());
        }

        try{
            $data = [];
            $data = array_reduce(['name','account_number'] , function($carry , $input) use ($request){
                $carry[$input] = $request->input($input);
                return $carry;
            });
            $branchId = $request->logged_branch_id;
            $data['branch_id'] = $branchId;
            $data['gym_id'] = $loggedGymId;
            //Validate unique bank in branch
            $existingBank = $request->id ? Bank::where('id', '<>' , $request->id)->where('account_number',$request->account_number)->where('branch_id',$request->logged_branch_id)->exists() : Bank::where('account_number',$request->account_number)->where('branch_id',$request->logged_branch_id)->exists();
            if($existingBank){
                return apiError('Bank account already exists' , 422 , 'Bank account already exists');
            } 
            Bank::updateOrInsert(['id' => $request->input('id')] , $data);
            $latestBank = $request->id ? Bank::where('gym_id',$loggedGymId)->where('id',$request->id)->first() : Bank::where('gym_id',$loggedGymId)->orderBy('id','desc')->first();
            if(empty($request->id)){
                $catRefNum = $this->generateBankRefNum($branchId);             
                $latestBank->update(['reference_num' => $catRefNum]);
            }
            return apiSuccess($latestBank , 'Bank stored successfully' , 200);
        }catch(Exception $e){
            return apiError('Failed to store bank' , 500 , $e->getMessage());
        }

        }

    function banks(Request $request){
        $loggedGymId = $request->logged_gym_id;
        try{
            $validator = Validator::make($request->all() , [
                'disable_page_param' => 'nullable|in:1,0',
                'limit' =>  'nullable|integer'
            ]);

            if($validator->fails()){
                return apiError('Validation failed' , 422 , $validator->errors()->first());
            }

            $search = $request->query('search');
            $paginateParam = $request->query('disable_page_param');
            $filterBranch = $request->query('filter_branch_id');
            $mainBranchId = Branch::where('type','main')->where('gym_id',$loggedGymId)->first()?->id ?? null;
            $bankQuery = Bank::with('branch')->where('gym_id',$loggedGymId)->when($search , function($query) use ($search){
                $query->where(function ($q) use ($search) {
                    $q->where('name','like',"%{$search}%")
                    ->orWhere('reference_num','like',"%{$search}%");
                    
                });
            })
            ->when($filterBranch , function($query) use ($filterBranch){
                $query->where('branch_id',$filterBranch);
            })
            ->when(!($request->logged_branch_id == $mainBranchId && $request->user()->type == 'default'),
            function($query) use ($request){
                $query->where('branch_id', $request->logged_branch_id);
            })
            ->orderby('id','desc');
            if($paginateParam && $paginateParam == 1){
                $banks = $bankQuery->get();
            }else{
                $banks = $bankQuery->paginate($request->limit ?? 10);
            }
            return apiSuccess($banks , 'Banks fetched successfully' , 200);
        }catch(Exception $e){
            return apiError('Failed to fetch banks' , 500 , $e->getMessage());
        }
    }
}
