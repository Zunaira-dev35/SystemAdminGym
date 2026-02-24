<?php

namespace Database\Seeders;

use App\Models\TimeZone;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Schema;

class TimezoneSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        if(Schema::hasTable('time_zones')){
            $existing = TimeZone::count();
            if ($existing > 0) {
                return;
            }

            $timezones = \DateTimeZone::listIdentifiers();
            foreach ($timezones as $tz) {
                $zone = new \DateTimeZone($tz);
                $offset = $zone->getOffset(new \DateTime());

                TimeZone::create([
                    'name' => str_replace('_', ' ', $tz),
                    'identifier' => $tz,
                    'offset' => $offset,
                    'details' => json_encode($zone->getLocation())
                ]);
            }
        }
         
    }
}
