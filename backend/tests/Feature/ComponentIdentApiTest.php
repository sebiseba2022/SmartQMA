<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ComponentIdentApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed();
    }

    /**
     * Testeaza lista initiala de identuri din nomenclator (create prin migrare / seeder)
     */
    public function test_nomenclator_contains_initial_eight_idents(): void
    {
        $response = $this->getJson('/api/v1/idents');

        $response->assertStatus(200)
            ->assertJsonPath('status', 'success')
            ->assertJsonCount(8, 'data')
            ->assertJsonPath('data.0.ident', 10002)
            ->assertJsonPath('data.0.package_type', 'THT')
            ->assertJsonPath('data.0.part_name', 'ATmega328P (Microcontroler 8-bit AVR)')
            ->assertJsonPath('data.1.ident', 10003)
            ->assertJsonPath('data.1.package_type', 'SMD');

        // Fiecare ident trebuie sa aiba internal_id = ident > 10000
        $data = $response->json('data');
        foreach ($data as $item) {
            $this->assertGreaterThan(10000, $item['ident']);
            $this->assertNotEmpty($item['part_name']);
            $this->assertNotEmpty($item['manufacturer_part_number']);
            $this->assertNotEmpty($item['provider']);
            $this->assertNotEmpty($item['package_type']);
        }
    }

    /**
     * Testeaza inregistrarea unui ident nou cu tip de capsula standard (SMD / THT)
     */
    public function test_create_ident_with_standard_package_type(): void
    {
        $payload = [
            'part_name' => 'Conector USB Type-C Reversibil',
            'manufacturer_part_number' => 'USB-C-31-M-12',
            'provider' => 'Mouser Electronics',
            'package_type' => 'SMD',
            'manufacturer' => 'Amphenol',
            'unit' => 'buc.',
        ];

        $response = $this->postJson('/api/v1/idents', $payload);

        $response->assertStatus(201)
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('data.part_name', 'Conector USB Type-C Reversibil')
            ->assertJsonPath('data.manufacturer_part_number', 'USB-C-31-M-12')
            ->assertJsonPath('data.package_type', 'SMD')
            ->assertJsonPath('data.unit', 'buc.');

        $newIdent = $response->json('data.ident');
        $this->assertGreaterThanOrEqual(10010, $newIdent);
    }

    /**
     * Testeaza inregistrarea unui ident nou cu tip de capsula custom (introdus la optiunea Altele)
     */
    public function test_create_ident_with_custom_package_type(): void
    {
        $payload = [
            'part_name' => 'Carcasă Metalică Ecranare RF',
            'manufacturer_part_number' => 'SHLD-RF-04',
            'provider' => 'Farnell Element14',
            'package_type' => 'Carcasă Aluminiu Turnat',
            'manufacturer' => 'Laird Technologies',
            'unit' => 'buc.',
        ];

        $response = $this->postJson('/api/v1/idents', $payload);

        $response->assertStatus(201)
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('data.part_name', 'Carcasă Metalică Ecranare RF')
            ->assertJsonPath('data.package_type', 'Carcasă Aluminiu Turnat');
    }

    /**
     * Testeaza validarea campurilor obligatorii la crearea unui ident nou
     */
    public function test_create_ident_validation_fails_when_fields_missing(): void
    {
        $response = $this->postJson('/api/v1/idents', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['part_name', 'manufacturer_part_number', 'provider', 'package_type']);
    }
}

