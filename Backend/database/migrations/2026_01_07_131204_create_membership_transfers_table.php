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
        Schema::create('membership_transfers', function (Blueprint $table) {
            $table->id();
            $table->mediumText('reference_num')->unique()->nullable();
            // Source member (transferring from)
            $table->unsignedBigInteger('from_user_id');
            $table->unsignedBigInteger('from_profile_id')->nullable();
            $table->unsignedBigInteger('from_status_detail_id')->nullable();
            
            // Destination member (transferring to)
            $table->unsignedBigInteger('to_user_id');
            $table->unsignedBigInteger('to_profile_id')->nullable();
            $table->unsignedBigInteger('to_status_detail_id')->nullable();
            
            // Transfer details
            $table->integer('transferred_days');
            $table->integer('from_remaining_days_before')->default(0);
            $table->integer('from_remaining_days_after')->default(0);
            $table->integer('to_remaining_days_before')->default(0);
            $table->integer('to_remaining_days_after')->default(0);
            
            // Plan information
            $table->unsignedBigInteger('plan_id')->nullable();
            $table->date('plan_start_date')->nullable();
            $table->date('plan_expire_date_before')->nullable();
            $table->date('plan_expire_date_after')->nullable();
            
            // Transfer metadata
            $table->text('notes')->nullable();
            $table->unsignedBigInteger('branch_id')->nullable();
            
            // Admin/User who performed the transfer
            $table->unsignedBigInteger('transferred_by')->nullable();
            
            // Foreign key constraints
            $table->foreign('from_user_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('to_user_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('from_profile_id')->references('id')->on('member_profiles')->onDelete('set null');
            $table->foreign('to_profile_id')->references('id')->on('member_profiles')->onDelete('set null');
            $table->foreign('plan_id')->references('id')->on('plans')->onDelete('set null');
            $table->foreign('transferred_by')->references('id')->on('users')->onDelete('set null');
            
            $table->timestamps();
            $table->softDeletes();
            
            // Indexes for better query performance
            $table->index(['from_user_id', 'created_at']);
            $table->index(['to_user_id', 'created_at']);
            $table->unsignedBigInteger('gym_id')->nullable();
            // $table->index('transfer_type');
            $table->index('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('membership_transfers');
    }
};