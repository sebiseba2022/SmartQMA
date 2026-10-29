<?php

namespace Tests\Unit;

use App\Models\ComponentIdent;
use PHPUnit\Framework\TestCase;

class ComponentIdentTest extends TestCase
{
    /**
     * Testeaza configurarea modelului ComponentIdent (primary key, fillables, casting)
     */
    public function test_component_ident_model_configuration(): void
    {
        $ident = new ComponentIdent();

        $this->assertEquals('component_idents', $ident->getTable());
        $this->assertEquals('ident', $ident->getKeyName());
        $this->assertFalse($ident->getIncrementing());
        $this->assertEquals('int', $ident->getKeyType());

        $expectedFillables = [
            'ident',
            'part_name',
            'manufacturer_part_number',
            'provider',
            'package_type',
            'manufacturer',
            'unit',
        ];

        $this->assertEquals($expectedFillables, $ident->getFillable());

        // Verificam ca footprint si datasheet_url NU sunt prezente
        $this->assertNotContains('footprint', $ident->getFillable());
        $this->assertNotContains('datasheet_url', $ident->getFillable());
    }
}

