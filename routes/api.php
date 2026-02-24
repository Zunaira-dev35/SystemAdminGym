<?php

use App\Http\Controllers\BranchController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\EmployeeController;
use App\Http\Controllers\FeeController;
use App\Http\Controllers\FinanceController;
use App\Http\Controllers\GymController;
use App\Http\Controllers\HrManagementController;
use App\Http\Controllers\InvoiceController;
use App\Http\Controllers\MemberController;
use App\Http\Controllers\MembershipTransferController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\PackageController;
use App\Http\Controllers\PlanController;
use App\Http\Controllers\PlanTransferController;
use App\Http\Controllers\SystemSettingController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\PayrollController;
use App\Http\Middleware\CheckPermission;
use Illuminate\Support\Facades\Route;

//Admin/staff/member other user login

// Route::post('send-otp', [UserController::class, 'sendOtp'])->name('send.otp');
Route::post('login',[UserController::class,'login'])->name('login');
Route::post('/logout', [UserController::class, 'logout'])->middleware(['auth:sanctum'])->name('logout');

Route::post('/delete-user', [UserController::class, 'deleteUser'])->middleware(['auth:sanctum']);

Route::controller(UserController::class)->prefix('user')->middleware(['auth:sanctum' , 'set.branch','set.gym','check.plan.expiry'])->group(function(){
    Route::get('permission-groups','permissionGroups')->name('user.permission.groups')->middleware(CheckPermission::class.':View Permission');
    Route::post('permission-group/store','permissionGroupStore')->name('user.permission.group.store');
    Route::get('permission-group/edit/{id}','permissionGroupEdit')->name('user.permission.group.edit')->middleware(CheckPermission::class.':Edit Permission');
    Route::delete('permission-group/delete','permissionGroupDelete')->name('user.permission.group.delete')->middleware(CheckPermission::class.':Delete Permission');
    Route::get('roles','roles')->name('user.roles');
    Route::post('role/store','roleStore')->name('user.role.store');
    Route::delete('role/delete','roleDelete')->name('user.role.delete')->middleware(CheckPermission::class.':Delete Role');
    Route::get('create/reference','createUserReference')->name('user.create.reference');
    Route::get('all','allUsers')->name('user.all')->middleware(CheckPermission::class.':View User');
    Route::post('store','userStore')->name('user.store');
    Route::post('update-status','userUpdateStatus')->name('user.update.status');
    Route::get('permission-default','permissionsDefault')->name('user.permission.default')->middleware(CheckPermission::class.':View Permission');
    // Route::get('current','currentUser')->name('user.current');
    Route::post('device-fcm-token','deviceFcmToken')->name('user.device.fcm.token');
});

Route::get('user/current',[UserController::class , 'currentUser'])->middleware(['auth:sanctum' , 'set.branch','set.gym'])->name('user.current');

Route::controller(PlanController::class)->prefix('plan')->middleware(['auth:sanctum','set.branch','set.gym','check.plan.expiry'])->group(function(){
    Route::get('all','plans')->name('plan.all')->middleware(CheckPermission::class.':View Plan');
    Route::get('create/reference','createPlanReference')->name('plan.create.reference');
    Route::post('store','planStore')->name('plan.store');
    Route::delete('delete','planDelete')->name('plan.delete')->middleware(CheckPermission::class.':Delete Plan');
    Route::post('update-status','planUpdateStatus')->name('plan.update.status')->middleware(CheckPermission::class.':Edit Plan');
});

Route::get('branch/all',[BranchController::class,'branches'])->name('branch.all');

Route::controller(BranchController::class)->prefix('branch')->middleware(['auth:sanctum','set.branch','set.gym','check.plan.expiry'])->group(function(){
    Route::get('all/fetch','allBranches')->name('branch.all.fetch');
    Route::post('store','branchStore')->name('branch.store');
    Route::get('create/reference','createBranchReference')->name('branch.create.reference');
    Route::delete('delete','branchDelete')->name('branch.delete')->middleware(CheckPermission::class.':Delete Branch');
    Route::post('update-status','branchUpdateStatus')->name('branch.update.status')->middleware(CheckPermission::class.':Edit Branch');
});

