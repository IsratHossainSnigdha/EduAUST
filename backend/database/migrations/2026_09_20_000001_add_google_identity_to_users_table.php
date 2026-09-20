<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Google sign-in previously matched accounts on email alone. Recording
     * Google's own subject identifier lets an account stay linked even if the
     * address changes, and lets the settings screen say truthfully whether
     * Google is connected rather than guessing from the domain.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('google_id')->nullable()->unique()->after('email');
            $table->timestamp('google_linked_at')->nullable()->after('google_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('google_linked_at');
            $table->dropUnique(['google_id']);
            $table->dropColumn('google_id');
        });
    }
};
