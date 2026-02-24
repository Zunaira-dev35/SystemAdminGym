<?php

namespace Database\Seeders;

use App\Models\Branch;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Schema;

class BranchSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        if(Schema::hasTable('roles')){
            $isEmptyBranches = Branch::count() === 0;
            $existingMainBranch = Branch::where('type','main')->where('status','active')->exists();
            if($isEmptyBranches || !$existingMainBranch){
                $branch =  Branch::create(['name' => 'Main Branch', 'type' => 'main' , 'status' => 'active']);
                $brRefNum = str_pad($branch->id , 2 , '0' , STR_PAD_LEFT);
                $branch->update(['reference_num' => $brRefNum ]);
            }
        }
    }
}
