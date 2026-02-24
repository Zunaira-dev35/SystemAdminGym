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
        Schema::create('plan_transfers', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id')->nullable();
            $table->foreign('user_id')->references('id')->on('users')->onDelete('set null');
            $table->unsignedBigInteger('current_plan_id')->nullable();
            $table->foreign('current_plan_id')->references('id')->on('plans')->onDelete('set null');
            $table->date('current_plan_start_date')->nullable();
            $table->bigInteger('current_plan_total_days')->nullable();
            $table->bigInteger('current_plan_used_days')->nullable();
            $table->double('current_plan_received_fee')->nullable();
            $table->double('total_fee_received')->nullable();
            $table->unsignedBigInteger('new_plan_id')->nullable();
            $table->foreign('new_plan_id')->references('id')->on('plans')->onDelete('set null');
            $table->date('new_plan_start_date')->nullable();
            $table->bigInteger('new_plan_total_days')->nullable();
            $table->bigInteger('new_plan_remaining_days')->nullable();
            $table->double('new_plan_total_fee')->nullable();
            $table->double('new_plan_remaining_fee')->nullable();
            $table->enum('deposit_method',['cash','bank'])->nullable();
            $table->unsignedBigInteger('created_by_id')->nullable();
            $table->foreign('created_by_id')->references('id')->on('users')->onDelete('set null');
            $table->date('generate_date')->nullable();
            $table->time('generate_time')->nullable();
            $table->unsignedBigInteger('branch_id')->nullable();
            $table->foreign('branch_id')->references('id')->on('branches')->onDelete('set null');
            $table->mediumText('reference_num')->nullable();
            $table->unsignedBigInteger('fee_collection_id')->nullable();
            $table->foreign('fee_collection_id')->references('id')->on('fee_collections')->onDelete('set null');
            $table->unsignedBigInteger('gym_id')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('plan_transfers');
    }
};
