import React, { useState } from 'react';
import { api } from '@/api/apiClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AdminSidebar from '@/components/layout/AdminSidebar';
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Search, Calendar, Clock, Check, X, Stethoscope } from 'lucide-react';
import { format, parse } from 'date-fns';
import { toast } from 'sonner';
import { getAppointmentStatus } from '@/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const statusConfig = {
  pending: 'bg-amber-100 text-amber-700',
  confirmed: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
  expired: 'bg-gray-100 text-gray-700',
};

const isAppointmentTimeReached = (appt) => {
  if (!appt?.date || !appt?.time) return true;
  try {
    const appointmentDateTime = parse(`${appt.date} ${appt.time}`, 'yyyy-MM-dd hh:mm a', new Date());
    return new Date() >= appointmentDateTime;
  } catch (e) {
    return true;
  }
};

export default function AdminAppointments() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const queryClient = useQueryClient();

  const { data: user } = useQuery({ queryKey: ['me'], queryFn: () => api.auth.me() });
  const { data: appointments = [] } = useQuery({ queryKey: ['allAppts'], queryFn: () => api.entities.Appointment.list('-date', 200) });
  const { data: pets = [] } = useQuery({ queryKey: ['allPets'], queryFn: () => api.entities.Pet.list() });
  const { data: users = [] } = useQuery({ queryKey: ['allUsers'], queryFn: () => api.entities.User.list() });

  const getVet = (vetEmail) => {
    if (!vetEmail) return null;
    return users.find(u => u.email?.toLowerCase() === vetEmail.toLowerCase());
  };

  const updateMutation = useMutation({
    mutationFn: ({ id, status, reason }) => api.entities.Appointment.update(id, { status, reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allAppts'] });
      toast.success('Appointment status updated!');
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to update appointment');
    },
  });

  const filtered = appointments.filter(a => {
    const pet = pets.find(p => p.id === a.pet_id);
    const vet = getVet(a.vet_email);
    const vetName = vet?.full_name?.toLowerCase() || '';
    const vetEmail = a.vet_email?.toLowerCase() || '';
    const searchLower = search.toLowerCase();

    const matchSearch = !search || 
      pet?.name?.toLowerCase().includes(searchLower) || 
      a.owner_email?.toLowerCase().includes(searchLower) ||
      vetName.includes(searchLower) ||
      vetEmail.includes(searchLower) ||
      (!a.vet_email && ('any available'.includes(searchLower) || 'unassigned'.includes(searchLower)));

    const derivedStatus = getAppointmentStatus(a);
    const matchStatus = statusFilter === 'all' || derivedStatus === statusFilter;
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
            <Input placeholder="Search by pet, owner, or veterinarian..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
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
              <SelectItem value="expired">Expired</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Card className="border-0 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[900px]">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-5 py-3 font-medium text-gray-500 whitespace-nowrap">Pet</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-500 whitespace-nowrap">Owner</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-500 whitespace-nowrap">Veterinarian</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-500 whitespace-nowrap">Type</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-500 whitespace-nowrap">Date & Time</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-500 whitespace-nowrap">Status</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-500 whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(appt => {
                  const pet = pets.find(p => p.id === appt.pet_id);
                  const vet = getVet(appt.vet_email);
                  return (
                    <tr key={appt.id} className="hover:bg-gray-50/50">
                      <td className="px-5 py-3 font-medium text-gray-900 whitespace-nowrap">{pet?.name || '—'}</td>
                      <td className="px-5 py-3 text-gray-500 text-xs whitespace-nowrap">{appt.owner_email}</td>
                      <td className="px-5 py-3 whitespace-nowrap">
                        {appt.vet_email ? (
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-700 text-xs font-semibold shrink-0">
                              <Stethoscope className="w-3.5 h-3.5 text-teal-600" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 text-xs">
                                {vet?.full_name ? (vet.full_name.startsWith('Dr.') ? vet.full_name : `Dr. ${vet.full_name}`) : (appt.vet_email || 'Assigned')}
                              </p>
                              <p className="text-[11px] text-gray-400">{appt.vet_email}</p>
                            </div>
                          </div>
                        ) : (
                          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-xs font-normal">
                            Any Available Vet
                          </Badge>
                        )}
                      </td>
                      <td className="px-5 py-3 capitalize text-gray-700 whitespace-nowrap">{appt.type?.replace('_', ' ')}</td>
                      <td className="px-5 py-3 text-gray-600 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                          {format(new Date(appt.date + 'T00:00:00'), 'MMM d, yyyy')}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <Clock className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                          {appt.time}
                        </div>
                      </td>
                      <td className="px-5 py-3 whitespace-nowrap">
                        <Badge className={statusConfig[getAppointmentStatus(appt)]}>{getAppointmentStatus(appt)}</Badge>
                      </td>
                      <td className="px-5 py-3 whitespace-nowrap">
                        <div className="flex gap-1">
                          {getAppointmentStatus(appt) === 'pending' && (
                            <Button size="sm" className="h-7 text-xs bg-blue-500 hover:bg-blue-600" onClick={() => updateMutation.mutate({ id: appt.id, status: 'confirmed' })}>
                              <Check className="w-3 h-3 mr-1" /> Confirm
                            </Button>
                          )}
                          {getAppointmentStatus(appt) === 'confirmed' && (
                            <Button 
                              size="sm" 
                              className="h-7 text-xs bg-green-500 hover:bg-green-600 disabled:opacity-50" 
                              disabled={!isAppointmentTimeReached(appt)}
                              title={!isAppointmentTimeReached(appt) ? "Cannot complete appointment before its scheduled date and time" : ""}
                              onClick={() => updateMutation.mutate({ id: appt.id, status: 'completed' })}
                            >
                              <Check className="w-3 h-3 mr-1" /> Complete
                            </Button>
                          )}
                          {(getAppointmentStatus(appt) === 'pending' || getAppointmentStatus(appt) === 'confirmed') && (
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="h-7 text-xs text-red-500 border-red-200 hover:bg-red-50" 
                              onClick={() => {
                                setCancelTarget(appt);
                                setCancelReason('');
                              }}
                            >
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

        {/* Cancellation Reason Dialog */}
        <Dialog open={!!cancelTarget} onOpenChange={(open) => { if (!open) setCancelTarget(null); }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Are you sure you want to cancel?</DialogTitle>
              <DialogDescription>
                Please provide a reason for cancelling this appointment. The pet owner will see this reason.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Input 
                placeholder="Cancellation reason..." 
                value={cancelReason} 
                onChange={(e) => setCancelReason(e.target.value)} 
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCancelTarget(null)}>Back</Button>
              <Button 
                className="!bg-red-600 hover:!bg-red-700 !text-white"
                disabled={!cancelReason.trim()}
                onClick={() => {
                  if (!cancelTarget) return;
                  const newReason = cancelTarget.reason 
                    ? `${cancelTarget.reason}\n\nCancellation Reason: ${cancelReason}`
                    : `Cancellation Reason: ${cancelReason}`;
                  updateMutation.mutate({ id: cancelTarget.id, status: 'cancelled', reason: newReason });
                  setCancelTarget(null);
                  setCancelReason('');
                }}
              >
                Confirm Cancel
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminSidebar>
  );
}