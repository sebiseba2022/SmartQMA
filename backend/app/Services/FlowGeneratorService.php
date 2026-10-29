<?php

namespace App\Services;

use App\Models\AoiResult;
use App\Models\EolResult;
use App\Models\IctResult;
use App\Models\InventoryComponent;
use App\Models\ProductDefinition;
use App\Models\QrLaserMarking;
use App\Models\SmdPlacement;
use App\Models\StationFeeder;
use App\Models\ThtPlacement;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;

class FlowGeneratorService
{
    private string $configFilePath;

    public function __construct()
    {
        $this->configFilePath = storage_path('app/flow_generator_config.json');
    }

    /**
     * Returnează configurația implicită din fabrică conform specificațiilor de producție
     */
    public function getDefaultConfig(): array
    {
        return [
            'enabled' => true,
            'product_model' => 'ARDUINO_UNO_R3',
            'product_ident' => 'ARD-UNO-R3',
            'serial_prefix_mode' => 'current_date', // 'current_date' sau 'custom'
            'custom_serial_prefix' => Carbon::now()->format('ymd'),

            // Magazie și Recepție Analist Calitate
            'auto_order_warehouse' => true,
            'order_quantity' => 500,
            'auto_qa_inspection' => true,
            'qa_inspector_username' => 'analist_calitate',
            'qa_reception_status' => 'conform',

            // Timpi de ciclu la stații (secunde)
            'qr_cycle_seconds' => 15,
            'smd_cycle_seconds' => 10,
            'aoi_cycle_seconds' => 10,
            'tht_cycle_seconds' => 15,
            'ict_cycle_seconds' => 30,
            'eol_cycle_seconds' => 50,

            // Tranzit QR -> SMD
            'qr_to_smd_seconds' => 30,
            'qr_to_smd_pause_probability_pct' => 5.0,
            'qr_to_smd_pause_min_seconds' => 60,   // 1 minut
            'qr_to_smd_pause_max_seconds' => 600,  // 10 minute

            // Tranzit SMD -> AOI
            'smd_to_aoi_min_seconds' => 25,
            'smd_to_aoi_max_seconds' => 50,
            'smd_to_aoi_pause_probability_pct' => 3.0,
            'smd_to_aoi_pause_min_seconds' => 60,
            'smd_to_aoi_pause_max_seconds' => 300,

            // Suport Lot AOI -> THT (40 - 60 piese trec o dată pe suport)
            'carrier_min_capacity' => 40,
            'carrier_max_capacity' => 60,
            'carrier_default_capacity' => 50,
            'carrier_transit_seconds' => 60,

            // Tranzit THT -> ICT
            'tht_to_ict_min_seconds' => 30,
            'tht_to_ict_max_seconds' => 40,

            // Tranzit ICT -> EOL (încărcasare și drum EOL)
            'ict_to_eol_min_seconds' => 20,
            'ict_to_eol_max_seconds' => 50,
            'ict_to_eol_default_seconds' => 35,

            // Defecte SMD (Total: 2.0%)
            'smd_defect_aoi_pct' => 1.0,  // Prinse la AOI: 1.0%
            'smd_defect_ict_pct' => 0.7,  // Prinse la ICT: 0.7%
            'smd_defect_eol_pct' => 0.3,  // Scăpate la EOL: 0.3%

            // Defecte THT (Total: 1.5%)
            'tht_defect_ict_pct' => 1.0,  // Prinse la ICT: 1.0%
            'tht_defect_eol_pct' => 0.5,  // Scăpate la EOL: 0.5%

            // Defecte QR Laser (0%)
            'qr_defect_pct' => 0.0,
        ];
    }

    /**
     * Încarcă configurația curentă sau cea implicită dacă nu există fișierul
     */
    public function getConfig(): array
    {
        $default = $this->getDefaultConfig();

        if (!File::exists($this->configFilePath)) {
            return $default;
        }

        try {
            $content = File::get($this->configFilePath);
            $parsed = json_decode($content, true);
            if (is_array($parsed)) {
                return array_merge($default, $parsed);
            }
        } catch (\Throwable $e) {
            // Ignorăm și returnăm default
        }

        return $default;
    }

