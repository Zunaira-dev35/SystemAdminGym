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
        Schema::create('invoices', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('gym_id')->nullable();
            $table->foreign('gym_id')->references('id')->on('gyms')->onDelete('set null');
            $table->unsignedBigInteger('package_id')->nullable();
            $table->foreign('package_id')->references('id')->on('packages')->onDelete('set null');
            $table->date('package_start_date')->nullable();
            $table->date('package_renewal_date')->nullable();
            $table->double('sub_total')->nullable();
            $table->double('discount_percent')->nullable();
            $table->double('grand_total')->nullable();
            $table->mediumText('desctiption')->nullable();
            $table->string('reference_num', 255)->unique()->nullable();
            $table->date('date')->nullable();
            $table->time('time')->nullable();
            $table->enum('deposit_method',['cash','card'])->nullable();
            $table->enum('payment_status',['pending','paid'])->default('pending')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('invoices');
    }
};
