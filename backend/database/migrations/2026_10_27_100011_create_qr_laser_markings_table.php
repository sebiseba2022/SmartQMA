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
        Schema::create('qr_laser_markings', function (Blueprint $table) {
            $table->id();
            $table->string('qr_serial_number', 12)->unique(); // Cod 12 cifre: YYMMDDxxxxxx
            $table->string('product_model')->default('ARDUINO_UNO_R3'); // Model PCB
            $table->string('pcb_side')->default('TOP'); // TOP / BOTTOM
            $table->decimal('laser_power_pct', 5, 2)->default(85.00); // Putere laser (%)
            $table->integer('mark_duration_ms')->default(420); // Durată marcare (ms)
            $table->string('operator_username')->nullable(); // Operator post laser
            $table->timestamp('marked_at')->useCurrent(); // Momentul marcării
            $table->string('status')->default('OK'); // OK, RESCANAT, EROARE
            $table->text('notes')->nullable(); // Note / detalii rescanare
            $table->timestamps();

            $table->index('qr_serial_number');
            $table->index('marked_at');
            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('qr_laser_markings');
    }
};

