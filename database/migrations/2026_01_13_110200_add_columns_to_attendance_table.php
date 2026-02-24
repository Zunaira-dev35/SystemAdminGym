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
        Schema::table('attendances', function (Blueprint $table) {
            $table->enum('attendance_type',['Morning','Evening'])->nullable();
            $table->time('shift_start_time')->nullable();
            $table->time('shift_end_time')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('attendances', function (Blueprint $table) {
            $table->dropColumn('attendance_type');
            $table->dropColumn('shift_start_time');
            $table->dropColumn('shift_end_time');
        });
    }
};
