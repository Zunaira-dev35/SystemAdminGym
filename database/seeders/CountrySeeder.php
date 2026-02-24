<?php

namespace Database\Seeders;

use App\Models\Country;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class CountrySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $json = file_get_contents(public_path('media/jsonFiles/countries.json'));
        $countries = json_decode($json, true);

        // Sort alphabetically by "name"
        usort($countries, function ($a, $b) {
            return strcmp($a['name'], $b['name']);
        });

        if(Schema::hasTable('countries')){
            $countriesData = Country::all();
            if($countriesData->isEmpty()){
                // DB::table('countries')->truncate(); 
                DB::table('countries')->insert($countries);
            }
        }
    }
}
