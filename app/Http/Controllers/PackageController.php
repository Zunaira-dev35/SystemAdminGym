<?php

namespace App\Http\Controllers;

use App\Models\Gym;
use App\Models\Package;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class PackageController extends Controller
{
    function packages(Request $request){
       try{
            $search = trim($request->query('search'));
            $filterStatus = $request->query('filter_status');
            $disablePaginateParam = $request->disable_page_param;
            $packageQuery = Package::when($search , function($query) use ($search){
                $query->where('name','like',"%{$search}%")
                ->orWhere('duration','like',"%{$search}%");
            })->when($filterStatus , function($query) use ($filterStatus){
                $query->where('status' , $filterStatus);
            }) ->orderByRaw("CASE WHEN type = 'trial' THEN 0 ELSE 1 END")
            ->orderBy('id', 'desc');
            if($disablePaginateParam && $disablePaginateParam == 1){
                $packages = $packageQuery->get();
            }else{
                $packages = $packageQuery->paginate($request->limit ?? 10);
            }
            return apiSuccess($packages , 'Packages fetched successfully' , 200);
       }catch(Exception $e){
            return apiError('Failed to fetch packages' , 500 , $e->getMessage());
       }
    }

    function packageStore(Request $request){
        $validator = Validator::make($request->all() , [
            'name'                      =>      'required|max:255|unique:packages,name,'.$request->id,
            'branch_limit'              =>      'required|integer|gt:0',
            'user_limit'                =>      'required|integer|gt:0',
            'member_limit'              =>      'required|integer|gt:0',
            'employee_limit'            =>      'required|integer|gt:0',
            'type'                      =>      'required|in:standard,trial',
            'duration'                  =>      'nullable|required_if:type,standard|in:monthly,yearly,lifetime',
            'price' => [
                'nullable',
                'required_if:type,standard',
                'numeric',
                // If not trial , must be greater than 0
                function ($attribute, $value, $fail) use ($request) {
                    if ($request->type !== 'trial' && $value == 0) {
                        $fail('Price must be greater than 0 for non-trial packages.');
                    }
                },
            ],
            'is_app_avail'              =>      'nullable|in:0,1',
            'id'                        =>      'nullable|exists:packages,id',
            'trial_days'                =>      'nullable|integer|gt:0|required_if:type,trial'
        ]);

        if($validator->fails()){
            return apiError('Validation failed' , 422 , $validator->errors()->first());
        }

        try{
            $data = [];
            $data = array_reduce(['name','description','branch_limit','user_limit','member_limit','employee_limit','duration','price','is_app_avail','type','trial_days'] , function($carry , $input) use ($request){
                $carry[$input] = $request->input($input);
                return $carry;
            });
            $data['created_by'] = Auth::id();
            if(empty($request->id)){
                $data['status'] = 'active';
            }
            $existingTrialPackage = Package::where('type','trial')->first();

            if ($request->type === 'trial') {
                if (!$request->id && $existingTrialPackage) {
                    return apiError( 'Failed to store package', 422, 'Only one trial package is allowed.' );
                }

                if ( $request->id && $existingTrialPackage && $existingTrialPackage->id != $request->id ) {
                    return apiError( 'Failed to update package', 422, 'Only one trial package is allowed.' );
                }
            }
            if($request->type == 'trial'){
                $data['price'] = 0;
                $data['duration'] = null;
            }
            if($request->type == 'standard'){
                $data['trial_days'] = null;
            }
            Package::updateOrInsert(['id' => $request->input('id')] , $data);
            $latestPackage = $request->id ? Package::where('id',$request->id)->first() : Package::orderBy('id','desc')->first();
            return apiSuccess($latestPackage , 'Package stored successfully' , 200);
        }catch(Exception $e){
            return apiError('Failed to store package' , 500 , $e->getMessage());
        }
    }

    function packageUpdateStatus(Request $request){
        $validator = Validator::make($request->all() , [
            'package_id'    =>  'required|exists:packages,id'
        ]);

        if($validator->fails()){
            return apiError('Validation failed' , 422 , $validator->errors()->first());
        }

        try{
            $package = Package::where('id',$request->package_id)->first();
            if($package->status == 'active'){
                $updatedStatus = 'inactive';
                $successMessage = 'Package inactivated successfully';
            }else{
                $updatedStatus = 'active';
                $successMessage = 'Package activated successfully';
            }
            $package->update(['status' => $updatedStatus]);
            return apiSuccess($package , $successMessage , 200);
        }catch(Exception $e){
            return apiError('Failed to update package status' , 500 , $e->getMessage());
        }
    }

    function packageDelete(Request $request){
        $validator = Validator::make($request->all() , [
            'package_id'    =>  'required|exists:packages,id'
        ]);

        if($validator->fails()){
            return apiError('Validation failed' , 422 , $validator->errors()->first());
        }

        try{
            $gymExistWithPackage = Gym::where('package_id',$request->package_id)->exists();
            if($gymExistWithPackage){
                return apiError('Unable to delete' , 422 , 'Unable to delete , gym exists with this package');
            }
            Package::where('id',$request->package_id)->delete();
            return apiSuccess(null , 'Package deleted successfully.' , 200);
        }catch(Exception $e){
            return apiError('Failed to delete package' , 500 , $e->getMessage());
        }
    }
}
