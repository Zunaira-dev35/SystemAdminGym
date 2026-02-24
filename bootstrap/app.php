<?php

use App\Http\Middleware\CheckPermission;
use App\Http\Middleware\CheckPlanExpiry;
use App\Http\Middleware\SetCurrentBranchMiddleware;
use App\Http\Middleware\SetCurrentGymMiddleware;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->append(\Illuminate\Http\Middleware\HandleCors::class);
        $middleware->alias([
            'CheckPermission' => CheckPermission::class,
            'set.branch' => SetCurrentBranchMiddleware::class,
            'set.gym'   => SetCurrentGymMiddleware::class,
            'check.plan.expiry' =>  CheckPlanExpiry::class
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })->create();