    /**
     * Salvează configurația
     */
    public function saveConfig(array $newConfig): array
    {
        $current = $this->getConfig();
        $merged = array_merge($current, $newConfig);

        // Validări esențiale
        $merged['smd_defect_aoi_pct'] = max(0.0, min(100.0, (float)($merged['smd_defect_aoi_pct'] ?? 1.0)));
        $merged['smd_defect_ict_pct'] = max(0.0, min(100.0, (float)($merged['smd_defect_ict_pct'] ?? 0.7)));
        $merged['smd_defect_eol_pct'] = max(0.0, min(100.0, (float)($merged['smd_defect_eol_pct'] ?? 0.3)));

        $merged['tht_defect_ict_pct'] = max(0.0, min(100.0, (float)($merged['tht_defect_ict_pct'] ?? 1.0)));
        $merged['tht_defect_eol_pct'] = max(0.0, min(100.0, (float)($merged['tht_defect_eol_pct'] ?? 0.5)));

        $merged['qr_defect_pct'] = max(0.0, min(100.0, (float)($merged['qr_defect_pct'] ?? 0.0)));

        $merged['carrier_min_capacity'] = max(1, (int)($merged['carrier_min_capacity'] ?? 40));
        $merged['carrier_max_capacity'] = max($merged['carrier_min_capacity'], (int)($merged['carrier_max_capacity'] ?? 60));
        $merged['carrier_default_capacity'] = max($merged['carrier_min_capacity'], min($merged['carrier_max_capacity'], (int)($merged['carrier_default_capacity'] ?? 50)));

        $dir = dirname($this->configFilePath);
        if (!File::isDirectory($dir)) {
            File::makeDirectory($dir, 0755, true);
        }

        File::put($this->configFilePath, json_encode($merged, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));

        return $merged;
    }

