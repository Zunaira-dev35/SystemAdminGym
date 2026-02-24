<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SetCurrentBranchMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $branchId = null;
        $token = $request->user()->currentAccessToken();
        foreach ($token->abilities as $ability) {
            if (str_starts_with($ability, 'branch:')) {
                $branchId = str_replace('branch:', '', $ability);
            }
        }
        // Attach branch_id to the request
        $request->merge(['logged_branch_id' => $branchId]);
        return $next($request);
    }
}
