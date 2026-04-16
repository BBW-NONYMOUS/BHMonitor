<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('boarding_houses', function (Blueprint $table) {
            // Default 'approved' so existing rows stay visible
            $table->string('approval_status')->default('approved')->after('status');
            $table->text('admin_notes')->nullable()->after('approval_status');
        });
    }

    public function down(): void
    {
        Schema::table('boarding_houses', function (Blueprint $table) {
            $table->dropColumn(['approval_status', 'admin_notes']);
        });
    }
};