    /**
     * Resetează la configurația din fabrică
     */
    public function resetConfig(): array
    {
        $default = $this->getDefaultConfig();
        $dir = dirname($this->configFilePath);
        if (!File::isDirectory($dir)) {
            File::makeDirectory($dir, 0755, true);
        }
        File::put($this->configFilePath, json_encode($default, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
        return $default;
    }

    /**
     * Asigură existența și aprovizionarea componentelor în magazie cu verificarea analistului de calitate
     */
    public function ensureWarehouseAndQcStock(array $config): array
    {
        $logs = [];
        $requiredComponents = [
            ['ident' => '10002', 'part_name' => 'ATmega328P (Microcontroler 8-bit AVR)', 'provider' => 'Mouser Electronics', 'pos' => 'U1'],
            ['ident' => '10003', 'part_name' => 'ATmega16U2 (Controller USB-la-Serial)', 'provider' => 'Mouser Electronics', 'pos' => 'U3'],
            ['ident' => '10004', 'part_name' => 'NCP1117ST50T3G (Regulator LDO 5.0V)', 'provider' => 'DigiKey', 'pos' => 'U5'],
            ['ident' => '10005', 'part_name' => 'LP2985-33DBVR (Regulator LDO 3.3V)', 'provider' => 'DigiKey', 'pos' => 'U2'],
            ['ident' => '10006', 'part_name' => 'LMV358IDGKR (Amplificator Operațional Dual)', 'provider' => 'Texas Instruments', 'pos' => 'U4'],
            ['ident' => '10007', 'part_name' => 'FDN340P (Tranzistor MOSFET Canal-P)', 'provider' => 'Mouser Electronics', 'pos' => 'T1'],
            ['ident' => '10008', 'part_name' => 'MF-MSMF050-2 (Siguranță Resetabilă PTC 500mA)', 'provider' => 'Farnell', 'pos' => 'F1'],
            ['ident' => '10009', 'part_name' => 'CSTCE16M0V53-R0 (Rezonator Ceramic 16 MHz)', 'provider' => 'Murata', 'pos' => 'Y1'],
        ];

        foreach ($requiredComponents as $comp) {
            $inventoryItem = InventoryComponent::where('ident', $comp['ident'])->first();

            // Dacă componenta nu există sau are stoc sub 50 bucăți, facem comandă automată
            if (!$inventoryItem || $inventoryItem->quantity < 50) {
                if ($config['auto_order_warehouse']) {
                    $orderQty = (int)($config['order_quantity'] ?? 500);

                    if (!$inventoryItem) {
                        $inventoryItem = InventoryComponent::create([
                            'ident' => $comp['ident'],
                            'part_name' => $comp['part_name'],
                            'ordered_at' => Carbon::now()->subHours(2),
                            'quantity' => $orderQty,
                            'arrived' => true,
                            'arrival_time' => Carbon::now()->subHour(),
                            'tracking_number' => 'AWB-' . strtoupper(substr(md5(uniqid()), 0, 10)),
                            'provider' => $comp['provider'],
                            'supplier_lot' => 'LOT-' . date('Ymd') . '-' . $comp['ident'],
                            'production_date' => Carbon::now()->subMonths(1),
                            'reception_status' => $config['auto_qa_inspection'] ? 'conform' : 'in_asteptare',
                            'reception_notes' => $config['auto_qa_inspection']
                                ? 'Lot recepționat și certificat conform IPC-A-610G de către analistul calitate.'
                                : 'Comandă plasată automat de generatorul de flux.',
                            'received_by' => $config['auto_qa_inspection'] ? $config['qa_inspector_username'] : 'magazioner',
                        ]);
                        $logs[] = "[Magazie & Calitate] Comandat automat lot nou pentru {$comp['part_name']} ({$orderQty} buc). Verificat conform de {$config['qa_inspector_username']}.";
                    } else {
                        $inventoryItem->quantity += $orderQty;
                        $inventoryItem->arrived = true;
                        $inventoryItem->arrival_time = Carbon::now();
                        if ($config['auto_qa_inspection']) {
                            $inventoryItem->reception_status = 'conform';
                            $inventoryItem->received_by = $config['qa_inspector_username'];
                            $inventoryItem->reception_notes = 'Suplimentare stoc verificată conform IPC-A-610G de analist calitate.';
                        }
                        $inventoryItem->save();
                        $logs[] = "[Magazie & Calitate] Suplimentat stoc pentru {$comp['part_name']} (+{$orderQty} buc).";
                    }
                }
            } elseif ($config['auto_qa_inspection'] && $inventoryItem->reception_status !== 'conform') {
                $inventoryItem->reception_status = 'conform';
                $inventoryItem->received_by = $config['qa_inspector_username'];
                $inventoryItem->reception_notes = 'Certificat conform de analistul de calitate.';
                $inventoryItem->save();
                $logs[] = "[Analist Calitate] Inspectat lot componentă {$comp['ident']} -> marcat CONFORM.";
            }

            // Asigurăm și configurarea feederelor la stația SMD și THT
            $stationId = ($comp['pos'] === 'U1') ? 'WS-THT-06' : 'WS-SMD-04';
            StationFeeder::updateOrCreate(
                ['station_id' => $stationId, 'position' => $comp['pos']],
                [
                    'component_internal_id' => $inventoryItem ? $inventoryItem->internal_id : 10002,
                    'loaded_by' => 'operator',
                    'loaded_at' => Carbon::now(),
                ]
            );
        }

        return $logs;
    }

    /**
     * Generează un lot complet de plăci PCB respectând timpii industriali și probabilitățile specificate
     */
    public function generateBatch(int $boardCount, array $overrideConfig = []): array
    {
        $config = array_merge($this->getConfig(), $overrideConfig);
        $boardCount = max(1, min(500, $boardCount));

        // 1. Asigurăm magazia și verificarea calității
        $warehouseLogs = $this->ensureWarehouseAndQcStock($config);

        return DB::transaction(function () use ($config, $boardCount, $warehouseLogs) {
            // Blocaj tranzacțional concurent pentru PostgreSQL (evită coliziuni de serii pe viteze mari 60x)
            if (DB::getDriverName() === 'pgsql') {
                DB::statement('SELECT pg_advisory_xact_lock(749281)');
            }

            // 2. Determinăm prefixul de 6 cifre YYMMDD pentru serii
            $prefix = ($config['serial_prefix_mode'] === 'custom' && !empty($config['custom_serial_prefix']))
                ? substr(preg_replace('/[^0-9]/', '', $config['custom_serial_prefix']) . '000000', 0, 6)
                : Carbon::now()->format('ymd');

            // Găsim secvența curentă maximă
            $lastMarking = QrLaserMarking::where('qr_serial_number', 'LIKE', $prefix . '%')
                ->lockForUpdate()
                ->orderBy('qr_serial_number', 'desc')
                ->first();

            $currentSeq = 1;
            if ($lastMarking) {
                $suffix = substr($lastMarking->qr_serial_number, 6);
                if (is_numeric($suffix)) {
                    $currentSeq = ((int) $suffix) + 1;
                }
            }

            $currentTime = Carbon::now()->subMinutes(max(10, (int)($boardCount * 2)));

            // Statistici rezultat
            $stats = [
                'total_boards' => $boardCount,
                'qr_laser' => ['marked' => 0, 'fail' => 0],
                'smd' => ['placed' => 0],
                'aoi' => ['tested' => 0, 'pass' => 0, 'fail' => 0],
                'carrier_batches' => 0,
                'tht' => ['placed' => 0],
                'ict' => ['tested' => 0, 'pass' => 0, 'fail_smd' => 0, 'fail_tht' => 0, 'fail_total' => 0],
                'eol' => ['tested' => 0, 'pass' => 0, 'fail_smd' => 0, 'fail_tht' => 0, 'fail_total' => 0],
                'final_good' => 0,
                'final_scrap' => 0,
                'yield_pct' => 0.0,
            ];

            $eventLogs = array_merge([], $warehouseLogs);
            $generatedSerials = [];

            // Suport/Carrier pentru transferul AOI -> THT
            $carrierCapacity = rand($config['carrier_min_capacity'], $config['carrier_max_capacity']);
            $currentCarrierBoards = [];

            for ($i = 0; $i < $boardCount; $i++) {
                // Alocare sigură serie unică fără coliziuni
                do {
                    $serialNumber = $prefix . sprintf('%06d', $currentSeq++);
                } while (QrLaserMarking::where('qr_serial_number', $serialNumber)->exists());

                $generatedSerials[] = $serialNumber;

            // ------------------------------------------------------------------
            // 1. STATIA QR LASER (15s pe placă, 0% fail implicit)
            // ------------------------------------------------------------------
            $qrDuration = (int)($config['qr_cycle_seconds'] ?? 15);
            $currentTime = $currentTime->copy()->addSeconds($qrDuration);

            // Verificare defect QR Laser
            $qrRoll = mt_rand(1, 10000) / 100.0;
            $qrFail = $qrRoll <= (float)$config['qr_defect_pct'];

            QrLaserMarking::create([
                'qr_serial_number' => $serialNumber,
                'product_model' => $config['product_model'] ?? 'ARDUINO_UNO_R3',
                'pcb_side' => 'TOP',
                'laser_power_pct' => 85.00,
                'mark_duration_ms' => $qrDuration * 1000,
                'operator_username' => 'operator_laser',
                'marked_at' => $currentTime->copy(),
                'status' => $qrFail ? 'FAIL' : 'OK',
                'notes' => $qrFail ? 'Eroare marcare cod QR' : 'Marcat automat de generatorul de flux',
            ]);

            $stats['qr_laser']['marked']++;
            if ($qrFail) {
                $stats['qr_laser']['fail']++;
                $eventLogs[] = "[{$currentTime->format('H:i:s')}] QR Laser: PCB {$serialNumber} -> EROARE MARCARE LASER.";
                continue; // Se oprește aici
            }

            // ------------------------------------------------------------------
            // TRANZIT QR -> SMD (Baza 30s + pauze aleatorii de producție 1-10 min)
            // ------------------------------------------------------------------
            $transitQrToSmd = (int)($config['qr_to_smd_seconds'] ?? 30);
            $pauseQrRoll = mt_rand(1, 10000) / 100.0;
            if ($pauseQrRoll <= (float)($config['qr_to_smd_pause_probability_pct'] ?? 5.0)) {
                $pauseSec = mt_rand(
                    (int)($config['qr_to_smd_pause_min_seconds'] ?? 60),
                    (int)($config['qr_to_smd_pause_max_seconds'] ?? 600)
                );
                $transitQrToSmd += $pauseSec;
                $eventLogs[] = "[{$currentTime->format('H:i:s')}] Linie producție: Pauză aleatorie între QR și SMD de " . round($pauseSec / 60, 1) . " min.";
            }
            $currentTime = $currentTime->copy()->addSeconds($transitQrToSmd);

            // ------------------------------------------------------------------
            // 2. STATIA SMD (10s ciclu)
            // Roll defecte SMD: 1.0% la AOI, 0.7% la ICT, 0.3% la EOL (total 2.0%)
            // ------------------------------------------------------------------
            $smdDuration = (int)($config['smd_cycle_seconds'] ?? 10);
            $currentTime = $currentTime->copy()->addSeconds($smdDuration);

            $smdPositions = [
                ['pos' => 'U3', 'id' => 10003],
                ['pos' => 'U5', 'id' => 10004],
                ['pos' => 'U2', 'id' => 10005],
                ['pos' => 'U4', 'id' => 10006],
                ['pos' => 'T1', 'id' => 10007],
                ['pos' => 'F1', 'id' => 10008],
                ['pos' => 'Y1', 'id' => 10009],
            ];

            foreach ($smdPositions as $sp) {
                SmdPlacement::create([
                    'station_id' => 'WS-SMD-04',
                    'qr_serial_number' => $serialNumber,
                    'bestuck_position' => $sp['pos'],
                    'component_internal_id' => $sp['id'],
                    'operator_username' => 'operator_smd',
                    'mounted_at' => $currentTime->copy(),
                ]);
            }
            $stats['smd']['placed']++;

            // Calculăm defectul SMD pe această placă
            $smdRoll = mt_rand(1, 10000) / 100.0;
            $smdDefectAoiPct = (float)($config['smd_defect_aoi_pct'] ?? 1.0);
            $smdDefectIctPct = (float)($config['smd_defect_ict_pct'] ?? 0.7);
            $smdDefectEolPct = (float)($config['smd_defect_eol_pct'] ?? 0.3);

            $hasSmdDefectAtAoi = false;
            $hasSmdDefectAtIct = false;
            $hasSmdDefectAtEol = false;

            if ($smdRoll <= $smdDefectAoiPct) {
                $hasSmdDefectAtAoi = true;
            } elseif ($smdRoll <= ($smdDefectAoiPct + $smdDefectIctPct)) {
                $hasSmdDefectAtIct = true;
            } elseif ($smdRoll <= ($smdDefectAoiPct + $smdDefectIctPct + $smdDefectEolPct)) {
                $hasSmdDefectAtEol = true;
            }

            // ------------------------------------------------------------------
            // TRANZIT SMD -> AOI (25 - 50s + pauză rară de câteva minute)
            // ------------------------------------------------------------------
            $transitSmdToAoi = mt_rand(
                (int)($config['smd_to_aoi_min_seconds'] ?? 25),
                (int)($config['smd_to_aoi_max_seconds'] ?? 50)
            );
            $pauseSmdRoll = mt_rand(1, 10000) / 100.0;
            if ($pauseSmdRoll <= (float)($config['smd_to_aoi_pause_probability_pct'] ?? 3.0)) {
                $pauseSec = mt_rand(
                    (int)($config['smd_to_aoi_pause_min_seconds'] ?? 60),
                    (int)($config['smd_to_aoi_pause_max_seconds'] ?? 300)
                );
                $transitSmdToAoi += $pauseSec;
                $eventLogs[] = "[{$currentTime->format('H:i:s')}] Buffer SMD-AOI: Pauză rară de " . round($pauseSec / 60, 1) . " min.";
            }
            $currentTime = $currentTime->copy()->addSeconds($transitSmdToAoi);

            // ------------------------------------------------------------------
            // 3. STATIA AOI (Inspecție Optică Automată)
            // Prinde defectele SMD de 1.0%
            // ------------------------------------------------------------------
            $aoiDuration = (int)($config['aoi_cycle_seconds'] ?? 10);
            $currentTime = $currentTime->copy()->addSeconds($aoiDuration);
            $stats['aoi']['tested']++;

            if ($hasSmdDefectAtAoi) {
                $aoiDefects = [
                    ['code' => 'SCURTCIRCUIT_PINI_U3', 'desc' => 'Punte de cositor între pinii 14-15 U3 ATmega16U2'],
                    ['code' => 'LIPSA_COMPONENTA_R1', 'desc' => 'Componentă lipsă poziție R1 (nepreluată din feeder)'],
                    ['code' => 'TOMBSTONE_C12', 'desc' => 'Efect tombstone (componentă ridicată pe un capăt) C12'],
                    ['code' => 'DEPLASARE_U2_SOIC', 'desc' => 'Deplasare rotațională peste toleranță U2 NCP1117'],
                ];
                $pickedDefect = $aoiDefects[array_rand($aoiDefects)];

                AoiResult::create([
                    'station_id' => 'WS-AOI-05',
                    'qr_serial_number' => $serialNumber,
                    'test_result' => 'FAIL',
                    'defect_code' => $pickedDefect['code'],
                    'details' => $pickedDefect['desc'],
                    'operator_username' => 'operator_aoi',
                    'tested_at' => $currentTime->copy(),
                ]);

                $stats['aoi']['fail']++;
                $stats['final_scrap']++;
                $eventLogs[] = "[{$currentTime->format('H:i:s')}] AOI FAIL: PCB {$serialNumber} -> {$pickedDefect['code']} ({$pickedDefect['desc']}). Oprit la inspecție.";
                continue; // Placa e rebut la AOI, nu trece mai departe
            }

            // AOI PASS
            AoiResult::create([
                'station_id' => 'WS-AOI-05',
                'qr_serial_number' => $serialNumber,
                'test_result' => 'PASS',
                'defect_code' => null,
                'details' => 'Inspectat optic automat 100% conform IPC-A-610G.',
                'operator_username' => 'operator_aoi',
                'tested_at' => $currentTime->copy(),
            ]);
            $stats['aoi']['pass']++;

            // ------------------------------------------------------------------
            // 4. SUPORT LOT (CARRIER) AOI -> THT (40 - 60 piese per suport)
            // ------------------------------------------------------------------
            $currentCarrierBoards[] = [
                'serial' => $serialNumber,
                'time' => $currentTime->copy(),
                'hasSmdDefectAtIct' => $hasSmdDefectAtIct,
                'hasSmdDefectAtEol' => $hasSmdDefectAtEol,
            ];

            // Când suportul este plin sau este ultima placă, lotul se transferă la THT
            $isCarrierReady = count($currentCarrierBoards) >= $carrierCapacity || ($i === $boardCount - 1);

            if ($isCarrierReady && count($currentCarrierBoards) > 0) {
                $carrierCount = count($currentCarrierBoards);
                $carrierTransit = (int)($config['carrier_transit_seconds'] ?? 60);
                $currentTime = $currentTime->copy()->addSeconds($carrierTransit);
                $stats['carrier_batches']++;
                $eventLogs[] = "[{$currentTime->format('H:i:s')}] Suport Lot: Transferat tavă suport completă cu {$carrierCount} bucăți de la AOI la THT.";

                // Procesăm plăcile din suport prin THT, ICT și EOL
                foreach ($currentCarrierBoards as $boardData) {
                    $bSerial = $boardData['serial'];
                    $bHasSmdDefectAtIct = $boardData['hasSmdDefectAtIct'];
                    $bHasSmdDefectAtEol = $boardData['hasSmdDefectAtEol'];

                    // ----------------------------------------------------------
                    // 5. STATIA THT (Amplasare manuală & cositorire U1 DIP28, 15s)
                    // Roll defecte THT: 1.0% la ICT, 0.5% la EOL (total 1.5%)
                    // ----------------------------------------------------------
                    $thtDuration = (int)($config['tht_cycle_seconds'] ?? 15);
                    $currentTime = $currentTime->copy()->addSeconds($thtDuration);

                    ThtPlacement::create([
                        'station_id' => 'WS-THT-06',
                        'qr_serial_number' => $bSerial,
                        'bestuck_position' => 'U1',
                        'component_internal_id' => 10002, // ATmega328P DIP28
                        'operator_username' => 'operator_tht',
                        'mounted_at' => $currentTime->copy(),
                    ]);
                    $stats['tht']['placed']++;

                    // Calculăm defectul THT
                    $thtRoll = mt_rand(1, 10000) / 100.0;
                    $thtDefectIctPct = (float)($config['tht_defect_ict_pct'] ?? 1.0);
                    $thtDefectEolPct = (float)($config['tht_defect_eol_pct'] ?? 0.5);

                    $hasThtDefectAtIct = false;
                    $hasThtDefectAtEol = false;

                    if ($thtRoll <= $thtDefectIctPct) {
                        $hasThtDefectAtIct = true;
                    } elseif ($thtRoll <= ($thtDefectIctPct + $thtDefectEolPct)) {
                        $hasThtDefectAtEol = true;
                    }

                    // ----------------------------------------------------------
                    // TRANZIT THT -> ICT (30 - 40s)
                    // ----------------------------------------------------------
                    $transitThtToIct = mt_rand(
                        (int)($config['tht_to_ict_min_seconds'] ?? 30),
                        (int)($config['tht_to_ict_max_seconds'] ?? 40)
                    );
                    $currentTime = $currentTime->copy()->addSeconds($transitThtToIct);

                    // ----------------------------------------------------------
                    // 6. STATIA ICT (In-Circuit Testing Bed-of-Nails, 30s)
                    // Prinde defectele SMD de 0.7% și defectele THT de 1.0%
                    // ----------------------------------------------------------
                    $ictDuration = (int)($config['ict_cycle_seconds'] ?? 30);
                    $currentTime = $currentTime->copy()->addSeconds($ictDuration);
                    $stats['ict']['tested']++;

                    if ($bHasSmdDefectAtIct) {
                        IctResult::create([
                            'station_id' => 'WS-ICT-07',
                            'qr_serial_number' => $bSerial,
                            'test_result' => 'FAIL',
                            'measured_values' => ['vcc_5v' => 0.05, 'vcc_3v3' => 0.0, 'xtal_freq_mhz' => 0.0],
                            'failed_nets' => 'NET_3V3_SHORT_GND, U3_RESET_PIN_OPEN',
                            'operator_username' => 'operator_ict',
                            'tested_at' => $currentTime->copy(),
                        ]);
                        $stats['ict']['fail_smd']++;
                        $stats['ict']['fail_total']++;
                        $stats['final_scrap']++;
                        $eventLogs[] = "[{$currentTime->format('H:i:s')}] ICT FAIL (SMD): PCB {$bSerial} -> Scurtcircuit depistat la testul electric in-circuit (NET_3V3_SHORT_GND).";
                        continue;
                    }

                    if ($hasThtDefectAtIct) {
                        IctResult::create([
                            'station_id' => 'WS-ICT-07',
                            'qr_serial_number' => $bSerial,
                            'test_result' => 'FAIL',
                            'measured_values' => ['vcc_5v' => 5.01, 'pin_u1_reset' => 'OPEN', 'tht_joint_r' => '>10M'],
                            'failed_nets' => 'U1_DIP28_PIN1_RESET_COLD_SOLDER, PIN_HEADER_J1_BRIDGE',
                            'operator_username' => 'operator_ict',
                            'tested_at' => $currentTime->copy(),
                        ]);
                        $stats['ict']['fail_tht']++;
                        $stats['ict']['fail_total']++;
                        $stats['final_scrap']++;
                        $eventLogs[] = "[{$currentTime->format('H:i:s')}] ICT FAIL (THT): PCB {$bSerial} -> Lipitură rece / pin nesudat la soclul DIP-28 U1 (PIN1_RESET).";
                        continue;
                    }

                    // ICT PASS
                    IctResult::create([
                        'station_id' => 'WS-ICT-07',
                        'qr_serial_number' => $bSerial,
                        'test_result' => 'PASS',
                        'measured_values' => ['vcc_5v' => 5.02, 'vcc_3v3' => 3.31, 'xtal_freq_mhz' => 16.00, 'reset_pullup_kohm' => 9.98],
                        'failed_nets' => null,
                        'operator_username' => 'operator_ict',
                        'tested_at' => $currentTime->copy(),
                    ]);
                    $stats['ict']['pass']++;

                    // ----------------------------------------------------------
                    // TRANZIT ICT -> EOL (Încărcasare & deplasare EOL, 20 - 50s)
                    // ----------------------------------------------------------
                    $transitIctToEol = mt_rand(
                        (int)($config['ict_to_eol_min_seconds'] ?? 20),
                        (int)($config['ict_to_eol_max_seconds'] ?? 50)
                    );
                    $currentTime = $currentTime->copy()->addSeconds($transitIctToEol);

                    // ----------------------------------------------------------
                    // 7. STATIA EOL (End-of-Line Functional Test, 50s)
                    // Prinde defectele SMD de 0.3% și defectele THT de 0.5%
                    // ----------------------------------------------------------
                    $eolDuration = (int)($config['eol_cycle_seconds'] ?? 50);
                    $currentTime = $currentTime->copy()->addSeconds($eolDuration);
                    $stats['eol']['tested']++;

                    if ($bHasSmdDefectAtEol) {
                        EolResult::create([
                            'station_id' => 'WS-EOL-08',
                            'qr_serial_number' => $bSerial,
                            'product_ident' => $config['product_ident'] ?? 'ARD-UNO-R3',
                            'hardware_version' => 'Rev 3.0',
                            'software_version' => 'v1.4.2',
                            'test_result' => 'FAIL',
                            'current_draw_ma' => 185.4, // Supracurent
                            'functional_checks' => [
                                'usb_comm' => false,
                                'gpio_test' => true,
                                'adc_test' => false,
                                'eeprom_test' => true,
                                'current_consumption' => false,
                            ],
                            'operator_username' => 'operator_eol',
                            'tested_at' => $currentTime->copy(),
                        ]);
                        $stats['eol']['fail_smd']++;
                        $stats['eol']['fail_total']++;
                        $stats['final_scrap']++;
                        $eventLogs[] = "[{$currentTime->format('H:i:s')}] EOL FAIL (SMD): PCB {$bSerial} -> Eșec comunicație USB / consum anormal supracurent (185.4 mA).";
                        continue;
                    }

                    if ($hasThtDefectAtEol) {
                        EolResult::create([
                            'station_id' => 'WS-EOL-08',
                            'qr_serial_number' => $bSerial,
                            'product_ident' => $config['product_ident'] ?? 'ARD-UNO-R3',
                            'hardware_version' => 'Rev 3.0',
                            'software_version' => 'v1.4.2',
                            'test_result' => 'FAIL',
                            'current_draw_ma' => 49.2,
                            'functional_checks' => [
                                'usb_comm' => true,
                                'gpio_test' => false,
                                'adc_test' => false,
                                'eeprom_test' => true,
                                'current_consumption' => true,
                            ],
                            'operator_username' => 'operator_eol',
                            'tested_at' => $currentTime->copy(),
                        ]);
                        $stats['eol']['fail_tht']++;
                        $stats['eol']['fail_total']++;
                        $stats['final_scrap']++;
                        $eventLogs[] = "[{$currentTime->format('H:i:s')}] EOL FAIL (THT): PCB {$bSerial} -> Eroare intrare analogică / conector THT slăbit la vibrații.";
                        continue;
                    }

                    // EOL PASS - PRODUS BUN FINALIZAT!
                    EolResult::create([
                        'station_id' => 'WS-EOL-08',
                        'qr_serial_number' => $bSerial,
                        'product_ident' => $config['product_ident'] ?? 'ARD-UNO-R3',
                        'hardware_version' => 'Rev 3.0',
                        'software_version' => 'v1.4.2',
                        'test_result' => 'PASS',
                        'current_draw_ma' => 48.5,
                        'functional_checks' => [
                            'usb_comm' => true,
                            'gpio_test' => true,
                            'adc_test' => true,
                            'eeprom_test' => true,
                            'current_consumption' => true,
                        ],
                        'operator_username' => 'operator_eol',
                        'tested_at' => $currentTime->copy(),
                    ]);
                    $stats['eol']['pass']++;
                    $stats['final_good']++;
                    $eventLogs[] = "[{$currentTime->format('H:i:s')}] EOL PASS: PCB {$bSerial} -> TESTAT FUNCȚIONAL 100% OK. Produs final gata de împachetare.";
                }

                // Resetăm suportul pentru următorul lot
                $currentCarrierBoards = [];
                $carrierCapacity = rand($config['carrier_min_capacity'], $config['carrier_max_capacity']);
            }
        }

            // Calculăm randamentul global (Yield %)
            $stats['yield_pct'] = $boardCount > 0 ? round(($stats['final_good'] / $boardCount) * 100, 2) : 0.0;

            return [
                'status' => 'success',
                'message' => "Lotul de {$boardCount} plăci a fost generat și procesat cu succes prin fluxul de producție.",
                'stats' => $stats,
                'logs' => array_slice($eventLogs, -100), // Ultimele 100 de înregistrări
                'generated_serials_count' => count($generatedSerials),
                'first_serial' => $generatedSerials[0] ?? null,
                'last_serial' => end($generatedSerials) ?: null,
            ];
        });
    }

    /**
     * Returnează statistici live agregate din baza de date
     */
    public function getAggregatedStats(): array
    {
        $qrTotal = QrLaserMarking::count();
        $smdTotal = SmdPlacement::distinct('qr_serial_number')->count('qr_serial_number');

        $aoiPass = AoiResult::where('test_result', 'PASS')->count();
        $aoiFail = AoiResult::where('test_result', 'FAIL')->count();

        $thtTotal = ThtPlacement::distinct('qr_serial_number')->count('qr_serial_number');

        $ictPass = IctResult::where('test_result', 'PASS')->count();
        $ictFail = IctResult::where('test_result', 'FAIL')->count();

        $eolPass = EolResult::where('test_result', 'PASS')->count();
        $eolFail = EolResult::where('test_result', 'FAIL')->count();

        return [
            'qr_total' => $qrTotal,
            'smd_boards_total' => $smdTotal,
            'aoi' => ['pass' => $aoiPass, 'fail' => $aoiFail, 'total' => $aoiPass + $aoiFail],
            'tht_boards_total' => $thtTotal,
            'ict' => ['pass' => $ictPass, 'fail' => $ictFail, 'total' => $ictPass + $ictFail],
            'eol' => ['pass' => $eolPass, 'fail' => $eolFail, 'total' => $eolPass + $eolFail],
            'final_good' => $eolPass,
            'final_scrap' => $aoiFail + $ictFail + $eolFail,
            'yield_pct' => ($eolPass + $aoiFail + $ictFail + $eolFail) > 0
                ? round(($eolPass / ($eolPass + $aoiFail + $ictFail + $eolFail)) * 100, 2)
                : 100.0,
        ];
    }
}

