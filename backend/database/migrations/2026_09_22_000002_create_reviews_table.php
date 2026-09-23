<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * What a student thought of the tutoring they received.
 *
 * Tutor cards have shown a star rating since the listing was built, read from
 * nothing — there was no table behind it. A review is only allowed from a
 * student the tutor actually accepted, so the figure means something.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('reviews', function (Blueprint $table) {
            $table->uuid('id')->primary();

            $table->foreignUuid('student_id')->constrained('users')->cascadeOnDelete();
            $table->foreignUuid('tutor_id')->constrained('users')->cascadeOnDelete();

            $table->unsignedTinyInteger('rating');
            $table->text('comment')->nullable();

            $table->timestamps();

            // One student holds one opinion of one tutor; changing your mind
            // edits it rather than adding a second.
            $table->unique(['student_id', 'tutor_id']);

            // The tutor's own listing, and the average, are both read this way.
            $table->index(['tutor_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reviews');
    }
};
