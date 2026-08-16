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
        Schema::create('notifications', function (Blueprint $table) {
            $table->uuid('id')->primary();

            // Notifications belong to a single recipient and are meaningless
            // once that account is gone.
            $table->foreignUuid('user_id')->constrained()->cascadeOnDelete();

            // Which dashboard the notification belongs to. A single account
            // can act as both a student and a tutor, so 'both' covers anything
            // that should surface on either. See Notification::AUDIENCES.
            $table->string('audience')->default('both');

            // Messages, Requests, Sessions, System — see Notification::CATEGORIES.
            $table->string('category')->default('system');
            $table->string('title');
            $table->text('body');

            // Null until the recipient reads it; doubles as the read timestamp.
            $table->timestamp('read_at')->nullable();
            $table->timestamps();

            // The list is always "this user's notifications for one dashboard,
            // newest first", and the badge counts the unread ones.
            $table->index(['user_id', 'audience', 'created_at']);
            $table->index(['user_id', 'audience', 'read_at']);
            $table->index(['user_id', 'category']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('notifications');
    }
};
