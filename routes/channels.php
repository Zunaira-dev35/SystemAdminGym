<?php

use App\Models\SupportTicketParticipant;
use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});


Broadcast::channel('notification-receive-{receiverId}', function ($user, $receiverId) {
    return true;
});
