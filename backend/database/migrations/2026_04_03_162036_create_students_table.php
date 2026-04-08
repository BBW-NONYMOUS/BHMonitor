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
        Schema::create('students', function (Blueprint $table) {
            $table->id();
            $table->string('student_no', 50)->unique();
            $table->string('first_name');
            $table->string('last_name');
            $table->enum('gender', ['Male', 'Female'])->nullable();
            $table->string('course')->nullable();
            $table->string('year_level')->nullable();
            $table->string('contact_number', 20)->nullable();
            $table->string('parent_name')->nullable();
            $table->string('parent_contact', 20)->nullable();
            $table->string('image')->nullable();
            $table->foreignId('boarding_house_id')->nullable()->constrained()->onDelete('set null');
            $table->index(['course', 'year_level']);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('students');
    }
};
