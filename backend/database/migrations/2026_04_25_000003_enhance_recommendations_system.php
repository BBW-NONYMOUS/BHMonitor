<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Add new columns to student_recommendations table
        Schema::table('student_recommendations', function (Blueprint $table) {
            $table->integer('rating')->nullable()->after('owner_response'); // 1-5 star rating
            $table->text('student_review')->nullable()->after('rating'); // Student's review of recommendation
            $table->string('template_used')->nullable()->after('student_review'); // Which template was used
            $table->boolean('is_bulk_request')->default(false)->after('template_used');
        });

        // Create recommendation_templates table
        Schema::create('recommendation_templates', function (Blueprint $table) {
            $table->id();
            $table->foreignId('owner_id')->constrained('owners')->onDelete('cascade');
            $table->string('name'); // e.g., "Graduate School", "Job Application"
            $table->text('template_text'); // Template with placeholders
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index('owner_id');
        });

        // Create recommendation_ratings table for historical tracking
        Schema::create('recommendation_ratings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('recommendation_id')->constrained('student_recommendations')->onDelete('cascade');
            $table->integer('rating'); // 1-5
            $table->text('review')->nullable();
            $table->timestamps();

            $table->index('recommendation_id');
        });

        // Create owner_recommendation_stats table for owner analytics
        Schema::create('owner_recommendation_stats', function (Blueprint $table) {
            $table->id();
            $table->foreignId('owner_id')->constrained('owners')->onDelete('cascade');
            $table->integer('total_recommendations')->default(0);
            $table->integer('accepted')->default(0);
            $table->integer('rejected')->default(0);
            $table->integer('submitted')->default(0);
            $table->decimal('average_rating', 3, 2)->nullable();
            $table->timestamps();

            $table->unique('owner_id');
        });
    }

    public function down(): void
    {
        Schema::table('student_recommendations', function (Blueprint $table) {
            $table->dropColumn(['rating', 'student_review', 'template_used', 'is_bulk_request']);
        });

        Schema::dropIfExists('recommendation_ratings');
        Schema::dropIfExists('recommendation_templates');
        Schema::dropIfExists('owner_recommendation_stats');
    }
};
