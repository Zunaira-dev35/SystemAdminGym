<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file stores credentials for third-party services such as Mailgun,
    | Postmark, AWS, Slack, Twilio, and others. This provides a conventional
    | place for packages to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key'    => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel'              => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    'firebase'  =>  [
        'credentials'   =>  env('FIREBASE_CREDENTIALS'),
        'project_id'    =>  env('FIREBASE_PROJECT_ID')
    ],
    
    'twilio' => [
        'sid'                => env('TWILIO_ACCOUNT_SID'),
        'auth_token'         => env('TWILIO_AUTH_TOKEN'),
        'verify_service_sid' => env('TWILIO_VERIFY_SERVICE_SID'),
    ],

    'bunnycdn'  =>  [
        'storage_zone'  =>  env('BUNNY_STORAGE_ZONE'),
        'api_key'       =>  env('BUNNY_API_KEY'),
        'url'   =>  env('BUNNY_URL')
    ]

];
