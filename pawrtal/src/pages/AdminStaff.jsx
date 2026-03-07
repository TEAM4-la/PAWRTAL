import React from 'react';
import { api } from '@/api/apiClient';
import { useQuery } from '@tanstack/react-query';
import AdminSidebar from '@/components/layout/AdminSidebar';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Stethoscope, Users, Mail, Phone, Briefcase } from 'lucide-react';

export default function AdminStaff() {
  const { data: user } = useQuery({ queryKey: ['me'], queryFn: () => api.auth.me() });
  const { data: allUsers = [] } = useQuery({ queryKey: ['allUsers'], queryFn: () => api.entities.User.list() });
  const { data: allAppointments = [] } = useQuery({ queryKey: ['allAppts'], queryFn: () => api.entities.Appointment.list() });

  const vets = allUsers.filter(u => u.user_type === 'veterinarian');
  const owners = allUsers.filter(u => u.user_type === 'pet_owner');

  return (
    <AdminSidebar currentUser={user}>
      <div className="p-6 max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Staff & Users</h1>
          <p className="text-gray-500 mt-1">Manage veterinarians and pet owners</p>
        </div>

        {/* Vets Section */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Stethoscope className="w-5 h-5 text-teal-600" />
            <h2 className="text-lg font-semibold text-gray-900">Veterinarians</h2>
            <Badge className="bg-teal-100 text-teal-700">{vets.length}</Badge>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {vets.length === 0 ? (
              <p className="text-gray-400 text-sm col-span-3">No veterinarians registered yet.</p>
            ) : vets.map(vet => {
              const vetAppts = allAppointments.filter(a => a.vet_email === vet.email);
              const completed = vetAppts.filter(a => a.status === 'completed').length;
              return (
                <Card key={vet.id} className="border-0 shadow-sm p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-bold text-lg">
                      {vet.full_name?.[0] || 'V'}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 truncate">{vet.full_name}</p>
                      <Badge className="bg-teal-50 text-teal-600 text-xs mt-0.5">Veterinarian</Badge>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-gray-500">
                      <Mail className="w-4 h-4 text-gray-300" />
                      <span className="truncate">{vet.email}</span>
                    </div>
                    {vet.phone && (
                      <div className="flex items-center gap-2 text-gray-500">
                        <Phone className="w-4 h-4 text-gray-300" />
                        <span>{vet.phone}</span>
                      </div>
                    )}
                    {vet.specialization && (
                      <div className="flex items-center gap-2 text-gray-500">
                        <Briefcase className="w-4 h-4 text-gray-300" />
                        <span>{vet.specialization}</span>
                      </div>
                    )}
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-100 flex gap-4 text-sm text-center">
                    <div className="flex-1">
                      <p className="font-bold text-gray-900">{vetAppts.length}</p>
                      <p className="text-gray-500 text-xs">Total Appts</p>
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-green-600">{completed}</p>
                      <p className="text-gray-500 text-xs">Completed</p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Owners Section */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-amber-600" />
            <h2 className="text-lg font-semibold text-gray-900">Pet Owners</h2>
            <Badge className="bg-amber-100 text-amber-700">{owners.length}</Badge>
          </div>
          <Card className="border-0 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-5 py-3 font-medium text-gray-500">Name</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-500">Email</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-500">Phone</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-500">Appointments</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {owners.length === 0 ? (
                  <tr><td colSpan={4} className="text-center py-10 text-gray-400">No pet owners registered yet.</td></tr>
                ) : owners.map(owner => {
                  const ownerAppts = allAppointments.filter(a => a.owner_email === owner.email);
                  return (
                    <tr key={owner.id} className="hover:bg-gray-50/50">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-bold text-sm">
                            {owner.full_name?.[0] || '?'}
                          </div>
                          <span className="font-medium text-gray-900">{owner.full_name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-gray-500">{owner.email}</td>
                      <td className="px-5 py-3 text-gray-500">{owner.phone || '—'}</td>
                      <td className="px-5 py-3 text-gray-700 font-medium">{ownerAppts.length}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>
        </div>
      </div>
    </AdminSidebar>
  );
}