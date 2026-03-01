import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from "@/utils";
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download, Share2, QrCode, Dog, Cat, Bird, Rabbit, Fish } from 'lucide-react';
import { toast } from "sonner";

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

  const { data: pet, isLoading } = useQuery({
    queryKey: ['pet', petId],
    queryFn: () => base44.entities.Pet.filter({ id: petId }),
    enabled: !!petId,
    select: (data) => data[0],
  });

  const getQRCodeUrl = () => {
    if (!pet) return '';
    const profileUrl = `${window.location.origin}${createPageUrl(`PublicPetProfile?id=${pet.id}`)}`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(profileUrl)}&color=0d9488`;
  };

  const handleDownload = async () => {
    try {
      const response = await fetch(getQRCodeUrl());
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = `${pet?.name || 'pet'}-qr-code.png`;
      link.href = url;
      link.click();
      window.URL.revokeObjectURL(url);
      toast.success('QR Code downloaded!');
    } catch (error) {
      toast.error('Failed to download QR code');
    }
  };

  const handleShare = async () => {
    const profileUrl = `${window.location.origin}${createPageUrl(`PublicPetProfile?id=${pet?.id}`)}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${pet?.name}'s Pet Profile`,
          text: `Check out ${pet?.name}'s digital pet profile on PAWRTAL`,
          url: profileUrl,
        });
      } catch (err) {
        // User cancelled sharing
      }
    } else {
      await navigator.clipboard.writeText(profileUrl);
      toast.success('Link copied to clipboard!');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!pet) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-500">Pet not found</p>
        <Link to={createPageUrl('MyPets')}>
          <Button className="mt-4">Back to My Pets</Button>
        </Link>
      </div>
    );
  }

  const Icon = speciesIcons[pet.species] || Dog;

  return (
    <div className="p-6 lg:p-8 max-w-lg mx-auto space-y-6">
      <Button
        variant="ghost"
        onClick={() => navigate(-1)}
        className="gap-2 text-gray-600"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </Button>

      <div className="text-center space-y-2">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center mx-auto shadow-lg shadow-teal-200">
          <QrCode className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Digital Pet ID</h1>
        <p className="text-gray-500">Scan this QR code to access {pet.name}'s profile</p>
      </div>

      <Card className="overflow-hidden border-0 shadow-xl">
        <div className="bg-gradient-to-br from-teal-500 to-teal-600 p-6 text-center text-white">
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
              <p className="text-teal-100 text-sm">{pet.breed || pet.species}</p>
            </div>
          </div>
        </div>

        <CardContent className="p-8 flex flex-col items-center">
          <div className="bg-white p-4 rounded-2xl shadow-inner border-2 border-gray-100">
            <img 
              src={getQRCodeUrl()} 
              alt="QR Code" 
              className="rounded-lg w-[280px] h-[280px]"
            />
          </div>

          <p className="text-xs text-gray-400 mt-4 text-center">
            Attach this QR to your pet's collar for quick identification
          </p>
        </CardContent>

        <div className="px-6 pb-6 flex gap-3">
          <Button
            variant="outline"
            onClick={handleShare}
            className="flex-1 h-12 gap-2"
          >
            <Share2 className="w-4 h-4" />
            Share
          </Button>
          <Button
            onClick={handleDownload}
            className="flex-1 h-12 gap-2 bg-teal-600 hover:bg-teal-700"
          >
            <Download className="w-4 h-4" />
            Download
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
}