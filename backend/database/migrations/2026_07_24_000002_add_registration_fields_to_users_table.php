<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Required academic identity fields. The unique() constraints also
            // create the indexes required on student_id and phone (email is
            // already unique in the base users migration).
            $table->string('student_id')->unique()->after('name');
            $table->string('phone')->unique()->after('email');
            $table->foreignId('department_id')->after('phone')
                ->constrained()->restrictOnDelete();
            $table->string('semester')->after('department_id');

            // Verification & profile assets.
            $table->string('student_id_image')->nullable()->after('semester');
            $table->string('profile_picture')->nullable()->after('student_id_image');
            $table->boolean('student_id_verified')->default(false)->after('profile_picture');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('student_id_verified');
            $table->dropColumn('profile_picture');
            $table->dropColumn('student_id_image');
            $table->dropColumn('semester');
            $table->dropConstrainedForeignId('department_id');
            $table->dropUnique(['phone']);
            $table->dropColumn('phone');
            $table->dropUnique(['student_id']);
            $table->dropColumn('student_id');
        });
    }
};
