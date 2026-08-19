<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * The student ID card verification step was dropped from the sign-up
     * flow, so the columns backing it no longer have a writer or a reader.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['student_id_image', 'student_id_verified']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('student_id_image')->nullable()->after('semester');
            $table->boolean('student_id_verified')->default(false)->after('profile_picture');
        });
    }
};
