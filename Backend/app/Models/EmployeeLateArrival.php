<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EmployeeLateArrival extends Model
{
    protected $fillable = ['user_id', 'month', 'late_arrivals','attendance_type'];

    protected $casts = [
        'late_arrivals' => 'array',
    ];
    

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}