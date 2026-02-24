// FaceCaptureModal.tsx – Fixed & Perfect
import React, { useRef, useEffect, useState } from 'react';
import * as faceapi from 'face-api.js';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Camera, X, CheckCircle } from 'lucide-react';

interface FaceCaptureModalProps {
  open: boolean;
  onClose: () => void;
  onCapture: any;//(base64: string) => void;
}

export default function FaceCaptureModal({ open, onClose, onCapture }: FaceCaptureModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [status, setStatus] = useState('Loading face detector...');
  const [statusType, setStatusType] = useState<'success' | 'error' | ''>('');
  const [hasCaptured, setHasCaptured] = useState(false);

  useEffect(() => {
    if (!open) return;

    const startUp = async () => {
      setStatus('Loading face detection model...');
      try {
        await faceapi.nets.tinyFaceDetector.loadFromUri('/models');

        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;

          // Wait for video to be ready
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play();
            setStatus('Camera ready! Click "Capture" when ready.');
          };
        }
      } catch (err) {
        console.error("Camera error:", err);
        setStatus('Camera access denied or not available!');
        setStatusType('error');
      }
    };

    startUp();

    return () => {
      if (videoRef.current?.srcObject) {
        (videoRef.current.srcObject as MediaStream)?.getTracks().forEach(t => t.stop());
      }
      setHasCaptured(false);
      setStatus('Loading face detector...');
    };
  }, [open]);

  const capturePhoto = () => {
    if (!videoRef.current || hasCaptured) return;

    // Double-check video is ready
    if (videoRef.current.videoWidth === 0 || videoRef.current.videoHeight === 0) {
      setStatus('Camera not ready yet...');
      return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    
    // This is your perfect base64 string
    const base64Image = canvas.toDataURL('image/jpeg', 0.9); // 90% quality
    console.log("base64Image",base64Image)
    setHasCaptured(true);
    setStatus('Photo captured successfully!');
    setStatusType('success');

    onCapture(base64Image); // This now has real image data
    onClose();
    // setTimeout(() => onClose(), 1500);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Capture Profile Photo
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="w-full rounded-lg border-4  bg-black mx-auto"
            style={{ maxHeight: '500px' }}
          />

          <div className="text-center">
            <p className={`text-xl font-semibold ${
              statusType === 'success' ? 'text-chart-3' : 
              statusType === 'error' ? 'text-chart-5' : 'text-gray-700'
            }`}>
              {status}
            </p>
            {hasCaptured && <CheckCircle className="h-16 w-16 text-green-500 mx-auto mt-4" />}
          </div>

          <div className="flex justify-center gap-4">
            <Button variant="outline" onClick={onClose} disabled={hasCaptured}>
              <X className="h-5 w-5 mr-2" />
              Cancel
            </Button>
            <Button 
              onClick={capturePhoto} 
              disabled={hasCaptured}
              size="lg"
              className=" hover:opacity-90"
            >
              <Camera className="h-5 w-5 mr-2" />
              {hasCaptured ? "Captured!" : "Capture Photo"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}