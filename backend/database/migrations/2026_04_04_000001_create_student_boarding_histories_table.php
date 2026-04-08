<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('student_boarding_histories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained()->onDelete('cascade');
            $table->foreignId('boarding_house_id')->nullable()->constrained()->onDelete('set null');
            $table->timestamp('boarded_at');
            $table->timestamp('vacated_at')->nullable();
            $table->string('notes')->nullable();
            $table->timestamps();

            $table->index(['student_id', 'boarded_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('student_boarding_histories');
    }
};
