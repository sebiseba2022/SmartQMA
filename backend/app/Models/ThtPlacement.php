<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ThtPlacement extends Model
{
    use HasFactory;

    protected $table = 'tht_placements';

    protected $fillable = [
        'station_id',
        'qr_serial_number',
        'bestuck_position',
        'component_internal_id',
        'operator_username',
        'mounted_at',
    ];

    protected $casts = [
        'component_internal_id' => 'integer',
        'mounted_at' => 'datetime',
    ];

    public function component(): BelongsTo
    {
        return $this->belongsTo(InventoryComponent::class, 'component_internal_id', 'internal_id');
    }
}
