<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Where a notification takes you when you open it.
 *
 * Notifications announced things like "your request was accepted, you can
 * message them now" and then went nowhere, because nothing recorded what
 * "there" was. The path is stored with the notification rather than guessed
 * in the browser, since only the thing that raised it knows what it was about.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('notifications', function (Blueprint $table) {
            $table->string('link')->nullable()->after('body');
        });
    }

    public function down(): void
    {
        Schema::table('notifications', function (Blueprint $table) {
            $table->dropColumn('link');
        });
    }
};
