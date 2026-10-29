<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\FlowGeneratorService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FlowGeneratorController extends Controller
{
    private FlowGeneratorService $generatorService;

    public function __construct(FlowGeneratorService $generatorService)
    {
        $this->generatorService = $generatorService;
    }

    /**
     * Obține configurația completă a generatorului de flux
     */
    public function getConfig(): JsonResponse
    {
        return response()->json([
            'status' => 'success',
            'data' => $this->generatorService->getConfig(),
            'default' => $this->generatorService->getDefaultConfig(),
        ]);
    }

    /**
     * Salvează configurația editată
     */
    public function saveConfig(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'enabled' => 'nullable|boolean',
            'product_model' => 'nullable|string',
            'product_ident' => 'nullable|string',
            'serial_prefix_mode' => 'nullable|string|in:current_date,custom',
            'custom_serial_prefix' => 'nullable|string',

            // Magazie & Calitate
            'auto_order_warehouse' => 'nullable|boolean',
            'order_quantity' => 'nullable|integer|min:10|max:10000',
            'auto_qa_inspection' => 'nullable|boolean',
            'qa_inspector_username' => 'nullable|string',
            'qa_reception_status' => 'nullable|string|in:conform,neconform,in_asteptare',

            // Timpi ciclu (secunde)
            'qr_cycle_seconds' => 'nullable|numeric|min:1|max:120',
            'smd_cycle_seconds' => 'nullable|numeric|min:1|max:120',
            'aoi_cycle_seconds' => 'nullable|numeric|min:1|max:120',
            'tht_cycle_seconds' => 'nullable|numeric|min:1|max:120',
            'ict_cycle_seconds' => 'nullable|numeric|min:1|max:120',
            'eol_cycle_seconds' => 'nullable|numeric|min:1|max:180',

            // Tranzit QR -> SMD
            'qr_to_smd_seconds' => 'nullable|numeric|min:1|max:300',
            'qr_to_smd_pause_probability_pct' => 'nullable|numeric|min:0|max:100',
            'qr_to_smd_pause_min_seconds' => 'nullable|numeric|min:1|max:1800',
            'qr_to_smd_pause_max_seconds' => 'nullable|numeric|min:1|max:3600',

            // Tranzit SMD -> AOI
            'smd_to_aoi_min_seconds' => 'nullable|numeric|min:1|max:300',
            'smd_to_aoi_max_seconds' => 'nullable|numeric|min:1|max:300',
            'smd_to_aoi_pause_probability_pct' => 'nullable|numeric|min:0|max:100',
            'smd_to_aoi_pause_min_seconds' => 'nullable|numeric|min:1|max:1800',
            'smd_to_aoi_pause_max_seconds' => 'nullable|numeric|min:1|max:3600',

            // Suport Lot AOI -> THT
            'carrier_min_capacity' => 'nullable|integer|min:1|max:500',
            'carrier_max_capacity' => 'nullable|integer|min:1|max:500',
            'carrier_default_capacity' => 'nullable|integer|min:1|max:500',
            'carrier_transit_seconds' => 'nullable|numeric|min:1|max:600',

            // Tranzit THT -> ICT
            'tht_to_ict_min_seconds' => 'nullable|numeric|min:1|max:300',
            'tht_to_ict_max_seconds' => 'nullable|numeric|min:1|max:300',

            // Tranzit ICT -> EOL
            'ict_to_eol_min_seconds' => 'nullable|numeric|min:1|max:300',
            'ict_to_eol_max_seconds' => 'nullable|numeric|min:1|max:300',
            'ict_to_eol_default_seconds' => 'nullable|numeric|min:1|max:300',

            // Defecte SMD
            'smd_defect_aoi_pct' => 'nullable|numeric|min:0|max:100',
            'smd_defect_ict_pct' => 'nullable|numeric|min:0|max:100',
            'smd_defect_eol_pct' => 'nullable|numeric|min:0|max:100',

            // Defecte THT
            'tht_defect_ict_pct' => 'nullable|numeric|min:0|max:100',
            'tht_defect_eol_pct' => 'nullable|numeric|min:0|max:100',

            // QR Defect
            'qr_defect_pct' => 'nullable|numeric|min:0|max:100',
        ]);

        $saved = $this->generatorService->saveConfig($validated);

        return response()->json([
            'status' => 'success',
            'message' => 'Configurația generatorului de flux a fost salvată cu succes.',
            'data' => $saved,
        ]);
    }

    /**
     * Resetează configurația la valorile implicite de fabrică
     */
    public function resetConfig(): JsonResponse
    {
        $default = $this->generatorService->resetConfig();

        return response()->json([
            'status' => 'success',
            'message' => 'Configurația a fost resetată la valorile implicite de fabrică.',
            'data' => $default,
        ]);
    }

    /**
     * Generează un lot de plăci prin fluxul de producție
     */
    public function generateBatch(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'count' => 'required|integer|min:1|max:500',
            'override_config' => 'nullable|array',
        ]);

        $count = (int)$validated['count'];
        $overrideConfig = $validated['override_config'] ?? [];

        $result = $this->generatorService->generateBatch($count, $overrideConfig);

        return response()->json($result);
    }

    /**
     * Returnează statistici live ale fluxului de producție
     */
    public function getStats(): JsonResponse
    {
        $stats = $this->generatorService->getAggregatedStats();

        return response()->json([
            'status' => 'success',
            'data' => $stats,
        ]);
    }

    /**
     * Declanșează manual verificarea stocului și inspecția calității
     */
    public function checkWarehouseAndQc(Request $request): JsonResponse
    {
        $config = $this->generatorService->getConfig();
        $logs = $this->generatorService->ensureWarehouseAndQcStock($config);

        return response()->json([
            'status' => 'success',
            'message' => 'Verificarea stocului și a recepției calității a fost finalizată.',
            'logs' => $logs,
        ]);
    }
}

