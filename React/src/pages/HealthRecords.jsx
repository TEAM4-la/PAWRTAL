import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from "@/utils";
import { api } from '@/api/apiClient';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import EmptyState from "@/components/shared/EmptyState";
import OwnerSidebar from '@/components/layout/OwnerSidebar';
import { 
  FileText, 
  Syringe, 
  Pill, 
  Download,
  Calendar,
  Dog,
  Cat,
  Bird,
  Rabbit,
  Fish,
  ExternalLink,
  Filter,
  ChevronLeft
} from 'lucide-react';
import { format, isAfter, isBefore, addDays } from 'date-fns';

const speciesIcons = {
  dog: Dog,
  cat: Cat,
  bird: Bird,
  rabbit: Rabbit,
  fish: Fish,
};

const recordTypeColors = {
  lab_result: 'bg-blue-100 text-blue-700',
  prescription: 'bg-green-100 text-green-700',
  diagnosis: 'bg-purple-100 text-purple-700',
  treatment: 'bg-teal-100 text-teal-700',
  surgery: 'bg-red-100 text-red-700',
  imaging: 'bg-indigo-100 text-indigo-700',
  dental: 'bg-pink-100 text-pink-700',
  other: 'bg-gray-100 text-gray-700',
};

export default function HealthRecords() {
  const navigate = useNavigate();
  const [selectedPet, setSelectedPet] = useState('all');
  const [activeTab, setActiveTab] = useState('records');

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => api.auth.me(),
  });

  const { data: pets = [], isLoading: petsLoading } = useQuery({
    queryKey: ['pets', user?.email],
    queryFn: () => api.entities.Pet.filter({ owner_email: user?.email }),
    enabled: !!user?.email,
  });

  const { data: healthRecords = [] } = useQuery({
    queryKey: ['healthRecords', pets, selectedPet],
    queryFn: async () => {
      if (selectedPet === 'all') {
        const allRecords = await Promise.all(
          pets.map(pet => api.entities.HealthRecord.filter({ pet_id: pet.id, is_visible_to_owner: true }))
        );
        return allRecords.flat().sort((a, b) => new Date(b.date) - new Date(a.date));
      } else {
        return api.entities.HealthRecord.filter({ pet_id: selectedPet, is_visible_to_owner: true }, '-date');
      }
    },
    enabled: pets.length > 0,
  });

  const { data: vaccinations = [] } = useQuery({
    queryKey: ['vaccinations', pets, selectedPet],
    queryFn: async () => {
      if (selectedPet === 'all') {
        const allVax = await Promise.all(
          pets.map(pet => api.entities.Vaccination.filter({ pet_id: pet.id }))
        );
        return allVax.flat().sort((a, b) => new Date(b.date_administered) - new Date(a.date_administered));
      } else {
        return api.entities.Vaccination.filter({ pet_id: selectedPet }, '-date_administered');
      }
    },
    enabled: pets.length > 0,
  });

  const { data: medications = [] } = useQuery({
    queryKey: ['medications', pets, selectedPet],
    queryFn: async () => {
      if (selectedPet === 'all') {
        const allMeds = await Promise.all(
          pets.map(pet => api.entities.Medication.filter({ pet_id: pet.id }))
        );
        return allMeds.flat().sort((a, b) => new Date(b.start_date) - new Date(a.start_date));
      } else {
        return api.entities.Medication.filter({ pet_id: selectedPet }, '-start_date');
      }
    },
    enabled: pets.length > 0,
  });

  const getPetName = (petId) => {
    const pet = pets.find(p => p.id === petId);
    return pet?.name || 'Unknown';
  };

  const upcomingVaccinations = vaccinations.filter(
    vax => vax.next_due_date && isBefore(new Date(vax.next_due_date), addDays(new Date(), 60))
  );

  const content = (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      <button onClick={() => navigate(createPageUrl('Dashboard'))} className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-amber-700 transition-colors mb-2">
        <ChevronLeft className="w-4 h-4" /> Back
      </button>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Health Records</h1>
          <p className="text-gray-500 mt-1">View all health information for your pets</p>
        </div>
        <div className="flex items-center gap-3">
          <Filter className="w-5 h-5 text-gray-400" />
          <Select value={selectedPet} onValueChange={setSelectedPet}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by pet" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Pets</SelectItem>
              {pets.map(pet => (
                <SelectItem key={pet.id} value={pet.id}>{pet.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Alerts */}
      {upcomingVaccinations.length > 0 && (
        <Card className="border-l-4 border-l-purple-500 bg-purple-50/50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Syringe className="w-5 h-5 text-purple-600 mt-0.5" />
              <div>
                <h4 className="font-semibold text-gray-900">Vaccinations Due Soon</h4>
                <p className="text-sm text-gray-600 mt-1">
                  {upcomingVaccinations.map(vax => (
                    <span key={vax.id} className="block">
                      {getPetName(vax.pet_id)}: {vax.vaccine_name} due {format(new Date(vax.next_due_date), 'MMM d, yyyy')}
                    </span>
                  ))}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-gray-100 p-1">
          <TabsTrigger value="records" className="gap-2">
            <FileText className="w-4 h-4" />
            Medical Records
          </TabsTrigger>
          <TabsTrigger value="vaccinations" className="gap-2">
            <Syringe className="w-4 h-4" />
            Vaccinations
          </TabsTrigger>
          <TabsTrigger value="medications" className="gap-2">
            <Pill className="w-4 h-4" />
            Medications
          </TabsTrigger>
        </TabsList>

        <TabsContent value="records" className="mt-6">
          {healthRecords.length === 0 ? (
            <Card className="border-dashed border-2">
              <EmptyState
                icon={FileText}
                title="No health records yet"
                description="Medical records uploaded by your vet will appear here"
              />
            </Card>
          ) : (
            <div className="space-y-4">
              {healthRecords.map((record) => (
                <Card key={record.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-teal-100 flex items-center justify-center">
                          <FileText className="w-6 h-6 text-teal-600" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-gray-900">{record.title}</h4>
                            <Badge className={recordTypeColors[record.record_type]}>
                              {record.record_type.replace('_', ' ')}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-500">
                            {getPetName(record.pet_id)} • {format(new Date(record.date), 'MMMM d, yyyy')}
                          </p>
                          {record.description && (
                            <p className="text-sm text-gray-600 mt-2">{record.description}</p>
                          )}
                          {record.vet_name && (
                            <p className="text-sm text-gray-400 mt-1">Dr. {record.vet_name}</p>
                          )}
                        </div>
                      </div>
                      {record.file_url && (
                        <a href={record.file_url} target="_blank" rel="noopener noreferrer">
                          <Button variant="outline" size="sm" className="gap-2">
                            <ExternalLink className="w-4 h-4" />
                            View
                          </Button>
                        </a>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="vaccinations" className="mt-6">
          {vaccinations.length === 0 ? (
            <Card className="border-dashed border-2">
              <EmptyState
                icon={Syringe}
                title="No vaccination records"
                description="Vaccination history will be shown here after vet visits"
              />
            </Card>
          ) : (
            <div className="space-y-4">
              {vaccinations.map((vax) => (
                <Card key={vax.id} className="border-0 shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                          <Syringe className="w-6 h-6 text-purple-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">{vax.vaccine_name}</h4>
                          <p className="text-sm text-gray-500">
                            {getPetName(vax.pet_id)} • Administered {format(new Date(vax.date_administered), 'MMM d, yyyy')}
                          </p>
                          {vax.administered_by && (
                            <p className="text-sm text-gray-400">By: {vax.administered_by}</p>
                          )}
                        </div>
                      </div>
                      {vax.next_due_date && (
                        <Badge 
                          variant="outline" 
                          className={
                            isBefore(new Date(vax.next_due_date), new Date())
                              ? 'bg-red-50 text-red-700 border-red-200'
                              : 'bg-blue-50 text-blue-700 border-blue-200'
                          }
                        >
                          <Calendar className="w-3 h-3 mr-1" />
                          Next: {format(new Date(vax.next_due_date), 'MMM d, yyyy')}
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="medications" className="mt-6">
          {medications.length === 0 ? (
            <Card className="border-dashed border-2">
              <EmptyState
                icon={Pill}
                title="No medications"
                description="Prescribed medications will appear here"
              />
            </Card>
          ) : (
            <div className="space-y-4">
              {medications.map((med) => (
                <Card key={med.id} className="border-0 shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${med.is_active ? 'bg-green-100' : 'bg-gray-100'}`}>
                          <Pill className={`w-6 h-6 ${med.is_active ? 'text-green-600' : 'text-gray-400'}`} />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">{med.name}</h4>
                          <p className="text-sm text-gray-500">
                            {getPetName(med.pet_id)} • {med.dosage} • {med.frequency}
                          </p>
                          <p className="text-sm text-gray-400">
                            {format(new Date(med.start_date), 'MMM d, yyyy')}
                            {med.end_date && ` - ${format(new Date(med.end_date), 'MMM d, yyyy')}`}
                          </p>
                        </div>
                      </div>
                      <Badge 
                        variant="outline" 
                        className={med.is_active ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-500'}
                      >
                        {med.is_active ? 'Active' : 'Completed'}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );

  if (petsLoading) {
    return (
      <OwnerSidebar user={user}>
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-amber-700 border-t-transparent rounded-full animate-spin" />
        </div>
      </OwnerSidebar>
    );
  }

  return (
    <OwnerSidebar user={user}>
      {content}
    </OwnerSidebar>
  );
}