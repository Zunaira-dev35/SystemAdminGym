<?php

use App\Helpers\FileUploadHelper;
use App\Models\EmployeeProfile;
use App\Models\MemberProfile;
use App\Models\User;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;


if(!function_exists('enrollFingerprint')){
    function enrollFingerprint($userId , $userType , $fingerprintImage){
         $imagePath = FileUploadHelper::uploadFile($fingerprintImage , 'users/profile'); 
          $bunnyUrl = config('services.bunnycdn.url');
        $tempPath = $bunnyUrl.$imagePath;
            // $tempPath = asset($imagePath);
            $response = Http::attach(
        'fingerprint', 
        file_get_contents($tempPath), 
        'fingerprint.png', 
        ['Content-Type' => 'image/png']
    )->post('https://browser.snowberrysys.com/finger-recognition/api/v1/fingerprint/enroll', [
            'userId' => $userId,
            'userType' => $userType
    ]);

        // $response = Http::timeout(60)->post('https://browser.snowberrysys.com/finger-recognition/api/v1/fingerprint/enroll', [
        //     'fingerprint' => $base64Image,
        //     'userId' => $userId,
        //     'userType' => $userType
        // ]);
        Log::info($response);
        if ($response->successful()) {
            return $response->json();
        }

        return [
            'success' => false,
            'message' => 'Fingerprint server request failed'
        ];

      
    }
}

if(!function_exists('checkUserFingerPrint')){
        function checkUserFingerPrint($fingerprintImage , $userType , $editUserId = null , $searchBranchId = null) {
            
            $imagePath = FileUploadHelper::uploadFile($fingerprintImage , 'users/profile'); 
            // $tempPath = asset($imagePath);
            $bunnyUrl = config('services.bunnycdn.url');
            $tempPath = $bunnyUrl.$imagePath;
            $response = Http::attach(
        'fingerprint', 
        file_get_contents($tempPath), 
        'fingerprint.png', 
        ['Content-Type' => 'image/png']
    )->post('https://browser.snowberrysys.com/finger-recognition/api/v1/fingerprint/identify', [
            'userType'  =>  $userType,
            'branchId' => $searchBranchId
    ]);

              $result = $response->json();
            if(isset($result['matchFound']) && $result['matchFound'] == true){
                    return [
                        'matched' => true,
                        'user_id' => $result['userId'],
                    ];
                
            }
            return [
                'matched' => false,
            ];
       
        }
    }


