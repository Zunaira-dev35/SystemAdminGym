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
        Schema::create('member_profiles', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id')->nullable();
            $table->foreign('user_id')->references('id')->on('users')->onDelete('set null');
            $table->mediumText('address')->nullable();
            $table->date('register_date')->nullable();
            $table->mediumText('cnic')->nullable();
            $table->string('whatsapp_num')->nullable();
            $table->unsignedBigInteger('current_plan_id')->nullable();
            $table->foreign('current_plan_id')->references('id')->on('plans')->onDelete('set null');
            $table->date('current_plan_start_date')->nullable();
            $table->date('current_plan_expire_date')->nullable();
            $table->longText('face_encoding')->nullable();
            $table->longText('fingerprint_encoding')->nullable();
            $table->integer('used_visit_days')->default(0);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
    */
    public function down(): void
    {
        Schema::dropIfExists('member_profiles');
    }
};
