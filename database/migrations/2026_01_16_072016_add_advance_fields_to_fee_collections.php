<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('fee_collections', function (Blueprint $table) {
            $table->boolean('is_advance')->default(false)->after('is_refund');
            $table->string('status')->default('active')->after('is_advance'); // active, pending, applied
            $table->foreignId('advance_payment_id')->nullable()->after('status');
        });
    }

    public function down(): void
    {
        Schema::table('fee_collections', function (Blueprint $table) {
            $table->dropColumn(['is_advance', 'status', 'advance_payment_id']);
        });
    }
};