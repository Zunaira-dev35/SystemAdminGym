import React, { useRef, useEffect, useState } from 'react';
import * as faceapi from 'face-api.js';

const FaceAttendance = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [status, setStatus] = useState('Loading face detector...');
  const [statusType, setStatusType] = useState<'success' | 'error' | ''>('');
  
  let lastScanTime = 0;
  const SCAN_DELAY = 4000; // 4 seconds cooldown

  useEffect(() => {
    const startUp = async function() {
      // Load models
      setStatus('Loading models...');
      await faceapi.nets.tinyFaceDetector.loadFromUri('/models');

      // Start camera
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setStatus('Face detection ready. Position your face in frame...');
      } catch (err) {
        setStatus('Camera access denied or not available!');
        setStatusType('error');
      }
    };

    startUp();

    // Cleanup on unmount
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream)?.getTracks();
        tracks?.forEach(track => track.stop());
      }
    };
  }, []);

  // Start detection loop when video is playing
  const handleVideoPlay = () => {
    const detectFaces = async () => {
      if (!videoRef.current) return;

      const detections = await faceapi.detectAllFaces(
        videoRef.current,
        new faceapi.TinyFaceDetectorOptions()
      );

      if (detections.length > 0) {
        const now = Date.now();
        if (now - lastScanTime >= SCAN_DELAY) {
          lastScanTime = now;
          captureAndSend();
        }
      }
    };

    // Run every 2 seconds (you can adjust)
    const interval = setInterval(detectFaces, 2000);
    return () => clearInterval(interval);
  };

  // Capture frame and send to backend
  const captureAndSend = async () => {
    if (!videoRef.current) return;

    setStatus('Processing face...');
    setStatusType('');

    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    const base64Image = canvas.toDataURL('image/jpeg');

    try {
      const response = await fetch('/check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
        },
        body: JSON.stringify({
          user_id: 2, // Change as needed or make dynamic
          image: base64Image,
        }),
      });

      const data = await response.json();

      if (data.status === 'success') {
        setStatus(`Attendance Marked For: ${data.user?.name || 'User'}`);
        setStatusType('success');
      } else {
        setStatus(data.message || 'No match found');
        setStatusType('error');
      }
    } catch (err) {
      console.error(err);
      setStatus('Error during face recognition');
      setStatusType('error');
    }
  };

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', textAlign: 'center', marginTop: '30px' }}>
      <h2>Automatic Face Attendance</h2>

      <video
        ref={videoRef}
        width="450"
        height="340"
        autoPlay
        muted
        playsInline
        style={{ border: '3px solid #222', borderRadius: '8px', marginTop: '20px' }}
        onPlay={handleVideoPlay}
      />

      <div
        style={{
          marginTop: '20px',
          fontSize: '22px',
          fontWeight: 'bold',
          color: statusType === 'success' ? 'green' : statusType === 'error' ? 'red' : 'inherit',
        }}
      >
        {status}
      </div>
    </div>
  );
};

export default FaceAttendance;