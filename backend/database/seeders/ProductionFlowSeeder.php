<?php

namespace Database\Seeders;

use App\Models\AoiResult;
use App\Models\BestuckPosition;
use App\Models\ComponentIdent;
use App\Models\EolResult;
use App\Models\IctResult;
use App\Models\InventoryComponent;
use App\Models\ProductDefinition;
use App\Models\QrLaserMarking;
use App\Models\SmdPlacement;
use App\Models\StationFeeder;
use App\Models\ThtPlacement;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class ProductionFlowSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Definitii produse (ident final -> HW & SW version)
        ProductDefinition::updateOrCreate(
            ['product_ident' => 'ARDUINO_UNO_R3'],
            [
                'product_name' => 'Arduino Uno R3 (SKU: A000066)',
                'hardware_version' => 'Rev 3.0',
                'software_version' => 'v1.1.2',
            ]
        );

        // 2. Reteta Bestuckung Arduino Uno R3 (componente principale 10002 - 10009)
        $bestuck = [
            // SMD
            ['position' => 'U3', 'expected_part' => 'ATmega16U2 (Controller USB-la-Serial)', 'type' => 'SMD'],
            ['position' => 'U5', 'expected_part' => 'NCP1117ST50T3G (Regulator LDO 5.0V)', 'type' => 'SMD'],
            ['position' => 'U2', 'expected_part' => 'LP2985-33DBVR (Regulator LDO 3.3V)', 'type' => 'SMD'],
            ['position' => 'U4', 'expected_part' => 'LMV358IDGKR (Amplificator Operațional Dual)', 'type' => 'SMD'],
            ['position' => 'T1', 'expected_part' => 'FDN340P (Tranzistor MOSFET Canal-P)', 'type' => 'SMD'],
            ['position' => 'F1', 'expected_part' => 'MF-MSMF050-2 (Siguranță Resetabilă PTC 500mA)', 'type' => 'SMD'],
            ['position' => 'Y1', 'expected_part' => 'CSTCE16M0V53-R0 (Rezonator Ceramic 16 MHz)', 'type' => 'SMD'],

            // THT
            ['position' => 'U1', 'expected_part' => 'ATmega328P (Microcontroler 8-bit AVR)', 'type' => 'THT'],
        ];

        foreach ($bestuck as $item) {
            BestuckPosition::updateOrCreate(
                [
                    'product_model' => 'ARDUINO_UNO_R3',
                    'position' => $item['position'],
                ],
                [
                    'expected_part' => $item['expected_part'],
                ]
            );
        }

        // 3. Comenzi componente in Magazie pentru Arduino Uno R3 (PDF-urile de la 10002 in sus: 10002 - 10009)
        // Toate campurile sunt completate, iar arrival_time contine data sosirii (efectiva sau planificata).
        $components = [
            [
                'internal_id' => 10002,
                'ident' => '10002',
                'part_name' => 'ATmega328P (Microcontroler 8-bit AVR)',
                'ordered_at' => Carbon::now()->subDays(10)->setTime(9, 15, 0),
                'quantity' => 500,
                'arrived' => true,
                'arrival_time' => Carbon::now()->subDays(7)->startOfDay(),
                'tracking_number' => 'DHL-884920145',
                'provider' => 'Mouser Electronics',
                'supplier_lot' => 'LOT-MCHP-10002',
                'production_date' => '2026-01-15',
                'entry_date' => Carbon::now()->subDays(7)->startOfDay(),
                'reception_status' => 'conform',
                'reception_notes' => 'Tuburi antistatice DIP-28 sigilate',
                'received_by' => 'operator',
            ],
            [
                'internal_id' => 10003,
                'ident' => '10003',
                'part_name' => 'ATmega16U2 (Controller USB-la-Serial)',
                'ordered_at' => Carbon::now()->subDays(10)->setTime(9, 20, 0),
                'quantity' => 500,
                'arrived' => true,
                'arrival_time' => Carbon::now()->subDays(7)->startOfDay(),
                'tracking_number' => 'DHL-884920146',
                'provider' => 'Mouser Electronics',
                'supplier_lot' => 'LOT-MCHP-10003',
                'production_date' => '2026-01-18',
                'entry_date' => Carbon::now()->subDays(7)->startOfDay(),
                'reception_status' => 'conform',
                'reception_notes' => 'Tava JEDEC QFN-32 sigilata vid',
                'received_by' => 'operator',
            ],
            [
                'internal_id' => 10004,
                'ident' => '10004',
                'part_name' => 'NCP1117ST50T3G (Regulator LDO 5.0V)',
                'ordered_at' => Carbon::now()->subDays(8)->setTime(11, 0, 0),
                'quantity' => 1000,
                'arrived' => true,
                'arrival_time' => Carbon::now()->subDays(5)->startOfDay(),
                'tracking_number' => 'FDX-392011482',
                'provider' => 'DigiKey Electronics',
                'supplier_lot' => 'LOT-ONS-10004',
                'production_date' => '2026-01-22',
                'entry_date' => Carbon::now()->subDays(5)->startOfDay(),
                'reception_status' => 'conform',
                'reception_notes' => 'Rola SOT-223 onsemi',
                'received_by' => 'operator',
            ],
            [
                'internal_id' => 10005,
                'ident' => '10005',
                'part_name' => 'LP2985-33DBVR (Regulator LDO 3.3V)',
                'ordered_at' => Carbon::now()->subDays(8)->setTime(11, 10, 0),
                'quantity' => 1000,
                'arrived' => true,
                'arrival_time' => Carbon::now()->subDays(5)->startOfDay(),
                'tracking_number' => 'FDX-392011483',
                'provider' => 'DigiKey Electronics',
                'supplier_lot' => 'LOT-TI-10005',
                'production_date' => '2026-01-25',
                'entry_date' => Carbon::now()->subDays(5)->startOfDay(),
                'reception_status' => 'conform',
                'reception_notes' => 'Rola SOT-23-5 Texas Instruments',
                'received_by' => 'operator',
            ],
            [
                'internal_id' => 10006,
                'ident' => '10006',
                'part_name' => 'LMV358IDGKR (Amplificator Operațional Dual)',
                'ordered_at' => Carbon::now()->subDays(6)->setTime(13, 45, 0),
                'quantity' => 800,
                'arrived' => true,
                'arrival_time' => Carbon::now()->subDays(3)->startOfDay(),
                'tracking_number' => 'UPS-1Z999AA101',
                'provider' => 'Farnell Element14',
                'supplier_lot' => 'LOT-TI-10006',
                'production_date' => '2026-02-01',
                'entry_date' => Carbon::now()->subDays(3)->startOfDay(),
                'reception_status' => 'conform',
                'reception_notes' => 'Rola VSSOP-8 Texas Instruments',
                'received_by' => 'operator',
            ],
            [
                'internal_id' => 10007,
                'ident' => '10007',
                'part_name' => 'FDN340P (Tranzistor MOSFET Canal-P)',
                'ordered_at' => Carbon::now()->subDays(5)->setTime(8, 30, 0),
                'quantity' => 1500,
                'arrived' => true,
                'arrival_time' => Carbon::now()->subDays(2)->startOfDay(),
                'tracking_number' => 'UPS-1Z999AA102',
                'provider' => 'Farnell Element14',
                'supplier_lot' => 'LOT-ONS-10007',
                'production_date' => '2026-02-04',
                'entry_date' => Carbon::now()->subDays(2)->startOfDay(),
                'reception_status' => 'conform',
                'reception_notes' => 'Rola SuperSOT-3 onsemi',
                'received_by' => 'operator',
            ],
            [
                'internal_id' => 10008,
                'ident' => '10008',
                'part_name' => 'MF-MSMF050-2 (Siguranță Resetabilă PTC 500mA)',
                'ordered_at' => Carbon::now()->subDays(3)->setTime(15, 10, 0),
                'quantity' => 2000,
                'arrived' => false,
                'arrival_time' => null,
                'tracking_number' => null,
                'provider' => 'TME Electronic Components',
                'supplier_lot' => 'LOT-BRN-10008',
                'production_date' => '2026-02-08',
                'entry_date' => null,
                'reception_status' => 'in_asteptare',
                'reception_notes' => 'In tranzit de la furnizor',
                'received_by' => 'operator',
            ],
            [
                'internal_id' => 10009,
                'ident' => '10009',
                'part_name' => 'CSTCE16M0V53-R0 (Rezonator Ceramic 16 MHz)',
                'ordered_at' => Carbon::now()->subDays(2)->setTime(10, 5, 0),
                'quantity' => 1200,
                'arrived' => false,
                'arrival_time' => null,
                'tracking_number' => null,
                'provider' => 'TME Electronic Components',
                'supplier_lot' => 'LOT-MUR-10009',
                'production_date' => '2026-02-10',
                'entry_date' => null,
                'reception_status' => 'in_asteptare',
                'reception_notes' => 'In tranzit de la furnizor',
                'received_by' => 'operator',
            ],
        ];

        foreach ($components as $c) {
            InventoryComponent::updateOrCreate(
                ['internal_id' => $c['internal_id']],
                $c
            );
        }

        if (DB::getDriverName() === 'pgsql') {
            DB::statement("SELECT setval('inventory_components_internal_id_seq', (SELECT COALESCE(MAX(internal_id), 10009) FROM inventory_components))");
        }

        // 4. Alimentatoare active la statii (Feeder setup)
        $feeders = [
            ['station_id' => 'WS-SMD-04', 'position' => 'U3', 'component_internal_id' => 10003],
            ['station_id' => 'WS-SMD-04', 'position' => 'U5', 'component_internal_id' => 10004],
            ['station_id' => 'WS-SMD-04', 'position' => 'U2', 'component_internal_id' => 10005],
            ['station_id' => 'WS-SMD-04', 'position' => 'U4', 'component_internal_id' => 10006],
            ['station_id' => 'WS-SMD-04', 'position' => 'T1', 'component_internal_id' => 10007],
            ['station_id' => 'WS-SMD-04', 'position' => 'F1', 'component_internal_id' => 10008],
            ['station_id' => 'WS-SMD-04', 'position' => 'Y1', 'component_internal_id' => 10009],

            ['station_id' => 'WS-THT-06', 'position' => 'U1', 'component_internal_id' => 10002],
        ];

        foreach ($feeders as $f) {
            StationFeeder::updateOrCreate(
                ['station_id' => $f['station_id'], 'position' => $f['position']],
                [
                    'component_internal_id' => $f['component_internal_id'],
                    'loaded_by' => 'operator',
                    'loaded_at' => Carbon::now()->subHours(6),
                ]
            );
        }

        // 5. Marcaje QR Laser (Serii de 12 cifre: YYMMDDxxxxxx)
        $todayPrefix = Carbon::now()->format('ymd'); // 261029 pentru 29 Oct 2026
        $laserSerials = [
            [
                'qr_serial_number' => $todayPrefix . '000001',
                'product_model' => 'ARDUINO_UNO_R3',
                'pcb_side' => 'TOP',
                'laser_power_pct' => 85.00,
                'mark_duration_ms' => 415,
                'operator_username' => 'operator',
                'marked_at' => Carbon::now()->subHours(5),
                'status' => 'OK',
                'notes' => 'Panou 1 / Bază marcare automată',
            ],
            [
                'qr_serial_number' => $todayPrefix . '000002',
                'product_model' => 'ARDUINO_UNO_R3',
                'pcb_side' => 'TOP',
                'laser_power_pct' => 85.50,
                'mark_duration_ms' => 420,
                'operator_username' => 'operator',
                'marked_at' => Carbon::now()->subHours(4)->subMinutes(30),
                'status' => 'OK',
                'notes' => 'Panou 1 / PCB #2',
            ],
            [
                'qr_serial_number' => $todayPrefix . '000003',
                'product_model' => 'ARDUINO_UNO_R3',
                'pcb_side' => 'TOP',
                'laser_power_pct' => 84.80,
                'mark_duration_ms' => 418,
                'operator_username' => 'operator',
                'marked_at' => Carbon::now()->subHours(3)->subMinutes(50),
                'status' => 'OK',
                'notes' => 'Panou 2 / Marcare automată',
            ],
            [
                'qr_serial_number' => $todayPrefix . '000004',
                'product_model' => 'ARDUINO_UNO_R3',
                'pcb_side' => 'TOP',
                'laser_power_pct' => 85.00,
                'mark_duration_ms' => 422,
                'operator_username' => 'operator',
                'marked_at' => Carbon::now()->subHours(2)->subMinutes(15),
                'status' => 'OK',
                'notes' => 'Panou 2 / Marcare automată',
            ],
            [
                'qr_serial_number' => $todayPrefix . '000005',
                'product_model' => 'ARDUINO_UNO_R3',
                'pcb_side' => 'TOP',
                'laser_power_pct' => 85.20,
                'mark_duration_ms' => 419,
                'operator_username' => 'operator',
                'marked_at' => Carbon::now()->subMinutes(45),
                'status' => 'OK',
                'notes' => 'Panou 3 / Gravare de verificare',
            ],
            [
                'qr_serial_number' => '260902000001', // Exemplul cerut de utilizator: 2 Septembrie 2026
                'product_model' => 'ARDUINO_UNO_R3',
                'pcb_side' => 'TOP',
                'laser_power_pct' => 85.00,
                'mark_duration_ms' => 410,
                'operator_username' => 'operator',
                'marked_at' => Carbon::create(2026, 9, 2, 8, 30, 0),
                'status' => 'RESCANAT',
                'notes' => 'Lot pilot 2 septembrie 2026 rescanat',
            ],
        ];

        foreach ($laserSerials as $ls) {
            QrLaserMarking::updateOrCreate(
                ['qr_serial_number' => $ls['qr_serial_number']],
                $ls
            );
        }

        // Curățare date vechi care nu respectă formatul strict YYMMDDNNNNNN
        SmdPlacement::where('qr_serial_number', 'LIKE', 'ARD-%')->delete();
        ThtPlacement::where('qr_serial_number', 'LIKE', 'ARD-%')->delete();
        AoiResult::where('qr_serial_number', 'LIKE', 'ARD-%')->delete();
        IctResult::where('qr_serial_number', 'LIKE', 'ARD-%')->delete();
        EolResult::where('qr_serial_number', 'LIKE', 'ARD-%')->delete();

        // 6. Exemplu complet trasabilitate PCB conform standardului unic YYMMDDNNNNNN
        $tracedSerials = [$todayPrefix . '000001', '260902000001'];

        $smdPlacements = [
            ['position' => 'U3', 'internal_id' => 10003],
            ['position' => 'U5', 'internal_id' => 10004],
            ['position' => 'U2', 'internal_id' => 10005],
            ['position' => 'U4', 'internal_id' => 10006],
            ['position' => 'T1', 'internal_id' => 10007],
            ['position' => 'F1', 'internal_id' => 10008],
            ['position' => 'Y1', 'internal_id' => 10009],
        ];

        foreach ($tracedSerials as $sampleQr) {
            foreach ($smdPlacements as $smd) {
                SmdPlacement::updateOrCreate(
                    ['qr_serial_number' => $sampleQr, 'bestuck_position' => $smd['position']],
                    [
                        'station_id' => 'WS-SMD-04',
                        'component_internal_id' => $smd['internal_id'],
                        'operator_username' => 'operator',
                        'mounted_at' => Carbon::now()->subHours(4),
                    ]
                );
            }

            AoiResult::updateOrCreate(
                ['qr_serial_number' => $sampleQr, 'station_id' => 'WS-AOI-05', 'tested_at' => Carbon::now()->subHours(3)->subMinutes(30)->toDateTimeString()],
                [
                    'test_result' => 'FAIL',
                    'defect_code' => 'BRIDGE_U3',
                    'details' => 'Scurtcircuit pasta reflow pini 5-6 ATmega16U2 QFN-32',
                    'operator_username' => 'operator',
                ]
            );
            AoiResult::updateOrCreate(
                ['qr_serial_number' => $sampleQr, 'station_id' => 'WS-AOI-05', 'tested_at' => Carbon::now()->subHours(3)->toDateTimeString()],
                [
                    'test_result' => 'PASS',
                    'defect_code' => null,
                    'details' => 'Remediat reflow & curatare cu ultrasunete. Inspectie optica 100% OK',
                    'operator_username' => 'operator',
                ]
            );

            $thtPlacements = [
                ['position' => 'U1', 'internal_id' => 10002],
            ];
            foreach ($thtPlacements as $tht) {
                ThtPlacement::updateOrCreate(
                    ['qr_serial_number' => $sampleQr, 'bestuck_position' => $tht['position']],
                    [
                        'station_id' => 'WS-THT-06',
                        'component_internal_id' => $tht['internal_id'],
                        'operator_username' => 'operator',
                        'mounted_at' => Carbon::now()->subHours(2),
                    ]
                );
            }

            IctResult::updateOrCreate(
                ['qr_serial_number' => $sampleQr, 'station_id' => 'WS-ICT-07', 'tested_at' => Carbon::now()->subHours(1)->subMinutes(40)->toDateTimeString()],
                [
                    'test_result' => 'FAIL',
                    'measured_values' => ['U5_VOUT' => '5.01V', 'U2_VOUT' => 'SHORT'],
                    'failed_nets' => 'NET_3V3_SHORT',
                    'operator_username' => 'operator',
                ]
            );
            IctResult::updateOrCreate(
                ['qr_serial_number' => $sampleQr, 'station_id' => 'WS-ICT-07', 'tested_at' => Carbon::now()->subHours(1)->subMinutes(20)->toDateTimeString()],
                [
                    'test_result' => 'PASS',
                    'measured_values' => ['U5_VOUT' => '5.01V', 'U2_VOUT' => '3.30V', 'Y1_FREQ' => '16.000MHz', 'VCC_GND' => '>100k'],
                    'failed_nets' => null,
                    'operator_username' => 'operator',
                ]
            );

            EolResult::updateOrCreate(
                ['qr_serial_number' => $sampleQr, 'station_id' => 'WS-EOL-08'],
                [
                    'product_ident' => 'ARDUINO_UNO_R3',
                    'hardware_version' => 'Rev 3.0',
                    'software_version' => 'v1.1.2',
                    'test_result' => 'PASS',
                    'current_draw_ma' => 47.85,
                    'functional_checks' => [
                        'usb_enumeration' => true,
                        'bootloader_checksum' => 'OK',
                        'uart_loopback' => true,
                        'adc_reference_v' => 5.01,
                        'gpio_all_pass' => true,
                    ],
                    'operator_username' => 'operator',
                    'tested_at' => Carbon::now()->subMinutes(30),
                ]
            );
        }
    }
}
