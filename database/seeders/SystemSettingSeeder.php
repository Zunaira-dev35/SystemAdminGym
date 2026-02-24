<?php

namespace Database\Seeders;

use App\Models\Country;
use App\Models\Currency;
use App\Models\SystemSetting;
use App\Models\TimeZone;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Schema;

class SystemSettingSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
         if(Schema::hasTable('system_settings')){
            $isEmptySystemSettings = SystemSetting::count() === 0;
            if($isEmptySystemSettings){
                $pakTimezone = TimeZone::where('name','Asia/Karachi')->first(); 
                $pakCurrency = Currency::where('iso','pkr')->first();
                $pakCountry = Country::where('name','Pakistan')->first();
                SystemSetting::create(['company_name' => "Gym ERP" , 
                'company_email' => 'example@gmail.com' , 
                'company_phone' => '123456789' , 
                // 'timezone_id' => $pakTimezone ? $pakTimezone->id : null , 
                'currency_id' => $pakCurrency ? $pakCurrency->id : null , 
                'country_id' => $pakCountry?->id ?? null ,
                'type'  =>  'system',
                'allow_higher_branch_access'    =>  false,
                'higher_branch_allowed_days'    => 0]);
            }
        }
    }
}
