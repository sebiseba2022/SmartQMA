<?php

namespace Tests\Feature;

use App\Models\User;
use Database\Seeders\ProductionFlowSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class FlowGeneratorApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(ProductionFlowSeeder::class);
    }

    public function test_can_get_generator_config(): void
    {
        $response = $this->getJson('/api/v1/generator/config');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'status',
                'data' => [
                    'enabled',
                    'qr_cycle_seconds',
                    'smd_cycle_seconds',
                    'aoi_cycle_seconds',
                    'tht_cycle_seconds',
                    'ict_cycle_seconds',
                    'eol_cycle_seconds',
                    'smd_defect_aoi_pct',
                    'smd_defect_ict_pct',
                    'smd_defect_eol_pct',
                    'tht_defect_ict_pct',
                    'tht_defect_eol_pct',
                    'carrier_min_capacity',
                    'carrier_max_capacity',
                ],
                'default',
            ]);

        $data = $response->json('data');
        $this->assertEquals(15, $data['qr_cycle_seconds']);
        $this->assertEquals(10, $data['smd_cycle_seconds']);
        $this->assertEquals(1.0, $data['smd_defect_aoi_pct']);
        $this->assertEquals(0.7, $data['smd_defect_ict_pct']);
        $this->assertEquals(0.3, $data['smd_defect_eol_pct']);
        $this->assertEquals(1.0, $data['tht_defect_ict_pct']);
        $this->assertEquals(0.5, $data['tht_defect_eol_pct']);
    }

    public function test_can_save_and_reset_generator_config(): void
    {
        $payload = [
            'qr_cycle_seconds' => 12,
            'smd_cycle_seconds' => 8,
            'smd_defect_aoi_pct' => 1.5,
            'carrier_default_capacity' => 45,
        ];

        $saveRes = $this->postJson('/api/v1/generator/config', $payload);
        $saveRes->assertStatus(200)
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('data.qr_cycle_seconds', 12)
            ->assertJsonPath('data.smd_cycle_seconds', 8)
            ->assertJsonPath('data.carrier_default_capacity', 45);
        $this->assertEquals(1.5, $saveRes->json('data.smd_defect_aoi_pct'));

        // Reset
        $resetRes = $this->postJson('/api/v1/generator/reset-config');
        $resetRes->assertStatus(200)
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('data.qr_cycle_seconds', 15);
        $this->assertEquals(1.0, $resetRes->json('data.smd_defect_aoi_pct'));
    }

    public function test_can_trigger_warehouse_and_qc_check(): void
    {
        $response = $this->postJson('/api/v1/generator/check-warehouse');
        $response->assertStatus(200)
            ->assertJsonPath('status', 'success');
    }

    public function test_can_generate_batch_of_boards(): void
    {
        $response = $this->postJson('/api/v1/generator/generate-batch', [
            'count' => 10,
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('status', 'success')
            ->assertJsonStructure([
                'status',
                'message',
                'stats' => [
                    'total_boards',
                    'qr_laser',
                    'smd',
                    'aoi',
                    'carrier_batches',
                    'tht',
                    'ict',
                    'eol',
                    'final_good',
                    'final_scrap',
                    'yield_pct',
                ],
                'logs',
                'generated_serials_count',
                'first_serial',
                'last_serial',
            ]);

        $firstSerial = $response->json('first_serial');
        $this->assertNotNull($firstSerial);
        $this->assertEquals(12, strlen($firstSerial), "Numărul de serie generat trebuie să aibă exact 12 caractere");
        $this->assertMatchesRegularExpression('/^\d{12}$/', $firstSerial, "Seria trebuie să fie compusă strict din 12 cifre");
    }

    public function test_can_get_aggregated_flow_stats(): void
    {
        $response = $this->getJson('/api/v1/generator/stats');
        $response->assertStatus(200)
            ->assertJsonStructure([
                'status',
                'data' => [
                    'qr_total',
                    'smd_boards_total',
                    'aoi',
                    'tht_boards_total',
                    'ict',
                    'eol',
                    'final_good',
                    'final_scrap',
                    'yield_pct',
                ],
            ]);
    }
}
