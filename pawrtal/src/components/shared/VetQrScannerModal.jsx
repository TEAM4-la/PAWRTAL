import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/api/apiClient';
import { createPageUrl } from '@/utils';
import { 
  Camera, 
  Image as ImageIcon, 
  QrCode, 
  X, 
  Loader2, 
  AlertCircle, 
  CheckCircle2, 
  Search,
  RefreshCw,
  VideoOff
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { 
  extractPetIdFromQrData, 
  decodeQrFromImageFile, 
  decodeQrFromVideo 
} from '@/utils/qrScanner';

export default function VetQrScannerModal({ isOpen, onClose }) {
  const navigate = useNavigate();
  const [mode, setMode] = useState('menu'); // 'menu' | 'camera' | 'manual'
  const [loading, setLoading] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [manualInput, setManualInput] = useState('');

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const animFrameRef = useRef(null);
  const fileInputRef = useRef(null);

  // Play a brief positive beep sound using browser Web Audio API
  const playBeep = () => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, ctx.currentTime); // A5 note
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
        osc.start();
        osc.stop(ctx.currentTime + 0.15);
      }
    } catch (e) {
      // Audio not permitted or supported, non-critical
    }
  };

  const handlePetFound = useCallback(async (scannedRaw) => {
    if (!scannedRaw) return;
    setLoading(true);

    const extractedId = extractPetIdFromQrData(scannedRaw);
    if (!extractedId) {
      setLoading(false);
      toast.error('Could not parse a valid Pet ID from the scanned QR code.');
      return;
    }

    try {
      // 1. Try finding by Pet ID (GUID)
      let foundPets = [];
      try {
        foundPets = await api.entities.Pet.filter({ id: extractedId });
      } catch (e) {
        // Continue to microchip check
      }

      // 2. Fallback: Check if it's a microchip ID
      if (!foundPets || foundPets.length === 0) {
        foundPets = await api.entities.Pet.filter({ microchip_id: extractedId });
      }

      if (foundPets && foundPets.length > 0) {
        const pet = foundPets[0];
        playBeep();
        toast.success(`Patient located: ${pet.name} (${pet.species || 'Pet'})`, {
          description: 'Emergency profile accessed successfully.',
        });
        stopCamera();
        onClose();
        navigate(createPageUrl(`VetPatientDetail?id=${pet.id}`));
      } else {
        toast.error('Patient record not found', {
          description: `No pet in system matches ID/Microchip "${extractedId}".`,
        });
      }
    } catch (err) {
      console.error('Failed to locate pet:', err);
      toast.error('Error looking up patient record: ' + (err.message || 'Server error'));
    } finally {
      setLoading(false);
    }
  }, [navigate, onClose]);

  // Start Live Camera stream
  const startCamera = async () => {
    setCameraError('');
    setMode('camera');

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError('Camera access is not supported by this browser.');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } }
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        scanVideoLoop();
      }
    } catch (err) {
      console.error('Camera error:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraError('Camera permission was denied. Please allow camera permissions in browser settings.');
      } else {
        setCameraError('Unable to start camera: ' + err.message);
      }
    }
  };

  const stopCamera = () => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const scanVideoLoop = () => {
    if (!videoRef.current || videoRef.current.paused || videoRef.current.ended) {
      return;
    }

    const decoded = decodeQrFromVideo(videoRef.current);
    if (decoded) {
      handlePetFound(decoded);
      return; // Stop scanning loop once found
    }

    animFrameRef.current = requestAnimationFrame(scanVideoLoop);
  };

  // Handle uploaded QR image file
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      const decodedText = await decodeQrFromImageFile(file);
      if (decodedText) {
        await handlePetFound(decodedText);
      } else {
        toast.error('Could not detect a QR code in the uploaded image. Please ensure it is clear and well-lit.');
      }
    } catch (err) {
      console.error('File scan error:', err);
      toast.error('Failed to process image file.');
    } finally {
      setLoading(false);
      if (e.target) e.target.value = '';
    }
  };

  // Close & cleanup
  const handleClose = () => {
    stopCamera();
    setMode('menu');
    setCameraError('');
    setManualInput('');
    onClose();
  };

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setMode('menu');
      setCameraError('');
      setManualInput('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) handleClose();
      }}
    >
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl relative overflow-hidden border border-gray-100">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-gradient-to-r from-teal-50/50 to-emerald-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-600 text-white flex items-center justify-center shadow-md shadow-teal-200">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 leading-tight">Emergency Pet QR Scan</h2>
              <p className="text-xs text-teal-700 font-medium">Instant patient record admission</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="text-gray-400 hover:text-gray-600 rounded-full p-1.5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          className="hidden"
        />

        {/* Modal Content */}
        <div className="p-6">

          {/* MODE: MENU (Choose Camera or File Upload) */}
          {mode === 'menu' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600 text-center">
                Scan the pet’s QR collar tag or medical card to instantly retrieve medical history and emergency contacts.
              </p>

              <div className="space-y-3 pt-2">
                {/* 1. Live Camera Button */}
                <button
                  type="button"
                  onClick={startCamera}
                  disabled={loading}
                  className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 border-teal-200 bg-teal-50/70 hover:bg-teal-100 text-left transition-all group shadow-sm hover:shadow"
                >
                  <div className="w-12 h-12 rounded-xl bg-teal-600 text-white flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform shadow-md shadow-teal-200">
                    <Camera className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-gray-900 text-sm flex items-center justify-between">
                      <span>Open Camera Scanner</span>
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-teal-200/80 text-teal-900">Live</span>
                    </div>
                    <div className="text-xs text-gray-600 mt-0.5">Use device camera to scan collar tag</div>
                  </div>
                </button>

                {/* 2. Upload Image Button */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={loading}
                  className="w-full flex items-center gap-4 p-4 rounded-2xl border border-gray-200 bg-gray-50/80 hover:bg-gray-100 text-left transition-all group"
                >
                  <div className="w-12 h-12 rounded-xl bg-gray-200 text-gray-700 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                    <ImageIcon className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-gray-900 text-sm">Upload QR Image / Photo</div>
                    <div className="text-xs text-gray-500 mt-0.5">Choose a saved QR screenshot or photo</div>
                  </div>
                </button>

                {/* 3. Manual Entry Button */}
                <button
                  type="button"
                  onClick={() => setMode('manual')}
                  disabled={loading}
                  className="w-full py-2.5 text-xs text-center text-teal-700 hover:text-teal-900 font-semibold transition-colors"
                >
                  Or enter Pet ID / Microchip manually →
                </button>
              </div>
            </div>
          )}

          {/* MODE: CAMERA LIVE SCANNER */}
          {mode === 'camera' && (
            <div className="space-y-4">
              {cameraError ? (
                <div className="p-6 text-center bg-red-50 rounded-2xl border border-red-200 space-y-3">
                  <VideoOff className="w-10 h-10 text-red-500 mx-auto" />
                  <p className="text-sm text-red-700 font-medium">{cameraError}</p>
                  <div className="flex gap-2 justify-center pt-2">
                    <Button variant="outline" size="sm" onClick={() => setMode('menu')}>
                      Back to Options
                    </Button>
                    <Button size="sm" className="bg-teal-600 text-white" onClick={startCamera}>
                      Try Again
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="relative rounded-2xl overflow-hidden bg-black aspect-video flex items-center justify-center shadow-inner">
                  <video
                    ref={videoRef}
                    playsInline
                    autoPlay
                    muted
                    className="w-full h-full object-cover"
                  />

                  {/* Viewfinder Target Box Overlay */}
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <div className="w-48 h-48 border-2 border-teal-400 rounded-2xl relative shadow-[0_0_0_9999px_rgba(0,0,0,0.4)]">
                      {/* Corner Accents */}
                      <span className="absolute -top-1 -left-1 w-4 h-4 border-t-4 border-l-4 border-emerald-400 rounded-tl" />
                      <span className="absolute -top-1 -right-1 w-4 h-4 border-t-4 border-r-4 border-emerald-400 rounded-tr" />
                      <span className="absolute -bottom-1 -left-1 w-4 h-4 border-b-4 border-l-4 border-emerald-400 rounded-bl" />
                      <span className="absolute -bottom-1 -right-1 w-4 h-4 border-b-4 border-r-4 border-emerald-400 rounded-br" />
                      {/* Animated Laser line */}
                      <div className="absolute inset-x-2 top-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent animate-bounce shadow-sm shadow-emerald-400" />
                    </div>
                  </div>

                  {loading && (
                    <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center text-white gap-2">
                      <Loader2 className="w-8 h-8 animate-spin text-teal-400" />
                      <span className="text-sm font-semibold">Finding patient record...</span>
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between text-xs text-gray-500 px-1">
                <span>Align QR code inside the box</span>
                <button
                  type="button"
                  onClick={() => {
                    stopCamera();
                    setMode('menu');
                  }}
                  className="text-teal-700 font-semibold hover:underline"
                >
                  Switch mode
                </button>
              </div>
            </div>
          )}

          {/* MODE: MANUAL ID / MICROCHIP ENTRY */}
          {mode === 'manual' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Enter the Pet ID (GUID) or Microchip Number found on the pet’s physical collar tag.
              </p>

              <div className="space-y-3">
                <Input
                  placeholder="e.g. c70a4f18-f5ac-4200... or MC-9821"
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  className="h-11 border-gray-300 font-mono text-sm"
                  autoFocus
                />

                <Button
                  type="button"
                  disabled={!manualInput.trim() || loading}
                  onClick={() => handlePetFound(manualInput.trim())}
                  className="w-full bg-teal-600 hover:bg-teal-700 text-white h-11 rounded-xl font-semibold gap-2"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  Search Patient Record
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setMode('menu')}
                  className="w-full text-xs text-gray-500"
                >
                  ← Back to scan options
                </Button>
              </div>
            </div>
          )}

          {/* Global Loading Overlay if file decoding */}
          {loading && mode !== 'camera' && (
            <div className="py-6 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
              <p className="text-sm font-medium text-gray-700">Searching patient database...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
