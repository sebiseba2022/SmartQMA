<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $isPgsql = DB::getDriverName() === 'pgsql';

        if ($isPgsql) {
            DB::statement('CREATE SEQUENCE IF NOT EXISTS component_idents_ident_seq START WITH 10002 INCREMENT BY 1');
        }

        Schema::create('component_idents', function (Blueprint $table) use ($isPgsql) {
            if ($isPgsql) {
                $table->unsignedBigInteger('ident')->primary()->default(DB::raw("nextval('component_idents_ident_seq')"));
            } else {
                $table->unsignedBigInteger('ident')->primary();
            }

            $table->string('part_name'); // Denumire componenta
            $table->string('manufacturer_part_number'); // Codul piesei de la producator
            $table->string('provider'); // Furnizor
            $table->string('package_type'); // Tipul de capsula: SMD, THT, Carcasa, PCB, Cositor, Stecker, sau introdus la Altele
            $table->string('manufacturer')->nullable(); // Producator
            $table->string('unit')->default('buc.'); // Unitate de masura
            $table->timestamps();

            $table->index('part_name');
            $table->index('manufacturer_part_number');
            $table->index('provider');
            $table->index('package_type');
        });

        $now = Carbon::now();

        $initialIdents = [
            [
                'ident' => 10002,
                'part_name' => 'ATmega328P (Microcontroler 8-bit AVR)',
                'manufacturer_part_number' => 'ATMEGA328P-PU',
                'provider' => 'Mouser Electronics',
                'package_type' => 'THT',
                'manufacturer' => 'Microchip Technology',
                'unit' => 'buc.',
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'ident' => 10003,
                'part_name' => 'ATmega16U2 (Controller USB-la-Serial)',
                'manufacturer_part_number' => 'ATMEGA16U2-MU',
                'provider' => 'Mouser Electronics',
                'package_type' => 'SMD',
                'manufacturer' => 'Microchip Technology',
                'unit' => 'buc.',
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'ident' => 10004,
                'part_name' => 'NCP1117ST50T3G (Regulator LDO 5.0V)',
                'manufacturer_part_number' => 'NCP1117ST50T3G',
                'provider' => 'DigiKey Electronics',
                'package_type' => 'SMD',
                'manufacturer' => 'onsemi',
                'unit' => 'buc.',
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'ident' => 10005,
                'part_name' => 'LP2985-33DBVR (Regulator LDO 3.3V)',
                'manufacturer_part_number' => 'LP2985-33DBVR',
                'provider' => 'DigiKey Electronics',
                'package_type' => 'SMD',
                'manufacturer' => 'Texas Instruments',
                'unit' => 'buc.',
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'ident' => 10006,
                'part_name' => 'LMV358IDGKR (Amplificator Operațional Dual)',
                'manufacturer_part_number' => 'LMV358IDGKR',
                'provider' => 'Farnell Element14',
                'package_type' => 'SMD',
                'manufacturer' => 'Texas Instruments',
                'unit' => 'buc.',
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'ident' => 10007,
                'part_name' => 'FDN340P (Tranzistor MOSFET Canal-P)',
                'manufacturer_part_number' => 'FDN340P',
                'provider' => 'Farnell Element14',
                'package_type' => 'SMD',
                'manufacturer' => 'onsemi',
                'unit' => 'buc.',
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'ident' => 10008,
                'part_name' => 'MF-MSMF050-2 (Siguranță Resetabilă PTC 500mA)',
                'manufacturer_part_number' => 'MF-MSMF050-2',
                'provider' => 'TME Electronic Components',
                'package_type' => 'SMD',
                'manufacturer' => 'Bourns',
                'unit' => 'buc.',
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'ident' => 10009,
                'part_name' => 'CSTCE16M0V53-R0 (Rezonator Ceramic 16 MHz)',
                'manufacturer_part_number' => 'CSTCE16M0V53-R0',
                'provider' => 'TME Electronic Components',
                'package_type' => 'SMD',
                'manufacturer' => 'Murata Electronics',
                'unit' => 'buc.',
                'created_at' => $now,
                'updated_at' => $now,
            ],
        ];

        DB::table('component_idents')->insert($initialIdents);

        if ($isPgsql) {
            DB::statement("SELECT setval('component_idents_ident_seq', (SELECT COALESCE(MAX(ident), 10009) FROM component_idents))");
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('component_idents');
        if (DB::getDriverName() === 'pgsql') {
            DB::statement('DROP SEQUENCE IF EXISTS component_idents_ident_seq');
        }
    }
};
