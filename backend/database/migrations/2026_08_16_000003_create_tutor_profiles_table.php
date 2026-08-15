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
        Schema::create('tutor_profiles', function (Blueprint $table) {
            $table->uuid('id')->primary();

            // A user tutors under a single profile; the department, name and
            // avatar are read from the user rather than duplicated here.
            $table->foreignUuid('user_id')->unique()->constrained()->cascadeOnDelete();

            $table->string('headline');
            $table->text('bio')->nullable();

            // Whole taka per hour — no fractional currency in this market.
            $table->unsignedInteger('hourly_rate');
            $table->unsignedTinyInteger('experience_years')->default(0);

            // Students taught so far, shown on the listing card.
            $table->unsignedInteger('student_count')->default(0);

            // Languages the tutor teaches in, e.g. ["English", "Bangla"].
            $table->json('languages');

            // Tutors can take themselves out of the listing without deleting
            // their profile.
            $table->boolean('is_available')->default(true);
            $table->timestamps();

            // The listing filters and sorts on these, always within the set of
            // available tutors.
            $table->index(['is_available', 'experience_years']);
            $table->index(['is_available', 'student_count']);
            $table->index(['is_available', 'hourly_rate']);
        });

        Schema::create('subject_tutor_profile', function (Blueprint $table) {
            $table->foreignId('subject_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('tutor_profile_id')->constrained()->cascadeOnDelete();

            $table->primary(['subject_id', 'tutor_profile_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('subject_tutor_profile');
        Schema::dropIfExists('tutor_profiles');
    }
};
