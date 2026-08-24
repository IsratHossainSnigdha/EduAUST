<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Signing in with an AUST Google account yields only a verified email and
     * a display name. The student ID and department are derived from the
     * institutional address (name.dept.id@aust.edu), but the phone number,
     * semester, and password have no equivalent source — the account is
     * created without them and the holder supplies them afterwards.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('student_id')->nullable()->change();
            $table->string('phone')->nullable()->change();
            $table->foreignId('department_id')->nullable()->change();
            $table->string('semester')->nullable()->change();
            $table->string('password')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('student_id')->nullable(false)->change();
            $table->string('phone')->nullable(false)->change();
            $table->foreignId('department_id')->nullable(false)->change();
            $table->string('semester')->nullable(false)->change();
            $table->string('password')->nullable(false)->change();
        });
    }
};
