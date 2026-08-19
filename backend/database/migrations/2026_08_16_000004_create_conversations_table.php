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
        Schema::create('conversations', function (Blueprint $table) {
            $table->uuid('id')->primary();

            // A conversation is strictly between two people. The pair is stored
            // in a canonical order (see Conversation::betweenIds) so the unique
            // index below makes duplicate threads impossible at the database
            // level rather than relying on application checks.
            $table->foreignUuid('user_one_id')->constrained('users')->cascadeOnDelete();
            $table->foreignUuid('user_two_id')->constrained('users')->cascadeOnDelete();

            // Denormalised so the conversation list can be ordered without
            // touching the messages table.
            $table->timestamp('last_message_at')->nullable();
            $table->timestamps();

            $table->unique(['user_one_id', 'user_two_id']);
            $table->index(['user_one_id', 'last_message_at']);
            $table->index(['user_two_id', 'last_message_at']);
        });

        Schema::create('messages', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('conversation_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('sender_id')->constrained('users')->cascadeOnDelete();

            $table->text('body');

            // Null until the recipient has seen it; drives the unread badge.
            $table->timestamp('read_at')->nullable();
            $table->timestamps();

            // The thread is always read newest-last for one conversation, and
            // unread counts filter on read_at.
            $table->index(['conversation_id', 'created_at']);
            $table->index(['conversation_id', 'sender_id', 'read_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('messages');
        Schema::dropIfExists('conversations');
    }
};
