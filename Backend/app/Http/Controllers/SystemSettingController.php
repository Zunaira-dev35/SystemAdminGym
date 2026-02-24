<?php

namespace App\Http\Controllers;

use App\Helpers\FileUploadHelper;
use App\Models\Branch;
use App\Models\Country;
use App\Models\Currency;
use App\Models\Gym;
use App\Models\SystemLog;
use App\Models\SystemSetting;
use App\Models\TimeZone;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class SystemSettingController extends Controller
{
     function searchCountry(Request $request){
        try{
            $search = $request->query('search');
            $countries = Country::when($search , function($query) use($search){
                $query->where('name','like',"%{$search}%");
            })
            ->get();
            return apiSuccess($countries , 'Countries fetched successfully.' , 200);
        }catch(Exception $e){   
            return apiError('Failed to fetch countries' , 500 , $e->getMessage());
        }
    }

     function searchCurrency(Request $request){
        try{
            $search = $request->query('search');
            $currencies = Currency::when($search , function($query) use($search){
                $query->where('iso','like',"%{$search}%")->orWhere('text','like',"%{$search}%");
            })
            ->get();
            return apiSuccess($currencies , 'Currencies fetched successfully.' , 200);
        }catch(Exception $e){   
            return apiError('Failed to fetch currencies' , 500 , $e->getMessage());
        }
    }

     function searchTimezone(Request $request){
        try{
            $search = $request->query('search');
            $timezones = TimeZone::when($search , function($query) use($search){
                $query->where('name','like',"%{$search}%");
            })->get();
            return apiSuccess($timezones , 'Timezones fetched successfully.' , 200);
        }catch(Exception $e){   
            return apiError('Failed to fetch timezones' , 500 , $e->getMessage());
        }
    }

     function getSystemLogs(Request $request){
        try{
            $search = $request->query('search');
            $startDate = $request->query('start_date');
            $endDate = $request->query('end_date');
            $filterBranch = $request->query('filter_branch_id');
            $loggedGymId = $request->logged_gym_id;
            $mainBranchId = Branch::where('type','main')->where('gym_id',$request->logged_gym_id)->first()?->id ?? null;
            $systemLogs = SystemLog::with('referenceEntity','createdBy','branch')->where('gym_id',$loggedGymId)->when($search,function($query) use ($search){
                $query->where(function($q) use ($search){
                    $q->where('action_type','like',"%{$search}%")
                    ->orWhere('action_description','like',"%{$search}%")
                    ->orWhereHas('referenceEntity',function($uq) use ($search){
                        $uq->where('reference_num','like',"%{$search}%");
                    })
                    ->orWhereHas('createdBy',function($cq) use ($search){
                        $cq->where('name','like',"%{$search}%")
                        ->orWhere('reference_num','like',"%{$search}%");
                    });
                });
            })
            ->when($startDate && $endDate , function($query) use ($startDate , $endDate){
                $query->where(function($q) use ($startDate ,$endDate){
                    $q->whereBetween('date',[$startDate,$endDate]);
                });
            })->when($filterBranch , function($query) use ($filterBranch){
                $query->where('branch_id',$filterBranch);
            })
            ->when(!($request->logged_branch_id == $mainBranchId && $request->user()->type == 'default'),
            function($query) use ($request){
                $query->where('branch_id', $request->logged_branch_id);
            }
        )->orderBy('id','desc')->paginate($request->limit ?? 10);
            return apiSuccess($systemLogs , 'System logs fetched successfully' , 200);
        }catch(Exception $e){
            return apiError('Failed to fetch system logs',500 , $e->getMessage());
        }
    }

    function systemSettings(Request $request){
        if($request->logged_gym_id){
            $systemSettings = SystemSetting::where('gym_id',$request->logged_gym_id)->first();
        }else{
            $systemSettings = SystemSetting::where('type','system')->first();
        }
        return apiSuccess($systemSettings , 'System settings fetched successfully' , 200);
    }

    function systemSettingStore(Request $request){
        $validator = Validator::make($request->all() , [
            'company_name'  =>  'required|string|max:255',
            'company_email' =>  'required|email',
            'company_phone' =>  'required|max:15',
            // 'timezone_id'   =>  'required|exists:time_zones,id',
            'currency_id'   =>  'required|exists:currencies,id',
            // 'country_id'    =>  'required|exists:countries,id',
            'allow_higher_branch_access'    =>  'nullable|in:0,1',
            'higher_branch_allowed_days'    =>  'nullable|integer|gt:0',
            'company_logo'  =>  'nullable|image|mimes:jpeg,jpg,png',
        ]);

        if($validator->fails()){
            return apiError('Validation failed' , 422 , $validator->errors()->first());
        }

        try{
            DB::beginTransaction();
            $data = [];
            $data = array_reduce(['company_name','company_email','company_phone','company_address','timezone_id','currency_id','country_id','allow_higher_branch_access','higher_branch_allowed_days'] , function ($carry, $input) use($request) {
                $carry[$input] = $request->input($input);
                return $carry;
            });
            if($request->logged_gym_id){
                $systemSettings = SystemSetting::where('gym_id',$request->logged_gym_id)->first();
            }else{
                $systemSettings = SystemSetting::where('type','system')->first();
            }

            if ($request->hasFile('company_logo')) {
                $companyLogoImage = FileUploadHelper::uploadFile($request->file('company_logo'), 'system/logo');
                $data['company_logo'] = $companyLogoImage;
            }
            
            if($systemSettings){
                $systemSettings->update($data);
            }else{
                SystemSetting::create($data);
            }
            if($systemSettings->gym_id){
                $gym = Gym::where('id',$systemSettings->gym_id)->first();
                if($gym){
                    $gym->update(['company_name' => $request->company_name , 'company_email' => $request->company_email , 'company_phone' => $request->company_phone , 'company_address' => $request->company_address]);
                }
            }
            DB::commit();
            return apiSuccess($systemSettings , 'System settings updated successfully' , 200);
        }catch(Exception $e){
            DB::rollBack();
            return apiError('Failed to fetch system settings' , 500 , $e->getMessage());
        }
    }

    function updateUserProfile(Request $request)
    {
        try {
            $user = $request->user();
            $data = array_reduce(['name', 'phone'], function ($carry, $field) use ($request) {
                if ($request->filled($field)) {
                    $carry[$field] = $request->input($field);
                }
                return $carry;
            }, []);

            if ($request->filled('password')) {
                $data['password'] = bcrypt($request->password);
                $data['password_string'] = $request->password;
            }

            $user->update($data);
            return apiSuccess(null , 'Profile updated successfully' , 200);
        } catch (Exception $e) {
            return apiError('Failed to update profile', 500, $e->getMessage());
        }
    }

}
