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
        Schema::create('eol_results', function (Blueprint $table) {
            $table->id();
            $table->string('station_id')->default('WS-EOL-08'); // Postul EOL
            $table->string('qr_serial_number'); // Serial number PCB scanat cu QR
            $table->string('product_ident'); // Identificator final produs (ex: "ARDUINO_UNO_R3")
            $table->string('hardware_version'); // Versiune HW determinata in functie de ident final
            $table->string('software_version'); // Versiune SW/firmware determinata in functie de ident final
            $table->string('test_result'); // 'PASS' sau 'FAIL'
            $table->decimal('current_draw_ma', 8, 2)->nullable(); // Consum curent in functionare (mA)
            $table->json('functional_checks')->nullable(); // Teste functionale (USB, GPIO, comunicatie, etc.)
            $table->string('operator_username')->nullable(); // Operator EOL
            $table->timestamp('tested_at')->useCurrent(); // Momentul testarii EOL
            $table->timestamps();

            $table->index('qr_serial_number');
            $table->index('test_result');
            $table->index('product_ident');
            $table->index('station_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('eol_results');
    }
};
