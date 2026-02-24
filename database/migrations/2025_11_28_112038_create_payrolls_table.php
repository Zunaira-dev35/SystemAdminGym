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
        Schema::create('payrolls', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->string('reference_num')->nullable();
            $table->integer('basic_salary');
            $table->string('payroll_month');
            $table->integer('cheat_minutes')->default(0);   
            $table->integer('cheat_deduction')->default(0);
            $table->integer('absent_days')->default(0);
            $table->integer('absent_deduction')->default(0);
            $table->integer('leave_days')->default(0);
            $table->integer('present_days')->default(0);         
            $table->integer('holiday_days')->default(0);
            $table->integer('net_payable')->default(0);
            $table->json('shift_absent')->nullable();
            $table->enum('status', ['unpaid', 'paid'])->default('unpaid');
            $table->unsignedBigInteger('processed_by')->nullable();
            $table->timestamp('processed_at')->nullable();
            $table->unsignedBigInteger('gym_id')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payrolls');
    }
};
