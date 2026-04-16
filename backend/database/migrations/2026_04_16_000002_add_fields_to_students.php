<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('students', function (Blueprint $table) {
            $table->string('address')->nullable()->after('contact_number');
            $table->foreignId('room_id')->nullable()->constrained('rooms')->nullOnDelete()->after('boarding_house_id');
        });
    }

    public function down(): void
    {
        Schema::table('students', function (Blueprint $table) {
            $table->dropForeign(['room_id']);
            $table->dropColumn(['address', 'room_id']);
        });
    }
};
