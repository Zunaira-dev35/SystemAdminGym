import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';

export default function SuccessPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-10 text-center border border-green-100">
        {/* Icon */}
        <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
          <CheckCircle className="h-12 w-12 text-green-600" strokeWidth={2} />
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Success!
        </h1>

        {/* Message */}
        <p className="text-lg text-gray-600 mb-8 leading-relaxed">
          Your email has been verified successfully.<br />
          Your gym account is now active.
        </p>

        {/* Action Button */}
        <Button
          size="lg"
          className="w-full bg-green-600 hover:bg-green-700 text-white font-medium shadow-md"
          onClick={() => navigate('/login')}
        >
          Go to Login
        </Button>

        {/* Optional subtle note */}
        <p className="mt-6 text-sm text-gray-500">
          You can now log in and start managing your gym.
        </p>
      </div>
    </div>
  );
}