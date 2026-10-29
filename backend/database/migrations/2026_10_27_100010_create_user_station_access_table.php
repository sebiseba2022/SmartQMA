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
        if (DB::getDriverName() === 'pgsql') {
            DB::statement('ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check');
        }

        Schema::table('users', function (Blueprint $table) {
            if (!Schema::hasColumn('users', 'barcode')) {
                $table->string('barcode')->nullable()->unique()->after('role');
            }
        });

        Schema::create('user_station_access', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->string('barcode');
            $table->string('station_id'); // qr-laser, smd, aoi, tht, ict, eol, export, etc.
            $table->boolean('is_authorized')->default(true);
            $table->timestamps();

            $table->unique(['user_id', 'station_id']);
            $table->index('barcode');
            $table->index('station_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('user_station_access');

        Schema::table('users', function (Blueprint $table) {
            if (Schema::hasColumn('users', 'barcode')) {
                $table->dropColumn('barcode');
            }
        });
    }
};
