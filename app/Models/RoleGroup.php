<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Spatie\Permission\Models\Role;

class RoleGroup extends Model
{
    use HasFactory;
    protected $fillable = ['role_name','role_id','assign_group_id','type','gym_id'];

    function permissionGroup(){
        return $this->hasOne(PermissionGroup::class,'id','assign_group_id');
    }

    function role(){
        return $this->hasOne(Role::class,'id','role_id');
    }
}
