<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AuthAndWorkstationTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_login_with_valid_credentials(): void
    {
        User::create([
            'username' => 'testuser',
            'name' => 'Test Operator',
            'role' => User::ROLE_PRODUCTION,
            'password' => Hash::make('SecretPass123!'),
            'is_active' => true,
        ]);

        $response = $this->postJson('/api/v1/auth/login', [
            'username' => 'testuser',
            'password' => 'SecretPass123!',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'status' => 'success',
                'user' => [
                    'username' => 'testuser',
                    'role' => 'production',
                ],
            ]);
    }

    public function test_login_fails_with_invalid_password(): void
    {
        User::create([
            'username' => 'testuser',
            'name' => 'Test Operator',
            'role' => User::ROLE_PRODUCTION,
            'password' => Hash::make('SecretPass123!'),
            'is_active' => true,
        ]);

        $response = $this->postJson('/api/v1/auth/login', [
            'username' => 'testuser',
            'password' => 'WrongPassword',
        ]);

        $response->assertStatus(401)
            ->assertJson([
                'status' => 'error',
            ]);
    }

    public function test_workstations_endpoint_returns_all_eleven_stations(): void
    {
        $response = $this->getJson('/api/v1/workstations');

        $response->assertStatus(200)
            ->assertJsonCount(11, 'data')
            ->assertJsonPath('data.0.slug', 'magazie')
            ->assertJsonPath('data.9.slug', 'statistica')
            ->assertJsonPath('data.10.slug', 'plm');

        $data = collect($response->json('data'));
        $magazie = $data->firstWhere('slug', 'magazie');
        $receptie = $data->firstWhere('slug', 'receptie-marfa');
        $smd = $data->firstWhere('slug', 'smd');

        $this->assertNotContains('operator', $magazie['allowed_roles']);
        $this->assertNotContains('production', $magazie['allowed_roles']);
        $this->assertNotContains('operator', $receptie['allowed_roles']);
        $this->assertNotContains('production', $receptie['allowed_roles']);

        $this->assertContains('operator', $smd['allowed_roles']);
    }

    public function test_verify_station_barcode_for_authorized_operator(): void
    {
        $user = User::create([
            'username' => 'op_smd_test',
            'name' => 'Operator SMD Test',
            'role' => User::ROLE_OPERATOR,
            'barcode' => 'BC-TEST-SMD-999',
            'password' => Hash::make('SecretPass123!'),
            'is_active' => true,
        ]);

        \App\Models\UserStationAccess::create([
            'user_id' => $user->id,
            'barcode' => 'BC-TEST-SMD-999',
            'station_id' => 'smd',
            'is_authorized' => true,
        ]);

        $response = $this->postJson('/api/v1/auth/verify-station-barcode', [
            'station_id' => 'smd',
            'barcode' => 'BC-TEST-SMD-999',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'status' => 'success',
                'authorized' => true,
                'station_id' => 'smd',
            ]);
    }

    public function test_verify_station_barcode_rejects_unauthorized_station(): void
    {
        $user = User::create([
            'username' => 'op_smd_only',
            'name' => 'Operator Doar SMD',
            'role' => User::ROLE_OPERATOR,
            'barcode' => 'BC-TEST-SMD-888',
            'password' => Hash::make('SecretPass123!'),
            'is_active' => true,
        ]);

        \App\Models\UserStationAccess::create([
            'user_id' => $user->id,
            'barcode' => 'BC-TEST-SMD-888',
            'station_id' => 'smd',
            'is_authorized' => true,
        ]);

        $response = $this->postJson('/api/v1/auth/verify-station-barcode', [
            'station_id' => 'aoi',
            'barcode' => 'BC-TEST-SMD-888',
        ]);

        $response->assertStatus(403)
            ->assertJson([
                'status' => 'error',
                'authorized' => false,
            ]);
    }

    public function test_verify_station_barcode_allows_engineer_anywhere(): void
    {
        User::create([
            'username' => 'eng_test',
            'name' => 'Inginer Test',
            'role' => User::ROLE_ENGINEER,
            'barcode' => 'BC-TEST-ENG-777',
            'password' => Hash::make('SecretPass123!'),
            'is_active' => true,
        ]);

        $response = $this->postJson('/api/v1/auth/verify-station-barcode', [
            'station_id' => 'aoi',
            'barcode' => 'BC-TEST-ENG-777',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'status' => 'success',
                'authorized' => true,
            ]);
    }

    public function test_datasheet_endpoint_returns_file_or_404(): void
    {
        $response = $this->get('/api/v1/idents/10000/datasheet');
        // If file exists, returns 200 with pdf header; otherwise 404
        if ($response->getStatusCode() === 200) {
            $this->assertEquals('application/pdf', $response->headers->get('content-type'));
        } else {
            $response->assertStatus(404);
        }

        $nonExistent = $this->getJson('/api/v1/idents/99999/datasheet');
        $nonExistent->assertStatus(404);
    }
}
