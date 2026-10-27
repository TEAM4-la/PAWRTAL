import jsQR from 'jsqr';

/**
 * Extracts a pet GUID or identifier from scanned QR data.
 * Supports:
 * - Full URLs: https://.../public-pet-profile?id=c70a4f18-f5ac-4200-8911-6a65b14ab76b
 * - Direct GUIDs: c70a4f18-f5ac-4200-8911-6a65b14ab76b
 * - Text query strings: id=c70a4f18-f5ac-4200-8911-6a65b14ab76b
 */
export function extractPetIdFromQrData(rawData) {
  if (!rawData || typeof rawData !== 'string') return null;

  const trimmed = rawData.trim();

  // 1. Direct standard UUID / GUID match (8-4-4-4-12 hex)
  const guidRegex = /[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/i;
  
  // Check if it's a URL
  try {
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      const url = new URL(trimmed);
      const idParam = url.searchParams.get('id');
      if (idParam && guidRegex.test(idParam)) {
        return idParam;
      }
    }
  } catch (e) {
    // Not a standard URL, continue with regex parsing
  }

  // 2. Check for "id=" pattern
  const idMatch = trimmed.match(/[?&]id=([0-9a-fA-F-]{36})/i);
  if (idMatch && idMatch[1]) {
    return idMatch[1];
  }

  // 3. Search for any GUID in the string
  const directMatch = trimmed.match(guidRegex);
  if (directMatch) {
    return directMatch[0];
  }

  return trimmed; // fallback to raw string (could be microchip ID)
}

/**
 * Decodes a QR code from an image File or Blob.
 * Returns a Promise that resolves to the raw decoded string, or null if not detected.
 */
export async function decodeQrFromImageFile(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const maxDim = 1200; // downscale large photos for fast decoding
          let { width, height } = img;
          if (width > maxDim || height > maxDim) {
            const ratio = Math.min(maxDim / width, maxDim / height);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d', { willReadFrequently: true });
          ctx.drawImage(img, 0, 0, width, height);

          const imageData = ctx.getImageData(0, 0, width, height);
          let code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'dontInvert',
          });

          if (!code) {
            code = jsQR(imageData.data, imageData.width, imageData.height, {
              inversionAttempts: 'attemptBoth',
            });
          }

          resolve(code ? code.data : null);
        } catch (err) {
          console.error('Error decoding QR image:', err);
          resolve(null);
        }
      };
      img.onerror = () => resolve(null);
      img.src = e.target.result;
    };
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });
}

/**
 * Decodes a single video frame from an HTMLVideoElement.
 */
export function decodeQrFromVideo(videoElement) {
  if (!videoElement || videoElement.readyState !== videoElement.HAVE_ENOUGH_DATA) {
    return null;
  }

  const canvas = document.createElement('canvas');
  canvas.width = videoElement.videoWidth;
  canvas.height = videoElement.videoHeight;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const code = jsQR(imageData.data, imageData.width, imageData.height, {
    inversionAttempts: 'dontInvert',
  });

  return code ? code.data : null;
}
