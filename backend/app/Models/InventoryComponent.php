<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

class InventoryComponent extends Model
{
    use HasFactory;

    protected $table = 'inventory_components';

    protected $fillable = [
        'internal_id',
        'ident',
        'part_name',
        'ordered_at',
        'quantity',
        'arrived',
        'arrival_time',
        'tracking_number',
        'provider',
        'supplier_lot',
        'production_date',
        'entry_date',
        'reception_status',
        'reception_notes',
        'received_by',
    ];

    protected $casts = [
        'internal_id' => 'integer',
        'ordered_at' => 'datetime',
        'quantity' => 'integer',
        'arrived' => 'boolean',
        'arrival_time' => 'datetime',
        'production_date' => 'date',
        'entry_date' => 'datetime',
    ];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($model) {
            if (empty($model->internal_id)) {
                $max = static::max('internal_id');
                $model->internal_id = ($max && $max >= 10001) ? $max + 1 : 10002;
            }
            if (empty($model->ident)) {
                $model->ident = (string) $model->internal_id;
            }
            if (empty($model->ordered_at)) {
                $model->ordered_at = Carbon::now();
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
