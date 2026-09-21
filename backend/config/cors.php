<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS) Configuration
    |--------------------------------------------------------------------------
    */

    'paths' => [
        'api/*',
    ],

    'allowed_methods' => [
        '*',
    ],

    'allowed_origins' => [
        'http://localhost:5173',
        'http://localhost:5174',
        'http://localhost:5175',
        'http://localhost:5176',

        'http://localhost:5177',
        'http://localhost:5178',
        'http://localhost:5179',
        'http://localhost:5180',
        'http://localhost:5181',
        'http://localhost:5182',
        'http://localhost:5183',

    ],

    'allowed_origins_patterns' => [],

    'allowed_headers' => [
        '*',
    ],

    'exposed_headers' => [],

    /*
     * Every authenticated call carries an Authorization header, which makes it
     * a non-simple request: the browser sends a preflight OPTIONS first. At 0
     * that preflight is never cached, so each call cost two round trips, and a
     * dashboard that opens four endpoints at once paid eight — noticeably slow
     * against `artisan serve`, which answers one request at a time.
     */
    'max_age' => 86400,

    'supports_credentials' => true,

];
