<?php

namespace App\Services;

use Twilio\Rest\Client;
use Exception;

class TwilioService
{
    protected $twilio;
    protected $from;
    protected $fromWhatsapp;

    public function __construct()
    {
        $this->twilio = new Client(
            config('services.twilio.sid'),
            config('services.twilio.auth_token')
        );
    }

    public function sendSms($to)
    {          
        try {
            $verification = $this->twilio->verify->v2->services(config('services.twilio.verify_service_sid'))
                ->verifications
                ->create($to, 'sms');

            return [
                'success' => true,
                'message' => 'OTP sent successfully',
                'sid' => $verification->sid
            ];
        } catch (\Exception $e) {
            return [
                'success' => false,
                'error' => 'Failed to send OTP'
            ];
        }
    }

    public function sendWhatsappSms($to, $message)
    {
         try {
            $verification = $this->twilio->verify->v2->services(config('services.twilio.verify_service_sid'))
                ->verifications
                ->create($to, 'whatsapp');

            return [
                'success' => true,
                'message' => 'OTP sent successfully',
                'sid' => $verification->sid
            ];
        } catch (\Exception $e) {
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }

    function verifyOTP($phone , $phoneOtp){

        $check = $this->twilio->verify->v2
        ->services(config('services.twilio.verify_service_sid'))
        ->verificationChecks
        ->create(['to' => $phone, 'code' => $phoneOtp]);

    if ($check->status === 'approved') {
        return [
            'success' => true,
            'message'   =>  'Verified successfully'
        ];
  
    }
        return [
            'success' => false,
            'message'   =>  'Invalid code'
        ];
    }
}