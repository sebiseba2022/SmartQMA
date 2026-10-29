<?php

namespace Tests\Feature;

use App\Models\QrLaserMarking;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Tests\TestCase;

class QrLaserApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed();
    }
    public function test_get_laser_markings_returns_list(): void
    {
        $response = $this->getJson('/api/v1/laser/markings');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'status',
                'data',
                'total',
            ]);
    }

    public function test_next_laser_serial_formats_12_digits_yymmddxxxxxx(): void
    {
        $response = $this->getJson('/api/v1/laser/next-serial?date=2026-09-02');

        $response->assertStatus(200)
            ->assertJson([
                'status' => 'success',
                'prefix' => '260902',
            ]);

        $nextSerial = $response->json('next_serial');
        $this->assertEquals(12, strlen($nextSerial));
        $this->assertStringStartsWith('260902', $nextSerial);
    }

    public function test_manual_mark_rejects_non_12_digit_serials(): void
    {
        // 11 cifre (prea scurt)
        $resp1 = $this->postJson('/api/v1/laser/mark', [
            'qr_serial_number' => '26090200001',
        ]);
        $resp1->assertStatus(422);

        // 13 cifre (prea lung)
        $resp2 = $this->postJson('/api/v1/laser/mark', [
            'qr_serial_number' => '2609020000001',
        ]);
        $resp2->assertStatus(422);

        // conține caractere non-numerice
        $resp3 = $this->postJson('/api/v1/laser/mark', [
            'qr_serial_number' => '26090200000A',
        ]);
        $resp3->assertStatus(422);
    }

    public function test_manual_mark_accepts_valid_12_digits(): void
    {
        $serial = '261231999999';
        QrLaserMarking::where('qr_serial_number', $serial)->delete();

        $response = $this->postJson('/api/v1/laser/mark', [
            'qr_serial_number' => $serial,
            'product_model' => 'ARDUINO_UNO_R3',
            'pcb_side' => 'TOP',
            'notes' => 'Test unitar marcare',
        ]);

        $response->assertStatus(201)
            ->assertJson([
                'status' => 'success',
                'data' => [
                    'qr_serial_number' => $serial,
                    'status' => 'OK',
                ],
            ]);

        // Verificăm persistența în DB
        $this->assertDatabaseHas('qr_laser_markings', [
            'qr_serial_number' => $serial,
        ]);
    }

    public function test_rescan_laser_pcb_updates_status(): void
    {
        $serial = '261231888888';
        QrLaserMarking::updateOrCreate(
            ['qr_serial_number' => $serial],
            [
                'product_model' => 'ARDUINO_UNO_R3',
                'pcb_side' => 'TOP',
                'status' => 'OK',
            ]
        );

        $response = $this->postJson('/api/v1/laser/rescan', [
            'qr_serial_number' => $serial,
            'operator_username' => 'operator_test',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'status' => 'success',
                'data' => [
                    'qr_serial_number' => $serial,
                    'status' => 'RESCANAT',
                ],
            ]);
    }
}
