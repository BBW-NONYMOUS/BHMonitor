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
        Schema::create('rooms', function (Blueprint $table) {
            $table->id();
            $table->foreignId('boarding_house_id')->constrained()->onDelete('cascade');
            $table->string('room_name');
            $table->integer('capacity')->default(1);
            $table->integer('occupied_slots')->default(0);
            $table->integer('available_slots')->default(1);
            $table->decimal('price', 10, 2)->default(0);
            $table->enum('status', ['available', 'occupied', 'maintenance'])->default('available');
            $table->enum('gender_type', ['Male', 'Female', 'Mixed'])->default('Mixed');
            $table->text('amenities')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('rooms');
    }
};
