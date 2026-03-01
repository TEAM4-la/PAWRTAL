import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { createPageUrl } from '@/utils';
import { Users, Calendar, PawPrint, Stethoscope, ClipboardList, Clock, CheckCircle, AlertCircle, TrendingUp, ChevronRight } from 'lucide-react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from 'react-router-dom';
import AdminSidebar from '@/components/layout/AdminSidebar';
import { format, isToday, isTomorrow } from 'date-fns';

export default function ClinicAdminDashboard() {
  const { data: user } = useQuery({ queryKey: ['me'], queryFn: () => base44.auth.me() });
  const { data: allPets = [] } = useQuery({ queryKey: ['allPets'], queryFn: () => base44.entities.Pet.list() });
  const { data: allAppointments = [] } = useQuery({ queryKey: ['allAppointments'], queryFn: () => base44.entities.Appointment.list('-date', 200) });
  const { data: allUsers = [] } = useQuery({ queryKey: ['allUsers'], queryFn: () => base44.entities.User.list() });

  const vets = allUsers.filter(u => u.user_type === 'veterinarian');
  const owners = allUsers.filter(u => u.user_type === 'pet_owner');
  const todayAppts = allAppointments.filter(a => isToday(new Date(a.date)));
  const pendingAppts = allAppointments.filter(a => a.status === 'pending');
  const confirmedAppts = allAppointments.filter(a => a.status === 'confirmed');
  const completedAppts = allAppointments.filter(a => a.status === 'completed');

  const stats = [
    { label: 'Total Pets', value: allPets.length, icon: PawPrint, color: 'from-amber-400 to-orange-400', bg: 'bg-amber-50', text: 'text-amber-700' },
    { label: 'Total Appointments', value: allAppointments.length, icon: Calendar, color: 'from-violet-400 to-violet-600', bg: 'bg-violet-50', text: 'text-violet-700' },
    { label: 'Veterinarians', value: vets.length, icon: Stethoscope, color: 'from-teal-400 to-teal-600', bg: 'bg-teal-50', text: 'text-teal-700' },
    { label: 'Pet Owners', value: owners.length, icon: Users, color: 'from-blue-400 to-blue-600', bg: 'bg-blue-50', text: 'text-blue-700' },
  ];

  const statusConfig = {
    pending: { color: 'bg-amber-100 text-amber-700', label: 'Pending' },
    confirmed: { color: 'bg-blue-100 text-blue-700', label: 'Confirmed' },
    completed: { color: 'bg-green-100 text-green-700', label: 'Completed' },
    cancelled: { color: 'bg-red-100 text-red-700', label: 'Cancelled' },
  };

  return (
    <AdminSidebar currentUser={user}>
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <p className="text-sm text-violet-500 font-medium mb-1">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
          <h1 className="text-2xl font-bold text-violet-900">
            Welcome back, {user?.full_name?.split(' ')[0] || 'Admin'} 👋
          </h1>
          <p className="text-violet-500/70 mt-1">Here's what's happening at VM Veterinary Clinic today.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat) => (
            <Card key={stat.label} className="border-0 shadow-sm overflow-hidden">
              <div className="p-5">
                <div className={`w-12 h-12 rounded-xl ${stat.bg} flex items-center justify-center mb-3`}>
                  <stat.icon className={`w-6 h-6 ${stat.text}`} />
                </div>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-sm text-gray-500 mt-0.5">{stat.label}</p>
              </div>
              <div className={`h-1 bg-gradient-to-r ${stat.color}`} />
            </Card>
          ))}
        </div>

        {/* Appointment Status Overview */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <Card className="border-0 shadow-sm p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900">{pendingAppts.length}</p>
              <p className="text-sm text-gray-500">Pending</p>
            </div>
          </Card>
          <Card className="border-0 shadow-sm p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900">{confirmedAppts.length}</p>
              <p className="text-sm text-gray-500">Confirmed</p>
            </div>
          </Card>
          <Card className="border-0 shadow-sm p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900">{completedAppts.length}</p>
              <p className="text-sm text-gray-500">Completed</p>
            </div>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Today's Appointments */}
          <Card className="border-0 shadow-sm">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Today's Appointments</h2>
              <Badge className="bg-violet-100 text-violet-700">{todayAppts.length} today</Badge>
            </div>
            <div className="divide-y divide-gray-50 max-h-72 overflow-y-auto">
              {todayAppts.length === 0 ? (
                <div className="py-10 text-center text-gray-400 text-sm">No appointments today</div>
              ) : todayAppts.map(appt => {
                const pet = allPets.find(p => p.id === appt.pet_id);
                const status = statusConfig[appt.status] || statusConfig.pending;
                return (
                  <div key={appt.id} className="px-5 py-3 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-violet-100 flex items-center justify-center text-violet-700 font-bold text-sm flex-shrink-0">
                      {pet?.name?.[0] || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{pet?.name || 'Unknown Pet'}</p>
                      <p className="text-xs text-gray-500">{appt.time} · {appt.type?.replace('_', ' ')}</p>
                    </div>
                    <Badge className={status.color}>{status.label}</Badge>
                  </div>
                );
              })}
            </div>
            <div className="p-4 border-t border-gray-50">
              <Link to={createPageUrl('AdminAppointments')}>
                <Button variant="ghost" size="sm" className="text-violet-600 hover:text-violet-700 w-full">
                  View All Appointments <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
          </Card>

          {/* Vet Staff */}
          <Card className="border-0 shadow-sm">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Veterinarian Staff</h2>
              <Badge className="bg-teal-100 text-teal-700">{vets.length} vets</Badge>
            </div>
            <div className="divide-y divide-gray-50 max-h-72 overflow-y-auto">
              {vets.length === 0 ? (
                <div className="py-10 text-center text-gray-400 text-sm">No vets registered yet</div>
              ) : vets.map(vet => {
                const vetAppts = allAppointments.filter(a => a.vet_email === vet.email);
                return (
                  <div key={vet.id} className="px-5 py-3 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-bold text-sm flex-shrink-0">
                      {vet.full_name?.[0] || 'V'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{vet.full_name}</p>
                      <p className="text-xs text-gray-500 truncate">{vet.email}</p>
                    </div>
                    <span className="text-xs text-gray-400">{vetAppts.length} appts</span>
                  </div>
                );
              })}
            </div>
            <div className="p-4 border-t border-gray-50">
              <Link to={createPageUrl('AdminStaff')}>
                <Button variant="ghost" size="sm" className="text-teal-600 hover:text-teal-700 w-full">
                  Manage Staff <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </AdminSidebar>
  );
}