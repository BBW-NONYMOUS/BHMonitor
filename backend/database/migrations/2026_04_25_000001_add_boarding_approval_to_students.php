<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('students', function (Blueprint $table) {
            $table->string('boarding_approval_status')->nullable()->after('boarding_house_id');
            $table->text('boarding_rejection_comment')->nullable()->after('boarding_approval_status');
        });
    }

    public function down(): void
    {
        Schema::table('students', function (Blueprint $table) {
            $table->dropColumn(['boarding_approval_status', 'boarding_rejection_comment']);
        });
    }
};
