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
            ->assertJsonPath('tests_summary.aoi.pass_count', 1)
            ->assertJsonPath('tests_summary.aoi.fail_count', 1)
            ->assertJsonPath('tests_summary.ict.pass_count', 1)
            ->assertJsonPath('tests_summary.ict.fail_count', 1)
            ->assertJsonPath('tests_summary.eol.pass_count', 1)
            ->assertJsonPath('tests_summary.eol.fail_count', 0)
            ->assertJsonPath('product_info.product_ident', 'ARDUINO_UNO_R3')
            ->assertJsonPath('product_info.hardware_version', 'Rev 3.0')
            ->assertJsonPath('product_info.software_version', 'v1.1.2');

        $data = $response->json();

        $this->assertNotEmpty($data['bestuck_placements']);
        $u3 = collect($data['bestuck_placements'])->firstWhere('position', 'U3');
        $this->assertNotNull($u3);
        $this->assertTrue($u3['is_mounted']);
        $this->assertEquals(10003, $u3['component_internal_id']);
        $this->assertEquals('SMD', $u3['stage']);

        $u1 = collect($data['bestuck_placements'])->firstWhere('position', 'U1');
        $this->assertNotNull($u1);
        $this->assertTrue($u1['is_mounted']);
        $this->assertEquals(10002, $u1['component_internal_id']);
        $this->assertEquals('THT', $u1['stage']);

        $this->assertNotEmpty($data['component_registry']);
    }

    /**
     * Testeaza nomenclatorul de identuri (component_idents, ident > 10000) si comenzile in Magazie
     */
    public function test_inventory_contains_arduino_uno_orders_and_creates_new_order(): void
    {
        $identsResponse = $this->getJson('/api/v1/idents');
        $identsResponse->assertStatus(200)
            ->assertJsonPath('status', 'success')
            ->assertJsonCount(8, 'data')
            ->assertJsonPath('data.0.ident', 10002)
            ->assertJsonPath('data.0.package_type', 'THT')
            ->assertJsonPath('data.1.ident', 10003)
            ->assertJsonPath('data.1.package_type', 'SMD');

        $newIdentRes = $this->postJson('/api/v1/idents', [
            'part_name' => 'Conector Mamă 12 Pini',
            'manufacturer_part_number' => 'STE-12P-01',
            'provider' => 'Farnell Element14',
            'package_type' => 'Stecker',
            'manufacturer' => 'TE Connectivity',
        ]);
        $newIdentRes->assertStatus(201)
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('data.ident', 10010)
            ->assertJsonPath('data.package_type', 'Stecker');

        $listResponse = $this->getJson('/api/v1/inventory');
        $listResponse->assertStatus(200)
            ->assertJsonPath('status', 'success')
            ->assertJsonCount(8, 'data')
            ->assertJsonPath('data.0.ident', '10002')
            ->assertJsonPath('data.7.ident', '10009')
            ->assertJsonPath('data.7.arrived', false)
            ->assertJsonPath('data.7.arrival_time', null)
            ->assertJsonPath('data.7.tracking_number', null);

        // Testeaza paginarea progresiva (top 50 / scroll)
        $paginatedResponse = $this->getJson('/api/v1/inventory?limit=5&offset=0');
        $paginatedResponse->assertStatus(200)
            ->assertJsonPath('status', 'success')
            ->assertJsonCount(5, 'data')
            ->assertJsonPath('limit', 5)
            ->assertJsonPath('offset', 0)
            ->assertJsonPath('has_more', true);

        $nextPageResponse = $this->getJson('/api/v1/inventory?limit=5&offset=5');
        $nextPageResponse->assertStatus(200)
            ->assertJsonPath('status', 'success')
            ->assertJsonCount(3, 'data')
            ->assertJsonPath('has_more', false);

        $payload = [
            'ident' => '10002',
            'ordered_at' => '2026-02-20 10:30:00',
            'quantity' => 600,
        ];

        $response = $this->postJson('/api/v1/inventory', $payload);

        $response->assertStatus(201)
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('data.ident', '10002')
            ->assertJsonPath('data.quantity', 600)
            ->assertJsonPath('data.arrived', false)
            ->assertJsonPath('data.arrival_time', null)
            ->assertJsonPath('data.tracking_number', null)
            ->assertJsonPath('data.provider', 'Mouser Electronics');

        $id = $response->json('data.id');

        $patchResponse = $this->patchJson("/api/v1/inventory/{$id}/arrival", [
            'arrived' => true,
            'arrival_time' => '2026-02-22 14:00:00',
            'tracking_number' => 'DHL-775544332',
        ]);

        $patchResponse->assertStatus(200)
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('data.arrived', true)
            ->assertJsonPath('data.tracking_number', 'DHL-775544332');

        $deleteResponse = $this->deleteJson("/api/v1/inventory/{$id}");
        $deleteResponse->assertStatus(200)
            ->assertJsonPath('status', 'success');
    }

    /**
     * Testeaza montarea rolei pe alimentator (feeder) scanata o singura data
     */
    public function test_load_feeder_stores_reel_association(): void
    {
        $payload = [
            'station_id' => 'WS-SMD-04',
            'position' => 'U3',
            'component_internal_id' => 10003,
            'loaded_by' => 'operator',
        ];

        $response = $this->postJson('/api/v1/feeders/load', $payload);

        $response->assertStatus(200)
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('feeder.position', 'U3')
            ->assertJsonPath('feeder.component_internal_id', 10003);
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
