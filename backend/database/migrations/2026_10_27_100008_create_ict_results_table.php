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
        Schema::create('ict_results', function (Blueprint $table) {
            $table->id();
            $table->string('station_id')->default('WS-ICT-07'); // Postul ICT
            $table->string('qr_serial_number'); // Serial number PCB scanat cu QR
            $table->string('test_result'); // 'PASS' sau 'FAIL'
            $table->json('measured_values')->nullable(); // Valori electrice masurate la patul de ace (rezistente, condensatori)
            $table->text('failed_nets')->nullable(); // Trasee / net-uri esuate (ex: "NET_RESET, D13")
            $table->string('operator_username')->nullable(); // Operator ICT
            $table->timestamp('tested_at')->useCurrent(); // Momentul testarii
            $table->timestamps();

            $table->index('qr_serial_number');
            $table->index('test_result');
            $table->index('station_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ict_results');
    }
};
