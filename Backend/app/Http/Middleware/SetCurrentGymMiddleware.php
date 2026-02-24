<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SetCurrentGymMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $gymId = null;
        $token = $request->user()->currentAccessToken();
        foreach ($token->abilities as $ability) {
            if (str_starts_with($ability, 'gym:')) {
                $gymId = str_replace('gym:', '', $ability);
            }
        }
        // Attach branch_id to the request
        $request->merge(['logged_gym_id' => $gymId]);
        return $next($request);
    }
}
