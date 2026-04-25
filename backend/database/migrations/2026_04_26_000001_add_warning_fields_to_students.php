<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('students', function (Blueprint $table) {
            $table->boolean('has_warning')->default(false)->after('boarding_rejection_comment');
            $table->text('warning_comment')->nullable()->after('has_warning');
            $table->foreignId('warning_marked_by')->nullable()->after('warning_comment')->constrained('users')->nullOnDelete();
            $table->timestamp('warning_marked_at')->nullable()->after('warning_marked_by');
        });
    }

    public function down(): void
    {
        Schema::table('students', function (Blueprint $table) {
            $table->dropConstrainedForeignId('warning_marked_by');
            $table->dropColumn(['has_warning', 'warning_comment', 'warning_marked_at']);
        });
    }
};
