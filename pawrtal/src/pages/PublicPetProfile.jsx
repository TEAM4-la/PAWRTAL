import React from 'react';
import { Link } from 'react-router-dom';
import { api } from '@/api/apiClient';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  PawPrint, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar,
  AlertTriangle,
  Dog,
  Cat,
  Bird,
  Rabbit,
  Fish,
  Heart,
  Syringe,
  LogIn,
  Shield,
  Stethoscope
} from 'lucide-react';
import { format, differenceInYears, differenceInMonths } from 'date-fns';

const speciesIcons = {
  dog: Dog,
  cat: Cat,
  bird: Bird,
  rabbit: Rabbit,
  fish: Fish,
};

export default function PublicPetProfile() {
  const urlParams = new URLSearchParams(window.location.search);
  const petId = urlParams.get('id');

  const { data: pet, isLoading } = useQuery({
    queryKey: ['publicPet', petId],
    queryFn: () => api.entities.Pet.filter({ id: petId }),
    enabled: !!petId,
    select: (data) => data[0],
  });

  const { data: owner } = useQuery({
    queryKey: ['petOwner', pet?.owner_email],
    queryFn: () => api.entities.User.filter({ email: pet?.owner_email }),
    enabled: !!pet?.owner_email,
    select: (data) => data[0],
  });



  const calculateAge = (dob) => {
    if (!dob) return 'Unknown';
    const years = differenceInYears(new Date(), new Date(dob));
    const months = differenceInMonths(new Date(), new Date(dob)) % 12;
    if (years === 0) return `${months} month${months !== 1 ? 's' : ''}`;
    if (months === 0) return `${years} year${years !== 1 ? 's' : ''}`;
    return `${years} years, ${months} months`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 to-orange-50">
        <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!pet) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 to-orange-50 p-6">
        <Card className="max-w-md text-center p-8">
          <PawPrint className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">Pet Not Found</h1>
          <p className="text-gray-500">This pet profile doesn't exist or has been removed.</p>
          {petId && (
            <p className="text-xs text-gray-400 mt-3 font-mono break-all">
              Scanned ID: {petId}
            </p>
          )}
        </Card>
      </div>
    );
  }

  const Icon = speciesIcons[pet.species] || Dog;

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-orange-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-lg border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-center gap-2">
          <img
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6978dd3b25d4410887cb4e17/be8bb8d23_pawrtal-logopng.png"
            alt="PAWRTAL"
            className="w-8 h-8 object-contain"
          />
          <span className="text-xl font-extrabold bg-gradient-to-r from-teal-600 to-orange-500 bg-clip-text text-transparent tracking-wider">
            PAWRTAL
          </span>
        </div>
      </header>

      <main className="max-w-lg mx-auto p-6 space-y-6">
        {/* Pet Card */}
        <Card className="overflow-hidden border-0 shadow-xl">
          <div className="relative h-56 bg-gradient-to-br from-teal-400 via-teal-500 to-orange-400">
            {pet.photo_url ? (
              <img src={pet.photo_url.replace('http://localhost:5035', '')} alt={pet.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Icon className="w-24 h-24 text-white/50" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            <div className="absolute bottom-4 left-4 right-4 space-y-1">
              <Badge className="bg-white/20 text-white backdrop-blur-sm capitalize">
                {pet.species}
              </Badge>
              <h1 className="text-3xl font-bold text-white">{pet.name}</h1>
              <p className="text-white/80">{pet.breed || 'Mixed breed'}</p>
              <p className="text-xs text-teal-100/80 font-mono">
                ID: {petId}
              </p>
            </div>
          </div>

          <CardContent className="p-6">
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="text-center p-3 bg-gray-50 rounded-xl">
                <p className="text-sm text-gray-500">Age</p>
                <p className="font-semibold text-gray-900">{calculateAge(pet.date_of_birth)}</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-xl">
                <p className="text-sm text-gray-500">Gender</p>
                <p className="font-semibold text-gray-900 capitalize">{pet.gender || 'Unknown'}</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-xl">
                <p className="text-sm text-gray-500">Weight</p>
                <p className="font-semibold text-gray-900">{pet.weight ? `${pet.weight} kg` : '-'}</p>
              </div>
            </div>

            {pet.microchip_id && (
              <div className="p-3 bg-teal-50 rounded-xl mb-4">
                <p className="text-sm text-teal-600">Microchip ID</p>
                <p className="font-mono font-semibold text-teal-800">{pet.microchip_id}</p>
              </div>
            )}

            {(pet.allergies?.length > 0 || pet.medical_conditions?.length > 0) && (
              <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                  <p className="font-semibold text-amber-800">Important Health Info</p>
                </div>
                {pet.allergies?.length > 0 && (
                  <div className="mb-2">
                    <p className="text-sm text-amber-700 font-medium">Allergies:</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {pet.allergies.map((a, i) => (
                        <Badge key={i} className="bg-red-100 text-red-700 border-red-200">{a}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                {pet.medical_conditions?.length > 0 && (
                  <div>
                    <p className="text-sm text-amber-700 font-medium">Conditions:</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {pet.medical_conditions.map((c, i) => (
                        <Badge key={i} className="bg-amber-100 text-amber-700 border-amber-200">{c}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>


        {/* Owner Contact */}
        {owner && (
          <Card className="border-0 shadow-lg bg-gradient-to-br from-teal-500 to-teal-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Heart className="w-5 h-5" />
                <h2 className="font-semibold">Owner Information</h2>
              </div>
              
              <div className="space-y-3">
                {owner.full_name && (
                  <p className="font-medium text-lg">{owner.full_name}</p>
                )}
                
                {owner.phone && (
                  <a href={`tel:${owner.phone}`} className="flex items-center gap-3 p-3 bg-white/10 rounded-xl hover:bg-white/20 transition-colors">
                    <Phone className="w-5 h-5" />
                    <span>{owner.phone}</span>
                  </a>
                )}
                
                {owner.email && (
                  <a href={`mailto:${owner.email}`} className="flex items-center gap-3 p-3 bg-white/10 rounded-xl hover:bg-white/20 transition-colors">
                    <Mail className="w-5 h-5" />
                    <span>{owner.email}</span>
                  </a>
                )}
                
                {owner.address && (
                  <div className="flex items-center gap-3 p-3 bg-white/10 rounded-xl">
                    <MapPin className="w-5 h-5 flex-shrink-0" />
                    <span>{owner.address}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Sign In — owner or vet can log in to see full private records */}
        <Card className="border-0 shadow-lg overflow-hidden">
          <div className="p-6 space-y-5">
            <div className="text-center space-y-1">
              <h3 className="text-lg font-bold text-gray-900">Access Full Pet Records</h3>
              <p className="text-sm text-gray-500">
                Sign in to view {pet.name}'s complete medical history, records, and more.
              </p>
            </div>

            {/* Owner sign-in */}
            <Link to={`/sign-in?role=owner&redirect=${encodeURIComponent(`/pet-profile?id=${petId}`)}`}>
              <Button className="w-full h-12 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold gap-2 rounded-xl shadow-md shadow-amber-200/50 transition-all">
                <Shield className="w-5 h-5" />
                Sign In as Pet Owner
              </Button>
            </Link>

            <div className="flex items-center gap-3 my-2">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-xs text-gray-400 font-medium">OR</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            {/* Vet sign-in */}
            <Link to={`/sign-in?role=vet&redirect=${encodeURIComponent(`/vet-patient-detail?id=${petId}`)}`}>
              <Button variant="outline" className="w-full h-12 border-2 border-teal-500 text-teal-700 hover:bg-teal-50 font-semibold gap-2 rounded-xl transition-all">
                <Stethoscope className="w-5 h-5" />
                Sign In as Veterinarian
              </Button>
            </Link>

            <p className="text-xs text-gray-400 text-center">
              Securely access the Pet Care Management Dashboard
            </p>
          </div>
        </Card>

        <p className="text-center text-sm text-gray-400 pb-6">
          Powered by PAWRTAL • VM Veterinary Clinic
        </p>
      </main>
    </div>
  );
}