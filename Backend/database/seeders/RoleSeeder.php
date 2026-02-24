<?php

namespace Database\Seeders;

use App\Models\PermissionGroup;
use App\Models\RoleGroup;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Schema;
use Spatie\Permission\Models\Role;

class RoleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        if(Schema::hasTable('roles')){
            Role::firstOrCreate(['name' => 'Super Admin' , 'guard_name' => 'sanctum']);
            // Role::firstOrCreate(['name' => 'Employee' , 'guard_name' => 'sanctum']);
            // Role::firstOrCreate(['name' => 'Member' , 'guard_name' => 'sanctum']);
        }

        if(Schema::hasTable('role_groups')){
            $isEmptyRoleGroups = RoleGroup::count() === 0;
            if($isEmptyRoleGroups){
                $role = Role::where('name' , 'Super Admin')->first();
                $permissionGroup = PermissionGroup::where('name' , 'Default Group')->where('type','default')->first();
                $permissionGroupPermissions = $permissionGroup ? json_decode($permissionGroup->permissions) : '';
                if($role && $permissionGroup && $permissionGroupPermissions){
                    $role->syncPermissions($permissionGroupPermissions);
                    RoleGroup::create(['role_name' => $role->name , 'role_id' => $role->id , 'assign_group_id' => $permissionGroup->id , 'type' => 'default']);
                }

                // $employeeRole = Role::where('name' , 'Employee')->first();
                // $employeePermissionGroup = PermissionGroup::where('name','Employee Permissions Group')->where('type','default')->first();
                // $employeePermissionGroupPermissions = $employeePermissionGroup ? json_decode($employeePermissionGroup->permissions) : '';
                // if($employeeRole && $employeePermissionGroup && $employeePermissionGroupPermissions){
                //     $employeeRole->syncPermissions($employeePermissionGroupPermissions);
                //     RoleGroup::create(['role_name' => $employeeRole->name , 'role_id' => $employeeRole->id , 'assign_group_id' => $employeePermissionGroup->id , 'type' => 'default']);
                // }

                // $memberRole = Role::where('name' , 'Member')->first();
                // $memberPermissionGroup = PermissionGroup::where('name','Member Permissions Group')->where('type','default')->first();
                // $memberPermissionGroupPermissions = $memberPermissionGroup ? json_decode($memberPermissionGroup->permissions) : '';
                // if($memberRole && $memberPermissionGroup && $memberPermissionGroupPermissions){
                //     $memberRole->syncPermissions($memberPermissionGroupPermissions);
                //     RoleGroup::create(['role_name' => $memberRole->name , 'role_id' => $memberRole->id , 'assign_group_id' => $memberPermissionGroup->id , 'type' => 'default']);
                // }
            }
        }
    }
}
