<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AoiResult extends Model
{
    use HasFactory;

    protected $table = 'aoi_results';

    protected $fillable = [
        'station_id',
        'qr_serial_number',
        'test_result',
        'defect_code',
        'details',
        'operator_username',
        'tested_at',
    ];

    protected $casts = [
        'tested_at' => 'datetime',
    ];
}
