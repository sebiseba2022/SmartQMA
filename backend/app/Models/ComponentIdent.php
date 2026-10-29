<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ComponentIdent extends Model
{
    use HasFactory;

    protected $table = 'component_idents';

    protected $primaryKey = 'ident';

    public $incrementing = false;

    protected $keyType = 'int';

    protected $fillable = [
        'ident',
        'part_name',
        'manufacturer_part_number',
        'provider',
        'package_type',
        'manufacturer',
        'unit',
    ];

    protected $casts = [
        'ident' => 'integer',
    ];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($model) {
            if (empty($model->ident)) {
                $max = static::max('ident');
                $model->ident = ($max && $max >= 10001) ? $max + 1 : 10002;
            }
        });
    }
}
