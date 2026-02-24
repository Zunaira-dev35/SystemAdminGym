<?php

namespace App\Providers;

use App\Models\SystemSetting;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Storage;
use League\Flysystem\Filesystem;
use PlatformCommunity\Flysystem\BunnyCDN\BunnyCDNAdapter as BunnyCDNBunnyCDNAdapter;
use PlatformCommunity\FlysystemBunnycdn\BunnycdnAdapter;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        
        $this->app->booted(function () {
            $this->setApplicationTimezone();
            
        });
        
    }

    protected function setApplicationTimezone(): void
    {
        try {
            // Check if system_settings table exists
            if (Schema::hasTable('system_settings')) {
                $settings = SystemSetting::with('currency','timezone')->first();
                $timezone = $settings?->timezone?->name ?? config('app.timezone');
                config(['app.timezone' => $timezone]);
                date_default_timezone_set($timezone);
            }else{
                config(['app.timezone' => 'UTC']);
                date_default_timezone_set('UTC');
            }
        } catch (\Exception $e) {
            // Fallback to UTC if any error occurs
            config(['app.timezone' => 'UTC']);
            date_default_timezone_set('UTC');
        }
    }

   
}
