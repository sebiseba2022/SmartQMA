<?php

namespace Tests\Unit;

use App\Services\DownloadBandwidthManager;
use Tests\TestCase;

class DownloadBandwidthManagerTest extends TestCase
{
    protected function tearDown(): void
    {
        @unlink(DownloadBandwidthManager::getRegistryPath());
        @unlink(DownloadBandwidthManager::getRegistryPath() . '.lock');
        parent::tearDown();
    }

    public function test_calculate_speed_allocates_max_speed_for_single_user(): void
    {
        $speed = DownloadBandwidthManager::calculateSpeed(1);
        $this->assertEquals(DownloadBandwidthManager::MAX_SPEED_SINGLE_DOWNLOAD, $speed);

        // Si pentru 0 sau mai putin trateaza ca o singura conexiune
        $this->assertEquals(DownloadBandwidthManager::MAX_SPEED_SINGLE_DOWNLOAD, DownloadBandwidthManager::calculateSpeed(0));
    }

    public function test_calculate_speed_divides_bandwidth_among_concurrent_connections(): void
    {
        // 2 conexiuni: 8 MB / 2 = 4 MB/s
        $speed2 = DownloadBandwidthManager::calculateSpeed(2);
        $this->assertEquals(4 * 1024 * 1024, $speed2);

        // 4 conexiuni: 8 MB / 4 = 2 MB/s
        $speed4 = DownloadBandwidthManager::calculateSpeed(4);
        $this->assertEquals(2 * 1024 * 1024, $speed4);
    }

    public function test_calculate_speed_enforces_minimum_bandwidth_floor(): void
    {
        // 16 conexiuni: 8 MB / 16 = 512 KB/s, dar se plafoneaza la minim 1 MB/s
        $speed16 = DownloadBandwidthManager::calculateSpeed(16);
        $this->assertEquals(DownloadBandwidthManager::MIN_SPEED_PER_DOWNLOAD, $speed16);
    }

    public function test_heartbeat_tracks_active_downloads_and_releases_cleanly(): void
    {
        $id1 = 'test_conn_1';
        $id2 = 'test_conn_2';

        $count1 = DownloadBandwidthManager::heartbeat($id1);
        $this->assertEquals(1, $count1);

        $count2 = DownloadBandwidthManager::heartbeat($id2);
        $this->assertEquals(2, $count2);

        DownloadBandwidthManager::release($id1);

        // Dupa release la id1, id2 reinnoieste heartbeat si ramane singur (1 conexiune)
        $countAfterRelease = DownloadBandwidthManager::heartbeat($id2);
        $this->assertEquals(1, $countAfterRelease);

        DownloadBandwidthManager::release($id2);
    }
}

