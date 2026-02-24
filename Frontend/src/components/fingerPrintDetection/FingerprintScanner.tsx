// components/shared/FingerprintScanner.tsx

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Fingerprint, Loader2, Check, AlertCircle, X } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface FingerprintScannerProps {
  onCapture: (data: { preview: string; raw: any }) => void;
  onClose?: () => void;
  isOpen?: boolean;
  title?: string;
}

export default function FingerprintScanner({
  onCapture,
  onClose,
  isOpen = true,
  title = "Scan Fingerprint",
}: FingerprintScannerProps) {
  const [status, setStatus] = useState<
    "idle" | "scanning" | "success" | "error"
  >("idle");
  const [message, setMessage] = useState("Place your finger on the scanner");
  const apiRef = useRef<any>(null);
  // Auto-close after success
  useEffect(() => {
    if (status === "success") {
      const timer = setTimeout(() => {
        onClose?.();
      }, 1500); // Close after 1.5s so user sees success

      return () => clearTimeout(timer);
    }
  }, [status, onClose]);
  useEffect(() => {
    if (!isOpen) return;

    // Safety check – SDK must be loaded in index.html
    if (!window.Fingerprint || !window.Fingerprint.WebApi) {
      setStatus("error");
      setMessage("Fingerprint SDK not loaded. Please refresh the page.");
      return;
    }

    try {
      const api = new window.Fingerprint.WebApi();
      apiRef.current = api;

      // Events
      api.onDeviceConnected = () => {
        setStatus("idle");
        setMessage("Scanner connected – place your finger");
      };

      api.onDeviceDisconnected = () => {
        setStatus("error");
        setMessage("Scanner disconnected");
      };

api.onSamplesAcquired = async (event: any) => {
  try {
    setStatus("scanning");
    setMessage("Processing fingerprint...");

    const samples = JSON.parse(event.samples);
    if (!Array.isArray(samples) || samples.length === 0) {
      throw new Error("No fingerprint samples received");
    }

    let sampleData = samples[0];

    // Safety: Extract the string if it's wrapped in an object
    if (typeof sampleData === "object" && sampleData !== null) {
      // Common patterns: { Data: "..."} or { data: "..."} or similar
      sampleData = sampleData.Data || sampleData.data || sampleData.sample || JSON.stringify(sampleData);
    }

    if (typeof sampleData !== "string") {
      throw new Error("Invalid sample format: expected a base64url string");
    }

    // Now safe to process
    let base64 = sampleData.replace(/-/g, "+").replace(/_/g, "/");
    while (base64.length % 4) base64 += "=";

    const preview = `data:image/wsq;base64,${base64}`;

    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const rawBinary = bytes.buffer;

    setStatus("success");
    setMessage("Fingerprint captured successfully!");

    setTimeout(() => {
      onCapture({
        preview,
        raw: rawBinary,
      });     

      toast({
        title: "Success",
        description: "Fingerprint captured!",
      });
    }, 600);
    onClose();
  } catch (err) {
    console.error("Capture error:", err);
    setStatus("error");
    setMessage("Failed to process fingerprint data");
  }
};

      api.onErrorOccurred = (e: any) => {
        setStatus("error");
        setMessage(e.message || "Scanner error occurred");
      };

      api.onQualityReported = (q: any) => {
        if (q.quality === window.Fingerprint.Quality.GOOD) {
          setMessage("Good quality – hold still");
        }
      };

      // Start scanning automatically
      setStatus("scanning");
      setMessage("Waiting for finger...");
      api.startAcquisition(window.Fingerprint.SampleFormat.PngImage); // WSQ compressed binary
      // Cleanup
      return () => {
        if (apiRef.current) {
          apiRef.current.stopAcquisition();
        }
      };
    } catch (err) {
      setStatus("error");
      setMessage("Failed to initialize scanner");
      console.error(err);
    }
  }, [isOpen, onCapture]);

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={handleOverlayClick}
    >
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="relative pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-3 text-xl">
              <Fingerprint className="h-7 w-7 text-primary" />
              {title}
            </CardTitle>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Scanner Area */}
          <div className="relative mx-auto w-72 h-96 bg-gradient-to-b from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 rounded-2xl overflow-hidden border-4 border-slate-300 dark:border-slate-700 shadow-inner">
            {/* Overlay States */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
              {/* Scanning */}
              {status === "scanning" && (
                <div className="text-center">
                  <div className="relative flex items-center justify-center mb-6">
                    <Fingerprint className="h-20 w-20 animate-pulse" />
                    <div className="absolute inset-0 rounded-full border-4 border-white/30 animate-ping" />
                  </div>
                  <div className="flex gap-2">
                    <div className="h-2 w-16 bg-white/60 rounded-full animate-pulse" />
                    <div className="h-2 w-16 bg-white/80 rounded-full animate-pulse delay-100" />
                    <div className="h-2 w-16 bg-white rounded-full animate-pulse delay-200" />
                  </div>
                </div>
              )}

              {/* Success */}
              {status === "success" && (
                <div className="text-center">
                  <div className="w-20 h-20 mx-auto bg-green-500/20 rounded-full flex items-center justify-center">
                    <Check className="h-12 w-12 text-green-500" />
                  </div>
                  <p className="mt-4 text-xl font-semibold">Success!</p>
                </div>
              )}

              {/* Error */}
              {status === "error" && (
                <div className="text-center">
                  <AlertCircle className="mx-auto h-16 w-16 text-red-500 mb-4" />
                  <p className="font-medium text-red-600 dark:text-red-400">
                    Scan Failed
                  </p>
                </div>
              )}
            </div>

            {/* Default finger icon */}
            {status === "idle" && (
              <div className="absolute inset-0 flex items-center justify-center opacity-20">
                <Fingerprint className="h-32 w-32" />
              </div>
            )}
          </div>

          {/* Status Badge */}
          <Badge
            variant={
              status === "success"
                ? "default"
                : status === "error"
                ? "destructive"
                : "secondary"
            }
            className="w-full justify-center py-3 text-base"
          >
            {status === "scanning" && (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Scanning fingerprint...
              </>
            )}
            {status === "success" && (
              <>
                <Check className="mr-2 h-5 w-5" />
                Captured Successfully
              </>
            )}
            {status === "error" && (
              <>
                <AlertCircle className="mr-2 h-5 w-5" />
                Scan Failed
              </>
            )}
            {status === "idle" && "Ready – place finger"}
          </Badge>

          {/* Message */}
          <p className="text-center text-lg font-medium">{message}</p>

          {/* Info */}
          <p className="text-center text-sm text-muted-foreground">
            Make sure <strong>HID DigitalPersona Lite Client</strong> is
            installed
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
