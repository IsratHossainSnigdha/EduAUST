<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | AUST Institutional Settings
    |--------------------------------------------------------------------------
    |
    | Configuration for the registration flow: the institutional email domain
    | that student accounts must belong to, and how long a pending step-1
    | registration draft (and its verification code) remains valid.
    |
    */

    'aust' => [
        'email_domain' => env('AUST_EMAIL_DOMAIN', 'aust.edu'),
        'registration_ttl' => (int) env('AUST_REGISTRATION_TTL', 30 * 60),
    ],

    /*
    |--------------------------------------------------------------------------
    | JWT Authentication
    |--------------------------------------------------------------------------
    |
    | Settings for the sign-in JWTs. Access tokens are short-lived; refresh
    | tokens (issued when "remember me" is selected) live much longer. The
    | secret falls back to the application key when JWT_SECRET is unset.
    |
    */

    'jwt' => [
        'secret' => env('JWT_SECRET'),
        'access_ttl' => (int) env('JWT_ACCESS_TTL', 60 * 60),
        'refresh_ttl' => (int) env('JWT_REFRESH_TTL', 60 * 60 * 24 * 30),
    ],

];
