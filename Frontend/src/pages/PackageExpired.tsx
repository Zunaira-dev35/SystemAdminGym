// src/pages/PackageExpired.tsx
import React from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { AlertCircle, CreditCard } from "lucide-react";

export default function PackageExpired() {
  const navigate = useNavigate();

  return (
    <div className="min-h-[calc(100vh-164px)] flex items-center justify-center ">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl overflow-hidden border border-border-gray">
        {/* Subtle top accent */}
        <div className="h-2 bg-primary" />

        <div className="p-8 sm:p-10 text-center space-y-8">
          {/* Icon + Title */}
          <div className="flex flex-col items-center gap-4">
            <h1 className="text-xl font-semibold text-gray-900">
              Your Subscription Has Expired
            </h1>
          </div>

          {/* Main Message */}
          <p className="text-base text-gray-700 leading-relaxed">
            Your gym management subscription period has ended. To continue using Gym ERP features, please recharge your account.
          </p>

          {/* Benefits (bullets) */}
          <ul className="text-left space-y-4 text-gray-700 max-w-md mx-auto">
            <li className="flex items-start gap-3">
              <span className="text-green-600 text-xl font-bold mt-0.5">✓</span>
              <span>Recharge quickly and keep managing your gym without interruption</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-green-600 text-xl font-bold mt-0.5">✓</span>
              <span>Pay only for what you use — transparent pricing, no hidden fees</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-green-600 text-xl font-bold mt-0.5">✓</span>
              <span>Need help? Our support team is available 24/7</span>
            </li>
          </ul>

          {/* CTA Button */}
          <div className="">
            <Button
              size="lg"
              className="w-full bg-primary text-white font-medium text-base shadow-md hover:shadow-lg transition-all"
              onClick={() => navigate("/package")}
            >
              <CreditCard className="mr-2 h-5 w-5" />
              Recharge Now
            </Button>
          </div>

          <p className="text-sm text-gray-500">
            Questions? Contact support anytime.
          </p>
        </div>
      </div>
    </div>
  );
}