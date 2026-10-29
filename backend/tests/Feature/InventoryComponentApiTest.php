<?php

namespace Tests\Feature;

use App\Models\InventoryComponent;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class InventoryComponentApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed();
    }

    /**
     * Testeaza paginarea progresiva cu limit si offset (top 50, scroll)
     */
    public function test_inventory_pagination_limit_and_offset(): void
    {
        // Pagina 1: primii 3 din 8
        $resPage1 = $this->getJson('/api/v1/inventory?limit=3&offset=0');
        $resPage1->assertStatus(200)
            ->assertJsonPath('status', 'success')
            ->assertJsonCount(3, 'data')
            ->assertJsonPath('limit', 3)
            ->assertJsonPath('offset', 0)
            ->assertJsonPath('total', 8)
            ->assertJsonPath('has_more', true);

        // Pagina 2: urmatorii 3 (offset=3)
        $resPage2 = $this->getJson('/api/v1/inventory?limit=3&offset=3');
        $resPage2->assertStatus(200)
            ->assertJsonPath('status', 'success')
            ->assertJsonCount(3, 'data')
            ->assertJsonPath('limit', 3)
            ->assertJsonPath('offset', 3)
            ->assertJsonPath('has_more', true);

        // Pagina 3: ultimele 2 inregistrari (offset=6)
        $resPage3 = $this->getJson('/api/v1/inventory?limit=3&offset=6');
        $resPage3->assertStatus(200)
            ->assertJsonPath('status', 'success')
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('limit', 3)
            ->assertJsonPath('offset', 6)
            ->assertJsonPath('has_more', false);
    }

    /**
     * Testeaza cautarea cu wildcard de tip prefix (10002%%)
     */
    public function test_inventory_wildcard_prefix_search(): void
    {
        $url = '/api/v1/inventory?' . http_build_query(['ident' => '10002%%']);
        $response = $this->getJson($url);

        $response->assertStatus(200)
            ->assertJsonPath('status', 'success');

        $data = $response->json('data');
        $this->assertNotEmpty($data);
        foreach ($data as $item) {
            $this->assertStringStartsWith('10002', (string) $item['ident']);
        }
    }

    /**
     * Testeaza cautarea cu wildcard de tip sufix (%%003)
     */
    public function test_inventory_wildcard_suffix_search(): void
    {
        $url = '/api/v1/inventory?' . http_build_query(['ident' => '%%003']);
        $response = $this->getJson($url);

        $response->assertStatus(200)
            ->assertJsonPath('status', 'success');

        $data = $response->json('data');
        $this->assertNotEmpty($data);
        foreach ($data as $item) {
            $this->assertStringEndsWith('003', (string) $item['ident']);
        }
    }

    /**
     * Testeaza cautarea cu wildcard de tip continut / infix (%%Regulator%%)
     */
    public function test_inventory_wildcard_infix_search(): void
    {
        $url = '/api/v1/inventory?' . http_build_query(['part_name' => '%%Regulator%%']);
        $response = $this->getJson($url);

        $response->assertStatus(200)
            ->assertJsonPath('status', 'success')
            ->assertJsonCount(2, 'data'); // NCP1117 (5.0V) si LP2985 (3.3V)
    }

    /**
     * Testeaza filtrarea exacta dupa furnizor (DigiKey Electronics)
     */
    public function test_inventory_filter_by_provider(): void
    {
        $url = '/api/v1/inventory?' . http_build_query(['provider' => 'DigiKey Electronics']);
        $response = $this->getJson($url);

        $response->assertStatus(200)
            ->assertJsonPath('status', 'success')
            ->assertJsonCount(2, 'data');

        $data = $response->json('data');
        foreach ($data as $item) {
            $this->assertEquals('DigiKey Electronics', $item['provider']);
        }
    }

    /**
     * Testeaza filtrarea dupa starea de receptie (arrived: da / nu)
     */
    public function test_inventory_filter_by_arrived_status(): void
    {
        // Comenzile deja sosite
        $resArrived = $this->getJson('/api/v1/inventory?' . http_build_query(['arrived' => 'da']));
        $resArrived->assertStatus(200)
            ->assertJsonPath('status', 'success')
            ->assertJsonCount(6, 'data');

        // Comenzile aflate in tranzit
        $resInTransit = $this->getJson('/api/v1/inventory?' . http_build_query(['arrived' => 'nu']));
        $resInTransit->assertStatus(200)
            ->assertJsonPath('status', 'success')
            ->assertJsonCount(2, 'data');
    }

    /**
     * Testeaza comportamentul sigur atunci cand se trimite doar %% sau %
     */
    public function test_inventory_standalone_wildcard_safe_handling(): void
    {
        $url = '/api/v1/inventory?' . http_build_query(['ident' => '%%']);
        $response = $this->getJson($url);

        // Nu trebuie sa produca eroare SQL sau crash
        $response->assertStatus(200)
            ->assertJsonPath('status', 'success');
    }

    /**
     * Testeaza actualizarea livrarii / receptiei (arrived, arrival_time, tracking_number)
     */
    public function test_inventory_patch_arrival_and_tracking(): void
    {
        // Luam o comanda aflata in tranzit (ex: 10008)
        $order = InventoryComponent::where('ident', '10008')->firstOrFail();
        $this->assertFalse((bool) $order->arrived);

        $response = $this->patchJson("/api/v1/inventory/{$order->id}/arrival", [
          'arrived' => true,
          'arrival_time' => '2026-10-29',
          'tracking_number' => 'TNT-889977112',
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('data.arrived', true)
            ->assertJsonPath('data.tracking_number', 'TNT-889977112')
            ->assertJsonPath('data.reception_status', 'conform');

        $this->assertTrue((bool) $order->fresh()->arrived);
        $this->assertEquals('TNT-889977112', $order->fresh()->tracking_number);
    }

    /**
     * Testeaza stergerea / anularea unei comenzi din magazie
     */
    public function test_inventory_delete_order(): void
    {
        $order = InventoryComponent::where('ident', '10009')->firstOrFail();
        $orderId = $order->id;

        $response = $this->deleteJson("/api/v1/inventory/{$orderId}");

        $response->assertStatus(200)
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('message', 'Comanda a fost anulată.');

        $this->assertNull(InventoryComponent::find($orderId));
    }
}

