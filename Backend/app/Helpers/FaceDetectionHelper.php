<?php

use App\Helpers\FileUploadHelper;
use App\Models\User;
use Bunny\Storage\Client;
use Bunny\Storage\Region;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

if(!function_exists('global_face_embedding')){
    function global_face_embedding($referenceNum ,  $set = null, $clear = false)
    {
        if ($clear) {
            Cache::forget('face_embedding_'.$referenceNum);
            return [];
        }
    
        if ($set !== null) {
            Cache::put('face_embedding_'.$referenceNum , $set);
        }
    
        return Cache::get('face_embedding_'.$referenceNum , []);
    }
}

function getEmbedding($imagePath)
{
    // Read image and convert to base64
    $imageData = base64_encode(file_get_contents($imagePath));
    $base64Image = 'data:image/jpeg;base64,' . $imageData;
    $url = 'http://127.0.0.1:53793/embedding';
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode(['image' => $base64Image]));
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 30);
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    if ($httpCode !== 200) {
        throw new \Exception("Embedding server error: HTTP $httpCode");
    }
    $data = json_decode($response, true);
    if (!isset($data['embedding']) || !is_array($data['embedding']) || count($data['embedding']) !== 512) {
        $error = $data['error'] ?? 'Invalid embedding';
        throw new \Exception($error);
    }
    return $data['embedding'];
}


if(!function_exists('checkUserFace')){
    function checkUserFace($profileImage , $userType  , $loggedGymId ,  $editUserId = null , $searchBranchId = null)
    {
        $profilePic = FileUploadHelper::uploadFile($profileImage , 'users/profile'); 
        // $tempPath = asset($profilePic);
        $bunnyUrl = config('services.bunnycdn.url');
        $tempPath = $bunnyUrl.$profilePic;
        $imageData = base64_encode(file_get_contents($tempPath));
        $base64Image = 'data:image/jpeg;base64,' . $imageData;

        $response = Http::timeout(30)->post('http://127.0.0.1:53793/embedding', [
        'image' => $base64Image,
        'user_type' => $userType,
        'exclude_id' => $editUserId,
        'branch_id' => $searchBranchId,
        'gym_id' =>  $loggedGymId
        ]);

         //delete image from binary storage after checking
        try {
            $client = new Client( config('services.bunnycdn.api_key'), config('services.bunnycdn.storage_zone'), Region::SINGAPORE );
            $client->delete($profilePic);
        } catch (\Exception $e) {
            Log::warning('Bunny delete failed: ' . $e->getMessage());
        }

        // Log::info($response);
        if ($response->successful()) {
            return $response->json();
        }

        return [
            'matched' => false,
            'message' => 'Face server request failed'
        ];
    }
}

