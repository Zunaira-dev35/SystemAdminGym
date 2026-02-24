<?php

namespace App\Http\Middleware;

use App\Models\Gym;
use Carbon\Carbon;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckPlanExpiry
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();
        if($user->gym_id){
            $gym = Gym::find($user->gym_id);
            if($gym){
                $now = Carbon::now();
                $packageRenewalDate = $gym->package_renewal_date ? Carbon::parse($gym->package_renewal_date) : null;
                if($packageRenewalDate && $now->greaterThan($packageRenewalDate)){
                    return apiError('Subscription expired', 403 , 'Your gym subscription has expired. Please renew your package to continue using the system.');
                }
            }
        }
        return $next($request);
    }
}
