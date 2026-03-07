import React from 'react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dog, Cat, Bird, Rabbit, Fish, Eye, QrCode, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from "@/utils";
import { format, differenceInYears, differenceInMonths } from 'date-fns';

const speciesIcons = {
  dog: Dog,
  cat: Cat,
  bird: Bird,
  rabbit: Rabbit,
  fish: Fish,
};

const speciesColors = {
  dog: 'bg-amber-100 text-amber-700',
  cat: 'bg-purple-100 text-purple-700',
  bird: 'bg-sky-100 text-sky-700',
  rabbit: 'bg-pink-100 text-pink-700',
  fish: 'bg-blue-100 text-blue-700',
  hamster: 'bg-orange-100 text-orange-700',
  reptile: 'bg-green-100 text-green-700',
  other: 'bg-gray-100 text-gray-700',
};

export default function PetCard({ pet, showActions = true, compact = false }) {
  const Icon = speciesIcons[pet.species] || Dog;
  
  const calculateAge = (dob) => {
    if (!dob) return 'Unknown';
    const years = differenceInYears(new Date(), new Date(dob));
    const months = differenceInMonths(new Date(), new Date(dob)) % 12;
    if (years === 0) return `${months} months`;
    if (months === 0) return `${years} years`;
    return `${years}y ${months}m`;
  };

  if (compact) {
    return (
      <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-100 hover:border-teal-200 transition-all">
        <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-teal-50 to-teal-100 flex items-center justify-center">
          {pet.photo_url ? (
            <img src={pet.photo_url} alt={pet.name} className="w-full h-full object-cover" />
          ) : (
            <Icon className="w-6 h-6 text-teal-600" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 truncate">{pet.name}</p>
          <p className="text-sm text-gray-500">{pet.breed || pet.species}</p>
        </div>
        <Badge className={speciesColors[pet.species]}>{pet.species}</Badge>
      </div>
    );
  }

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 border-0 bg-white">
      <div className="relative h-48 bg-gradient-to-br from-teal-50 via-white to-orange-50">
        {pet.photo_url ? (
          <img src={pet.photo_url} alt={pet.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Icon className="w-20 h-20 text-teal-300" />
          </div>
        )}
        <Badge className={`absolute top-3 right-3 ${speciesColors[pet.species]}`}>
          {pet.species}
        </Badge>
      </div>
      
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="text-xl font-bold text-gray-900">{pet.name}</h3>
            <p className="text-gray-500 text-sm">{pet.breed || 'Mixed breed'}</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-teal-600">{calculateAge(pet.date_of_birth)}</p>
            <p className="text-xs text-gray-400">{pet.gender}</p>
          </div>
        </div>

        {pet.weight && (
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
            <span className="px-2 py-1 bg-gray-100 rounded-full">{pet.weight} kg</span>
            {pet.is_neutered && (
              <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full">Neutered</span>
            )}
          </div>
        )}

        {showActions && (
          <div className="flex gap-2 pt-3 border-t border-gray-100">
            <Link to={createPageUrl(`PetProfile?id=${pet.id}`)} className="flex-1">
          <Button variant="outline" className="w-full gap-2 text-teal-600 border-teal-200 hover:bg-teal-50">
                <Eye className="w-4 h-4" />
                View
              </Button>
            </Link>
            <Link to={createPageUrl(`PetQR?id=${pet.id}`)}>
              <Button variant="outline" className="gap-2 border-gray-200">
                <QrCode className="w-4 h-4" />
              </Button>
            </Link>
            <Link to={createPageUrl(`BookAppointment?petId=${pet.id}`)}>
              <Button className="gap-2 bg-teal-600 hover:bg-teal-700 text-white">
                <Calendar className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        )}
      </div>
    </Card>
  );
}