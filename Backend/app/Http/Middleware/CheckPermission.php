<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckPermission
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next , $permission): Response
    {
       
        $user = $request->user();
//  $permissions = explode(',', $permissions);
        // Check each guard to see if it's a permission
           if ($user->hasPermissionTo($permission)) {
               return $next($request);
           }
        // foreach ($permissions as $permission) {
        //     if ($user->hasPermissionTo($permission)) {
        //         return $next($request);
        //     }
        // }
         
            return apiError('Unauthorized', 403 , 'You do not have permission access to this resource');
    }
}
