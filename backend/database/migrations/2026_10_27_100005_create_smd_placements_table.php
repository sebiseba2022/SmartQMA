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
        Schema::create('smd_placements', function (Blueprint $table) {
            $table->id();
            $table->string('station_id')->default('WS-SMD-04'); // Postul SMD
            $table->string('qr_serial_number'); // Serial number PCB scanat cu QR
            $table->string('bestuck_position'); // Pozitia amplasata pe Bestuck (ex: "R1", "C1", "U1")
            $table->unsignedBigInteger('component_internal_id'); // Identul rolei din magazie (> 10000)
            $table->string('operator_username')->nullable(); // Operatorul liniei SMD
            $table->timestamp('mounted_at')->useCurrent(); // Momentul amplasarii
            $table->timestamps();

            $table->foreign('component_internal_id')->references('internal_id')->on('inventory_components')->cascadeOnDelete();
            $table->index('qr_serial_number');
            $table->index('component_internal_id');
            $table->index('bestuck_position');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('smd_placements');
    }
};
