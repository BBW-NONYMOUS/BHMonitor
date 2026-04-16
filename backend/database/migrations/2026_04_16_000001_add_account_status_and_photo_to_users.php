<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('account_status')->default('approved')->after('role'); // pending|approved|rejected
            $table->string('profile_photo')->nullable()->after('account_status');
            $table->text('rejection_reason')->nullable()->after('profile_photo');
        });

        // Set existing admin accounts as approved automatically
        \DB::table('users')->where('role', 'admin')->update(['account_status' => 'approved']);
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['account_status', 'profile_photo', 'rejection_reason']);
        });
    }
};
