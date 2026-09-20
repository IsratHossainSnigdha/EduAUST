<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Becoming a tutor only asks for subjects, experience and a bio, so the
     * headline has no value to insert at that point. It was left NOT NULL when
     * the other optional profile fields were relaxed, which made every attempt
     * to create a tutor account fail.
     */
    public function up(): void
    {
        Schema::table('tutor_profiles', function (Blueprint $table) {
            $table->string('headline')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tutor_profiles', function (Blueprint $table) {
            $table->string('headline')->nullable(false)->change();
        });
    }
};
