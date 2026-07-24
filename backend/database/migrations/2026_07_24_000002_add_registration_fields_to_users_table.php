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
        Schema::table('users', function (Blueprint $table) {
            $table->string('student_id')->nullable()->unique()->after('name');
            $table->string('phone')->nullable()->unique()->after('email');
            $table->foreignId('department_id')->nullable()->after('phone')
                ->constrained()->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropConstrainedForeignId('department_id');
            $table->dropUnique(['phone']);
            $table->dropColumn('phone');
            $table->dropUnique(['student_id']);
            $table->dropColumn('student_id');
        });
    }
};
