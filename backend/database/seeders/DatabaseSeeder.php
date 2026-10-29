<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\UserStationAccess;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database with core SmartQMA roles and station rights.
     */
    public function run(): void
    {
        $users = [
            [
                'username' => 'owner',
                'name' => 'Florian S. (Proprietar)',
                'email' => 'owner@smartqma.local',
                'role' => User::ROLE_OWNER,
                'barcode' => 'BC-OWN-001',
                'password' => Hash::make('Password123!'),
                'is_active' => true,
            ],
            [
                'username' => 'director',
                'name' => 'Director Fabricație',
                'email' => 'director@smartqma.local',
                'role' => User::ROLE_DIRECTOR,
                'barcode' => 'BC-DIR-002',
                'password' => Hash::make('Password123!'),
                'is_active' => true,
            ],
            [
                'username' => 'engineer',
                'name' => 'Inginer Proces & Calitate',
                'email' => 'engineer@smartqma.local',
                'role' => User::ROLE_ENGINEER,
                'barcode' => 'BC-ENG-003',
                'password' => Hash::make('Password123!'),
                'is_active' => true,
            ],
            [
                'username' => 'magazioner',
                'name' => 'Responsabil Magazie & Stocuri',
                'email' => 'magazioner@smartqma.local',
                'role' => User::ROLE_MAGAZIONER,
                'barcode' => 'BC-MAG-004',
                'password' => Hash::make('Password123!'),
                'is_active' => true,
            ],
            [
                'username' => 'analist_calitate',
                'name' => 'Analist Control Calitate',
                'email' => 'calitate@smartqma.local',
                'role' => User::ROLE_ANALIST_CALITATE,
                'barcode' => 'BC-QA-005',
                'password' => Hash::make('Password123!'),
                'is_active' => true,
            ],
            [
                'username' => 'operator_smd',
                'name' => 'Operator Montaj SMD',
                'email' => 'op_smd@smartqma.local',
                'role' => User::ROLE_OPERATOR,
                'barcode' => 'BC-OP-SMD-001',
                'password' => Hash::make('Password123!'),
                'is_active' => true,
            ],
            [
                'username' => 'operator_aoi',
                'name' => 'Operator Inspecție AOI',
                'email' => 'op_aoi@smartqma.local',
                'role' => User::ROLE_OPERATOR,
                'barcode' => 'BC-OP-AOI-002',
                'password' => Hash::make('Password123!'),
                'is_active' => true,
            ],
            [
                'username' => 'operator',
                'name' => 'Operator Linie Fabricație',
                'email' => 'operator@smartqma.local',
                'role' => User::ROLE_OPERATOR,
                'barcode' => 'BC-OP-GEN-003',
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

        // Definire drepturi de acces pe posturi pentru operatori (user_station_access)
        // Operator SMD are acces doar la smd si qr-laser
        $opSmd = User::where('username', 'operator_smd')->first();
        if ($opSmd) {
            foreach (['qr-laser', 'smd'] as $st) {
                UserStationAccess::updateOrCreate(
                    ['user_id' => $opSmd->id, 'station_id' => $st],
                    ['barcode' => $opSmd->barcode, 'is_authorized' => true]
                );
            }
        }

        // Operator AOI are acces la aoi si tht
        $opAoi = User::where('username', 'operator_aoi')->first();
        if ($opAoi) {
            foreach (['aoi', 'tht'] as $st) {
                UserStationAccess::updateOrCreate(
                    ['user_id' => $opAoi->id, 'station_id' => $st],
                    ['barcode' => $opAoi->barcode, 'is_authorized' => true]
                );
            }
        }

        // Operator General are acces la toate posturile operationale
        $opGen = User::where('username', 'operator')->first();
        if ($opGen) {
            foreach (['qr-laser', 'smd', 'aoi', 'tht', 'ict', 'eol', 'export'] as $st) {
                UserStationAccess::updateOrCreate(
                    ['user_id' => $opGen->id, 'station_id' => $st],
                    ['barcode' => $opGen->barcode, 'is_authorized' => true]
                );
            }
        }

        $this->call(ProductionFlowSeeder::class);
    }
}
