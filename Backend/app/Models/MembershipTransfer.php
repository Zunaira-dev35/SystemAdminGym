<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class MembershipTransfer extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'from_user_id',
        'from_profile_id',
        'from_status_detail_id',
        'to_user_id',
        'to_profile_id',
        'to_status_detail_id',
        'transferred_days',
        'from_remaining_days_before',
        'from_remaining_days_after',
        'to_remaining_days_before',
        'to_remaining_days_after',
        'plan_id',
        'plan_start_date',
        'plan_expire_date_before',
        'plan_expire_date_after',
        'notes',
        'transferred_by',
        'branch_id',
        'reference_num',
        'gym_id'
    ];

    protected $casts = [
        'transferred_days' => 'integer',
        'from_remaining_days_before' => 'integer',
        'from_remaining_days_after' => 'integer',
        'to_remaining_days_before' => 'integer',
        'to_remaining_days_after' => 'integer',
        'plan_start_date' => 'date',
        'plan_expire_date_before' => 'date',
        'plan_expire_date_after' => 'date',
    ];

    protected $appends = [
        'from_member_name',
        'to_member_name',
        'transferred_by_name',
        'plan_name',
    ];

    // Relationships
    public function fromUser()
    {
        return $this->belongsTo(User::class, 'from_user_id');
    }

    public function toUser()
    {
        return $this->belongsTo(User::class, 'to_user_id');
    }

    public function fromProfile()
    {
        return $this->belongsTo(MemberProfile::class, 'from_profile_id');
    }

    public function toProfile()
    {
        return $this->belongsTo(MemberProfile::class, 'to_profile_id');
    }

    public function plan()
    {
        return $this->belongsTo(Plan::class, 'plan_id');
    }

    public function transferredBy()
    {
        return $this->belongsTo(User::class, 'transferred_by');
    }

    public function fromStatusDetail()
    {
        return $this->belongsTo(UserStatusDetail::class, 'from_status_detail_id');
    }

    public function toStatusDetail()
    {
        return $this->belongsTo(UserStatusDetail::class, 'to_status_detail_id');
    }

    // Accessors
    public function getFromMemberNameAttribute()
    {
        return $this->fromUser ? $this->fromUser->name : 'N/A';
    }

    public function getToMemberNameAttribute()
    {
        return $this->toUser ? $this->toUser->name : 'N/A';
    }

    public function getTransferredByNameAttribute()
    {
        return $this->transferredBy ? $this->transferredBy->name : 'System';
    }

    public function getPlanNameAttribute()
    {
        return $this->plan ? $this->plan->name : 'N/A';
    }

    public function getTransferDateAttribute()
    {
        return $this->created_at->format('Y-m-d H:i:s');
    }

    // Scopes for easy querying
    public function scopeFromMember($query, $userId)
    {
        return $query->where('from_user_id', $userId);
    }

    public function scopeToMember($query, $userId)
    {
        return $query->where('to_user_id', $userId);
    }

    public function scopeByMember($query, $userId)
    {
        return $query->where(function ($q) use ($userId) {
            $q->where('from_user_id', $userId)
              ->orWhere('to_user_id', $userId);
        });
    }

    public function scopeRecent($query, $days = 30)
    {
        return $query->where('created_at', '>=', now()->subDays($days));
    }


    public function scopeByTransferredBy($query, $userId)
    {
        return $query->where('transferred_by', $userId);
    }
    public function branch()
    {
        return $this->belongsTo(Branch::class, 'branch_id');
    }
}