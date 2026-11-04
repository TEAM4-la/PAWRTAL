import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from "@/utils";
import { api } from '@/api/apiClient';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download, Share2, QrCode, Dog, Cat, Bird, Rabbit, Fish, Printer } from 'lucide-react';

import OwnerSidebar from '@/components/layout/OwnerSidebar';
import BackButton from '@/components/ui/BackButton';
import PrintablePetId from '@/components/shared/PrintablePetId';
import { toast } from 'sonner';

const speciesIcons = {
  dog: Dog,
  cat: Cat,
  bird: Bird,
  rabbit: Rabbit,
  fish: Fish,
};

export default function PetQR() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const petId = urlParams.get('id');

  const { data: user } = useQuery({ queryKey: ['me'], queryFn: () => api.auth.me() });

  const { data: pet, isLoading } = useQuery({
    queryKey: ['pet', petId],
    queryFn: () => api.entities.Pet.filter({ id: petId }),
    enabled: !!petId,
    select: (data) => data[0],
  });

  const getPublicBaseUrl = () => {
    const raw =
      typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_PUBLIC_BASE_URL != null
        ? String(import.meta.env.VITE_PUBLIC_BASE_URL)
        : '';
    const trimmed = raw.trim().replace(/\/$/, '');
    return trimmed || window.location.origin;
  };

  /** Full URL encoded in the QR — opens the public pet profile page (for anyone who scans). */
  const getPublicProfileUrl = () => {
    if (!pet) return '';
    return `${getPublicBaseUrl()}${createPageUrl(`PublicPetProfile?id=${pet.id}`)}`;
  };

  const getQRCodeImageServiceUrl = (size = '280x280') => {
    const target = getPublicProfileUrl();
    if (!target) return '';
    return `https://api.qrserver.com/v1/create-qr-code/?size=${size}&data=${encodeURIComponent(target)}&color=0d9488`;
  };

  const handleDownload = async () => {
    try {
      // 2 cm x 2 cm at 300 DPI is exactly 236 x 236 pixels
      const qrUrl = getQRCodeImageServiceUrl('236x236');
      const response = await fetch(qrUrl);
      const rawBuffer = await response.arrayBuffer();

      // Inject standard PNG pHYs chunk (11,811 pixels/meter = 300 DPI)
      // When opened in Word, Docs, Photoshop, or Windows Print, this guarantees standard 2.0 cm x 2.0 cm print size
      let finalBlob;
      try {
        const u8 = new Uint8Array(rawBuffer);
        if (u8[0] === 0x89 && u8[1] === 0x50 && u8[2] === 0x4E && u8[3] === 0x47) {
          const ihdrDataLen = (u8[8] << 24) | (u8[9] << 16) | (u8[10] << 8) | u8[11];
          const ihdrEndOffset = 8 + 4 + 4 + ihdrDataLen + 4;

          const physChunk = new Uint8Array([
            0x00, 0x00, 0x00, 0x09, // Length: 9 bytes
            0x70, 0x48, 0x59, 0x73, // 'pHYs'
            0x00, 0x00, 0x2E, 0x23, // X: 11,811 pixels/meter (300 DPI)
            0x00, 0x00, 0x2E, 0x23, // Y: 11,811 pixels/meter (300 DPI)
            0x01,                   // Unit: meter
            0x78, 0xA5, 0x3F, 0x76  // CRC32
          ]);

          const combined = new Uint8Array(u8.length + physChunk.length);
          combined.set(u8.subarray(0, ihdrEndOffset), 0);
          combined.set(physChunk, ihdrEndOffset);
          combined.set(u8.subarray(ihdrEndOffset), ihdrEndOffset + physChunk.length);

          finalBlob = new Blob([combined], { type: 'image/png' });
        } else {
          finalBlob = new Blob([rawBuffer], { type: 'image/png' });
        }
      } catch {
        finalBlob = new Blob([rawBuffer], { type: 'image/png' });
      }

      const url = window.URL.createObjectURL(finalBlob);
      const link = document.createElement('a');
      link.download = `${pet?.name || 'pet'}-collar-qr.png`;
      link.href = url;
      link.click();
      window.URL.revokeObjectURL(url);
      toast.success('QR Code downloaded successfully!');
    } catch (error) {
      console.error('Failed to download QR code', error);
      toast.error('Failed to download QR code');
    }
  };

  const handleShare = async () => {
    const pageUrl = getPublicProfileUrl();
    if (!pageUrl) {
      toast.error('Pet profile link not found');
      return;
    }

    // 1. If native share is supported (e.g. mobile with HTTPS)
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share({
          title: `${pet?.name}'s Digital Pet ID — PAWRTAL`,
          text: `Check out ${pet?.name}'s public pet profile on PAWRTAL:`,
          url: pageUrl,
        });
        toast.success('Shared successfully!');
        return;
      } catch (err) {
        if (err.name === 'AbortError') {
          // User dismissed the native share sheet
          return;
        }
        console.warn('Native share failed, falling back to copy:', err);
      }
    }

    // 2. Fallback to copy link to clipboard (works on HTTP and mobile)
    try {
      let copied = false;
      if (typeof navigator !== 'undefined' && navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(pageUrl);
        copied = true;
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = pageUrl;
        textArea.style.position = 'fixed';
        textArea.style.left = '-9999px';
        textArea.style.top = '-9999px';
        textArea.setAttribute('readonly', '');
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        textArea.setSelectionRange(0, 99999);
        copied = document.execCommand('copy');
        document.body.removeChild(textArea);
      }

      if (copied) {
        toast.success('Pet profile link copied to clipboard!');
      } else {
        window.prompt('Copy this link to share:', pageUrl);
      }
    } catch {
      window.prompt('Copy this link to share:', pageUrl);
    }
  };

  const handlePrint = () => {
    try {
      toast.info('Preparing print preview...', { id: 'print-id', duration: 2500 });
      setTimeout(() => {
        if (typeof window !== 'undefined' && typeof window.print === 'function') {
          window.print();
        } else {
          toast.error('Printing is not supported on this browser/device.');
        }
      }, 150);
    } catch (err) {
      console.error('Print failed:', err);
      toast.error('Unable to open print dialog on this device.');
    }
  };

  if (isLoading) {
    return (
      <OwnerSidebar user={user}>
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-amber-700 border-t-transparent rounded-full animate-spin" />
        </div>
      </OwnerSidebar>
    );
  }

  if (!pet) {
    return (
      <OwnerSidebar user={user}>
        <div className="p-6 text-center">
          <p className="text-gray-500">Pet not found</p>
          <Link to={createPageUrl('MyPets')}>
            <Button className="mt-4">Back to My Pets</Button>
          </Link>
        </div>
      </OwnerSidebar>
    );
  }

  const Icon = speciesIcons[pet.species] || Dog;

  const content = (
    <div className="p-6 lg:p-8 max-w-lg mx-auto space-y-6">
      <BackButton
        onClick={() => petId ? navigate(createPageUrl(`PetProfile?id=${petId}`)) : navigate(createPageUrl('Dashboard'))}
        className="mb-2"
      />

      <div className="text-center space-y-2">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center mx-auto shadow-lg shadow-orange-200 text-white">
          <QrCode className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Digital Pet ID</h1>
        <p className="text-gray-500">Scan to open {pet.name}'s public pet profile on PAWRTAL</p>
      </div>

      <Card className="overflow-hidden border-0 shadow-xl">
        <div className="bg-gradient-to-br from-amber-500 to-orange-500 p-6 text-center text-white">
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-full overflow-hidden bg-white/20 flex items-center justify-center">
              {pet.photo_url ? (
                <img src={pet.photo_url} alt={pet.name} className="w-full h-full object-cover" />
              ) : (
                <Icon className="w-6 h-6 text-white" />
              )}
            </div>
            <div className="text-left">
              <h2 className="text-xl font-bold">{pet.name}</h2>
              <p className="text-orange-100 text-sm">{pet.breed || pet.species}</p>
            </div>
          </div>
        </div>

        <CardContent className="p-8 flex flex-col items-center">
          <div className="bg-white p-4 rounded-2xl shadow-inner border-2 border-gray-100">
            <a
              href={getPublicProfileUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
              title="Open Pet QR link"
            >
              <img
                src={getQRCodeImageServiceUrl()}
                alt={`QR code linking to ${pet.name}'s public pet profile`}
                className="rounded-lg w-[280px] h-[280px]"
              />
            </a>
          </div>

          <p className="text-xs text-gray-400 mt-4 text-center">
            Attach this QR to your pet's collar for quick identification
          </p>
        </CardContent>

        <div className="px-6 pb-6 flex flex-col sm:flex-row gap-3">
          <div className="flex gap-3 w-full sm:w-2/3">
            <Button
              type="button"
              variant="outline"
              onClick={handleShare}
              className="flex-1 h-12 gap-2 hover:border-orange-200 hover:bg-orange-50 hover:text-orange-600 active:bg-orange-100 cursor-pointer touch-manipulation"
            >
              <Share2 className="w-4 h-4" />
              Share
            </Button>
            <Button
              type="button"
              onClick={handleDownload}
              className="flex-1 h-12 gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-sm shadow-orange-100 active:opacity-90 cursor-pointer touch-manipulation"
            >
              <Download className="w-4 h-4" />
              Download QR
            </Button>
          </div>
          <Button
            type="button"
            onClick={handlePrint}
            className="w-full sm:w-1/3 h-12 gap-2 bg-orange-500 hover:bg-orange-600 text-white active:bg-orange-700 cursor-pointer touch-manipulation"
          >
            <Printer className="w-4 h-4" />
            Print ID
          </Button>
        </div>
      </Card>

      <Card className="bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200">
        <CardContent className="p-4">
          <h3 className="font-semibold text-orange-800 mb-1">💡 Pro Tip</h3>
          <p className="text-sm text-orange-700">
            Print this QR code and attach it to your pet's collar. 
            If your pet gets lost, anyone can scan it to see your contact information and help reunite you.
          </p>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <OwnerSidebar user={user}>
      <div className="print:hidden">
        {content}
      </div>
      <PrintablePetId pet={pet} user={user} qrCodeUrl={getQRCodeImageServiceUrl()} />
    </OwnerSidebar>
  );
}
