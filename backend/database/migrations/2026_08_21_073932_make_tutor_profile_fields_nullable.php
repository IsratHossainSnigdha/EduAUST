<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tutor_profiles', function (Blueprint $table) {
            $table->integer('hourly_rate')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('tutor_profiles', function (Blueprint $table) {
            $table->integer('hourly_rate')->nullable(false)->change();
        });
    }
};