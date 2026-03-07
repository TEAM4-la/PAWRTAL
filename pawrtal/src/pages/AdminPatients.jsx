import React, { useState } from 'react';
import { api } from '@/api/apiClient';
import { useQuery } from '@tanstack/react-query';
import AdminSidebar from '@/components/layout/AdminSidebar';
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, PawPrint } from 'lucide-react';
import { format, differenceInYears } from 'date-fns';

const speciesColors = {
  dog: 'bg-amber-100 text-amber-700',
  cat: 'bg-purple-100 text-purple-700',
  bird: 'bg-sky-100 text-sky-700',
  rabbit: 'bg-pink-100 text-pink-700',
  fish: 'bg-blue-100 text-blue-700',
  other: 'bg-gray-100 text-gray-700',
};

export default function AdminPatients() {
  const [search, setSearch] = useState('');
  const { data: user } = useQuery({ queryKey: ['me'], queryFn: () => api.auth.me() });
  const { data: pets = [] } = useQuery({ queryKey: ['allPets'], queryFn: () => api.entities.Pet.list() });
  const { data: appointments = [] } = useQuery({ queryKey: ['allAppts'], queryFn: () => api.entities.Appointment.list() });

  const filtered = pets.filter(p =>
    !search || p.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.species?.toLowerCase().includes(search.toLowerCase()) ||
    p.owner_email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminSidebar currentUser={user}>
      <div className="p-6 max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">All Patients</h1>
          <p className="text-gray-500 mt-1">{pets.length} pets registered in the clinic</p>
        </div>

        <div className="relative mb-6 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input placeholder="Search pets or owners..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.length === 0 ? (
            <div className="col-span-3 py-16 text-center text-gray-400">
              <PawPrint className="w-12 h-12 mx-auto mb-3 text-gray-200" />
              <p>No pets found</p>
            </div>
          ) : filtered.map(pet => {
            const petAppts = appointments.filter(a => a.pet_id === pet.id);
            const lastAppt = petAppts.sort((a, b) => new Date(b.date) - new Date(a.date))[0];
            const age = pet.date_of_birth ? differenceInYears(new Date(), new Date(pet.date_of_birth)) : null;
            return (
              <Card key={pet.id} className="border-0 shadow-sm p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-14 h-14 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                    {pet.photo_url ? (
                      <img src={pet.photo_url} alt={pet.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-gray-400">
                        {pet.name?.[0]}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-gray-900">{pet.name}</p>
                    <Badge className={`text-xs mt-0.5 ${speciesColors[pet.species] || speciesColors.other}`}>
                      {pet.species}
                    </Badge>
                  </div>
                </div>
                <div className="space-y-1.5 text-sm text-gray-500">
                  {pet.breed && <p><span className="text-gray-400">Breed:</span> {pet.breed}</p>}
                  {age !== null && <p><span className="text-gray-400">Age:</span> {age} yr{age !== 1 ? 's' : ''}</p>}
                  <p><span className="text-gray-400">Owner:</span> <span className="truncate">{pet.owner_email}</span></p>
                  <p><span className="text-gray-400">Visits:</span> {petAppts.length}</p>
                  {lastAppt && <p><span className="text-gray-400">Last visit:</span> {format(new Date(lastAppt.date), 'MMM d, yyyy')}</p>}
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </AdminSidebar>
  );
}