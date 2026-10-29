<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class QrLaserMarking extends Model
{
    use HasFactory;

    protected $table = 'qr_laser_markings';

    protected $fillable = [
        'qr_serial_number',
        'product_model',
        'pcb_side',
        'laser_power_pct',
        'mark_duration_ms',
        'operator_username',
        'marked_at',
        'status',
        'notes',
    ];

    protected $casts = [
        'marked_at' => 'datetime',
        'laser_power_pct' => 'decimal:2',
        'mark_duration_ms' => 'integer',
    ];
}

