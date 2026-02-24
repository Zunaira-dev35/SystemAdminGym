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
        Schema::create('freeze_requests', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id')->nullable();
            $table->foreign('user_id')->references('id')->on('users')->onDelete('set null');
            $table->date('start_date')->nullable();
            $table->date('end_date')->nullable();
            $table->unsignedBigInteger('plan_id')->nullable();
            $table->foreign('plan_id')->references('id')->on('plans')->onDelete('set null');
            $table->date('plan_start_date')->nullable();
            $table->date('plan_expire_date')->nullable();
            $table->date('generate_date')->nullable();
            $table->time('generate_time')->nullable();
            $table->date('approve_date')->nullable();
            $table->time('approve_time')->nullable();
            $table->date('reject_date')->nullable();
            $table->time('reject_time')->nullable();
            $table->unsignedBigInteger('created_by_id')->nullable();
            $table->foreign('created_by_id')->references('id')->on('users')->onDelete('set null');
            $table->unsignedBigInteger('approve_by_id')->nullable();
            $table->foreign('approve_by_id')->references('id')->on('users')->onDelete('set null');
            $table->unsignedBigInteger('rejected_by_id')->nullable();
            $table->foreign('rejected_by_id')->references('id')->on('users')->onDelete('set null');
            $table->enum('status',['pending','approved','rejected']);
            $table->integer('duration_days')->nullable();
            $table->mediumText('reason')->nullable();
            $table->unsignedBigInteger('branch_id')->nullable();
            $table->foreign('branch_id')->references('id')->on('branches')->onDelete('set null');
            $table->mediumText('reference_num')->nullable();
            $table->boolean('process_status')->default(0)->nullable();
            $table->unsignedBigInteger('gym_id')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('freeze_requests');
    }
};
