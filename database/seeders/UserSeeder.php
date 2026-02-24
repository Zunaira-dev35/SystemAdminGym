<?php

namespace Database\Seeders;

use App\Models\Branch;
use App\Models\RoleGroup;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Spatie\Permission\Models\Role;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        if(Schema::hasTable('users')){
            $isEmpty = User::count() === 0;
            $defaultUser = User::where('type','default')->exists();
            if($isEmpty || !$defaultUser){
                User::create([
                    'name' => 'System Admin',
                    // 'phone' => '+92' .  mt_rand(1000000000, 9999999999),
                    'password' => bcrypt('123456'),
                    'password_string'   =>  '123456',
                    'type'  => 'system_admin',
                    'user_type' => 'system_admin',
                    'status' => 'active'
                ]);
                $latestUser = User::orderBy('id','desc')->first();
                $totalUserCount = User::where('user_type','system_admin')->count();
                $userRefNum = 'SA-'.str_pad($totalUserCount , 2 , '0',STR_PAD_LEFT);
                $latestUser->update(['reference_num' => $userRefNum ]);
            }
        }
    }
}
