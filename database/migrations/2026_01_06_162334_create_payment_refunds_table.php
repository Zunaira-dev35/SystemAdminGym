<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payment_refunds', function (Blueprint $table) {
            $table->id();
            $table->string('reference_num')->unique();
            $table->foreignId('fee_collection_id') ->nullable() ->constrained('fee_collections') ->nullOnDelete();
            $table->foreignId('user_id') ->nullable() ->constrained('users') ->nullOnDelete();
            $table->foreignId('plan_id') ->nullable() ->constrained('plans') ->nullOnDelete();
            $table->decimal('refund_amount', 10, 2);
            $table->decimal('original_amount', 10, 2);
            $table->enum('refund_method', ['cash', 'bank']);
            $table->text('notes')->nullable();
            $table->date('refund_date'); 
            $table->time('refund_time');
            $table->foreignId('created_by_id') ->nullable() ->constrained('users') ->nullOnDelete();
            $table->foreignId('branch_id') ->nullable() ->constrained('branches') ->nullOnDelete();
            $table->unsignedBigInteger('gym_id')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payment_refunds');
    }
};