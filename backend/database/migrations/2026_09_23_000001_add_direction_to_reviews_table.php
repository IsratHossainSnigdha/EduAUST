<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Reviews were one-way: a student rating a tutor. A tutor can now rate a
 * student too, so a row needs to say which direction it is — and the same
 * student/tutor pair can hold one review each way.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('reviews', function (Blueprint $table) {
            $table->string('direction', 32)->default('student_to_tutor')->after('tutor_id');

            // The student_id foreign key leans on the old composite unique for
            // its index; give it a standalone one before that unique is dropped.
            $table->index('student_id');
        });

        Schema::table('reviews', function (Blueprint $table) {
            $table->dropUnique(['student_id', 'tutor_id']);
        });

        Schema::table('reviews', function (Blueprint $table) {
            // One opinion per pair per direction: a student's review of a tutor
            // and that tutor's review of the student are two separate rows.
            $table->unique(['student_id', 'tutor_id', 'direction']);
        });
    }

    public function down(): void
    {
        Schema::table('reviews', function (Blueprint $table) {
            $table->dropUnique(['student_id', 'tutor_id', 'direction']);
        });

        Schema::table('reviews', function (Blueprint $table) {
            $table->unique(['student_id', 'tutor_id']);
            $table->dropIndex(['student_id']);
            $table->dropColumn('direction');
        });
    }
};
