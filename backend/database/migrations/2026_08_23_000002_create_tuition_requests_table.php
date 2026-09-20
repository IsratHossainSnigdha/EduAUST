<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * A tuition request is a student asking one tutor to teach one subject.
     * The tutor then accepts or declines it, which is the only thing that
     * moves it out of the pending state.
     */
    public function up(): void
    {
        Schema::create('tuition_requests', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('student_id')->constrained('users')->cascadeOnDelete();
            $table->foreignUuid('tutor_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('subject_id')->nullable()->constrained()->nullOnDelete();
            $table->string('level')->nullable();
            $table->text('message')->nullable();
            $table->string('status')->default('pending');
            $table->timestamp('seen_at')->nullable();
            $table->timestamp('responded_at')->nullable();
            $table->timestamps();

            // The tutor's inbox is read by status and recency.
            $table->index(['tutor_id', 'status', 'created_at']);
            $table->index(['student_id', 'created_at']);

            // A student cannot queue up the same subject with the same tutor
            // twice; they either wait for an answer or send a different one.
            $table->unique(['student_id', 'tutor_id', 'subject_id', 'status'], 'tuition_requests_no_duplicate_pending');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tuition_requests');
    }
};
