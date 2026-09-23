<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * The student dashboard has offered a "Saved Tutors" card since it was first
 * built, with nothing behind it. This is that shortlist: the tutors a student
 * has kept while browsing, before they are ready to send a request.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('saved_tutors', function (Blueprint $table) {
            $table->uuid('id')->primary();

            $table->foreignUuid('student_id')->constrained('users')->cascadeOnDelete();
            $table->foreignUuid('tutor_id')->constrained('users')->cascadeOnDelete();

            $table->timestamps();

            // Saving the same tutor twice is the same shortlist, not two.
            $table->unique(['student_id', 'tutor_id']);

            // The listing is always "this student's saves, newest first".
            $table->index(['student_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('saved_tutors');
    }
};
