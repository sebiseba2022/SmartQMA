<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AoiResult;
use App\Models\BestuckPosition;
use App\Models\EolResult;
use App\Models\IctResult;
use App\Models\InventoryComponent;
use App\Models\ProductDefinition;
use App\Models\SmdPlacement;
use App\Models\StationFeeder;
use App\Models\ThtPlacement;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class TraceabilityController extends Controller
{
    private const IDENT_NAMES = [
        '10002' => 'ATmega328P (Microcontroler 8-bit AVR)',
        '10003' => 'ATmega16U2 (Controller USB-la-Serial)',
        '10004' => 'NCP1117ST50T3G (Regulator LDO 5.0V)',
        '10005' => 'LP2985-33DBVR (Regulator LDO 3.3V)',
        '10006' => 'LMV358IDGKR (Amplificator Operațional Dual)',
        '10007' => 'FDN340P (Tranzistor MOSFET Canal-P)',
        '10008' => 'MF-MSMF050-2 (Siguranță Resetabilă PTC 500mA)',
        '10009' => 'CSTCE16M0V53-R0 (Rezonator Ceramic 16 MHz)',
    ];

    /**
     * Scanare QR serial number PCB
     */
    public function scanQr(string $qr): JsonResponse
    {
        $qr = trim($qr);

        $aoiList = AoiResult::where('qr_serial_number', $qr)->orderBy('tested_at', 'asc')->get();
        $aoiPassCount = $aoiList->where('test_result', 'PASS')->count();
        $aoiFailCount = $aoiList->where('test_result', 'FAIL')->count();

        $ictList = IctResult::where('qr_serial_number', $qr)->orderBy('tested_at', 'asc')->get();
        $ictPassCount = $ictList->where('test_result', 'PASS')->count();
        $ictFailCount = $ictList->where('test_result', 'FAIL')->count();

        $eolList = EolResult::where('qr_serial_number', $qr)->orderBy('tested_at', 'asc')->get();
        $eolPassCount = $eolList->where('test_result', 'PASS')->count();
        $eolFailCount = $eolList->where('test_result', 'FAIL')->count();

        $latestEol = $eolList->last();
        $productIdent = $latestEol ? $latestEol->product_ident : 'ARDUINO_UNO_R3';
        $productDef = ProductDefinition::where('product_ident', $productIdent)->first();

        $hardwareVersion = $latestEol?->hardware_version ?? $productDef?->hardware_version ?? 'N/A';
        $softwareVersion = $latestEol?->software_version ?? $productDef?->software_version ?? 'N/A';

        $smdPlacements = SmdPlacement::with('component')
            ->where('qr_serial_number', $qr)
            ->get()
            ->keyBy('bestuck_position');

        $thtPlacements = ThtPlacement::with('component')
            ->where('qr_serial_number', $qr)
            ->get()
            ->keyBy('bestuck_position');

        $bestuckRecipe = BestuckPosition::where('product_model', $productIdent)->get();

        if ($bestuckRecipe->isEmpty()) {
            $bestuckRecipe = BestuckPosition::all();
        }

        $allPositions = [];
        $registryCounts = [];

        foreach ($bestuckRecipe as $bPos) {
            $pos = $bPos->position;
            $placed = null;
            $stage = null;

            if (isset($smdPlacements[$pos])) {
                $placed = $smdPlacements[$pos];
                $stage = 'SMD';
            } elseif (isset($thtPlacements[$pos])) {
                $placed = $thtPlacements[$pos];
                $stage = 'THT';
            }

            if ($placed) {
                $cInternalId = $placed->component_internal_id;
                $cName = $placed->component ? $placed->component->part_name : 'Componentă #' . $cInternalId;
                $cLot = $placed->component ? ($placed->component->supplier_lot ?? 'N/A') : 'N/A';

                $allPositions[] = [
                    'position' => $pos,
                    'expected_part' => $bPos->expected_part,
                    'stage' => $stage,
                    'is_mounted' => true,
                    'component_internal_id' => $cInternalId,
                    'component_name' => $cName,
                    'supplier_lot' => $cLot,
                    'operator' => $placed->operator_username,
                    'mounted_at' => $placed->mounted_at?->toIso8601String(),
                ];

                if (!isset($registryCounts[$cInternalId])) {
                    $registryCounts[$cInternalId] = [
                        'internal_id' => $cInternalId,
                        'part_name' => $cName,
                        'supplier_lot' => $cLot,
                        'count' => 0,
                    ];
                }
                $registryCounts[$cInternalId]['count']++;
            } else {
                $allPositions[] = [
                    'position' => $pos,
                    'expected_part' => $bPos->expected_part,
                    'stage' => null,
                    'is_mounted' => false,
                    'component_internal_id' => null,
                    'component_name' => null,
                    'supplier_lot' => null,
                    'operator' => null,
                    'mounted_at' => null,
                ];
            }
        }

        return response()->json([
            'status' => 'success',
            'qr_serial_number' => $qr,
            'product_info' => [
                'product_ident' => $productIdent,
                'product_name' => $productDef?->product_name ?? 'Modul Electronic',
                'hardware_version' => $hardwareVersion,
                'software_version' => $softwareVersion,
            ],
            'tests_summary' => [
                'aoi' => [
                    'pass_count' => $aoiPassCount,
                    'fail_count' => $aoiFailCount,
                    'total_tests' => $aoiList->count(),
                    'latest_status' => $aoiList->last()?->test_result ?? 'UNTESTED',
                    'history' => $aoiList,
                ],
                'ict' => [
                    'pass_count' => $ictPassCount,
                    'fail_count' => $ictFailCount,
                    'total_tests' => $ictList->count(),
                    'latest_status' => $ictList->last()?->test_result ?? 'UNTESTED',
                    'history' => $ictList,
                ],
                'eol' => [
                    'pass_count' => $eolPassCount,
                    'fail_count' => $eolFailCount,
                    'total_tests' => $eolList->count(),
                    'latest_status' => $eolList->last()?->test_result ?? 'UNTESTED',
                    'history' => $eolList,
                ],
            ],
            'bestuck_placements' => $allPositions,
            'component_registry' => array_values($registryCounts),
        ]);
    }

    /**
     * Lista comenzi componente din magazie
     */
    public function getInventory(): JsonResponse
    {
        $items = InventoryComponent::orderBy('id', 'asc')->get();
        return response()->json([
            'status' => 'success',
            'data' => $items,
        ]);
    }

    /**
     * Inregistrare comanda noua de componente in magazie
     */
    public function storeInventory(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'ident' => 'nullable|string',
            'part_name' => 'nullable|string',
            'ordered_at' => 'nullable|date',
            'quantity' => 'required|integer|min:1',
            'arrived' => 'nullable|boolean',
            'arrival_time' => 'nullable|date',
            'tracking_number' => 'nullable|string',
            'provider' => 'nullable|string',
            'supplier_lot' => 'nullable|string',
            'production_date' => 'nullable|date',
            'reception_status' => 'nullable|string|in:conform,neconform,in_asteptare',
            'reception_notes' => 'nullable|string',
            'received_by' => 'nullable|string',
        ]);

        $ident = $validated['ident'] ?? '10002';
        $partName = $validated['part_name'] ?? (self::IDENT_NAMES[$ident] ?? ('Componentă #' . $ident));
        $arrived = (bool) ($validated['arrived'] ?? false);
        $orderedAt = !empty($validated['ordered_at']) ? Carbon::parse($validated['ordered_at']) : Carbon::now();
        $arrivalTime = !empty($validated['arrival_time'])
            ? Carbon::parse($validated['arrival_time'])->startOfDay()
            : Carbon::now()->startOfDay();

        $item = InventoryComponent::create([
            'ident' => $ident,
            'part_name' => $partName,
            'ordered_at' => $orderedAt,
            'quantity' => $validated['quantity'],
            'arrived' => $arrived,
            'arrival_time' => $arrivalTime,
            'tracking_number' => $validated['tracking_number'] ?? ('AWB-' . $ident),
            'provider' => $validated['provider'] ?? 'Mouser Electronics',
            'supplier_lot' => $validated['supplier_lot'] ?? ('LOT-' . $ident),
            'production_date' => $validated['production_date'] ?? null,
            'entry_date' => $arrivalTime,
            'reception_status' => $validated['reception_status'] ?? ($arrived ? 'conform' : 'in_asteptare'),
            'reception_notes' => $validated['reception_notes'] ?? null,
            'received_by' => $validated['received_by'] ?? 'operator',
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Comanda de componente a fost înregistrată în magazie.',
            'data' => $item,
        ], 201);
    }

    /**
     * Actualizare status sosire in depozit (arrived & arrival_time) pentru o comanda
     */
    public function updateInventoryArrival(Request $request, int $id): JsonResponse
    {
        $item = InventoryComponent::findOrFail($id);

        $validated = $request->validate([
            'arrived' => 'required|boolean',
            'arrival_time' => 'nullable|date',
        ]);

        $arrived = (bool) $validated['arrived'];
        $arrivalTime = !empty($validated['arrival_time'])
            ? Carbon::parse($validated['arrival_time'])->startOfDay()
            : ($item->arrival_time ?? Carbon::now()->startOfDay());

        $item->update([
            'arrived' => $arrived,
            'arrival_time' => $arrivalTime,
            'entry_date' => $arrivalTime,
            'reception_status' => $arrived ? 'conform' : 'in_asteptare',
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Statusul comenzii a fost actualizat.',
            'data' => $item->fresh(),
        ]);
    }

    /**
     * Anulare / stergere comanda din magazie
     */
    public function deleteInventory(int $id): JsonResponse
    {
        $item = InventoryComponent::findOrFail($id);
        $item->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Comanda a fost anulată.',
        ]);
    }

    /**
     * Alimentatoare active pe statie (Reel setup)
     */
    public function getStationFeeders(string $stationId): JsonResponse
    {
        $feeders = StationFeeder::with('component')
            ->where('station_id', $stationId)
            ->get();

        return response()->json([
            'status' => 'success',
            'station_id' => $stationId,
            'feeders' => $feeders,
        ]);
    }

    /**
     * Scanare rola / punga din magazie pe pozitie / alimentator la SMD sau THT
     */
    public function loadFeeder(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'station_id' => 'required|string',
            'position' => 'required|string',
            'component_internal_id' => 'required|integer|exists:inventory_components,internal_id',
            'loaded_by' => 'nullable|string',
        ]);

        $feeder = StationFeeder::updateOrCreate(
            [
                'station_id' => $validated['station_id'],
                'position' => $validated['position'],
            ],
            [
                'component_internal_id' => $validated['component_internal_id'],
                'loaded_by' => $validated['loaded_by'] ?? 'operator',
                'loaded_at' => Carbon::now(),
            ]
        );

        return response()->json([
            'status' => 'success',
            'message' => 'Rola / lotul din magazie a fost incarcat pe alimentator.',
            'feeder' => $feeder->load('component'),
        ]);
    }

    /**
     * Inregistrare amplasare SMD
     */
    public function recordSmdPlacement(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'station_id' => 'required|string',
            'qr_serial_number' => 'required|string',
            'bestuck_position' => 'required|string',
            'component_internal_id' => 'required|integer|exists:inventory_components,internal_id',
            'operator_username' => 'nullable|string',
        ]);

        $placement = SmdPlacement::create([
            'station_id' => $validated['station_id'],
            'qr_serial_number' => $validated['qr_serial_number'],
            'bestuck_position' => $validated['bestuck_position'],
            'component_internal_id' => $validated['component_internal_id'],
            'operator_username' => $validated['operator_username'] ?? 'operator',
            'mounted_at' => Carbon::now(),
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Amplasare SMD inregistrata cu succes.',
            'placement' => $placement->load('component'),
        ], 201);
    }

    /**
     * Inregistrare amplasare THT
     */
    public function recordThtPlacement(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'station_id' => 'required|string',
            'qr_serial_number' => 'required|string',
            'bestuck_position' => 'required|string',
            'component_internal_id' => 'required|integer|exists:inventory_components,internal_id',
            'operator_username' => 'nullable|string',
        ]);

        $placement = ThtPlacement::create([
            'station_id' => $validated['station_id'],
            'qr_serial_number' => $validated['qr_serial_number'],
            'bestuck_position' => $validated['bestuck_position'],
            'component_internal_id' => $validated['component_internal_id'],
            'operator_username' => $validated['operator_username'] ?? 'operator',
            'mounted_at' => Carbon::now(),
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Amplasare THT inregistrata cu succes.',
            'placement' => $placement->load('component'),
        ], 201);
    }

    /**
     * Inregistrare test AOI
     */
    public function recordAoiTest(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'station_id' => 'required|string',
            'qr_serial_number' => 'required|string',
            'test_result' => 'required|string|in:PASS,FAIL',
            'defect_code' => 'nullable|string',
            'details' => 'nullable|string',
            'operator_username' => 'nullable|string',
        ]);

        $test = AoiResult::create([
            'station_id' => $validated['station_id'],
            'qr_serial_number' => $validated['qr_serial_number'],
            'test_result' => $validated['test_result'],
            'defect_code' => $validated['defect_code'] ?? null,
            'details' => $validated['details'] ?? null,
            'operator_username' => $validated['operator_username'] ?? 'operator',
            'tested_at' => Carbon::now(),
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Test AOI inregistrat.',
            'test' => $test,
        ], 201);
    }

    /**
     * Inregistrare test ICT
     */
    public function recordIctTest(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'station_id' => 'required|string',
            'qr_serial_number' => 'required|string',
            'test_result' => 'required|string|in:PASS,FAIL',
            'measured_values' => 'nullable|array',
            'failed_nets' => 'nullable|string',
            'operator_username' => 'nullable|string',
        ]);

        $test = IctResult::create([
            'station_id' => $validated['station_id'],
            'qr_serial_number' => $validated['qr_serial_number'],
            'test_result' => $validated['test_result'],
            'measured_values' => $validated['measured_values'] ?? null,
            'failed_nets' => $validated['failed_nets'] ?? null,
            'operator_username' => $validated['operator_username'] ?? 'operator',
            'tested_at' => Carbon::now(),
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Test ICT inregistrat.',
            'test' => $test,
        ], 201);
    }

    /**
     * Inregistrare test EOL
     */
    public function recordEolTest(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'station_id' => 'required|string',
            'qr_serial_number' => 'required|string',
            'product_ident' => 'required|string',
            'test_result' => 'required|string|in:PASS,FAIL',
            'current_draw_ma' => 'nullable|numeric',
            'functional_checks' => 'nullable|array',
            'operator_username' => 'nullable|string',
        ]);

        $def = ProductDefinition::where('product_ident', $validated['product_ident'])->first();
        $hwVersion = $def ? $def->hardware_version : 'Rev 1.0';
        $swVersion = $def ? $def->software_version : 'v1.0.0';

        $test = EolResult::create([
            'station_id' => $validated['station_id'],
            'qr_serial_number' => $validated['qr_serial_number'],
            'product_ident' => $validated['product_ident'],
            'hardware_version' => $hwVersion,
            'software_version' => $swVersion,
            'test_result' => $validated['test_result'],
            'current_draw_ma' => $validated['current_draw_ma'] ?? null,
            'functional_checks' => $validated['functional_checks'] ?? null,
            'operator_username' => $validated['operator_username'] ?? 'operator',
            'tested_at' => Carbon::now(),
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Test EOL inregistrat.',
            'test' => $test,
        ], 201);
    }
}
