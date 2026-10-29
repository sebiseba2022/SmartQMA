<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StationFeeder extends Model
{
    use HasFactory;

    protected $table = 'station_feeders';

    protected $fillable = [
        'station_id',
        'position',
        'component_internal_id',
        'loaded_by',
        'loaded_at',
    ];

    protected $casts = [
        'component_internal_id' => 'integer',
        'loaded_at' => 'datetime',
    ];

    public function component(): BelongsTo
    {
        return $this->belongsTo(InventoryComponent::class, 'component_internal_id', 'internal_id');
    }
}
