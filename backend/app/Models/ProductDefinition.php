<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ProductDefinition extends Model
{
    use HasFactory;

    protected $table = 'product_definitions';

    protected $fillable = [
        'product_ident',
        'product_name',
        'hardware_version',
        'software_version',
    ];
}
