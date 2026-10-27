<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database with core SmartQMA roles.
     */
    public function run(): void
    {
        $users = [
            [
                'username' => 'owner',
                'name' => 'Florian S. (Deținător Sistem)',
                'email' => 'owner@smartqma.local',
                'role' => User::ROLE_OWNER,
                'password' => Hash::make('Password123!'),
                'is_active' => true,
            ],
            [
                'username' => 'director',
                'name' => 'Director Fabricație',
                'email' => 'director@smartqma.local',
                'role' => User::ROLE_DIRECTOR,
                'password' => Hash::make('Password123!'),
                'is_active' => true,
            ],
            [
                'username' => 'engineer',
                'name' => 'Inginer Proces & Calitate',
                'email' => 'engineer@smartqma.local',
                'role' => User::ROLE_ENGINEER,
                'password' => Hash::make('Password123!'),
                'is_active' => true,
            ],
            [
                'username' => 'operator',
                'name' => 'Operator Linie Fabricație',
                'email' => 'operator@smartqma.local',
                'role' => User::ROLE_PRODUCTION,
                'password' => Hash::make('Password123!'),
                'is_active' => true,
            ],
        ];

        foreach ($users as $userData) {
            User::updateOrCreate(
                ['username' => $userData['username']],
                $userData
            );
        }
    }
}
