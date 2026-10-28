<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
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
            DB::statement('CREATE SEQUENCE IF NOT EXISTS inventory_components_internal_id_seq START WITH 10001 INCREMENT BY 1');
        }

        Schema::create('inventory_components', function (Blueprint $table) use ($isPgsql) {
            $table->id();
            if ($isPgsql) {
                $table->unsignedBigInteger('internal_id')->unique()->default(DB::raw("nextval('inventory_components_internal_id_seq')"));
            } else {
                $table->unsignedBigInteger('internal_id')->unique()->nullable();
            }
            $table->string('part_name'); // Denumirea piesei (ex: "Rezistenta 10k 0805", "ATmega328P-AU")
            $table->string('supplier_lot'); // Lotul furnizorului inscris pe rola/punga
            $table->date('production_date')->nullable(); // Data fabricatiei componentei
            $table->timestamp('entry_date')->useCurrent(); // Data intrarii in magazie
            $table->string('reception_status')->default('conform'); // conform / neconform / in_asteptare
            $table->text('reception_notes')->nullable(); // Observatii receptie marfa
            $table->unsignedInteger('quantity')->default(0); // Cantitate piese primite
            $table->string('received_by')->nullable(); // Operator receptie
            $table->timestamps();

            $table->index('internal_id');
            $table->index('part_name');
            $table->index('supplier_lot');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('inventory_components');
        if (DB::getDriverName() === 'pgsql') {
            DB::statement('DROP SEQUENCE IF EXISTS inventory_components_internal_id_seq');
        }
    }
};
