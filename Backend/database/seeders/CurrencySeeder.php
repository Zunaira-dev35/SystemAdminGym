<?php

namespace Database\Seeders;

use App\Models\Currency;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class CurrencySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $json = file_get_contents(public_path('media/jsonFiles/currency.json'));
        $currencies = json_decode($json, true);
        // Sort alphabetically by "name"
        usort($currencies, function ($a, $b) {
            return strcmp($a['text'], $b['text']);
        });

        if(Schema::hasTable('currencies')){
            $currenciesData = Currency::all();
            if($currenciesData->isEmpty()){
                // DB::table('currencies')->truncate(); 
                DB::table('currencies')->insert($currencies);
            }
        }
    }
}
