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
        Schema::create('leaves', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id')->nullable();
            $table->foreign('user_id')->references('id')->on('users')->onDelete('set null');
            $table->date('start_date');
            $table->date('end_date');
            $table->string('leave_title')->nullable();
            $table->mediumText('apply_reason')->nullable();
            $table->mediumText('doc_url')->nullable();
            $table->enum('status', ['pending','on-hold','approved', 'rejected'])->default('pending');
            $table->mediumText('hold_reason')->nullable();
            $table->mediumText('reject_reason')->nullable();
            $table->enum('leave_mode',['single','multiple'])->nullable();
            $table->unsignedBigInteger('verify_by')->nullable();
            $table->foreign('verify_by')->references('id')->on('users')->onDelete('set null');
            $table->timestamp('verify_at')->nullable();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('gym_id')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('leaves');
    }
};
