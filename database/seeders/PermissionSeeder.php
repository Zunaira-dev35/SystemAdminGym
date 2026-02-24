<?php

namespace Database\Seeders;

use App\Models\PermissionGroup;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Schema;
use Spatie\Permission\Models\Permission;

class PermissionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $permissions = [
            'Create Member', 'Edit Member', 'View Member', 'Delete Member','Export Member',
            'Create Plan', 'Edit Plan', 'View Plan', 'Delete Plan','Export Plan',
            'Create Freeze', 'Edit Freeze', 'View Freeze', 'Delete Freeze','Export Freeze',
            'Create Freeze Request', 'Edit Freeze Request', 'View Freeze Request', 'Delete Freeze Request','Export Freeze Request',
            'Create Shift', 'Edit Shift', 'View Shift', 'Delete Shift','Export Shift',
            'Create Employee', 'Edit Employee', 'View Employee', 'Delete Employee','Export Employee',
            'Create Member Attendance', 'Edit Member Attendance', 'View Member Attendance', 'Delete Member Attendance','Export Member Attendance',
            'Create Employee Attendance', 'Edit Employee Attendance', 'View Employee Attendance', 'Delete Employee Attendance','Export Employee Attendance',
            'Create Leave', 'Edit Leave', 'View Leave', 'Delete Leave','Export Leave',
            'Create Holiday', 'Edit Holiday', 'View Holiday', 'Delete Holiday','Export Holiday',
            'Create Payroll', 'Edit Payroll', 'View Payroll', 'Delete Payroll','Export Payroll',
            'View Report','Export Report',
            'View Ledger','Export Ledger',
            'Create Permission', 'Edit Permission', 'View Permission', 'Delete Permission','Export Permission',
            'Create Role', 'Edit Role', 'View Role', 'Delete Role','Export Role',
            'Create User', 'Edit User', 'View User', 'Delete User','Export User',
            'Create Holiday','Edit Holiday','View Holiday','Delete Holiday','Export Holiday',
            'Create Leave','Edit Leave','View Leave','Delete Leave','Export Leave',
            'Create System Settings','Edit System Settings','View System Settings',
            'Create Fee Collection','Edit Fee Collection','View Fee Collection','Delete Fee Collection','Export Fee Collection',
            'Create Branch', 'Edit Branch', 'View Branch', 'Delete Branch','Export Branch',
            'Create Plan Transfer', 'Edit Plan Transfer', 'View Plan Transfer', 'Delete Plan Transfer','Export Plan Transfer',
            'Create Income', 'Edit Income', 'View Income', 'Delete Income','Export Income',
            'Create Expense', 'Edit Expense', 'View Expense', 'Delete Expense','Export Expense',
            'View System Logs',
            'Create Public Checkin',
            'Create Fee Refund' , 'View Fee Refund','Export Fee Refund',
            'Create Membership Transfer' , 'View Membership Transfer','Export Membership Transfer',
            'Create Bank', 'Edit Bank', 'View Bank', 'Delete Bank','Export Bank'
        ];

        $employeePermissions = [
            'Create Public Checkin',
            'Create Member', 'View Member',
            'Create Member Attendance','View Member Attendance',
            'Create Employee Attendance','View Employee Attendance',
            'View Freeze Request',
            'View Payroll','Export Payroll',
            'Create Leave', 'Edit Leave', 'View Leave',
            'Create Fee Collection','View Fee Collection'
        ];

        $memberPermissions = [
            'View Member',
            'View Member Attendance',
            'View Freeze Request', 'Create Freeze Request', 'Delete Freeze Request','Export Freeze Request',
            'View Plan Transfer',
            'View Fee Collection'
        ];

        if(Schema::hasTable('permissions')){
            $isEmptyType = Permission::count() === 0;
            if($isEmptyType){ 
                foreach($permissions as $permission){
                    Permission::firstOrCreate(['name' => $permission , 'guard_name' => 'sanctum']);
                }
            }
        }
        if(Schema::hasTable('permission_groups')){
            $isEmptyPermissionGroups = PermissionGroup::count() === 0;
            if($isEmptyPermissionGroups){
                PermissionGroup::create(['name' => 'Default Group' , 'permissions' => json_encode($permissions) , 'type' => 'default']);
                // PermissionGroup::create(['name' => 'Employee Permissions Group' , 'permissions' => json_encode($employeePermissions) , 'type' => 'default']);
                // PermissionGroup::create(['name' => 'Member Permissions Group' , 'permissions' => json_encode($memberPermissions) , 'type' => 'default']);
            }
        }
    }
}
