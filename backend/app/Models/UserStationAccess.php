<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserStationAccess extends Model
{
    use HasFactory;

    protected $table = 'user_station_access';

    protected $fillable = [
        'user_id',
        'barcode',
        'station_id',
        'is_authorized',
    ];

    protected $casts = [
        'is_authorized' => 'boolean',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}

