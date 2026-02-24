<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('advance_payments', function (Blueprint $table) {
            $table->id();
            $table->string('reference_num')->unique();
            $table->foreignId('user_id')->constrained('users');
            $table->foreignId('plan_id')->constrained('plans');
            $table->decimal('amount', 10, 2);
            $table->string('deposit_method'); // cash, bank
            $table->foreignId('bank_id')->nullable()->constrained('banks');
            $table->string('payment_date');
            $table->time('payment_time');
            $table->foreignId('created_by_id')->constrained('users');
            $table->foreignId('branch_id')->constrained('branches');
            $table->text('notes')->nullable();
            $table->enum('status', ['pending', 'applied', 'cancelled'])->default('pending');
            $table->boolean('is_auto_renew')->default(true);
            $table->foreignId('fee_collection_id')->nullable();
            $table->unsignedBigInteger('gym_id')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('advance_payments');
    }
};