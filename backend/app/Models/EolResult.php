<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EolResult extends Model
{
    use HasFactory;

    protected $table = 'eol_results';

    protected $fillable = [
        'station_id',
        'qr_serial_number',
        'product_ident',
        'hardware_version',
        'software_version',
        'test_result',
        'current_draw_ma',
        'functional_checks',
        'operator_username',
        'tested_at',
    ];

    protected $casts = [
        'current_draw_ma' => 'float',
        'functional_checks' => 'array',
        'tested_at' => 'datetime',
    ];
}
