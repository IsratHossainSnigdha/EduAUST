<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * When a tutoring arrangement finished.
 *
 * Ending one only moved the status to "ended", so a past student or tutor
 * could be listed but not dated, and neither side could see how long the
 * arrangement had run.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tuition_requests', function (Blueprint $table) {
            $table->timestamp('ended_at')->nullable()->after('responded_at');
        });

        // Arrangements ended before this column existed still have a date worth
        // showing: the last time the row changed, which was the ending.
        DB::table('tuition_requests')
            ->where('status', 'ended')
            ->whereNull('ended_at')
            ->update(['ended_at' => DB::raw('updated_at')]);
    }

    public function down(): void
    {
        Schema::table('tuition_requests', function (Blueprint $table) {
            $table->dropColumn('ended_at');
        });
    }
};
