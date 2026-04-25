<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('student_recommendations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained('students')->onDelete('cascade');
            $table->foreignId('owner_id')->constrained('owners')->onDelete('cascade');
            $table->string('status')->default('pending'); // pending, accepted, rejected, submitted
            $table->text('student_message')->nullable(); // Student's reason/request
            $table->text('owner_response')->nullable(); // Owner's recommendation text
            $table->text('rejection_reason')->nullable(); // If rejected, why
            $table->timestamp('requested_at')->nullable();
            $table->timestamp('responded_at')->nullable();
            $table->timestamps();
            
            // Indexes
            $table->index('student_id');
            $table->index('owner_id');
            $table->index('status');
            $table->unique(['student_id', 'owner_id']); // One rec per student-owner pair
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('student_recommendations');
    }
};
