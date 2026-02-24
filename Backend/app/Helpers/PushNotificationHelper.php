<?php

use Google\Auth\Credentials\ServiceAccountCredentials;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

function getFirebaseAccessToken(): string
{
      $credentialsPath = storage_path(config('services.firebase.credentials'));
    $credentials = new ServiceAccountCredentials(
        'https://www.googleapis.com/auth/firebase.messaging',
        json_decode(file_get_contents($credentialsPath), true)
    );

    $token = $credentials->fetchAuthToken();

    return $token['access_token'];
}

if (!function_exists('sendFCM')) {
    function sendFCM($deviceId, $title, $body, $data = [])
    {
        $accessToken = getFirebaseAccessToken();
        $response = Http::withToken($accessToken)
            ->post(
                'https://fcm.googleapis.com/v1/projects/' .
                config('services.firebase.project_id') .
                '/messages:send',
                [
                    'message' => [
                        'token' => $deviceId,
                        'notification' => [
                            'title' => $title,
                            'body' => $body,
                        ],
                        'data' => !empty($data) ? $data : null,
                        "android" =>  [
                        "priority" => "HIGH",
                        "notification" =>  [
                          "channel_id" => "brg_loopers_channel"
                        ]
                        ]
                    ],
                ]
            );
        return $response->json();
    }
}


