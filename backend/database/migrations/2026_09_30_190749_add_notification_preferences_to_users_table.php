<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Which kinds of notification an account wants.
 *
 * Settings has shown switches for messages, requests and system notices
 * since it was built, but they only changed the page's own state: nothing
 * stored them and nothing read them, so turning one off did nothing and it
 * was back on after a reload.
 *
 * Null means the account has never changed anything, which is every topic
 * on; only the topics someone has actually turned off need recording.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->json('notification_preferences')->nullable()->after('profile_picture');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('notification_preferences');
        });
    }
};
