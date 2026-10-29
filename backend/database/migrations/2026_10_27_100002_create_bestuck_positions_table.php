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
        Schema::create('bestuck_positions', function (Blueprint $table) {
            $table->id();
            $table->string('product_model'); // Model produs (ex: "ARDUINO_UNO_R3")
            $table->string('position'); // Pozitie pe Bestuck (ex: "R1", "C1", "U1", "J1")
            $table->string('expected_part'); // Denumirea piesei asteptate (ex: "Rezistenta 10k 0805")
            $table->timestamps();

            $table->unique(['product_model', 'position']);
            $table->index('product_model');
            $table->index('position');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('bestuck_positions');
    }
};
