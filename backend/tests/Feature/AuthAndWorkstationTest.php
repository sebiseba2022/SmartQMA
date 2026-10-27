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

    public function test_workstations_endpoint_returns_all_ten_stations(): void
    {
        $response = $this->getJson('/api/v1/workstations');

        $response->assertStatus(200)
            ->assertJsonCount(10, 'data')
            ->assertJsonPath('data.0.slug', 'magazie')
            ->assertJsonPath('data.9.slug', 'statistica');
    }
}
