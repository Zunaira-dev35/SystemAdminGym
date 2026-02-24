import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

export default function ErrorPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-10 text-center border border-red-100">
        {/* Icon */}
        <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-full bg-red-100">
          <AlertCircle className="h-12 w-12 text-red-600" strokeWidth={2} />
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Verification Failed
        </h1>

        {/* Message */}
        <p className="text-lg text-gray-600 mb-8 leading-relaxed">
          The link is invalid, expired, or already used.<br />
          Please request a new verification link.
        </p>

        {/* Action Button */}
        <Button
          size="lg"
          className="w-full bg-red-600 hover:bg-red-700 text-white font-medium shadow-md"
          onClick={() => navigate('/trial')}
        >
          Request New Link
        </Button>

        {/* Optional subtle note */}
        <p className="mt-6 text-sm text-gray-500">
          Need help? Contact support.
        </p>
      </div>
    </div>
  );
}