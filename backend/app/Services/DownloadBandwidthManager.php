<?php

namespace App\Services;

class DownloadBandwidthManager
{
    /**
     * Banda totală alocată cumulativ pentru descărcări mari de fișiere (8 MB/s).
     * Garantează că restul lățimii de bandă și worker-ilor rămân disponibili pentru interacțiunea din aplicație fără lag.
     */
    public const TOTAL_POOL_BYTES_PER_SEC = 8 * 1024 * 1024; // 8 MB/s

    /**
     * Viteza maximă pentru un singur utilizator când nu există alte descărcări active (6 MB/s).
     */
    public const MAX_SPEED_SINGLE_DOWNLOAD = 6 * 1024 * 1024; // 6 MB/s

    /**
     * Viteza minimă garantată per descărcare concurentă (1 MB/s).
     */
    public const MIN_SPEED_PER_DOWNLOAD = 1 * 1024 * 1024; // 1 MB/s

    /**
     * Intervalul de reevaluare a conexiunilor concurente active (la fiecare 2 secunde).
     */
    public const RECHECK_INTERVAL_SECONDS = 2.0;

    /**
     * Pragul de expirare heartbeat pentru conexiuni întrerupte/închise (4 secunde).
     */
    public const HEARTBEAT_TIMEOUT_SECONDS = 4.0;

    /**
     * Calea către fișierul atomic de registru al descărcărilor active.
     */
    public static function getRegistryPath(): string
    {
        $dir = storage_path('framework');
        if (! is_dir($dir)) {
            @mkdir($dir, 0777, true);
        }

        return $dir . '/active_downloads.json';
    }

    /**
     * Înregistrează sau actualizează heartbeat-ul unei descărcări active și returnează numărul de conexiuni active.
     */
    public static function heartbeat(string $downloadId): int
    {
        $filePath = self::getRegistryPath();
        $lockPath = $filePath . '.lock';

        $lockHandle = fopen($lockPath, 'c+');
        if (! $lockHandle) {
            return 1;
        }

        flock($lockHandle, LOCK_EX);

        $now = microtime(true);
        $data = [];

        if (file_exists($filePath)) {
            $raw = file_get_contents($filePath);
            $data = json_decode($raw, true) ?: [];
        }

        // Elimină descărcările expirate (utilizatori care au închis tab-ul sau conexiunea s-a întrerupt)
        $active = [];
        foreach ($data as $id => $timestamp) {
            if (($now - (float) $timestamp) < self::HEARTBEAT_TIMEOUT_SECONDS) {
                $active[$id] = (float) $timestamp;
            }
        }

        // Înregistrează heartbeat pentru descărcarea curentă
        $active[$downloadId] = $now;

        file_put_contents($filePath, json_encode($active), LOCK_EX);

        flock($lockHandle, LOCK_UN);
        fclose($lockHandle);

        return max(1, count($active));
    }

    /**
     * Elimină o descărcare din registrul activ la finalizare sau la deconectare.
     */
    public static function release(string $downloadId): void
    {
        $filePath = self::getRegistryPath();
        $lockPath = $filePath . '.lock';

        $lockHandle = fopen($lockPath, 'c+');
        if (! $lockHandle) {
            return;
        }

        flock($lockHandle, LOCK_EX);

        if (file_exists($filePath)) {
            $raw = file_get_contents($filePath);
            $data = json_decode($raw, true) ?: [];
            unset($data[$downloadId]);
            file_put_contents($filePath, json_encode($data), LOCK_EX);
        }

        flock($lockHandle, LOCK_UN);
        fclose($lockHandle);
    }

    /**
     * Calculează viteza dinamică per descărcare (în bytes/sec) împărțind banda totală la numărul de conexiuni.
     */
    public static function calculateSpeed(int $activeCount): int
    {
        if ($activeCount <= 1) {
            return self::MAX_SPEED_SINGLE_DOWNLOAD;
        }

        $allocated = (int) floor(self::TOTAL_POOL_BYTES_PER_SEC / $activeCount);

        return max(self::MIN_SPEED_PER_DOWNLOAD, min(self::MAX_SPEED_SINGLE_DOWNLOAD, $allocated));
    }
}

