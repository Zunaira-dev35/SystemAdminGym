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
        Schema::table('freeze_requests', function (Blueprint $table) {
            //
            $table->date('must_complete_by_date')->nullable()->after('process_status');
            $table->boolean('is_first_freeze')->default(0)->after('must_complete_by_date');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('freeze_requests', function (Blueprint $table) {
            //
        });
    }
};
