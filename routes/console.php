<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Schedule::command('app:auto-approve-freeze-requests')->daily()->withoutOverlapping();
Schedule::command('app:process-freeze-requests')->daily()->withoutOverlapping();
Schedule::command('app:auto-expire-member')->daily()->withoutOverlapping();
Schedule::command('app:auto-active-member')->daily()->withoutOverlapping();
Schedule::command('app:send-expire-reminder')->daily()->withoutOverlapping();

