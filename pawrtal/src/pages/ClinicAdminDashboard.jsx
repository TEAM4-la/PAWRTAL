import React from 'react';
import { api } from '@/api/apiClient';
import { useQuery } from '@tanstack/react-query';
import { createPageUrl, getAppointmentStatus } from '@/utils';
import { Users, Calendar, PawPrint, Stethoscope, ClipboardList, Clock, CheckCircle, AlertCircle, TrendingUp, ChevronRight, Package, AlertTriangle, PackageX, CalendarX } from 'lucide-react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from 'react-router-dom';
import AdminSidebar from '@/components/layout/AdminSidebar';
import { format, isToday, isTomorrow } from 'date-fns';

export default function ClinicAdminDashboard() {
  const { data: user } = useQuery({ queryKey: ['me'], queryFn: () => api.auth.me() });
  const { data: allPets = [] } = useQuery({ queryKey: ['allPets'], queryFn: () => api.entities.Pet.list() });
  const { data: allAppointments = [] } = useQuery({ queryKey: ['allAppointments'], queryFn: () => api.entities.Appointment.list('-date', 200) });
  const { data: allUsers = [] } = useQuery({ queryKey: ['allUsers'], queryFn: () => api.entities.User.list() });
  const { data: allInventory = [] } = useQuery({
    queryKey: ['adminInventoryDashboard'],
    queryFn: () => api.entities.InventoryItem.list('-created_date', 500),
  });

  const vets = allUsers.filter(u => u.user_type === 'veterinarian');
  const owners = allUsers.filter(u => u.user_type === 'pet_owner');
  const todayAppts = allAppointments.filter(a => isToday(new Date(a.date)));
  const pendingAppts = allAppointments.filter(a => getAppointmentStatus(a) === 'pending');
  const confirmedAppts = allAppointments.filter(a => getAppointmentStatus(a) === 'confirmed');
  const completedAppts = allAppointments.filter(a => getAppointmentStatus(a) === 'completed');

  const totalInventory = allInventory.length;
  const outOfStockItems = allInventory.filter(i => i.is_out_of_stock || i.quantity <= 0);
  const lowStockItems = allInventory.filter(
    i => (i.is_low_stock || (i.quantity > 0 && i.quantity <= (i.min_stock_level ?? 5))) && !i.is_out_of_stock && i.quantity > 0
  );
  const todayDateStr = format(new Date(), 'yyyy-MM-dd');
  const expiredItems = allInventory.filter(
    i => i.is_expired || (i.expiration_date && i.expiration_date < todayDateStr)
  );

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
    expired: { color: 'bg-gray-100 text-gray-700', label: 'Expired' },
  };

  return (
    <AdminSidebar currentUser={user}>
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <p className="text-sm text-violet-500 font-medium mb-1">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
          <h1 className="text-2xl font-bold text-violet-900">
            Welcome back, {user?.display_name?.trim() || user?.first_name?.trim() || 'Admin'}!
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
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-violet-600" />
              Appointment Status Overview
            </h2>
            <Link to={createPageUrl('AdminAppointments')}>
              <Button variant="ghost" size="sm" className="text-violet-600 hover:text-violet-700 gap-1 text-xs font-medium">
                View Appointments <ChevronRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="border-0 shadow-sm p-4 flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700 flex-shrink-0">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{pendingAppts.length}</p>
                <p className="text-sm text-gray-500">Pending</p>
              </div>
            </Card>

            <Card className="border-0 shadow-sm p-4 flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-blue-100 flex items-center justify-center text-blue-700 flex-shrink-0">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{confirmedAppts.length}</p>
                <p className="text-sm text-gray-500">Confirmed</p>
              </div>
            </Card>

            <Card className="border-0 shadow-sm p-4 flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-green-100 flex items-center justify-center text-green-700 flex-shrink-0">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{completedAppts.length}</p>
                <p className="text-sm text-gray-500">Completed</p>
              </div>
            </Card>
          </div>
        </div>

        {/* Inventory Status Overview */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <Package className="w-5 h-5 text-violet-600" />
              Inventory & Stock Status
            </h2>
            <Link to={createPageUrl('AdminInventory')}>
              <Button variant="ghost" size="sm" className="text-violet-600 hover:text-violet-700 gap-1 text-xs font-medium">
                View Inventory <ChevronRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-0 shadow-sm p-4 flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-violet-100 flex items-center justify-center text-violet-700 flex-shrink-0">
                <Package className="w-6 h-6" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{totalInventory}</p>
                <p className="text-sm text-gray-500">Total Items in Inventory</p>
              </div>
            </Card>

            <Card className="border-0 shadow-sm p-4 flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700 flex-shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-2xl font-bold text-gray-900">{lowStockItems.length}</p>
                  {lowStockItems.length > 0 && (
                    <span className="text-[11px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-medium">
                      Low Stock
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500">Low Stock</p>
              </div>
            </Card>

            <Card className="border-0 shadow-sm p-4 flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-red-100 flex items-center justify-center text-red-700 flex-shrink-0">
                <PackageX className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-2xl font-bold text-gray-900">{outOfStockItems.length}</p>
                  {outOfStockItems.length > 0 && (
                    <span className="text-[11px] bg-red-100 text-red-800 px-2 py-0.5 rounded-full font-medium">
                      Depleted
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500">Out of Stock</p>
              </div>
            </Card>

            <Card className="border-0 shadow-sm p-4 flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-gray-100 flex items-center justify-center text-gray-700 flex-shrink-0">
                <CalendarX className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-2xl font-bold text-gray-900">{expiredItems.length}</p>
                  {expiredItems.length > 0 && (
                    <span className="text-[11px] bg-gray-200 text-gray-800 px-2 py-0.5 rounded-full font-medium">
                      Expired
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500">Expired Products</p>
              </div>
            </Card>
          </div>
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
                const derivedStatus = getAppointmentStatus(appt);
                const status = statusConfig[derivedStatus] || statusConfig.pending;
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
                  View Staff <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </AdminSidebar>
  );
}