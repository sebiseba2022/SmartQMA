<?php

namespace Database\Seeders;

use App\Models\AoiResult;
use App\Models\BestuckPosition;
use App\Models\EolResult;
use App\Models\IctResult;
use App\Models\InventoryComponent;
use App\Models\ProductDefinition;
use App\Models\SmdPlacement;
use App\Models\StationFeeder;
use App\Models\ThtPlacement;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;

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

        // 2. Reteta Bestuckung Arduino Uno R3 (conform Datasheet oficial pag. 5 & 6)
        $bestuck = [
            // SMD
            ['position' => 'U1', 'expected_part' => 'Regulator LDO 5.0V 800mA (SPX1117M3-L-5)', 'doc_id' => 'DOC-QMA-DS-10008', 'type' => 'SMD'],
            ['position' => 'U3', 'expected_part' => 'Microcontroller USB Bridge (ATMEGA16U2-MU)', 'doc_id' => 'DOC-QMA-DS-10009', 'type' => 'SMD'],
            ['position' => 'U5', 'expected_part' => 'Amplificator Dublu Rail-to-Rail (LMV358LIST)', 'doc_id' => 'DOC-QMA-DS-10010', 'type' => 'SMD'],
            ['position' => 'PC1', 'expected_part' => 'Condensator Aluminiu 47uF 25V SMD (EEE-1EA470WP)', 'doc_id' => 'DOC-QMA-DS-10003', 'type' => 'SMD'],
            ['position' => 'PC2', 'expected_part' => 'Condensator Aluminiu 47uF 25V SMD (EEE-1EA470WP)', 'doc_id' => 'DOC-QMA-DS-10004', 'type' => 'SMD'],
            ['position' => 'D1', 'expected_part' => 'Dioda Redresoare 1A 1000V SMA (CGRA4007-G)', 'doc_id' => 'DOC-QMA-DS-10005', 'type' => 'SMD'],
            ['position' => 'F1', 'expected_part' => 'Siguranta Resetabila 500mA 1812 (MF-MSMF050-2)', 'doc_id' => 'DOC-QMA-DS-10011', 'type' => 'SMD'],
            ['position' => 'LED-ON', 'expected_part' => 'LED Verde 0805 Power (KPT-2012SGC)', 'doc_id' => 'DOC-QMA-DS-10017', 'type' => 'SMD'],
            ['position' => 'LED-L', 'expected_part' => 'LED Galben 0805 D13 (KPT-2012YC)', 'doc_id' => 'DOC-QMA-DS-10017', 'type' => 'SMD'],
            ['position' => 'LED-TX', 'expected_part' => 'LED Galben 0805 TX (KPT-2012YC)', 'doc_id' => 'DOC-QMA-DS-10017', 'type' => 'SMD'],
            ['position' => 'LED-RX', 'expected_part' => 'LED Galben 0805 RX (KPT-2012YC)', 'doc_id' => 'DOC-QMA-DS-10017', 'type' => 'SMD'],

            // THT
            ['position' => 'X1', 'expected_part' => 'Conector DC Jack 2.1x5.5mm (PJ-102AH)', 'doc_id' => 'DOC-QMA-DS-10001', 'type' => 'THT'],
            ['position' => 'X2', 'expected_part' => 'Conector USB Tip B Through-Hole (614004134721)', 'doc_id' => 'DOC-QMA-DS-10002', 'type' => 'THT'],
            ['position' => 'J-ZU4', 'expected_part' => 'Microcontroller AVR 32KB DIP-28 (ATMEGA328P-PU)', 'doc_id' => 'DOC-QMA-DS-10006', 'type' => 'THT'],
            ['position' => 'Y1', 'expected_part' => 'Cuart Oscilator 16MHz HC-49/US (ECS-160-20-4X-DU)', 'doc_id' => 'DOC-QMA-DS-10007', 'type' => 'THT'],
            ['position' => 'ICSP', 'expected_part' => 'Header Pini 2x3 2.54mm ATmega328P', 'doc_id' => 'DOC-QMA-DS-10012', 'type' => 'THT'],
            ['position' => 'ICSP1', 'expected_part' => 'Header Pini 2x3 2.54mm ATmega16U2', 'doc_id' => 'DOC-QMA-DS-10013', 'type' => 'THT'],
            ['position' => 'RESET', 'expected_part' => 'Buton Push Tactil 6x6mm (B3F-1000)', 'doc_id' => 'DOC-QMA-DS-10014', 'type' => 'THT'],
            ['position' => 'JANALOG', 'expected_part' => 'Barete Pini Mama Power 8p + Analog 6p (SSW)', 'doc_id' => 'DOC-QMA-DS-10015', 'type' => 'THT'],
            ['position' => 'JDIGITAL', 'expected_part' => 'Barete Pini Mama Digital 10p + 8p (SSW)', 'doc_id' => 'DOC-QMA-DS-10016', 'type' => 'THT'],
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

        // 3. Magazie & Receptie Componente (internal_id > 10000 cu doc_id unic)
        $components = [
            [
                'internal_id' => 10001,
                'part_name' => 'Conector DC Jack 2.1x5.5mm PJ-102AH',
                'datasheet_doc_id' => 'DOC-QMA-DS-10001',
                'supplier_lot' => 'LOT-CUI-2026A',
                'production_date' => '2026-01-10',
                'entry_date' => Carbon::now()->subDays(12),
                'reception_status' => 'conform',
                'reception_notes' => 'Pini integri, CoC validat',
                'quantity' => 1500,
                'received_by' => 'operator',
            ],
            [
                'internal_id' => 10002,
                'part_name' => 'Conector USB Tip B Through-Hole 614004134721',
                'datasheet_doc_id' => 'DOC-QMA-DS-10002',
                'supplier_lot' => 'LOT-WRTH-2026B',
                'production_date' => '2026-01-12',
                'entry_date' => Carbon::now()->subDays(12),
                'reception_status' => 'conform',
                'reception_notes' => 'Ecranare metalica impecabila',
                'quantity' => 1200,
                'received_by' => 'operator',
            ],
            [
                'internal_id' => 10003,
                'part_name' => 'Condensator Aluminiu 47uF 25V SMD EEE-1EA470WP',
                'datasheet_doc_id' => 'DOC-QMA-DS-10003',
                'supplier_lot' => 'LOT-PAN-2026C',
                'production_date' => '2026-01-15',
                'entry_date' => Carbon::now()->subDays(11),
                'reception_status' => 'conform',
                'reception_notes' => 'Role sigilate Panasonic 2000 buc',
                'quantity' => 4000,
                'received_by' => 'operator',
            ],
            [
                'internal_id' => 10004,
                'part_name' => 'Dioda Redresoare 1A 1000V SMA CGRA4007-G',
                'datasheet_doc_id' => 'DOC-QMA-DS-10005',
                'supplier_lot' => 'LOT-CMP-2026D',
                'production_date' => '2026-01-20',
                'entry_date' => Carbon::now()->subDays(10),
                'reception_status' => 'conform',
                'reception_notes' => 'Banda 5000 buc SMA conforma',
                'quantity' => 5000,
                'received_by' => 'operator',
            ],
            [
                'internal_id' => 10005,
                'part_name' => 'Microcontroller AVR 32KB DIP-28 ATMEGA328P-PU',
                'datasheet_doc_id' => 'DOC-QMA-DS-10006',
                'supplier_lot' => 'LOT-MCHP-2026E',
                'production_date' => '2026-02-01',
                'entry_date' => Carbon::now()->subDays(9),
                'reception_status' => 'conform',
                'reception_notes' => 'Tuburi antistatice DIP-28 sigilate',
                'quantity' => 2000,
                'received_by' => 'operator',
            ],
            [
                'internal_id' => 10006,
                'part_name' => 'Cuart Oscilator 16MHz HC-49/US ECS-160-20-4X-DU',
                'datasheet_doc_id' => 'DOC-QMA-DS-10007',
                'supplier_lot' => 'LOT-ECS-2026F',
                'production_date' => '2026-02-05',
                'entry_date' => Carbon::now()->subDays(8),
                'reception_status' => 'conform',
                'reception_notes' => 'Punga ermetica cu desicant',
                'quantity' => 3000,
                'received_by' => 'operator',
            ],
            [
                'internal_id' => 10007,
                'part_name' => 'Regulator LDO 5.0V 800mA SOT-223 SPX1117M3-L-5',
                'datasheet_doc_id' => 'DOC-QMA-DS-10008',
                'supplier_lot' => 'LOT-MXL-2026G',
                'production_date' => '2026-02-10',
                'entry_date' => Carbon::now()->subDays(8),
                'reception_status' => 'conform',
                'reception_notes' => 'Rola SOT-223 MaxLinear',
                'quantity' => 2500,
                'received_by' => 'operator',
            ],
            [
                'internal_id' => 10008,
                'part_name' => 'Microcontroller USB Bridge QFN-32 ATMEGA16U2-MU',
                'datasheet_doc_id' => 'DOC-QMA-DS-10009',
                'supplier_lot' => 'LOT-MCHP-2026H',
                'production_date' => '2026-02-12',
                'entry_date' => Carbon::now()->subDays(7),
                'reception_status' => 'conform',
                'reception_notes' => 'Tava JEDEC QFN-32 sigilata vid',
                'quantity' => 1500,
                'received_by' => 'operator',
            ],
            [
                'internal_id' => 10009,
                'part_name' => 'Amplificator Dublu Rail-to-Rail LMV358LIST',
                'datasheet_doc_id' => 'DOC-QMA-DS-10010',
                'supplier_lot' => 'LOT-STM-2026I',
                'production_date' => '2026-02-14',
                'entry_date' => Carbon::now()->subDays(7),
                'reception_status' => 'conform',
                'reception_notes' => 'MiniSO-8 rola 2500 buc',
                'quantity' => 2500,
                'received_by' => 'operator',
            ],
            [
                'internal_id' => 10010,
                'part_name' => 'Siguranta Resetabila 500mA 1812 MF-MSMF050-2',
                'datasheet_doc_id' => 'DOC-QMA-DS-10011',
                'supplier_lot' => 'LOT-BRN-2026J',
                'production_date' => '2026-02-15',
                'entry_date' => Carbon::now()->subDays(6),
                'reception_status' => 'conform',
                'reception_notes' => 'Rola Bourns 1812',
                'quantity' => 3000,
                'received_by' => 'operator',
            ],
            [
                'internal_id' => 10011,
                'part_name' => 'Header Pini 2x3 2.54mm M20-9980346',
                'datasheet_doc_id' => 'DOC-QMA-DS-10012',
                'supplier_lot' => 'LOT-HRW-2026K',
                'production_date' => '2026-02-15',
                'entry_date' => Carbon::now()->subDays(6),
                'reception_status' => 'conform',
                'reception_notes' => 'Pini auriti gold-flash',
                'quantity' => 4000,
                'received_by' => 'operator',
            ],
            [
                'internal_id' => 10012,
                'part_name' => 'Buton Push Tactil 6x6mm B3F-1000',
                'datasheet_doc_id' => 'DOC-QMA-DS-10014',
                'supplier_lot' => 'LOT-OMR-2026L',
                'production_date' => '2026-02-16',
                'entry_date' => Carbon::now()->subDays(5),
                'reception_status' => 'conform',
                'reception_notes' => 'Omron punguta 1000 buc',
                'quantity' => 1000,
                'received_by' => 'operator',
            ],
            [
                'internal_id' => 10013,
                'part_name' => 'Barete Pini Mama Power 8p + Analog 6p SSW',
                'datasheet_doc_id' => 'DOC-QMA-DS-10015',
                'supplier_lot' => 'LOT-SMT-2026M',
                'production_date' => '2026-02-17',
                'entry_date' => Carbon::now()->subDays(5),
                'reception_status' => 'conform',
                'reception_notes' => 'Tavite conectori Samtec',
                'quantity' => 2000,
                'received_by' => 'operator',
            ],
            [
                'internal_id' => 10014,
                'part_name' => 'Barete Pini Mama Digital 10p + 8p SSW',
                'datasheet_doc_id' => 'DOC-QMA-DS-10016',
                'supplier_lot' => 'LOT-SMT-2026N',
                'production_date' => '2026-02-17',
                'entry_date' => Carbon::now()->subDays(5),
                'reception_status' => 'conform',
                'reception_notes' => 'Tavite conectori Samtec',
                'quantity' => 2000,
                'received_by' => 'operator',
            ],
            [
                'internal_id' => 10015,
                'part_name' => 'LED Verde 0805 Power KPT-2012SGC',
                'datasheet_doc_id' => 'DOC-QMA-DS-10017',
                'supplier_lot' => 'LOT-KGB-2026O',
                'production_date' => '2026-02-18',
                'entry_date' => Carbon::now()->subDays(4),
                'reception_status' => 'conform',
                'reception_notes' => 'Rola Kingbright 2000 buc verde',
                'quantity' => 4000,
                'received_by' => 'operator',
            ],
            [
                'internal_id' => 10016,
                'part_name' => 'LED Galben 0805 D13/TX/RX KPT-2012YC',
                'datasheet_doc_id' => 'DOC-QMA-DS-10017',
                'supplier_lot' => 'LOT-KGB-2026P',
                'production_date' => '2026-02-18',
                'entry_date' => Carbon::now()->subDays(4),
                'reception_status' => 'conform',
                'reception_notes' => 'Rola Kingbright 2000 buc galben',
                'quantity' => 6000,
                'received_by' => 'operator',
            ],
        ];

        foreach ($components as $c) {
            unset($c['datasheet_doc_id']);
            InventoryComponent::updateOrCreate(
                ['internal_id' => $c['internal_id']],
                $c
            );
        }

        // 4. Alimentatoare active la statii (Feeder setup - rola scanata o singura data)
        $feeders = [
            ['station_id' => 'WS-SMD-04', 'position' => 'U1', 'component_internal_id' => 10007],
            ['station_id' => 'WS-SMD-04', 'position' => 'U3', 'component_internal_id' => 10008],
            ['station_id' => 'WS-SMD-04', 'position' => 'U5', 'component_internal_id' => 10009],
            ['station_id' => 'WS-SMD-04', 'position' => 'PC1', 'component_internal_id' => 10003],
            ['station_id' => 'WS-SMD-04', 'position' => 'PC2', 'component_internal_id' => 10003],
            ['station_id' => 'WS-SMD-04', 'position' => 'D1', 'component_internal_id' => 10004],
            ['station_id' => 'WS-SMD-04', 'position' => 'F1', 'component_internal_id' => 10010],
            ['station_id' => 'WS-SMD-04', 'position' => 'LED-ON', 'component_internal_id' => 10015],
            ['station_id' => 'WS-SMD-04', 'position' => 'LED-L', 'component_internal_id' => 10016],
            ['station_id' => 'WS-SMD-04', 'position' => 'LED-TX', 'component_internal_id' => 10016],
            ['station_id' => 'WS-SMD-04', 'position' => 'LED-RX', 'component_internal_id' => 10016],

            ['station_id' => 'WS-THT-06', 'position' => 'X1', 'component_internal_id' => 10001],
            ['station_id' => 'WS-THT-06', 'position' => 'X2', 'component_internal_id' => 10002],
            ['station_id' => 'WS-THT-06', 'position' => 'J-ZU4', 'component_internal_id' => 10005],
            ['station_id' => 'WS-THT-06', 'position' => 'Y1', 'component_internal_id' => 10006],
            ['station_id' => 'WS-THT-06', 'position' => 'ICSP', 'component_internal_id' => 10011],
            ['station_id' => 'WS-THT-06', 'position' => 'ICSP1', 'component_internal_id' => 10011],
            ['station_id' => 'WS-THT-06', 'position' => 'RESET', 'component_internal_id' => 10012],
            ['station_id' => 'WS-THT-06', 'position' => 'JANALOG', 'component_internal_id' => 10013],
            ['station_id' => 'WS-THT-06', 'position' => 'JDIGITAL', 'component_internal_id' => 10014],
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

        // 5. Exemplu complet trasabilitate PCB: ARD-UNO-2026-0001
        $sampleQr = 'ARD-UNO-2026-0001';

        // Plasam toate componentele SMD
        $smdPlacements = [
            ['position' => 'U1', 'internal_id' => 10007],
            ['position' => 'U3', 'internal_id' => 10008],
            ['position' => 'U5', 'internal_id' => 10009],
            ['position' => 'PC1', 'internal_id' => 10003],
            ['position' => 'PC2', 'internal_id' => 10003],
            ['position' => 'D1', 'internal_id' => 10004],
            ['position' => 'F1', 'internal_id' => 10010],
            ['position' => 'LED-ON', 'internal_id' => 10015],
            ['position' => 'LED-L', 'internal_id' => 10016],
            ['position' => 'LED-TX', 'internal_id' => 10016],
            ['position' => 'LED-RX', 'internal_id' => 10016],
        ];
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

        // Test AOI: 1 FAIL initial, apoi 1 PASS
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

        // Plasam componentele THT
        $thtPlacements = [
            ['position' => 'X1', 'internal_id' => 10001],
            ['position' => 'X2', 'internal_id' => 10002],
            ['position' => 'J-ZU4', 'internal_id' => 10005],
            ['position' => 'Y1', 'internal_id' => 10006],
            ['position' => 'ICSP', 'internal_id' => 10011],
            ['position' => 'ICSP1', 'internal_id' => 10011],
            ['position' => 'RESET', 'internal_id' => 10012],
            ['position' => 'JANALOG', 'internal_id' => 10013],
            ['position' => 'JDIGITAL', 'internal_id' => 10014],
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

        // Test ICT: 1 FAIL initial, apoi 1 PASS
        IctResult::updateOrCreate(
            ['qr_serial_number' => $sampleQr, 'station_id' => 'WS-ICT-07', 'tested_at' => Carbon::now()->subHours(1)->subMinutes(40)->toDateTimeString()],
            [
                'test_result' => 'FAIL',
                'measured_values' => ['PC1' => '46.8uF', 'PC2' => 'SHORT', 'D1_VF' => '0.62V'],
                'failed_nets' => 'NET_VOUT_SHORT, NET_D13',
                'operator_username' => 'operator',
            ]
        );
        IctResult::updateOrCreate(
            ['qr_serial_number' => $sampleQr, 'station_id' => 'WS-ICT-07', 'tested_at' => Carbon::now()->subHours(1)->subMinutes(20)->toDateTimeString()],
            [
                'test_result' => 'PASS',
                'measured_values' => ['PC1' => '47.1uF', 'PC2' => '46.9uF', 'D1_VF' => '0.64V', 'Y1_FREQ' => '16.000MHz', 'VCC_GND' => '>100k'],
                'failed_nets' => null,
                'operator_username' => 'operator',
            ]
        );

        // Test EOL: 1 PASS
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
