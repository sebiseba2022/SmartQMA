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
        Schema::create('aoi_results', function (Blueprint $table) {
            $table->id();
            $table->string('station_id')->default('WS-AOI-05'); // Postul AOI (in loc de inspection_uid)
            $table->string('qr_serial_number'); // Serial number PCB scanat cu QR
            $table->string('test_result'); // 'PASS' sau 'FAIL'
            $table->string('defect_code')->nullable(); // Cod defect daca testul a picat (ex: 'BRIDGE_U1', 'MISSING_R1')
            $table->text('details')->nullable(); // Detalii optice / observatii camera
            $table->string('operator_username')->nullable(); // Operator AOI
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
        Schema::dropIfExists('aoi_results');
    }
};
