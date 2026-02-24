<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('transactions', function (Blueprint $table) {
            $table->date('payment_date')->nullable()->after('date');
            $table->date('application_date')->nullable()->after('payment_date');
            $table->foreignId('advance_payment_id')->nullable()->after('payment_refund_id');
        });
    }

    public function down(): void
    {
        Schema::table('transactions', function (Blueprint $table) {
            $table->dropColumn(['payment_date', 'application_date', 'advance_payment_id']);
        });
    }
};