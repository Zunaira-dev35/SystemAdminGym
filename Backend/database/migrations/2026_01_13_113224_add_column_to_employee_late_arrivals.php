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
        Schema::table('employee_late_arrivals', function (Blueprint $table) {
            $table->enum('attendance_type',['Morning','Evening'])->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('employee_late_arrivals', function (Blueprint $table) {
            $table->dropColumn('attendance_type');
        });
    }
};
