// components/faceDetection/InlineFaceCapture.tsx
import { useRef, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { X, RotateCw } from "lucide-react";

interface InlineFaceCaptureProps {
  onCapture: (base64: string) => void;
  onCancel: () => void;
  isProcessing?: boolean;
  resetTrigger?: boolean;
}

export default function InlineFaceCapture({
  onCapture,
  onCancel,
  isProcessing = false,
  resetTrigger = false,
}: InlineFaceCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [status, setStatus] = useState("Requesting camera access...");
  const [hasCaptured, setHasCaptured] = useState(false);

  const faceDetectorRef = useRef<any>(null);
  const lastVideoTimeRef = useRef<number>(-1);
  const childrenRef = useRef<HTMLElement[]>([]); // for cleanup of overlays (optional)
  const rafRef = useRef<number | null>(null);
  const currentStreamRef = useRef<MediaStream | null>(null);

  const stableCount = useRef(0);
  const captureCooldownRef = useRef(false);

  // ── 1. Load MediaPipe Face Detector ─────────────────────────────────────
const loadFaceDetector = async () => {
  try {
    setStatus("Loading face detection model...");

    // Correct CDN bundle (ES module)
    const { FilesetResolver, FaceDetector } = await import(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/vision_bundle.mjs"
    );

    const vision = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
    );

    const faceDetector = await FaceDetector.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath:
          "https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite",
        delegate: "CPU", // safer than GPU for broad compatibility
      },
      runningMode: "VIDEO",
      minDetectionConfidence: 0.5,
    });

    faceDetectorRef.current = faceDetector;
    setStatus("Face detector ready ✓");
    return faceDetector;
  } catch (err) {
    console.error("MediaPipe load failed:", err);
    setStatus("Failed to initialize face detection");
    return null;
  }
};

  // ── 2. Start webcam and detection loop ──────────────────────────────────
  const startDetection = async () => {
    if (!videoRef.current) return;

    // Load detector if not loaded yet
    if (!faceDetectorRef.current) {
      await loadFaceDetector();
    }

    const detector = faceDetectorRef.current;
    if (!detector) return;

    try {
      setStatus("Starting camera...");
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      currentStreamRef.current = stream;
      videoRef.current.srcObject = stream;
      await videoRef.current.play().catch(console.error);

      setStatus("Position your face inside the frame");

      // ── Detection loop (like official example) ──────────────────────────
const predictWebcam = async () => {
  if (!videoRef.current || hasCaptured) return;

  const video = videoRef.current;
  const nowInMs = performance.now();

  // ← Critical guard: skip detection until video has real dimensions
  if (video.readyState < 2 || video.videoWidth === 0 || video.videoHeight === 0) {
    rafRef.current = requestAnimationFrame(predictWebcam);
    return;
  }

  if (video.currentTime !== lastVideoTimeRef.current) {
    lastVideoTimeRef.current = video.currentTime;

    try {
      const { detections } = faceDetectorRef.current.detectForVideo(video, nowInMs);

     childrenRef.current.forEach((el) => el.remove());
          childrenRef.current = [];

          if (detections?.length > 0) {
            const detection = detections[0];
            const { boundingBox } = detection;

            const vw = video.videoWidth;
            const vh = video.videoHeight;

            const centerX = boundingBox.originX + boundingBox.width / 2;
            const centerY = boundingBox.originY + boundingBox.height / 2;

            const offsetX = Math.abs(centerX - vw / 2);
            const offsetY = Math.abs(centerY - vh / 2);

            const centered = offsetX < vw * 0.15 && offsetY < vh * 0.15;
            const faceAreaRatio =
              (boundingBox.width * boundingBox.height) / (vw * vh);
            const sizeOk = faceAreaRatio > 0.08;

            if (centered && sizeOk) {
              stableCount.current += 1;
              setStatus("Hold still…");

              if (stableCount.current >= 3 && !captureCooldownRef.current) {
                captureCooldownRef.current = true;
                capture();
                setTimeout(() => {
                  captureCooldownRef.current = false;
                  stableCount.current = 0;
                }, 3000);
              }
            } else {
              stableCount.current = 0;
              setStatus(centered ? "Face too small" : "Center your face");
            }

            // Optional: Draw bounding box (like official demo)
            // Uncomment if you want visual feedback
            // /*
            // const box = document.createElement("div");
            // box.className = "absolute border-2 border-green-400 pointer-events-none";
            // box.style.left = `${(vw - boundingBox.width - boundingBox.originX) * (video.clientWidth / vw)}px`;
            // box.style.top = `${boundingBox.originY * (video.clientHeight / vh)}px`;
            // box.style.width = `${boundingBox.width * (video.clientWidth / vw)}px`;
            // box.style.height = `${boundingBox.height * (video.clientHeight / vh)}px`;
            // video.parentElement?.appendChild(box);
            // childrenRef.current.push(box);
            // */
          } else {
            stableCount.current = 0;
            setStatus("Position your face inside the frame");
          }
        }

        // rafRef.current = requestAnimationFrame(predictWebcam);
      // };

      // predictWebcam();
    catch (err) {
      console.warn("Detection skipped due to internal error:", err);
      // Optional: don't let one crash kill the loop
    }
  }

  rafRef.current = requestAnimationFrame(predictWebcam);
};

      predictWebcam();
    } catch (err: any) {
      console.error("Camera error:", err);
      setStatus(
        err.name === "NotAllowedError" ? "Camera permission denied" : "Camera error"
      );
    }
  };

  const stopCamera = () => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    if (currentStreamRef.current) {
      currentStreamRef.current.getTracks().forEach((t) => t.stop());
      currentStreamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    childrenRef.current.forEach((el) => el.remove());
    childrenRef.current = [];

    faceDetectorRef.current?.close?.();
    faceDetectorRef.current = null;

    stableCount.current = 0;
  };

  const capture = () => {
    if (!videoRef.current || hasCaptured) return;
    const video = videoRef.current;

    if (video.readyState < 2) {
      setStatus("Camera not ready...");
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d")!;

    // Mirror (user camera)
    ctx.scale(-1, 1);
    ctx.translate(-canvas.width, 0);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const base64 = canvas.toDataURL("image/jpeg", 0.88);
    setHasCaptured(true);
    setStatus("Verifying face...");
    onCapture(base64);
  };

  const retake = () => {
    setHasCaptured(false);
    stableCount.current = 0;
    startDetection();
  };

  // Initial start + cleanup
  useEffect(() => {
    startDetection();
    return () => stopCamera();
  }, []);

  // Parent reset
  useEffect(() => {
    if (resetTrigger && !isProcessing) {
      setHasCaptured(false);
      setStatus("Position your face...");
      startDetection();
    }
  }, [resetTrigger, isProcessing]);

  return (
   <div className="relative w-full h-full flex items-center justify-center bg-black rounded-2xl overflow-hidden shadow-2xl">
    {/* Video container - forced square/near-square for face capture */}
    <div className=" w-full  overflow-hidden">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
className="absolute inset-0 w-full h-full object-cover scale-x-[-1]"        style={{ background: "#000" }}
      />

      {/* Oval guide */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-80 h-96 border-4 border-white/40 rounded-full" 
        style={{
            aspectRatio: "1 / 1.25",           // slightly taller oval like many face ID systems
            maxWidth: "380px",
            maxHeight: "480px"
          }}/>
      </div>

      {/* Status & controls */}
      <div className="absolute bottom-0 left-0 right-0 p-8 text-white text-center space-y-6 bg-gradient-to-t from-black/90 to-transparent">
        <p className="text-xl font-medium tracking-wider">
          {isProcessing ? "Verifying..." : status}
        </p>

        <div className="flex justify-center gap-6">
          <Button
            size="lg"
            variant="secondary"
            onClick={() => {
              stopCamera();
              onCancel();
            }}
            disabled={isProcessing}
            className="rounded-full"
          >
            <X className="h-6 w-6 mr-2" />
            Cancel
          </Button>

          {!hasCaptured ? (
            <Button
              size="lg"
              onClick={capture}
              disabled={isProcessing || status.includes("denied")}
              className="rounded-full bg-white text-black hover:bg-gray-200 shadow-2xl px-12"
            >
              Capture Face
            </Button>
          ) : (
            <Button
              size="lg"
              variant="secondary"
              onClick={retake}
              disabled={isProcessing}
              className="rounded-full"
            >
              <RotateCw className="h-6 w-6 mr-2" />
              Retake
            </Button>
          )}
        </div>
      </div>
    </div>
    </div>
  );
}