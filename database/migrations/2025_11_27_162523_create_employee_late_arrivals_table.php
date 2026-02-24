<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('employee_late_arrivals', function (Blueprint $table) {
            $table->id();
            
            // Employee reference
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            
            // Format: "2025-08" — represents the year and month
            $table->string('month'); // Better than string(7) — uses YEAR(4) + MONTH(2) type in MySQL
            
            // JSON structure:
            // {
            //   "2025-08-25": { "checkIn": 3, "checkOut": 4 },
            //   "2025-08-26": { "checkIn": 5 }
            // }
            // Values represent minutes late (or count of late events)
            $table->json('late_arrivals')->nullable();
                  
            $table->unique(['user_id', 'month']);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('employee_late_arrivals');
    }
};