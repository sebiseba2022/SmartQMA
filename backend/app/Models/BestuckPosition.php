<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BestuckPosition extends Model
{
    use HasFactory;

    protected $table = 'bestuck_positions';

    protected $fillable = [
        'product_model',
        'position',
        'expected_part',
    ];
}
