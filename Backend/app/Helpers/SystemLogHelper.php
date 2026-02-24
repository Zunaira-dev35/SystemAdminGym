<?php

use App\Models\SystemLog;
use Illuminate\Support\Facades\Auth;

if (!function_exists('GenerateSystemLogs')) {

    // Store incoming log details
    function GenerateSystemLogs($actionType , $actionDescription , $referenceEntityId , $referenceEntity , $gymId , $branchId = null , $deviceIP = null)
    {
        $data = [
            'action_type' => $actionType ,
            'action_description'    =>  $actionDescription ,
            'reference_entity_id'   =>  $referenceEntityId ,
            'reference_entity'      =>  $referenceEntity,
            'created_by_user_id'    =>  Auth::id(),
            'date'                  =>  now()->toDateString(),
            'time'                  =>  now()->toTimeString(),
            'branch_id'             =>  $branchId,
            'device_ip'             =>  $deviceIP,
            'gym_id'                =>  $gymId
        ];
        SystemLog::create($data);
    }
}


