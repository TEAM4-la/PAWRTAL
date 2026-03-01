import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from "@/utils";
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import EmptyState from "@/components/shared/EmptyState";
import { 
  Search, 
  PawPrint, 
  User, 
  Calendar,
  FileText,
  Dog,
  Cat,
  Bird,
  Rabbit,
  Fish,
  ArrowRight,
  ChevronLeft
} from 'lucide-react';
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

export default function Patients() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [speciesFilter, setSpeciesFilter] = useState('all');

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: pets = [], isLoading } = useQuery({
    queryKey: ['allPets'],
    queryFn: () => base44.entities.Pet.list('-created_date'),
    enabled: !!user,
  });

  const { data: appointments = [] } = useQuery({
    queryKey: ['allAppointments'],
    queryFn: () => base44.entities.Appointment.list('-date'),
    enabled: !!user,
  });

  const calculateAge = (dob) => {
    if (!dob) return 'Unknown';
    const years = differenceInYears(new Date(), new Date(dob));
    const months = differenceInMonths(new Date(), new Date(dob)) % 12;
    if (years === 0) return `${months}mo`;
    return `${years}y ${months}mo`;
  };

  const getLastVisit = (petId) => {
    const petAppointments = appointments
      .filter(apt => apt.pet_id === petId && apt.status === 'completed')
      .sort((a, b) => new Date(b.date) - new Date(a.date));
    return petAppointments[0]?.date;
  };

  const filteredPets = pets.filter(pet => {
    const matchesSearch = 
      pet.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pet.breed?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pet.owner_email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSpecies = speciesFilter === 'all' || pet.species === speciesFilter;
    return matchesSearch && matchesSpecies;
  });

  const speciesList = [...new Set(pets.map(p => p.species))];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
      <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-teal-700 transition-colors mb-2">
        <ChevronLeft className="w-4 h-4" /> Back
      </button>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Patients</h1>
          <p className="text-gray-500 mt-1">{pets.length} registered patients</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            placeholder="Search by name, breed, or owner..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-11"
          />
        </div>
        <Select value={speciesFilter} onValueChange={setSpeciesFilter}>
          <SelectTrigger className="w-full sm:w-40 h-11">
            <SelectValue placeholder="All species" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Species</SelectItem>
            {speciesList.map(species => (
              <SelectItem key={species} value={species} className="capitalize">
                {species}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Patients List */}
      {filteredPets.length === 0 ? (
        <Card className="border-dashed border-2">
          <EmptyState
            icon={PawPrint}
            title="No patients found"
            description={searchTerm ? "Try adjusting your search terms" : "No pets registered yet"}
          />
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredPets.map((pet) => {
            const Icon = speciesIcons[pet.species] || Dog;
            const lastVisit = getLastVisit(pet.id);
            
            return (
              <Card key={pet.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-gradient-to-br from-teal-50 to-teal-100 flex items-center justify-center flex-shrink-0">
                      {pet.photo_url ? (
                        <img src={pet.photo_url} alt={pet.name} className="w-full h-full object-cover" />
                      ) : (
                        <Icon className="w-8 h-8 text-teal-400" />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900 text-lg">{pet.name}</h3>
                        <Badge className={speciesColors[pet.species]}>{pet.species}</Badge>
                      </div>
                      <p className="text-gray-600">{pet.breed || 'Mixed breed'} • {pet.gender} • {calculateAge(pet.date_of_birth)}</p>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          {pet.owner_email}
                        </span>
                        {lastVisit && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            Last visit: {format(new Date(lastVisit), 'MMM d, yyyy')}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Link to={createPageUrl(`VetPatientDetail?id=${pet.id}`)}>
                        <Button variant="outline" className="gap-2">
                          <FileText className="w-4 h-4" />
                          View Records
                        </Button>
                      </Link>
                      <Link to={createPageUrl(`VetAddRecord?petId=${pet.id}`)}>
                        <Button className="bg-teal-600 hover:bg-teal-700">
                          Add Record
                        </Button>
                      </Link>
                    </div>
                  </div>

                  {(pet.allergies?.length > 0 || pet.medical_conditions?.length > 0) && (
                    <div className="mt-3 pt-3 border-t border-gray-100 flex flex-wrap gap-2">
                      {pet.allergies?.map((allergy, i) => (
                        <Badge key={i} variant="outline" className="bg-red-50 text-red-700 border-red-200">
                          Allergy: {allergy}
                        </Badge>
                      ))}
                      {pet.medical_conditions?.map((condition, i) => (
                        <Badge key={i} variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                          {condition}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}