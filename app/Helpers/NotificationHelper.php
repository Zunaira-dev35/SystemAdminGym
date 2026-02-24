<?php

use App\Events\NotificationReceiveEvent;
use App\Events\NotificationSent;
use App\Helpers\FileUploadHelper;
use App\Models\LoyaltyOfferSetting;
use App\Models\LoyaltyRewardTransaction;
use App\Models\Notification;
use App\Models\User;

if (!function_exists('generateNotification')) {

    // Store incoming log details
    function generateNotification($user_id , $name , $message , $type , $referenceEntityName = null , $referenceEntityId = null , $branchId = null , $image = null)
    {   
        try {
            // Validate input
            if (empty($user_id) || empty($name) || empty($message)) {
                return;
            }
            // Upload image if exists
            $notifyPic = $image ? FileUploadHelper::uploadFile($image, 'notification/image') : null;
            // Find the user
            $user = User::find($user_id);
            if (!$user) {
                return;
            }
            // Create database notification
            Notification::create([
                'user_id' => $user_id,
                'name' => $name,
                'message' => $message,
                'is_read' => false,
                'type' => $type,
                'image' => $notifyPic,
                'date' => now(),
                'time'  =>  now(),
                'branch_id' =>  $branchId,
                'reference_entity_name' =>  $referenceEntityName,
                'reference_entity_id'   =>  $referenceEntityId
            ]);
            $latestNotification = Notification::with('receiver')->orderBy('id','desc')->first();
            broadcast(new NotificationReceiveEvent($latestNotification))->toOthers();
            return true;
        } catch (\Exception $e) {
            return false;
        }
    }
}


