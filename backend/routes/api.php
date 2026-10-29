<?php

use App\Http\Controllers\Api\TraceabilityController;
use App\Models\User;
use App\Models\UserStationAccess;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| SmartQMA API Routes (v1)
|--------------------------------------------------------------------------
*/

Route::prefix('v1')->group(function () {

    // POST /api/v1/auth/login - Autentificare utilizator (Bcrypt hash check)
    Route::post('/auth/login', function (Request $request) {
        $validated = $request->validate([
            'username' => 'required|string',
            'password' => 'required|string',
        ]);

        $cleanUsername = strtolower(trim($validated['username']));
        $user = User::whereRaw('LOWER(username) = ?', [$cleanUsername])->first();

        if (! $user || ! Hash::check($validated['password'], $user->password)) {
            return response()->json([
                'status' => 'error',
                'message' => 'Nume de utilizator sau parolă incorectă.',
            ], 401);
        }

        if (! $user->is_active) {
            return response()->json([
                'status' => 'error',
                'message' => 'Contul este dezactivat. Contactați administratorul (Owner).',
            ], 403);
        }

        return response()->json([
            'status' => 'success',
            'message' => 'Autentificare reușită.',
            'user' => [
                'id' => $user->id,
                'username' => $user->username,
                'name' => $user->name,
                'role' => $user->role,
                'barcode' => $user->barcode,
                'email' => $user->email,
            ],
            // Token simplu de sesiune pentru clientul React
            'token' => base64_encode($user->id . ':' . $user->username . ':' . time()),
        ]);
    });

    // POST /api/v1/auth/verify-station-barcode - Verificare acces pe post pe baza codului de bare al operatorului
    Route::post('/auth/verify-station-barcode', function (Request $request) {
        $validated = $request->validate([
            'station_id' => 'required|string',
            'barcode' => 'required|string',
        ]);

        $barcode = trim($validated['barcode']);
        $stationId = trim($validated['station_id']);

        $user = User::where('barcode', $barcode)->first();
        if (! $user) {
            return response()->json([
                'status' => 'error',
                'authorized' => false,
                'message' => 'Cod de bare nerecunoscut în baza de date.',
            ], 404);
        }

        if (! $user->is_active) {
            return response()->json([
                'status' => 'error',
                'authorized' => false,
                'message' => 'Contul operatorului este dezactivat.',
            ], 403);
        }

        // Rolurile superioare (Director, Owner, Inginer) au acces garantat
        if ($user->isOwner() || $user->isDirector() || $user->isEngineer()) {
            return response()->json([
                'status' => 'success',
                'authorized' => true,
                'user' => [
                    'id' => $user->id,
                    'username' => $user->username,
                    'name' => $user->name,
                    'role' => $user->role,
                    'barcode' => $user->barcode,
                ],
                'station_id' => $stationId,
                'message' => 'Acces autorizat complet.',
            ]);
        }

        // Pentru operatori: verificare tabel dedicat user_station_access
        $hasAccess = UserStationAccess::where('user_id', $user->id)
            ->where('station_id', $stationId)
            ->where('is_authorized', true)
            ->exists();

        if (! $hasAccess) {
            return response()->json([
                'status' => 'error',
                'authorized' => false,
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'role' => $user->role,
                ],
                'message' => "Operatorul {$user->name} nu este autorizat pentru postul selectat ({$stationId}).",
            ], 403);
        }

        return response()->json([
            'status' => 'success',
            'authorized' => true,
            'user' => [
                'id' => $user->id,
                'username' => $user->username,
                'name' => $user->name,
                'role' => $user->role,
                'barcode' => $user->barcode,
            ],
            'station_id' => $stationId,
            'message' => "Acces autorizat pe baza legitimației de operator ({$user->name}).",
        ]);
    });

    // GET /api/v1/workstations - Lista posturilor de lucru din linia de producție
    Route::get('/workstations', function () {
        $workstations = [
            [
                'id' => 1,
                'slug' => 'magazie',
                'title' => 'Zona de stocare - Magazie',
                'code' => 'WS-MAG-01',
                'category' => 'Stocare & Logistică',
                'type' => 'storage',
                'allowed_roles' => ['magazioner', 'analist_calitate', 'engineer', 'director', 'owner'],
                'description' => 'Recepție și eliberare componente electronice, trasabilitate loturi și trasabilitate FIFO.',
            ],
            [
                'id' => 2,
                'slug' => 'receptie-marfa',
                'title' => 'Punct de verificare - Receptie marfa',
                'code' => 'WS-REC-02',
                'category' => 'Control Calitate Ieșire/Intrare',
                'type' => 'inspection',
                'allowed_roles' => ['analist_calitate', 'magazioner', 'engineer', 'director', 'owner'],
                'description' => 'Inspectare vizuală a ambalajelor, verificare conformitate Certificate de Conformitate (CoC).',
            ],
            [
                'id' => 3,
                'slug' => 'qr-laser',
                'title' => 'Zona de marcare - QR Laser',
                'code' => 'WS-LSR-03',
                'category' => 'Identificare & Marcare',
                'type' => 'marking',
                'allowed_roles' => ['operator', 'production', 'engineer', 'director', 'owner'],
                'description' => 'Gravare laser cod DataMatrix 2D / QR pe PCB-uri pentru trasabilitate serializată unică.',
            ],
            [
                'id' => 4,
                'slug' => 'smd',
                'title' => 'Zona de amplasare - SMD',
                'code' => 'WS-SMD-04',
                'category' => 'Asamblare Suprafață',
                'type' => 'assembly',
                'allowed_roles' => ['operator', 'production', 'engineer', 'director', 'owner'],
                'description' => 'Linii de pick-and-place automatizate, imprimare pastă de lipit și cuptoare reflow.',
            ],
            [
                'id' => 5,
                'slug' => 'aoi',
                'title' => 'Punct de verificare - AOI',
                'code' => 'WS-AOI-05',
                'category' => 'Inspecție Optică Automată',
                'type' => 'inspection',
                'allowed_roles' => ['operator', 'production', 'engineer', 'director', 'owner'],
                'description' => 'Validare automată a alinierii componentelor, scurtcircuitelor și joncțiunilor de lipire.',
            ],
            [
                'id' => 6,
                'slug' => 'tht',
                'title' => 'Zona de amplasare - THT',
                'code' => 'WS-THT-06',
                'category' => 'Asamblare Manuală / Through-Hole',
                'type' => 'assembly',
                'allowed_roles' => ['operator', 'production', 'engineer', 'director', 'owner'],
                'description' => 'Inserție manuală/robotizată a componentelor de putere through-hole și lipire selectivă.',
            ],
            [
                'id' => 7,
                'slug' => 'ict',
                'title' => 'Punct de verificare - ICT',
                'code' => 'WS-ICT-07',
                'category' => 'Testare Electrică În Circuit',
                'type' => 'testing',
                'allowed_roles' => ['operator', 'production', 'engineer', 'director', 'owner'],
                'description' => 'Testare parametri pasivi/activi (In-Circuit Test) folosind pat de ace și semnale electrice.',
            ],
            [
                'id' => 8,
                'slug' => 'eol',
                'title' => 'Punct de verificare - EOL',
                'code' => 'WS-EOL-08',
                'category' => 'Testare Funcțională Finală',
                'type' => 'testing',
                'allowed_roles' => ['operator', 'production', 'engineer', 'director', 'owner'],
                'description' => 'Testare finală End-Of-Line: alimentare la parametri nominali, calibrare senzori și testare firmware.',
            ],
            [
                'id' => 9,
                'slug' => 'export',
                'title' => 'Zona de scanare - Export',
                'code' => 'WS-EXP-09',
                'category' => 'Scanare & Ambalare Finală',
                'type' => 'export',
                'allowed_roles' => ['operator', 'production', 'engineer', 'director', 'owner'],
                'description' => 'Validare împachetare, asociere cutie/palet, generare etichete de livrare și închidere comandă.',
            ],
            [
                'id' => 10,
                'slug' => 'statistica',
                'title' => 'Statistica',
                'code' => 'WS-STA-10',
                'category' => 'Management & Analiză Producție',
                'type' => 'statistics',
                'allowed_roles' => ['director', 'owner'],
                'description' => 'Panou executiv: indicatori FPY (First Pass Yield), Scrap Rate, timpi de tact și distribuția defectelor.',
            ],
            [
                'id' => 11,
                'slug' => 'plm',
                'title' => 'Product Lifetime Management (PLM)',
                'code' => 'WS-PLM-11',
                'category' => 'Management Date Tehnice',
                'type' => 'lifecycle',
                'allowed_roles' => ['engineer', 'director', 'owner', 'magazioner', 'analist_calitate'],
                'description' => 'Managementul ciclului de viață al componentelor, specificații tehnice, fișe de catalog (datasheet) și nomenclator identuri.',
            ],
        ];

        return response()->json([
            'status' => 'success',
            'count' => count($workstations),
            'data' => $workstations,
        ]);
    });

    // -------------------------------------------------------------
    // Trasabilitate Industrială & Scanare Cod QR
    // -------------------------------------------------------------
    // GET /api/v1/traceability/scan/{qr} -> Rezultate teste AOI, ICT, EOL (pass/fail) + Amplasare Bestück SMD/THT
    Route::get('/traceability/scan/{qr}', [TraceabilityController::class, 'scanQr']);

    // Magazie & Comenzi componente + Nomenclator Identuri & Datasheet
    Route::get('/idents', [TraceabilityController::class, 'getComponentIdents']);
    Route::post('/idents', [TraceabilityController::class, 'storeComponentIdent']);
    Route::get('/idents/{ident}/datasheet', function (string $ident) {
        $safeIdent = preg_replace('/[^0-9A-Za-z_-]/', '', $ident);
        $path = TraceabilityController::getIdentPdfPath($safeIdent);

        if (! $path || ! file_exists($path)) {
            return response()->json([
                'status' => 'error',
                'message' => "Datasheet-ul pentru identul {$safeIdent} nu a fost găsit în dosarul unic ident-storage.",
            ], 404);
        }

        $fileSize = filesize($path);
        $downloadId = bin2hex(random_bytes(8));

        $headers = [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'inline; filename="' . $safeIdent . '.pdf"',
            'Content-Length' => (string) $fileSize,
            'Accept-Ranges' => 'bytes',
            'Cache-Control' => 'no-cache, must-revalidate',
        ];

        return response()->stream(function () use ($path, $downloadId) {
            $handle = fopen($path, 'rb');
            if (! $handle) {
                return;
            }

            $chunkSize = 64 * 1024; // 64 KB per chunk
            $isTesting = app()->runningUnitTests();

            // Calculează viteza inițială bazată pe conexiunile active curente
            $activeCount = \App\Services\DownloadBandwidthManager::heartbeat($downloadId);
            $currentSpeed = \App\Services\DownloadBandwidthManager::calculateSpeed($activeCount);

            $lastCheckTime = microtime(true);
            $windowStartTime = microtime(true);
            $bytesSentInWindow = 0;

            try {
                while (! feof($handle) && ! connection_aborted()) {
                    $buffer = fread($handle, $chunkSize);
                    if ($buffer === false || $buffer === '') {
                        break;
                    }

                    echo $buffer;
                    if (ob_get_level() > 0) {
                        ob_flush();
                    }
                    flush();

                    $chunkBytes = strlen($buffer);
                    $bytesSentInWindow += $chunkBytes;

                    $now = microtime(true);

                    // Reevaluare periodică la fiecare 2 secunde: actualizează numărul de descărcări active și redistribuie viteza
                    if (($now - $lastCheckTime) >= \App\Services\DownloadBandwidthManager::RECHECK_INTERVAL_SECONDS) {
                        $activeCount = \App\Services\DownloadBandwidthManager::heartbeat($downloadId);
                        $currentSpeed = \App\Services\DownloadBandwidthManager::calculateSpeed($activeCount);
                        $lastCheckTime = $now;
                        $windowStartTime = $now;
                        $bytesSentInWindow = 0;
                    }

                    // Reglare dinamică a debitului dacă nu suntem în teste unitare
                    if (! $isTesting && $currentSpeed > 0) {
                        $elapsedInWindow = microtime(true) - $windowStartTime;
                        $expectedTime = $bytesSentInWindow / $currentSpeed;

                        if ($expectedTime > $elapsedInWindow) {
                            $sleepUs = (int) (($expectedTime - $elapsedInWindow) * 1_000_000);
                            if ($sleepUs > 0) {
                                usleep($sleepUs);
                            }
                        }
                    }
                }
            } finally {
                fclose($handle);
                \App\Services\DownloadBandwidthManager::release($downloadId);
            }
        }, 200, $headers);
    });

    Route::post('/idents/{ident}/datasheet', function (Request $request, string $ident) {
        $request->validate([
            'datasheet' => 'required|file|mimes:pdf|max:20480',
        ]);
        $safeIdent = preg_replace('/[^0-9A-Za-z_-]/', '', $ident);
        $dir = TraceabilityController::getIdentStorageDirectory();
        $request->file('datasheet')->move($dir, "{$safeIdent}.pdf");

        return response()->json([
            'status' => 'success',
            'message' => "Datasheet-ul a fost salvat cu succes în ident-storage/{$safeIdent}.pdf.",
            'datasheet_url' => "/api/v1/idents/{$safeIdent}/datasheet",
        ]);
    });
    Route::get('/inventory', [TraceabilityController::class, 'getInventory']);
    Route::post('/inventory', [TraceabilityController::class, 'storeInventory']);
    Route::patch('/inventory/{id}/arrival', [TraceabilityController::class, 'updateInventoryArrival']);
    Route::delete('/inventory/{id}', [TraceabilityController::class, 'deleteInventory']);

    // Configurare alimentatoare (feeder / role scanate o singură dată la stație)
    Route::get('/feeders/{stationId}', [TraceabilityController::class, 'getStationFeeders']);
    Route::post('/feeders/load', [TraceabilityController::class, 'loadFeeder']);

    // Înregistrare componente montate pe PCB
    Route::post('/placements/smd', [TraceabilityController::class, 'recordSmdPlacement']);
    Route::post('/placements/tht', [TraceabilityController::class, 'recordThtPlacement']);

    // Înregistrare inspecții & teste industriale
    Route::post('/tests/aoi', [TraceabilityController::class, 'recordAoiTest']);
    Route::post('/tests/ict', [TraceabilityController::class, 'recordIctTest']);
    Route::post('/tests/eol', [TraceabilityController::class, 'recordEolTest']);
});
