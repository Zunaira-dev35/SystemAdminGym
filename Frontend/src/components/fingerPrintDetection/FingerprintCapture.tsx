// components/EmployeeFingerprintCapture.tsx
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Fingerprint, Camera, CheckCircle2 } from "lucide-react";
import FingerprintScanner from "./FingerprintScanner";
import { cn } from "@/lib/utils";

interface EmployeeFingerprintCaptureProps {
  onFingerprintCapture?: (base64: string) => void;
  initialFingerprint?: string; // optional: pre-filled
  isVerifying?: boolean;
  isVerified?: boolean;
}

export default function EmployeeFingerprintCapture({
  onFingerprintCapture,
  initialFingerprint = "",
  isVerifying = false,
  isVerified = false,
}: EmployeeFingerprintCaptureProps) {
  const [showScanner, setShowScanner] = useState(false);
  // const [fingerprintBase64, setFingerprintBase64] =
  //   useState(initialFingerprint);
  const [fingerprintPreview, setFingerprintPreview] =
    useState<string>(initialFingerprint); // for <img> preview

  const isCaptured = !!fingerprintPreview;
  const [fingerprintRaw, setFingerprintRaw] = useState<string>(""); // clean base64 → send to backend
  const [showFingerprintScanner, setShowFingerprintScanner] = useState(false);
  const handleCapture = ({ preview, raw }: any) => {
    console.log("raw", raw);
    onFingerprintCapture(raw);
    setFingerprintPreview(preview); // shows in circle
    setFingerprintRaw(raw); // send this to backend
    // toast({ title: "Success", description: "Fingerprint captured!" });
    setShowFingerprintScanner(false);
  };

  return (
    <div className="space-y-6">
      {/* Fingerprint Preview Circle */}
      <div className="flex justify-center">
        <div className="relative">
          {/* Placeholder or Captured Image */}
          <div className="w-32 h-32 rounded-full bg-muted border-4  shadow-2xl flex items-center justify-center overflow-hidden">
            {isCaptured ? (
              <img
                src={fingerprintPreview}
                alt="Captured fingerprint"
                className="w-full h-full object-cover"
              />
            ) : (
              <Fingerprint className="w-16 h-16 text-slate-500" />
            )}
          </div>

          {/* Success Checkmark */}
          {/* {isCaptured && (
            <div className="absolute -top-1 -right-1">
              <CheckCircle2 className="w-8 h-8 text-chart-3/70 bg-chart-3/10 rounded-full shadow-lg" />
            </div>
          )} */}
          {/* Verifying Spinner Overlay */}
          {isVerifying && (
            <div className="absolute inset-0 rounded-full border-4 border-gray-300 border-t-primary animate-spin pointer-events-none" />
          )}

          {/* Success Checkmark Overlay */}
          {isVerified && !isVerifying && (
            <div className="absolute inset-0 rounded-full flex items-center justify-center bg-green-500/30 pointer-events-none">
              <svg
                className="h-14 w-14 text-green-600 drop-shadow-lg"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={5}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-center gap-4">
        {/* Fingerprint Button – Changes Text After Capture */}
        <Button
          // variant={isCaptured ? "outline" : "default"}
          className={cn(
            "gap-2 transition-all"
            // isCaptured &&
            //   "border-green-500 text-green-600 hover:bg-green-50 dark:hover:bg-green-950"
          )}
          onClick={() => setShowScanner(true)}
        >
          <Fingerprint className="w-4 h-4" />
          {isCaptured ? "Re-scan Fingerprint" : "Capture Fingerprint"}
        </Button>
      </div>

      {/* Status Text */}
      {/* <p className="text-center text-sm text-muted-foreground">
        {isCaptured ? "Fingerprint captured successfully" : "No fingerprint captured yet"}
      </p> */}

      {/* Scanner Modal */}
      <FingerprintScanner
        isOpen={showScanner}
        title="Scan Fingerprint"
        onCapture={handleCapture}
        onClose={() => setShowScanner(false)}
      />
    </div>
  );
}
