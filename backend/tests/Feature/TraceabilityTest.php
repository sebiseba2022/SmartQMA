<?php

namespace Tests\Feature;

use Tests\TestCase;

class TraceabilityTest extends TestCase
{
    use \Illuminate\Foundation\Testing\RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed();
    }

    /**
     * Testeaza scanarea codului QR pentru trasabilitate completa PCB
     */
    public function test_scan_qr_returns_test_counts_and_bestuck_placements(): void
    {
        $response = $this->getJson('/api/v1/traceability/scan/ARD-UNO-2026-0001');

        $response->assertStatus(200)
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('qr_serial_number', 'ARD-UNO-2026-0001')
            // Teste AOI
            ->assertJsonPath('tests_summary.aoi.pass_count', 1)
            ->assertJsonPath('tests_summary.aoi.fail_count', 1)
            // Teste ICT
            ->assertJsonPath('tests_summary.ict.pass_count', 1)
            ->assertJsonPath('tests_summary.ict.fail_count', 1)
            // Teste EOL
            ->assertJsonPath('tests_summary.eol.pass_count', 1)
            ->assertJsonPath('tests_summary.eol.fail_count', 0)
            // HW si SW version determinate din identul final la EOL
            ->assertJsonPath('product_info.product_ident', 'ARDUINO_UNO_R3')
            ->assertJsonPath('product_info.hardware_version', 'Rev 3.0')
            ->assertJsonPath('product_info.software_version', 'v1.1.2');

        $data = $response->json();

        // Verificam ca Bestuck contine pozitiile oficiale
        $this->assertNotEmpty($data['bestuck_placements']);
        $u1 = collect($data['bestuck_placements'])->firstWhere('position', 'U1');
        $this->assertNotNull($u1);
        $this->assertTrue($u1['is_mounted']);
        $this->assertEquals(10007, $u1['component_internal_id']);
        $this->assertEquals('SMD', $u1['stage']);

        // Verificam pozitie THT X1 (DC Jack)
        $x1 = collect($data['bestuck_placements'])->firstWhere('position', 'X1');
        $this->assertNotNull($x1);
        $this->assertTrue($x1['is_mounted']);
        $this->assertEquals(10001, $x1['component_internal_id']);
        $this->assertEquals('THT', $x1['stage']);

        // Verificam registrul de componente
        $this->assertNotEmpty($data['component_registry']);
    }

    /**
     * Testeaza adaugarea unui lot in magazie cu internal_id > 10000 generat automat
     */
    public function test_inventory_reception_auto_assigns_internal_id_above_10000(): void
    {
        $payload = [
            'part_name' => 'Oscilator Quartz 16MHz SMD',
            'supplier_lot' => 'LOT-ABR-2026Z',
            'production_date' => '2026-02-20',
            'reception_status' => 'conform',
            'reception_notes' => 'Rola test 16MHz verificata',
            'quantity' => 2000,
            'received_by' => 'operator',
        ];

        $response = $this->postJson('/api/v1/inventory', $payload);

        $response->assertStatus(201)
            ->assertJsonPath('status', 'success');

        $internalId = $response->json('data.internal_id');
        $this->assertGreaterThan(10000, $internalId);
    }

    /**
     * Testeaza montarea rolei pe alimentator (feeder) scanata o singura data
     */
    public function test_load_feeder_stores_reel_association(): void
    {
        $payload = [
            'station_id' => 'WS-SMD-04',
            'position' => 'R3',
            'component_internal_id' => 10001,
            'loaded_by' => 'operator',
        ];

        $response = $this->postJson('/api/v1/feeders/load', $payload);

        $response->assertStatus(200)
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('feeder.position', 'R3')
            ->assertJsonPath('feeder.component_internal_id', 10001);
    }

    /**
     * Testeaza inregistrarea testului EOL cu rezolvare automata a HW si SW version
     */
    public function test_record_eol_test_automatically_resolves_hw_and_sw_version(): void
    {
        $payload = [
            'station_id' => 'WS-EOL-08',
            'qr_serial_number' => 'ARD-UNO-2026-0099',
            'product_ident' => 'ARDUINO_UNO_R3',
            'test_result' => 'PASS',
            'current_draw_ma' => 46.50,
            'functional_checks' => ['led_blink' => true, 'usb' => true],
            'operator_username' => 'operator',
        ];

        $response = $this->postJson('/api/v1/tests/eol', $payload);

        $response->assertStatus(201)
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('test.hardware_version', 'Rev 3.0')
            ->assertJsonPath('test.software_version', 'v1.1.2')
            ->assertJsonPath('test.test_result', 'PASS');
    }
}
