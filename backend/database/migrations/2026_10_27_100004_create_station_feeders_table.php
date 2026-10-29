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
        Schema::create('station_feeders', function (Blueprint $table) {
            $table->id();
            $table->string('station_id'); // Identificatorul postului (ex: "WS-SMD-04", "WS-THT-06")
            $table->string('position'); // Pozitia / Slotul de alimentare asociat (ex: "R1", "C1", "U1")
            $table->unsignedBigInteger('component_internal_id'); // Identificatorul unic intern al rolei (> 10000 din magazie)
            $table->string('loaded_by')->nullable(); // Operatorul care a montat rola
            $table->timestamp('loaded_at')->useCurrent(); // Momentul scanarii rolei
            $table->timestamps();

            $table->foreign('component_internal_id')->references('internal_id')->on('inventory_components')->cascadeOnDelete();
            $table->unique(['station_id', 'position']);
            $table->index('station_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('station_feeders');
    }
};
