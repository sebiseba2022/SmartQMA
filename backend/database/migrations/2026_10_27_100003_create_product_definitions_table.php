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
        Schema::create('product_definitions', function (Blueprint $table) {
            $table->id();
            $table->string('product_ident')->unique(); // Identificator final produs (ex: "ARDUINO_UNO_R3")
            $table->string('product_name'); // Nume comercial (ex: "Arduino Uno R3 Compatible Board")
            $table->string('hardware_version'); // Versiune hardware asociata identului (ex: "Rev 3.0")
            $table->string('software_version'); // Versiune software/firmware asociata identului (ex: "v1.1.2")
            $table->timestamps();

            $table->index('product_ident');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('product_definitions');
    }
};
