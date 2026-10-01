<?php

namespace App\Providers;

use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // The link lands on the frontend's reset page. The address is encoded
        // so a "+" in it survives the trip rather than arriving as a space.
        ResetPassword::createUrlUsing(function (object $notifiable, string $token) {
            return rtrim((string) config('app.frontend_url'), '/')
                .'/password-reset/'.$token
                .'?email='.urlencode($notifiable->getEmailForPasswordReset());
        });
    }
}
