import React from 'react';
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
  Syringe
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

  const { data: vaccinations = [] } = useQuery({
    queryKey: ['publicVaccinations', petId],
    queryFn: () => api.entities.Vaccination.filter({ pet_id: petId }, '-date_administered', 5),
    enabled: !!petId,
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
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center">
            <PawPrint className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold bg-gradient-to-r from-teal-600 to-orange-500 bg-clip-text text-transparent">
            PAWRTAL
          </span>
        </div>
      </header>

      <main className="max-w-lg mx-auto p-6 space-y-6">
        {/* Pet Card */}
        <Card className="overflow-hidden border-0 shadow-xl">
          <div className="relative h-56 bg-gradient-to-br from-teal-400 via-teal-500 to-orange-400">
            {pet.photo_url ? (
              <img src={pet.photo_url} alt={pet.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Icon className="w-24 h-24 text-white/50" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            <div className="absolute bottom-4 left-4 right-4">
              <Badge className="bg-white/20 text-white backdrop-blur-sm mb-2 capitalize">
                {pet.species}
              </Badge>
              <h1 className="text-3xl font-bold text-white">{pet.name}</h1>
              <p className="text-white/80">{pet.breed || 'Mixed breed'}</p>
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

        {/* Vaccinations */}
        {vaccinations.length > 0 && (
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Syringe className="w-5 h-5 text-purple-600" />
                <h2 className="font-semibold text-gray-900">Recent Vaccinations</h2>
              </div>
              <div className="space-y-3">
                {vaccinations.map((vax) => (
                  <div key={vax.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{vax.vaccine_name}</p>
                      <p className="text-sm text-gray-500">
                        {format(new Date(vax.date_administered), 'MMM d, yyyy')}
                      </p>
                    </div>
                    {vax.next_due_date && (
                      <Badge variant="outline" className="text-xs">
                        Due: {format(new Date(vax.next_due_date), 'MMM yyyy')}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

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

        <p className="text-center text-sm text-gray-400 pb-6">
          Powered by PAWRTAL • VM Veterinary Clinic
        </p>
      </main>
    </div>
  );
}