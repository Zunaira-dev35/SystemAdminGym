<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use App\Models\Country;
use App\Models\Currency;
use App\Models\EmailVerification;
use App\Models\Gym;
use App\Models\Invoice;
use App\Models\Package;
use App\Models\PermissionGroup;
use App\Models\RoleGroup;
use App\Models\SubscriptionHistory;
use App\Models\SystemSetting;
use App\Models\User;
use Carbon\Carbon;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class GymController extends Controller
{
    function gyms(Request $request){
        try{
            $search = trim($request->query('search'));
            $filterStatus = $request->query('filter_status');
            $filterGymId = $request->query('filter_gym_id');
            $disablePaginateParam = $request->disable_page_param;
            $gymQuery = Gym::with('currentInvoice','invoices','subscriptionHistories')
            ->when($search, function($query) use ($search) {
                $query->where(function($q) use ($search) {
                    $q->where('company_name', 'like', "%{$search}%")
                      ->orWhere('company_email', 'like', "%{$search}%")
                      ->orWhere('company_phone', 'like', "%{$search}%")
                      ->orWhere('reference_num', 'like', "%{$search}%");
                });
            })
            ->when($filterStatus, function($query) use ($filterStatus) {
                $query->where('status', $filterStatus);
            })
            ->when(!empty($filterGymId), function($query) use ($filterGymId) {
                $query->where('id', $filterGymId);
            })
            ->orderBy('id', 'desc');
            if($disablePaginateParam && $disablePaginateParam == 1){
                $gyms = $gymQuery->get();
            }else{
                $gyms = $gymQuery->paginate($request->limit ?? 10);
            }
            return apiSuccess($gyms , 'Gyms fetched successfully' , 200);
       }catch(Exception $e){
            return apiError('Failed to fetch gyms' , 500 , $e->getMessage());
       }
    }

    function gymStore(Request $request){
        $validator = Validator::make($request->all(),[
            'company_name'  =>  'required',
            'company_email' =>  'required|email|unique:gyms,company_email,'.$request->id,
            'password'      =>      empty($request->id) ? 'required' : 'nullable',
            'id'            =>  'nullable|exists:gyms,id'
        ]);

        if($validator->fails()){
            return apiError('Validation failed' , 422 , $validator->errors()->first());
        }

        try{
            DB::beginTransaction();
            $data = [];
            $data = array_reduce(['company_name','company_email','company_phone','company_address'],function($carry , $input) use ($request){
                $carry[$input] = $request->input($input);
                return $carry;
            });
            if(empty($request->id)){
                $data['status'] = 'inactive';
            }
            if($request->password){
                $data['password'] = bcrypt($request->password);
            }
            $passwordString = $request->password;
            Gym::updateOrInsert(['id' => $request->input('id')] , $data);
            $latestGym = $request->id ? Gym::where('id',$request->id)->first() : Gym::orderBy('id','desc')->first();
            if(empty($request->id)){
                $totalGymCount = Gym::count();
                $gymRefNum = 'G'.$totalGymCount;
                $latestGym->update(['reference_num' => $gymRefNum ]);
                $this->createDefaultMainBranch($latestGym);
                }
            $this->createDefaultUser($latestGym , $passwordString);
            $this->createDefaultSystemSettings($latestGym);
            DB::commit();
            return apiSuccess($latestGym , 'Gym stored successfully' , 200);
        }catch(Exception $e){
            DB::rollBack();
            return apiError('Failed to store gym' , 500 , $e->getMessage());
        }
    }

    function createDefaultUser($gym , $passwordString){
        $data = ['name' => $gym->company_name , 'type' => 'default' , 'user_type' => 'other' , 'gym_id' => $gym->id];
        if($passwordString){
            $data = array_merge(['password' => bcrypt($passwordString) , 'password_string' => $passwordString] , $data);
        }
        $user = User::where('gym_id',$gym->id)->where('type','default')->first();
        if($user){
            $user->update($data);
        }else{
            $data = array_merge(['status' => 'inactive'] , $data);
            $user = User::create($data);
            $totalUserCount = User::where('gym_id',$gym->id)->where('user_type','other')->count();
            $userRefNum = $gym->reference_num.'-U'.$totalUserCount;
            $user->update(['reference_num' => $userRefNum]);
        }
      
        $defaultRoleGroup = RoleGroup::where('type','default')->first();
        $roleId = $defaultRoleGroup ? $defaultRoleGroup->role_id : '';
        $role = $roleId ? Role::where('id',$roleId)->first() : '';
        $user->syncRoles($role);
        $user->update(['role_id' => $role->id]);
    }

    function createDefaultSystemSettings($gym){
        $systemAdminSettings = SystemSetting::where('type','system')->first();

        if($systemAdminSettings){
            $currencyId = $systemAdminSettings->currency_id;
            $countryId = $systemAdminSettings->country_id;
        }else{
            $pakCurrency = Currency::where('iso','pkr')->first();
            $pakCountry = Country::where('name','Pakistan')->first();
            $currencyId = $pakCurrency?->id ?? null;
            $countryId = $pakCountry?->id ?? null;
        }

        $data = [
            'type'                          =>      'gym',
            'gym_id'                        =>      $gym->id ,   
            'company_name'                  =>      $gym->company_name , 
            'company_email'                 =>      $gym->company_email, 
            'company_phone'                 =>      $gym->company_phone , 
            'currency_id'                   =>      $currencyId , 
        ];

        $systemSettings = SystemSetting::where('type','gym')->where('gym_id',$gym->id)->first();

        if($systemSettings){
            $systemSettings->update($data);
        }else{
            $data = array_merge([
                'country_id'                    =>      $countryId ,
                'allow_higher_branch_access'    =>      false,
                'higher_branch_allowed_days'    =>      0] , 
            $data);
            SystemSetting::create($data);
        }
    }

    function createDefaultMainBranch($gym){
        $existingBranch = Branch::where('type','main')->where('gym_id',$gym->id)->exists();
        if(!$existingBranch){
            $branch =  Branch::create(['name' => $gym->reference_num.' Main Branch', 'type' => 'main' , 'status' => 'active' , 'gym_id' => $gym->id]);
            $totalBranchCount = Branch::where('gym_id',$gym->id)->count();
            $brRefNum = $gym->reference_num.'-B'.$totalBranchCount;
            $branch->update(['reference_num' => $brRefNum ]);
        }
    }

    function autoGenerateInvoice($gym , $depositMethod){
        $refNum = generateInvoiceRefNum($gym);
        $invoice = Invoice::create([
            'gym_id'    =>  $gym->id,
            'package_id'    =>  $gym->package_id,
            'package_start_date'    =>  $gym->package_start_date , 
            'package_renewal_date'  =>  $gym->package_renewal_date,
            'sub_total' =>  $gym->price,
            'discount_percent'  =>  0,
            'grand_total'   =>  $gym->price,
            'desctiption'   =>  'Package subscribed',
            'date'  =>  now()->toDateString(),
            'time'  =>  now()->toTimeString(),
            'deposit_method'    =>  $depositMethod,
            'payment_status'    =>  'pending',
            'reference_num' =>  $refNum
        ]);
        return $invoice->id;
    }

    function createSubscriptionHistory($gym){
        SubscriptionHistory::create([
            'gym_id'    =>  $gym->id,
            'package_id'    =>  $gym->package_id,
            'package_start_date'    =>  $gym->package_start_date,
            'package_renewal_date'  =>  $gym->package_renewal_date,
            'invoice_id'    =>   $gym->invoice_id
        ]);
    }

    function assignPackage(Request $request){
        $validator = Validator::make($request->all() , [
            'gym_id'    =>  'required|exists:gyms,id',
            'package_id'    =>  'required|exists:packages,id',
            'deposit_method'    =>  'nullable|in:cash,card',
        ]);

        if($validator->fails()){
            return apiError('Validation failed' , 422 , $validator->errors()->first());
        }

        try{
            DB::beginTransaction();
            $package = Package::where('id',$request->package_id)->first();
            $gym = Gym::where('id',$request->gym_id)->first();
            
            // if($gym->package_id && $gym->package_renewal_date && $gym->package_renewal_date > now()->toDateString()){
            //     DB::rollBack();
            //     return apiError('Failed to assign package.' , 409 , 'The gym already has an active package and cannot be assigned again.');
            // }
            if($package->type == 'standard' && !$request->deposit_method){
                DB::rollBack();
                return apiError('Deposit method is required' , 422 , 'Deposit method is requried');
            }
            if($package->type == 'standard'){
                if($package->duration == 'monthly'){
                    $packageRenewalDate = Carbon::now()->addMonth()->toDateString();
                }elseif($package->duration == 'yearly'){
                    $packageRenewalDate = Carbon::now()->addYear()->toDateString();
                }else{
                    $packageRenewalDate = null;
                }
            }else{
                $packageTrialDays = $package->trial_days ;
                $packageRenewalDate = Carbon::now()->addDays($packageTrialDays)->toDateString();
                $gymTrialSubHistory = SubscriptionHistory::where('gym_id',$gym->id)->where('package_id',$package->id)->exists();
                if($gymTrialSubHistory){
                    DB::rollBack();
                    return apiError('Trial access is no longer available for this gym.' , 422 , 'Trial access is no longer available for this gym.');
                }
            }
            $gym->update(['package_id' => $package->id , 'branch_limit' => $package->branch_limit , 'user_limit' => $package->user_limit , 'member_limit' => $package->member_limit , 'employee_limit' => $package->employee_limit , 'duration' => $package->duration , 'price' => $package->price , 'package_start_date' => now()->toDateString() , 'package_renewal_date' => $packageRenewalDate , 'trial_days'   =>  $package->trial_days , 'invoice_id' => null ]);
            $defaultUser = User::with('gym')->where('type','default')->where('gym_id' , $gym->id)->first();
            if($package->type == 'trial'){
                $gym->update(['status' => 'active']);
                $defaultUser->update(['status' => 'active']);
            }else{
                $invoiceId = $this->autoGenerateInvoice($gym , $request->deposit_method);
                if($request->user()->type == 'system_admin'){
                    $gym->update(['status' => 'inactive' , 'invoice_id' => $invoiceId]);
                    $defaultUser->update(['status' => 'inactive']);
                }else{
                    $invoice = Invoice::where('id',$invoiceId)->first();
                    $gym->update(['status' => 'active' , 'invoice_id' => $invoiceId]);
                    $defaultUser->update(['status' => 'active']);
                    $invoice->update(['payment_status' => 'paid']);
                }
                }
            $this->createSubscriptionHistory($gym);
            $users = User::where('user_type','system_admin')->get();
            foreach($users as $user){
                generateNotification($user->id, 'Gym subscription activated', 'The gym '.$gym->reference_num.' has successfully subscribed to the package '.$package->name, 'others' , 'Gym' , $gym->id);
            }
            DB::commit();
            return apiSuccess($defaultUser , 'The gym has successfully subscribed to the package' , 200);
        }catch(Exception $e){
            DB::rollBack();
            return apiError('Failed to assign package' , 500 , $e->getMessage());
        }
    }

    function gymSubscriptionDetails(Request $request){
        $validator = Validator::make($request->all() , [
            'gym_id' => 'required|exists:gyms,id'
        ]);

        if($validator->fails()){
            return apiError('Validation failed' , 422 , $validator->errors()->first());
        }

        try{
            $gym = Gym::with('currentInvoice','invoices','subscriptionHistories')->where('id',$request->gym_id)->first();
            $branches = Branch::where('gym_id',$gym->id)->get();
            $branchLimit = $gym->branch_limit ?? 0;
            $branchUsedLimit = Branch::where('gym_id',$gym->id)->count();
            $memberLimit = $gym->member_limit ?? 0;
            $memberUsedLimit = User::where('gym_id',$gym->id)->where('user_type','member')->count();;
            $memberUsagePercentage = $memberLimit > 0 ? round(($memberUsedLimit / $memberLimit) * 100, 2) : 0;
            $employeeLimit = $gym->employee_limit ?? 0;
            $employeeUsedLimit = User::where('gym_id',$gym->id)->where('user_type','employee')->count();;
            $employeeUsagePercentage = $employeeLimit > 0 ? round(($employeeUsedLimit / $employeeLimit) * 100, 2) : 0;
            $userLimit = $gym->user_limit ?? 0;
            $userUsedLimit = User::where('gym_id',$gym->id)->where('user_type','other')->count();;
            $userUsagePercentage = $userLimit > 0 ? round(($userUsedLimit / $userLimit) * 100, 2) : 0;
            $totalPackageDays = 0;
            $remainingPackageDays = 0;
            $usedPackageDays = 0;
            $startDate = $gym->package_start_date ? Carbon::parse($gym->package_start_date) : null;
            $endDate = $gym->package_renewal_date ? Carbon::parse($gym->package_renewal_date) : null;
            if ($startDate && $endDate && $endDate->greaterThan($startDate)) {
                $totalPackageDays = (int) $startDate->diffInDays($endDate);
                $usedPackageDays = (int) min( $totalPackageDays, $startDate->diffInDays(now()) );
                $remainingPackageDays = (int) max( 0, $totalPackageDays - $usedPackageDays );
            }
            $data = [
                'gym'                           =>          $gym,
                'branches'                      =>          $branches,
                'branch_limit'                  =>          $branchLimit,
                'branch_used_limit'             =>          $branchUsedLimit,
                'member_limit'                  =>          $memberLimit,
                'member_used_limit'             =>          $memberUsedLimit,
                'member_usage_percentage'       =>          $memberUsagePercentage,
                'employee_limit'                =>          $employeeLimit,
                'employee_used_limit'           =>          $employeeUsedLimit,
                'employee_usage_percentage'     =>          $employeeUsagePercentage,
                'user_limit'                    =>          $userLimit,
                'user_used_limit'               =>          $userUsedLimit,
                'user_usage_percentage'         =>          $userUsagePercentage,
                'total_package_days'            =>          $totalPackageDays,
                'used_package_days'             =>          $usedPackageDays,
                'remaining_package_days'        =>          $remainingPackageDays
            ];
            return apiSuccess($data , 'Gym subscription details fetched successfully' , 200);
        }catch(Exception $e){
            return apiError('Failed to fetch gym subscription details' , 500 , $e->getMessage());
        }
    }

    function gymUpdateStatus(Request $request){
        $validator = Validator::make($request->all() , [
            'gym_id'    =>  'required|exists:gyms,id'
        ]);

        if($validator->fails()){
            return apiError('Validation failed' , 422 , $validator->errors()->first());
        }

        try{
            $gym = Gym::where('id',$request->gym_id)->first();
            if($gym->status == 'active'){
                $updatedStatus = 'inactive';
                $successMessage = 'Gym inactivated successfully';
            }else{
                $updatedStatus = 'active';
                $successMessage = 'Gym activated successfully';
            }
            $gym->update(['status' => $updatedStatus]);
            return apiSuccess($gym , $successMessage , 200);
        }catch(Exception $e){
            return apiError('Failed to update gym status' , 500 , $e->getMessage());
        }
    }

    function getVerificationEmailTemplate($companyName , $url){
        $html = 
        '<html lang="en">
            <head>
                <meta charset="UTF-8">
                <title>Email Verification</title>
            </head>
            <body style="font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f6f6f6;">
                <table width="100%" cellpadding="0" cellspacing="0" style="margin: 0; padding: 20px 0; background-color: #f6f6f6;">
                    <tr>
                        <td align="center">
                            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border: 1px solid #dddddd; padding: 20px;">
                                <tr>
                                    <td align="center" style="padding: 10px 0;">
                                        <h1 style="font-size: 24px; margin: 0; color: #333333;">Email Verification</h1>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 20px 20px; color: #333333; font-size: 16px; line-height: 1.5;">
                                        <p style="margin: 0 0 10px;">Hello <span style="font-weight:700">'.$companyName.',</span></p>
                                        <p style="margin: 0 0 10px;">Thank you for registering with Snowberry. Click the link below to verify your email address and activate your account:</p>
                                        <p style="padding: 15px;width:95%;border-radius:4px;background-color:#FF7035;text-align:center;color:white;font-size:16px;font-weight:600"><a href="'.$url.'" style="color: white; text-decoration: none;">Click here</a></p>
                                        <p style="margin: 0 0 10px;">If you didn\'t request this, please ignore this email.</p>
                                        <p style="margin: 0;">Thank you,</p>
                                    </td>
                                </tr>
                                <tr>
                                    <td align="center" style="padding: 10px 0; border-top: 1px solid #dddddd;">
                                        <p style="margin: 0; color: #888888; font-size: 12px;">&copy; '.date("Y").' Snowberry. All rights reserved.</p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </body>
        </html>';
        return $html;
    }

    function getCredentialsEmailTemplate($companyName, $loginId, $password, $url) {
    $year = date("Y");

    $html = '
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Your Account Credentials</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 0;
            background-color: #f6f6f6;
        }
        .container {
            width: 100%;
            padding: 20px 0;
            background-color: #f6f6f6;
        }
        .email-wrapper {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border: 1px solid #dddddd;
            padding: 20px;
        }
        .header h1 {
            font-size: 24px;
            margin: 0;
            color: #333333;
        }
        .content p {
            font-size: 16px;
            color: #333333;
            line-height: 1.5;
            margin: 10px 0;
        }
        .credentials {
            background-color: #f4f4f4;
            padding: 15px;
            border-radius: 5px;
            margin: 15px 0;
            font-family: monospace;
            font-size: 15px;
        }
        .button {
            display: inline-block;
            padding: 12px 25px;
            background-color: #FF7035;
            color: #ffffff !important;
            text-decoration: none;
            font-weight: 600;
            border-radius: 4px;
            margin: 15px 0;
        }
        .footer {
            padding: 10px 0;
            border-top: 1px solid #dddddd;
            text-align: center;
            font-size: 12px;
            color: #888888;
        }
        @media screen and (max-width: 620px) {
            .email-wrapper {
                width: 90% !important;
            }
            .button {
                width: 100% !important;
                box-sizing: border-box;
                text-align: center;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="email-wrapper">
            <div class="header" align="center">
                <h1>Welcome to Snowberry!</h1>
            </div>
            <div class="content">
                <p>Hello <strong>'.$companyName.'</strong>,</p>
                <p>Thank you for registering with Snowberry! Your account has been successfully created. Below are your login credentials:</p>
                
                <div class="credentials">
                    <p><strong>Login ID:</strong> '.$loginId.'</p>
                    <p><strong>Password:</strong> '.$password.'</p>
                </div>

                <p>Please keep this information safe and do not share it with anyone.</p>
                <p>Click the button below to log in and get started:</p>

                <p align="center">
                    <a href="'.$url.'" class="button">Login Now</a>
                </p>

                <p>We’re excited to have you on board and hope you enjoy using our service!</p>
                <p>Thank you,<br>Snowberry Team</p>
            </div>
            <div class="footer">
                &copy; '.$year.' Snowberry. All rights reserved.
            </div>
        </div>
    </div>
</body>
</html>
';

    return $html;
}



    function sendPackageMail(Request $request){
        $validator = Validator::make($request->all() , [
            'package_type'      =>      'required|in:trial,standard',
            'package_id'        =>      'nullable|required_if:package_type,standard|exists:packages,id',
            'deposit_method'    =>      'nullable|required_if:package_type,standard|in:cash,card',
            'company_name'      =>      'required',
            'company_email'     =>      'required|email',
        ]);

        if($validator->fails()){
            return apiError('Validation failed' , 422 , $validator->errors()->first());
        }

        try{
            $companyName = $request->company_name;
            $companyEmail = $request->company_email;
            $packageType = $request->package_type;
            $packageId = $request->package_id;
            $depositMethod = $request->deposit_method;
            $gym = Gym::where('company_email' , $request->company_email)->first();
            if($gym){
                return apiError('Account already exists' , 422 , 'Your account already exists , please login to continue');
            }
            if($gym && $request->package_type == 'trial'){
                $package = Package::where('type','trial')->first();
                if(!$package){
                    return apiError('No trial package exists' , 422 , 'No trial package exists');
                }
                $gymTrialSubHistory = SubscriptionHistory::where('gym_id',$gym->id)->where('package_id',$package->id)->exists();
                if($gymTrialSubHistory){
                    return apiError('Trial access is no longer available for this gym.' , 422 , 'Trial access is no longer available for this gym.');
                }

            }
            $token = Str::random(64);
            $expiresAt = Carbon::now()->addMinutes(60); // expires in 60 min
            EmailVerification::create([
                'company_name'   => $companyName,
                'company_email'  => $companyEmail,
                'package_type'   => $packageType,
                'package_id'     => $packageId,
                'deposit_method' => $depositMethod,
                'token'          => $token,
                'expires_at'     => $expiresAt,
                'status'         => 'pending'
            ]);
            // $url = 'http://localhost:5173/email/verification?token=' . $token;
            $url = env('FRONTEND_URL') . 'email/verification?token=' . $token;
            //send mail
            $html = $this->getVerificationEmailTemplate($companyName , $url);
            Mail::html($html, function ($message) use ($companyEmail) {
                $message->to($companyEmail) ->subject('Email Verification');
            });
            return apiSuccess(null , 'Verification mail sent successfully. Please check your mail to continue');
        }catch(Exception $e){
            return apiError('Failed to send verification mail.' , 500 , $e->getMessage());
        }
    }

    function gymEmailVerification(Request $request){
        try{
            $token = $request->query('token');

            $verification = EmailVerification::where('token', $token)->first();
           

            if (!$verification) {
                return apiError('Invalid verification link', 422, 'Invalid verification link');
            }

            if($verification->status == 'verified'){
                return apiSuccess(null , 'Account activated successfully , please check your email for account credentials' , 200);
            }

            if (Carbon::now()->greaterThan($verification->expires_at)) {
                return apiError('Verification link has expired', 422, 'Verification link expired');
            }


            $companyEmail = $verification->company_email;
            $companyName  = $verification->company_name;
            $packageType  = $verification->package_type;
            $packageId    = $verification->package_id;
            $depositMethod = $verification->deposit_method;

            DB::beginTransaction();
            if(!$companyEmail || !$companyName || !$packageType){
                DB::rollBack();
                return apiError('Invalid data' , 422 , 'Invalid data');
            }
            $gym = Gym::where('company_email',$companyEmail)->first();
            
            if(!$gym){
                $gym = $this->createGymDefaults($companyName , $companyEmail);
            }

            if($packageType == 'trial'){
                $package = Package::where('type','trial')->first();
            }else{
                if(!$packageId){
                    DB::rollBack();
                    return apiError('Failed to assign package' , 422 , 'Package not found');
                }
                 if(!$depositMethod){
                    DB::rollBack();
                    return apiError('Failed to assign package' , 422 , 'Deposit method not found');
                }
                $package = Package::where('id',$packageId)->first();
            }
            if(!$package){
                DB::rollBack();
                return apiError('Failed to assign package' , 422 , 'Package not found');
            }
             if($package->type == 'standard'){
                if($package->duration == 'monthly'){
                    $packageRenewalDate = Carbon::now()->addMonth()->toDateString();
                }elseif($package->duration == 'yearly'){
                    $packageRenewalDate = Carbon::now()->addYear()->toDateString();
                }else{
                    $packageRenewalDate = null;
                }
            }else{
                $packageTrialDays = $package->trial_days ;
                $packageRenewalDate = Carbon::now()->addDays($packageTrialDays)->toDateString();
                $gymTrialSubHistory = SubscriptionHistory::where('gym_id',$gym->id)->where('package_id',$package->id)->exists();
                if($gymTrialSubHistory){
                    DB::rollBack();
                    return apiError('Trial access is no longer available for this gym.' , 422 , 'Trial access is no longer available for this gym.');
                }
            }
            $gym->update(['package_id' => $package->id , 'branch_limit' => $package->branch_limit , 'user_limit' => $package->user_limit , 'member_limit' => $package->member_limit , 'employee_limit' => $package->employee_limit , 'duration' => $package->duration , 'price' => $package->price , 'package_start_date' => now()->toDateString() , 'package_renewal_date' => $packageRenewalDate , 'trial_days'   =>  $package->trial_days ]);
            $defaultUser = User::with('gym')->where('type','default')->where('gym_id' , $gym->id)->first();
            if($package->type == 'trial'){
                $gym->update(['status' => 'active']);
                $defaultUser->update(['status' => 'active']);
            }else{
                $invoiceId = $this->autoGenerateInvoice($gym , $depositMethod);
                $invoice = Invoice::where('id',$invoiceId)->first();
                $gym->update(['status' => 'active' , 'invoice_id' => $invoiceId]);
                $defaultUser->update(['status' => 'active']);
                $invoice->update(['payment_status' => 'paid']);
            }
            $this->createSubscriptionHistory($gym);
            //send credentials mail
            $url = env('FRONTEND_URL').'/login';
            // $url = 'http://localhost:5173/login';
            $loginId = $defaultUser->reference_num;
            $password = $defaultUser->password_string;
            $html = $this->getCredentialsEmailTemplate($companyName , $loginId , $password , $url);
            Mail::html($html, function ($message) use ($companyEmail) {
                $message->to($companyEmail) ->subject('Your Account Credentials');
            });
            $users = User::where('user_type','system_admin')->get();
            foreach($users as $user){
                generateNotification($user->id, 'Gym activated', 'Gym '.$gym->reference_num.' activated and account credentials sent successfuly', 'others' , 'Gym' , $gym->id);
            }
            $verification->update(['status' => 'verified']);
            DB::commit();
            return apiSuccess(null , 'Account activated successfully , please check your email for account credentials' , 200);
        }catch(Exception $e){
            DB::rollBack();
            return apiError('Failed to assign package' , 500 , $e->getMessage());
        }
    }
    function createGymDefaults($companyName , $companyEmail){
            $data = [
                'company_name' => $companyName , 
                'company_email' =>  $companyEmail,
                'status'        => 'inactive',
                'password'  =>  bcrypt($companyName)
            ];
            $passwordString = $companyName;
            $latestGym = Gym::create($data);
            $totalGymCount = Gym::count();
            $gymRefNum = 'G'.$totalGymCount;
            $latestGym->update(['reference_num' => $gymRefNum ]);
            $this->createDefaultMainBranch($latestGym);
            $this->createDefaultUser($latestGym , $passwordString);
            $this->createDefaultSystemSettings($latestGym);
            return $latestGym;       
    }

    
}