Route::controller(MemberController::class)->prefix('member')->middleware(['auth:sanctum','set.branch','set.gym','check.plan.expiry'])->group(function(){
    Route::get('all','members')->name('member.all');
    Route::get('create/reference','createMemberReference')->name('member.create.reference');
    Route::post('store','memberStore')->name('member.store');
    Route::get('freeze-request-create-reference','createFreezeRequestReference')->name('member.freeze.request.create.reference');
    Route::post('freeze-request-store','freezeRequestStore')->name('member.freeze.request.store')->middleware(CheckPermission::class.':Create Freeze Request');
    Route::post('freeze-request-update-status','freezeRequestUpdateStatus')->name('member.freeze.request.update.status')->middleware(CheckPermission::class.':Edit Freeze Request');
    Route::get('freeze-requests','freezeRequests')->name('member.freeze.requests')->middleware(CheckPermission::class.':View Freeze Request');
    Route::post('freeze','freezeMember')->name('member.freeze');
    Route::post('unfreeze','unfreezeMember')->name('member.unfreeze')->middleware(CheckPermission::class.':Edit Freeze Request');
    Route::post('import/csv','importMemberCsv')->name('member.import.csv');
    Route::get('details','memberDetails')->name('member.details');
    Route::get('fee-collections','memberFeeCollections')->name('member.fee.collections');
    Route::get('member-freeze-requests','memberFreezeRequests')->name('member.freeze.requests');
    Route::get('attendances','memberAttendances')->name('member.attendances');
    Route::get('plan-transfers','memberPlanTransfers')->name('member.plan.transfers');
    // Route::get('stats','calculateComprehensiveMemberStats')->name('member.stats');
    Route::post('delete','memberDelete')->name('member.delete');
    Route::post('search','memberSearch')->name('member.search');
});

Route::controller(EmployeeController::class)->prefix('employee')->middleware(['auth:sanctum','set.branch','set.gym','check.plan.expiry'])->group(function(){
    Route::get('all','employees')->name('employee.all')->middleware(CheckPermission::class.':View Employee');
    Route::get('create/reference','createEmployeeReference')->name('employee.create.reference');
    Route::post('store','employeeStore')->name('employee.store');
     Route::get('shift/create/reference','createShiftReference')->name('employee.create.shift.reference');
    Route::post('shift/store','shiftStore')->name('shift.store');
    Route::get('shift/all','shifts')->name('shift.all');
    // Route::post('shift/inactive','shiftInactive')->name('shift.inactive')->middleware(CheckPermission::class.':Edit Shift');
});

Route::controller(FeeController::class)->prefix('fee/collection')->middleware(['auth:sanctum','set.branch','set.gym','check.plan.expiry'])->group(function(){
    Route::get('all','feeCollections')->name('fee.collection.all')->middleware(CheckPermission::class.':View Fee Collection');
    Route::get('create/reference','createFeeCollectionReference')->name('fee.collection.create.reference');
    Route::post('store','feeCollectionStore')->name('fee.collection.store')->middleware(CheckPermission::class.':Create Fee Collection');
    Route::get('refund/list','refundList')->name('fee.collection.refund')->middleware(CheckPermission::class.':View Fee Refund');
    Route::post('refund','feeCollectionRefund')->name('fee.collection.refund')->middleware(CheckPermission::class.':Create Fee Refund');
    Route::post('delete','feeCollectionDelete')->name('fee.collection.delete')->middleware(CheckPermission::class.':Delete Fee Collection');
    Route::post('edit','feeCollectionEdit')->name('fee.collection.edit')->middleware(CheckPermission::class.':Delete Fee Collection');
    Route::post('generate-receipt','generateReceipt')->name('fee.collection.generate.receipt');
    // advance
    Route::post('advance/store','createAdvancePayment')->name('advance.fee.collection.store')->middleware(CheckPermission::class.':Create Fee Collection');
    Route::get('advance/all','getAllAdvancePayments')->name('advance.fee.collection.all')->middleware(CheckPermission::class.':View Fee Collection');
    Route::post('advance/apply','applyAdvancePayment')->name('advance.fee.collection.apply')->middleware(CheckPermission::class.':Create Fee Collection');
    Route::post('advance/cancel','cancelAdvancePayment')->name('advance.fee.collection.apply')->middleware(CheckPermission::class.':Create Fee Collection');
});

