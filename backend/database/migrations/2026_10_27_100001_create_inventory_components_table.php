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
            DB::statement('CREATE SEQUENCE IF NOT EXISTS inventory_components_internal_id_seq START WITH 10002 INCREMENT BY 1');
        }

        Schema::create('inventory_components', function (Blueprint $table) use ($isPgsql) {
            $table->id();
            if ($isPgsql) {
                $table->unsignedBigInteger('internal_id')->unique()->default(DB::raw("nextval('inventory_components_internal_id_seq')"));
            } else {
                $table->unsignedBigInteger('internal_id')->unique()->nullable();
            }
            $table->string('ident')->default('10002'); // Identul componentei (ex: 10002 .. 10009)
            $table->string('part_name'); // Denumirea componentei (ex: "ATmega328P")
            $table->timestamp('ordered_at')->useCurrent(); // Cand s-a dat comanda
            $table->unsignedInteger('quantity')->default(0); // Cantitatea comandata
            $table->boolean('arrived')->default(false); // Daca a ajuns sau nu in depozit
            $table->timestamp('arrival_time')->nullable(); // Arrival time (cand a ajuns in depozit)
            $table->string('tracking_number')->nullable(); // Tracking number (AWB)
            $table->string('provider')->nullable(); // Provider (nume furnizor)

            // Campuri aditionale pentru trasabilitate loturi
            $table->string('supplier_lot')->nullable();
            $table->date('production_date')->nullable();
            $table->timestamp('entry_date')->nullable()->useCurrent();
            $table->string('reception_status')->default('conform');
            $table->text('reception_notes')->nullable();
            $table->string('received_by')->nullable();
            $table->timestamps();

            $table->index('internal_id');
            $table->index('ident');
            $table->index('part_name');
            $table->index('provider');
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
