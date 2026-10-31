import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, X, RotateCcw, Check, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { api } from '@/api/apiClient';

export default function LiveCameraCaptureModal({
  isOpen,
  onClose,
  onPhotoCaptured,
  title = "Capture Medical Result / Document"
}) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const fileFallbackInputRef = useRef(null);

  const [streamActive, setStreamActive] = useState(false);
  const [capturedDataUrl, setCapturedDataUrl] = useState(null);
  const [capturedBlob, setCapturedBlob] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [availableCameras, setAvailableCameras] = useState([]);
  const [currentCameraIdx, setCurrentCameraIdx] = useState(0);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setStreamActive(false);
  }, []);

  const startCamera = useCallback(async (deviceId = null) => {
    stopCamera();
    setCameraError('');
    setCapturedDataUrl(null);
    setCapturedBlob(null);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError('Camera access is not supported by your browser or environment.');
      return;
    }

    try {
      const constraints = {
        video: deviceId 
          ? { deviceId: { exact: deviceId } } 
          : { facingMode: { ideal: 'environment' }, width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setStreamActive(true);
      }

      // Enumerate available video devices
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter((d) => d.kind === 'videoinput');
      setAvailableCameras(videoDevices);
    } catch (err) {
      console.error('Camera access error:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraError('Camera permission was denied. Please allow camera permissions in browser settings.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setCameraError('No camera found on this device.');
      } else {
        setCameraError(`Unable to start camera: ${err.message || 'Check camera permissions'}`);
      }
    }
  }, [stopCamera]);

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen, startCamera, stopCamera]);

  const handleSwitchCamera = () => {
    if (availableCameras.length <= 1) return;
    const nextIdx = (currentCameraIdx + 1) % availableCameras.length;
    setCurrentCameraIdx(nextIdx);
    startCamera(availableCameras[nextIdx].deviceId);
  };

  const handleCapture = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const width = video.videoWidth || 1280;
    const height = video.videoHeight || 720;
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, width, height);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    setCapturedDataUrl(dataUrl);

    canvas.toBlob((blob) => {
      setCapturedBlob(blob);
    }, 'image/jpeg', 0.92);

    stopCamera();
  };

  const handleRetake = () => {
    setCapturedDataUrl(null);
    setCapturedBlob(null);
    const targetDeviceId = availableCameras[currentCameraIdx]?.deviceId;
    startCamera(targetDeviceId);
  };

  const handleUsePhoto = async () => {
    if (!capturedBlob) return;

    setIsUploading(true);
    try {
      const file = new File(
        [capturedBlob],
        `medical-result-capture-${Date.now()}.jpg`,
        { type: 'image/jpeg' }
      );

      const { file_url } = await api.integrations.Core.UploadFile({ file });
      onPhotoCaptured(file_url);
      toast.success('Live photo captured and attached!');
      handleClose();
    } catch (err) {
      console.error('Failed to upload captured photo:', err);
      toast.error('Failed to upload captured photo: ' + (err.message || 'Server error'));
    } finally {
      setIsUploading(false);
    }
  };

  const handleFallbackFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const { file_url } = await api.integrations.Core.UploadFile({ file });
      onPhotoCaptured(file_url);
      toast.success('Photo captured and attached!');
      handleClose();
    } catch (err) {
      console.error('Fallback upload error:', err);
      toast.error('Failed to upload photo');
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    if (isUploading) return;
    stopCamera();
    setCapturedDataUrl(null);
    setCapturedBlob(null);
    setCameraError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isUploading) handleClose();
      }}
    >
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl relative overflow-hidden border border-gray-100 flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-teal-50/70 to-emerald-50/70 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-md shadow-teal-200">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900 leading-tight">{title}</h2>
              <p className="text-xs text-teal-700 font-medium">Capture physical result, test strip, or document</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={isUploading}
            className="text-gray-400 hover:text-gray-600 rounded-full p-1.5 transition-colors disabled:opacity-40"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewport Area */}
        <div className="p-4 sm:p-5 flex-1 flex flex-col items-center justify-center overflow-y-auto">
          <div className="relative w-full aspect-4/3 bg-gray-950 rounded-2xl overflow-hidden shadow-inner flex items-center justify-center">
            
            {/* 1. Live Camera Stream */}
            {!capturedDataUrl && !cameraError && (
              <>
                <video
                  ref={videoRef}
                  playsInline
                  autoPlay
                  muted
                  className="w-full h-full object-cover"
                />

                {/* Viewfinder crosshairs / frame */}
                <div className="absolute inset-5 border border-white/30 rounded-xl pointer-events-none flex flex-col justify-between p-2">
                  <div className="flex justify-between">
                    <div className="w-4 h-4 border-t-2 border-l-2 border-teal-400"></div>
                    <div className="w-4 h-4 border-t-2 border-r-2 border-teal-400"></div>
                  </div>
                  <div className="flex justify-between">
                    <div className="w-4 h-4 border-b-2 border-l-2 border-teal-400"></div>
                    <div className="w-4 h-4 border-b-2 border-r-2 border-teal-400"></div>
                  </div>
                </div>

                {/* Live Indicator */}
                <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[11px] font-semibold">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  LIVE CAMERA
                </div>
              </>
            )}

            {/* 2. Photo Snapshot Preview */}
            {capturedDataUrl && (
              <div className="relative w-full h-full">
                <img
                  src={capturedDataUrl}
                  alt="Captured result"
                  className="w-full h-full object-contain bg-black"
                />
                <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-teal-600/90 text-white text-[11px] font-semibold shadow-md">
                  PHOTO CAPTURED ✓
                </div>
              </div>
            )}

            {/* 3. Camera Error / Fallback View */}
            {cameraError && (
              <div className="p-6 text-center text-white space-y-4 max-w-xs">
                <div className="w-12 h-12 rounded-full bg-red-500/20 text-red-400 mx-auto flex items-center justify-center">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-semibold">{cameraError}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    You can still capture directly using your device's native camera.
                  </p>
                </div>
                <Button
                  type="button"
                  onClick={() => fileFallbackInputRef.current?.click()}
                  className="bg-teal-600 hover:bg-teal-700 text-white text-xs h-9 gap-1.5"
                >
                  <Camera className="w-4 h-4" />
                  Use Native Camera App
                </Button>
              </div>
            )}

            {/* Hidden canvas for taking snapshot */}
            <canvas ref={canvasRef} className="hidden" />

            {/* Native camera file input fallback */}
            <input
              ref={fileFallbackInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFallbackFile}
              className="hidden"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 bg-gray-50 border-t border-gray-100 flex items-center justify-between gap-3 shrink-0">
          {!capturedDataUrl ? (
            <>
              {availableCameras.length > 1 ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleSwitchCamera}
                  disabled={!streamActive}
                  className="h-10 text-xs gap-1.5 text-gray-700"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Flip Camera
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileFallbackInputRef.current?.click()}
                  className="h-10 text-xs gap-1.5 text-gray-600"
                  title="Or choose photo from device"
                >
                  <Camera className="w-3.5 h-3.5" />
                  Device App
                </Button>
              )}

              {/* Shutter Button */}
              <button
                type="button"
                onClick={handleCapture}
                disabled={!streamActive}
                className="w-14 h-14 rounded-full border-4 border-teal-600 bg-white p-1 hover:scale-105 active:scale-95 transition-all shadow-lg shadow-teal-600/20 disabled:opacity-40 disabled:cursor-not-allowed mx-auto"
                title="Capture Photo"
              >
                <div className="w-full h-full rounded-full bg-teal-600 flex items-center justify-center text-white">
                  <Camera className="w-5 h-5" />
                </div>
              </button>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClose}
                className="h-10 text-xs text-gray-500 hover:text-gray-700"
              >
                Cancel
              </Button>
            </>
          ) : (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={handleRetake}
                disabled={isUploading}
                className="h-10 text-xs gap-1.5 border-gray-300 text-gray-700"
              >
                <RotateCcw className="w-4 h-4" />
                Retake Photo
              </Button>

              <Button
                type="button"
                onClick={handleUsePhoto}
                disabled={isUploading}
                className="h-10 text-xs gap-1.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold shadow-md shadow-teal-600/20"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Attach This Photo
                  </>
                )}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
