import React, { useState } from 'react';
import { api } from '@/api/apiClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AdminSidebar from '@/components/layout/AdminSidebar';
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Search, Calendar, Clock, Check, X } from 'lucide-react';
import { format } from 'date-fns';

const statusConfig = {
  pending: 'bg-amber-100 text-amber-700',
  confirmed: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

export default function AdminAppointments() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const queryClient = useQueryClient();

  const { data: user } = useQuery({ queryKey: ['me'], queryFn: () => api.auth.me() });
  const { data: appointments = [] } = useQuery({ queryKey: ['allAppts'], queryFn: () => api.entities.Appointment.list('-date', 200) });
  const { data: pets = [] } = useQuery({ queryKey: ['allPets'], queryFn: () => api.entities.Pet.list() });

  const updateMutation = useMutation({
    mutationFn: ({ id, status }) => api.entities.Appointment.update(id, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['allAppts'] }),
  });

  const filtered = appointments.filter(a => {
    const pet = pets.find(p => p.id === a.pet_id);
    const matchSearch = !search || pet?.name?.toLowerCase().includes(search.toLowerCase()) || a.owner_email?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || a.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <AdminSidebar currentUser={user}>
      <div className="p-6 max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">All Appointments</h1>
          <p className="text-gray-500 mt-1">Manage clinic-wide appointments</p>
        </div>

        <div className="flex gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input placeholder="Search by pet or owner..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Card className="border-0 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-5 py-3 font-medium text-gray-500">Pet</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-500">Owner</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-500">Type</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-500">Date & Time</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-500">Status</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(appt => {
                  const pet = pets.find(p => p.id === appt.pet_id);
                  return (
                    <tr key={appt.id} className="hover:bg-gray-50/50">
                      <td className="px-5 py-3 font-medium text-gray-900">{pet?.name || '—'}</td>
                      <td className="px-5 py-3 text-gray-500 text-xs">{appt.owner_email}</td>
                      <td className="px-5 py-3 capitalize text-gray-700">{appt.type?.replace('_', ' ')}</td>
                      <td className="px-5 py-3 text-gray-600">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-gray-400" />
                          {format(new Date(appt.date), 'MMM d, yyyy')}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <Clock className="w-3.5 h-3.5 text-gray-400" />
                          {appt.time}
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <Badge className={statusConfig[appt.status]}>{appt.status}</Badge>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex gap-1">
                          {appt.status === 'pending' && (
                            <Button size="sm" className="h-7 text-xs bg-blue-500 hover:bg-blue-600" onClick={() => updateMutation.mutate({ id: appt.id, status: 'confirmed' })}>
                              <Check className="w-3 h-3 mr-1" /> Confirm
                            </Button>
                          )}
                          {appt.status === 'confirmed' && (
                            <Button size="sm" className="h-7 text-xs bg-green-500 hover:bg-green-600" onClick={() => updateMutation.mutate({ id: appt.id, status: 'completed' })}>
                              <Check className="w-3 h-3 mr-1" /> Complete
                            </Button>
                          )}
                          {(appt.status === 'pending' || appt.status === 'confirmed') && (
                            <Button size="sm" variant="outline" className="h-7 text-xs text-red-500 border-red-200" onClick={() => updateMutation.mutate({ id: appt.id, status: 'cancelled' })}>
                              <X className="w-3 h-3 mr-1" /> Cancel
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="py-16 text-center text-gray-400">No appointments found</div>
            )}
          </div>
        </Card>
      </div>
    </AdminSidebar>
  );
}