import React, { useState, useRef } from 'react';
import { Camera, Image as ImageIcon, Dog, Loader2, X } from 'lucide-react';
import { Button } from "@/components/ui/button";

export default function PetPhotoUpload({
  photoUrl = '',
  onPhotoSelected,
  isUploading = false,
  label = 'Click to upload photo'
}) {
  const [showModal, setShowModal] = useState(false);
  const cameraInputRef = useRef(null);
  const galleryInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file && onPhotoSelected) {
      onPhotoSelected(file);
    }
    // Reset inputs so selecting the same file again triggers change event
    if (e.target) {
      e.target.value = '';
    }
    setShowModal(false);
  };

  const openCamera = () => {
    if (cameraInputRef.current) {
      cameraInputRef.current.click();
    }
  };

  const openGallery = () => {
    if (galleryInputRef.current) {
      galleryInputRef.current.click();
    }
  };

  return (
    <div className="flex flex-col items-center">
      {/* Hidden file inputs */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Avatar with click triggers */}
      <div className="relative group">
        <button
          type="button"
          onClick={() => !isUploading && setShowModal(true)}
          className="w-32 h-32 rounded-full overflow-hidden bg-gradient-to-br from-teal-100 to-orange-100 flex items-center justify-center border-4 border-white shadow-lg focus:outline-none focus:ring-2 focus:ring-teal-400 group-hover:opacity-95 transition-all"
          title="Change photo"
        >
          {photoUrl ? (
            <img src={photoUrl} alt="Pet" className="w-full h-full object-cover" />
          ) : (
            <Dog className="w-12 h-12 text-teal-300" />
          )}
        </button>

        <button
          type="button"
          onClick={() => !isUploading && setShowModal(true)}
          disabled={isUploading}
          className="absolute bottom-0 right-0 w-10 h-10 rounded-full bg-teal-500 hover:bg-teal-600 flex items-center justify-center transition-all shadow-md text-white border-2 border-white focus:outline-none focus:ring-2 focus:ring-teal-400"
          aria-label="Upload pet photo"
        >
          {isUploading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Camera className="w-5 h-5" />
          )}
        </button>
      </div>

      <button
        type="button"
        onClick={() => !isUploading && setShowModal(true)}
        className="text-sm text-gray-500 hover:text-teal-600 transition-colors mt-3 font-medium"
      >
        {label}
      </button>

      {/* Photo Option Modal / Action Sheet */}
      {showModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowModal(false);
          }}
        >
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl relative space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900 text-lg">Choose Pet Photo</h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 rounded-full p-1 transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-gray-500">
              How would you like to provide your pet's photo?
            </p>

            <div className="space-y-3 pt-1">
              {/* Camera Option */}
              <button
                type="button"
                onClick={openCamera}
                className="w-full flex items-center gap-3.5 p-3.5 rounded-xl border border-teal-200 bg-teal-50/60 hover:bg-teal-100/70 text-teal-950 font-medium transition-all group text-left"
              >
                <div className="w-11 h-11 rounded-xl bg-teal-500 text-white flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform shadow-sm">
                  <Camera className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-semibold text-teal-950 text-sm">Take Photo</div>
                  <div className="text-xs text-teal-700">Open camera and capture now</div>
                </div>
              </button>

              {/* Gallery / File Picker Option */}
              <button
                type="button"
                onClick={openGallery}
                className="w-full flex items-center gap-3.5 p-3.5 rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100/80 text-gray-900 font-medium transition-all group text-left"
              >
                <div className="w-11 h-11 rounded-xl bg-gray-200 text-gray-700 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform shadow-sm">
                  <ImageIcon className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-semibold text-gray-900 text-sm">Choose from Gallery</div>
                  <div className="text-xs text-gray-500">Select an existing photo or file</div>
                </div>
              </button>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={() => setShowModal(false)}
              className="w-full h-11 mt-2 text-gray-600 rounded-xl"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