Route::controller(PlanTransferController::class)->prefix('plan/transfer')->middleware(['auth:sanctum','set.branch','set.gym','check.plan.expiry'])->group(function(){
    Route::get('all','planTransfers')->name('plan.transfer.all')->middleware(CheckPermission::class.':View Plan Transfer');
    Route::get('create/reference','createPlanTransferReference')->name('plan.transfer.create.reference');
    Route::post('store','planTransferStore')->name('plan.transfer.store')->middleware(CheckPermission::class.':Create Plan Transfer');
    Route::get('available/plans','availablePlans')->name('plan.transfer.available.plans');
});

Route::controller(SystemSettingController::class)->prefix('system')->middleware(['auth:sanctum','set.branch','set.gym','check.plan.expiry'])->group(function(){
    Route::get('search/country','searchCountry')->name('search.country')->middleware(CheckPermission::class.':Create System Settings');
    Route::get('search/currency','searchCurrency')->name('search.currency')->middleware(CheckPermission::class.':Create System Settings');
    Route::get('search/timezone','searchTimezone')->name('search.timezone')->middleware(CheckPermission::class.':Create System Settings');
    Route::post('setting/store','systemSettingStore')->name('system.setting.store');
    Route::get('settings','systemSettings')->name('system.settings');
});
Route::controller(PayrollController::class)->prefix('payroll')->middleware(['auth:sanctum','set.branch','set.gym','check.plan.expiry'])->group(function(){
    Route::get('/','payrolls')->name('get.payroll')->middleware(CheckPermission::class.':View Payroll');
    Route::post('generate','generate')->name('generate.payroll')->middleware(CheckPermission::class.':Create Payroll');
    Route::post('edit','editPayroll')->name('edit.payroll')->middleware(CheckPermission::class.':Edit Payroll');
    Route::post('pay','payPayroll')->name('edit.payroll')->middleware(CheckPermission::class.':Edit Payroll');
});

Route::controller(HrManagementController::class)->middleware(['auth:sanctum','set.branch','set.gym','check.plan.expiry'])->group(function(){
    Route::get('attendance/all','attendances')->name('attendance.all');
    Route::post('attendance/store','attendanceStore')->name('attendance.store');
    Route::post('attendance/update','attendanceUpdate')->name('attendance.update');
    Route::delete('attendance/delete','attendanceDelete')->name('attendance.delete');
    Route::post('attendance/checkout','attendanceCheckout')->name('attendance.checkout');
    Route::get('holiday/all','holidays')->name('holiday.view')->middleware(CheckPermission::class.':View Holiday');
    Route::post('holiday/store','holidayStore')->name('holiday.store');
    Route::delete('holiday/delete','holidayDelete')->name('holiday.delete')->middleware(CheckPermission::class.':Delete Holiday');
    Route::post('leave/store','leaveStore')->name('leave.store');
    Route::get('leave/all','leaves')->name('leave.all')->middleware(CheckPermission::class.':View Leave');
    Route::post('leave/process','leaveProcess')->name('leave.process')->middleware(CheckPermission::class.':Edit Leave');
});

Route::controller(FinanceController::class)->prefix('finance')->middleware(['auth:sanctum','set.branch','set.gym','check.plan.expiry'])->group(function(){
    Route::get('expense/category/all','expenseCategories')->name('finance.expense.category')->middleware(CheckPermission::class.':View Expense');
    Route::post('expense/category/store','expenseCategoryStore')->name('finance.expense.category.store');
    Route::delete('expense/category/delete','expenseCategoryDelete')->name('finance.expense.category.delete')->middleware(CheckPermission::class.':Delete Expense');
    Route::get('expense/all','expenses')->name('finance.expense')->middleware(CheckPermission::class.':View Expense');
    Route::post('expense/store','expenseStore')->name('finance.expense.store');
    Route::delete('expense/delete','expenseDelete')->name('finance.expense.delete')->middleware(CheckPermission::class.':Delete Expense');
    Route::get('income/category/all','incomeCategories')->name('finance.income.category')->middleware(CheckPermission::class.':View Income');
    Route::post('income/category/store','incomeCategoryStore')->name('finance.income.category.store');
    Route::delete('income/category/delete','incomeCategoryDelete')->name('finance.income.category.delete')->middleware(CheckPermission::class.':Delete Income');
    Route::get('income/all','incomes')->name('finance.income')->middleware(CheckPermission::class.':View Income');
    Route::post('income/store','incomeStore')->name('finance.income.store');
    Route::delete('income/delete','incomeDelete')->name('finance.income.delete')->middleware(CheckPermission::class.':Delete Income');
    Route::get('payment-vouchers','paymentVouchers')->name('finance.payment.vouchers');
    Route::get('cash-book','cashBook')->name('finance.cash.book');
    Route::get('bank-book','bankBook')->name('finance.bank.book');
    Route::post('bank/store','bankStore')->name('finance.bank.store');
    Route::get('bank/all','banks')->name('finance.banks');
});

