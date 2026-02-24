<?php

return [
    'paths' => [
        'api/*',
        'sanctum/csrf-cookie',
        'login',
        'logout',
        'admin/*' // Add any custom paths you need
    ],

    'allowed_methods' => ['*'],

    // For development (be more restrictive in production)
    'allowed_origins' => [
        'http://localhost:5173', // Your React dev server
        'http://127.0.0.1:5173',  // Alternative localhost
        'https://ZAINSgym.snowberrysys.com',
        '*'
    ],

    'allowed_origins_patterns' => [],

    'allowed_headers' => [
        'Content-Type',
        'X-Auth-Token',
        'Authorization',
        'X-Requested-With',
        'Accept'
    ],

    'exposed_headers' => [
        'Authorization',
        'X-CSRF-TOKEN'
    ],

    'max_age' => 86400, // 24 hours

    'supports_credentials' => true, // Important for cookies/sessions
];
