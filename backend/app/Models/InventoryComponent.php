<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class InventoryComponent extends Model
{
    use HasFactory;

    protected $table = 'inventory_components';

    protected $fillable = [
        'internal_id',
        'part_name',
        'supplier_lot',
        'production_date',
        'entry_date',
        'reception_status',
        'reception_notes',
        'quantity',
        'received_by',
    ];

    protected $casts = [
        'internal_id' => 'integer',
        'production_date' => 'date',
        'entry_date' => 'datetime',
        'quantity' => 'integer',
    ];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($model) {
            if (empty($model->internal_id)) {
                $max = static::max('internal_id');
                $model->internal_id = ($max && $max >= 10000) ? $max + 1 : 10001;
            }
        });
    }

    public function smdPlacements(): HasMany
    {
        return $this->hasMany(SmdPlacement::class, 'component_internal_id', 'internal_id');
    }

    public function thtPlacements(): HasMany
    {
        return $this->hasMany(ThtPlacement::class, 'component_internal_id', 'internal_id');
    }

    public function stationFeeders(): HasMany
    {
        return $this->hasMany(StationFeeder::class, 'component_internal_id', 'internal_id');
    }
}
