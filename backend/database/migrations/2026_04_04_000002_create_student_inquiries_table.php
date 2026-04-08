<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('student_inquiries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('boarding_house_id')->constrained()->cascadeOnDelete();
            $table->foreignId('student_id')->nullable()->constrained()->nullOnDelete();
            
            // Student info (for non-registered students)
            $table->string('full_name');
            $table->string('email');
            $table->string('contact_number');
            $table->string('student_no')->nullable();
            $table->string('course')->nullable();
            $table->string('year_level')->nullable();
            $table->enum('gender', ['Male', 'Female'])->nullable();
            
            // Inquiry details
            $table->text('message')->nullable();
            $table->string('preferred_room_type')->nullable();
            $table->decimal('budget', 10, 2)->nullable();
            $table->date('move_in_date')->nullable();
            
            // Status tracking
            $table->enum('status', ['pending', 'contacted', 'approved', 'declined', 'cancelled'])->default('pending');
            $table->text('owner_notes')->nullable();
            
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('student_inquiries');
    }
};
