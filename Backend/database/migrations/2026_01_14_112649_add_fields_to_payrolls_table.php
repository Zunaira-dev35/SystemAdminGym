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
        Schema::table('payrolls', function (Blueprint $table) {
            //
            $table->string('period_start')->nullable();
            $table->string('period_end')->nullable();
            $table->integer('period_days')->default(0);
            $table->integer('period_salary')->default(0);
            $table->json('shift_config')->nullable();
            $table->json('absent_details')->nullable();

        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('payrolls', function (Blueprint $table) {
            //
        });
    }
};
