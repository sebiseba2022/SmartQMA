<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class IctResult extends Model
{
    use HasFactory;

    protected $table = 'ict_results';

    protected $fillable = [
        'station_id',
        'qr_serial_number',
        'test_result',
        'measured_values',
        'failed_nets',
        'operator_username',
        'tested_at',
    ];

    protected $casts = [
        'measured_values' => 'array',
        'tested_at' => 'datetime',
    ];
}
