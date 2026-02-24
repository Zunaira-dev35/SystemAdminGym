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
        Schema::table('payment_refunds', function (Blueprint $table) {
            //
            $table->boolean('is_advance_refund')
              ->default(false)
              ->after('notes');

            $table->unsignedBigInteger('advance_payment_id')
              ->nullable()
              ->after('is_advance_refund');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('payment_refunds', function (Blueprint $table) {
            //
            $table->dropColumn(['is_advance_refund', 'advance_payment_id']);
        });
    }
};
