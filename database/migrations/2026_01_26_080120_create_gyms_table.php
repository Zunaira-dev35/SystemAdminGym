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
        Schema::create('gyms', function (Blueprint $table) {
            $table->id();
            $table->string('company_name')->nullable();
            $table->string('company_email')->nullable();
            $table->string('company_phone')->nullable();
            $table->string('company_address')->nullable();
            $table->string('password')->nullable();
            $table->unsignedBigInteger('package_id')->nullable();
            $table->foreign('package_id')->references('id')->on('packages')->onDelete('set null');
            $table->integer('branch_limit')->nullable();
            $table->integer('user_limit')->nullable();
            $table->integer('member_limit')->nullable();
            $table->integer('employee_limit')->nullable();
            $table->string('duration')->nullable();
            $table->double('price')->nullable();
            $table->date('package_start_date')->nullable();
            $table->date('package_renewal_date')->nullable();
            $table->enum('status',['active','inactive'])->nullable();
            $table->string('reference_num', 255)->unique()->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('gyms');
    }
};
