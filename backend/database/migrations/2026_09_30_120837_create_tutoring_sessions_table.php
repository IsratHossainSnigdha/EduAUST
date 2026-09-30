<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * An agreed time to actually meet and study.
 *
 * The product went request, accept, then chat, and stopped. There was no way
 * to settle on a time, see what was coming up, or look back at what had
 * happened, even though the landing page has always promised you could
 * "schedule a session that fits your schedule".
 *
 * Named tutoring_sessions because Laravel already owns "sessions" for its own
 * HTTP session store.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tutoring_sessions', function (Blueprint $table) {
            $table->uuid('id')->primary();

            // The arrangement it belongs to. Ending the arrangement takes its
            // sessions with it, since they cannot happen any more.
            $table->foreignUuid('tuition_request_id')
                ->constrained('tuition_requests')
                ->cascadeOnDelete();

            // Denormalised so "my sessions" is one indexed lookup rather than
            // a join through the arrangement on every dashboard load.
            $table->foreignUuid('tutor_id')->constrained('users')->cascadeOnDelete();
            $table->foreignUuid('student_id')->constrained('users')->cascadeOnDelete();

            // DATETIME, not TIMESTAMP: MySQL silently attaches ON UPDATE
            // CURRENT_TIMESTAMP to the first non-nullable TIMESTAMP column
            // in a table, which rewrote the agreed time on every save.
            $table->dateTime('scheduled_at');
            $table->unsignedSmallInteger('duration_minutes')->default(60);

            // Free text: a room, a building, or a meeting link. Campus
            // tutoring happens in too many kinds of place to enumerate.
            $table->string('location')->nullable();
            $table->text('note')->nullable();

            // proposed -> confirmed -> completed, or cancelled from any of
            // them. Kept as a string for the same reason the request status
            // is: adding a state should not need a migration.
            $table->string('status')->default('proposed');

            // Whoever suggested it. The other side is the one who answers.
            $table->foreignUuid('proposed_by')->constrained('users')->cascadeOnDelete();

            $table->dateTime('cancelled_at')->nullable();
            $table->foreignUuid('cancelled_by')->nullable()->constrained('users')->nullOnDelete();

            $table->timestamps();

            // Both dashboards ask "what is coming up for me", in time order.
            $table->index(['tutor_id', 'scheduled_at']);
            $table->index(['student_id', 'scheduled_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tutoring_sessions');
    }
};
