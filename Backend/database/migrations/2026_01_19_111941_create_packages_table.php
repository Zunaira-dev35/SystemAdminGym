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
        Schema::create('packages', function (Blueprint $table) {
            $table->id();
            $table->string('name')->nullable();
            $table->mediumText('description')->nullable();
            $table->integer('branch_limit')->nullable();
            $table->integer('user_limit')->nullable();
            $table->integer('member_limit')->nullable();
            $table->integer('employee_limit')->nullable();
            $table->string('duration')->nullable();
            $table->double('price')->nullable();
            $table->enum('status',['active','inactive'])->nullable();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->foreign('created_by')->references('id')->on('users')->onDelete('set null');
            $table->boolean('is_app_avail')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('packages');
    }
};