Route::controller(NotificationController::class)->prefix('notification')->middleware(['auth:sanctum' , 'set.branch','set.gym','check.plan.expiry'])->group(function(){
    Route::get('all','notifications')->name('notification.all');  
    Route::post('/mark/all/read','markAllNotificationAsRead')->name('notification.mark.all.read');
    Route::post('/mark/read','markNotificationAsRead')->name('notification.mark.read');
});

Route::get('system-logs',[SystemSettingController::class,'getSystemLogs'])->name('system.logs')->middleware(['auth:sanctum' , 'set.branch','set.gym','check.plan.expiry']);
Route::get('dashboard',[DashboardController::class,'dashboard'])->name('dashboard')->middleware(['auth:sanctum' , 'set.branch','set.gym','check.plan.expiry']);

Route::get('logged-branch',[BranchController::class,'loggedBranch'])->name('logged.branch')->middleware(['auth:sanctum' , 'set.branch','set.gym','check.plan.expiry']);
Route::post('verify-user-face',[UserController::class , 'verifyUserFace'])->name('verify.user.face')->middleware(['auth:sanctum' , 'set.branch','set.gym','check.plan.expiry']);
Route::post('verify-user-fingerprint',[UserController::class , 'verifyUserFingerprint'])->name('verify.user.fingerprint')->middleware(['auth:sanctum' , 'set.branch','set.gym','check.plan.expiry']);
Route::post('update-user-profile',[SystemSettingController::class,'updateUserProfile'])->name('update.user.profile')->middleware(['auth:sanctum' , 'set.branch','set.gym','check.plan.expiry']);

Route::controller(MembershipTransferController::class)->prefix('membership')->middleware(['auth:sanctum','set.branch','set.gym','check.plan.expiry'])->group(function(){
    Route::post('transfer','membershipTransfer')->name('membership.transfer.store')->middleware(CheckPermission::class.':Create Membership Transfer');
    Route::get('/','index')->name('get.membership')->middleware(CheckPermission::class.':View Membership Transfer');
});

Route::controller(PackageController::class)->prefix('package')->middleware(['auth:sanctum'])->group(function(){
    Route::post('store','packageStore')->name('package.store');
    Route::post('update/status','packageUpdateStatus')->name('package.update.status');
    Route::post('delete','packageDelete')->name('package.delete');
});

Route::get('package/all',[PackageController::class,'packages'])->name('package.all');

Route::controller(GymController::class)->prefix('gym')->middleware(['auth:sanctum'])->group(function(){
    Route::get('all','gyms')->name('gym.all');
    Route::post('store','gymStore')->name('gym.store');
    Route::post('assign/package','assignPackage')->name('gym.assign.package');
    Route::get('subscription-details','gymSubscriptionDetails')->name('gym.subscription.details');
    Route::post('update/status','gymUpdateStatus')->name('gym.update.status');
});

Route::post('gym/send-package-mail',[GymController::class,'sendPackageMail'])->name('gym.send.package.mail');
Route::get('gym/email-verification',[GymController::class,'gymEmailVerification'])->name('gym.email.verification');

Route::controller(InvoiceController::class)->prefix('invoice')->middleware(['auth:sanctum'])->group(function(){
    Route::get('all','invoices')->name('invoice.all');
    Route::post('edit','invoiceEdit')->name('invoice.edit');
    Route::get('view','invoiceView')->name('invoice.view');
});

Route::get('system/dashboard',[DashboardController::class,'systemDashboard'])->name('dashboard')->middleware(['auth:sanctum']);

