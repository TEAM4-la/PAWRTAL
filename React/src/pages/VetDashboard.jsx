import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from "@/utils";
import { api } from '@/api/apiClient';
import { useQuery } from '@tanstack/react-query';
import VetSidebar from '@/components/layout/VetSidebar';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import StatsCard from "@/components/shared/StatsCard";
import AppointmentCard from "@/components/shared/AppointmentCard";
import { 
  Calendar, 
  Users, 
  PawPrint, 
  Clock,
  ArrowRight,
  AlertTriangle,
  CheckCircle,
  Stethoscope
} from 'lucide-react';
import NotificationPanel from '@/components/dashboard/NotificationPanel';
import { format, isToday, isTomorrow, isAfter } from 'date-fns';

export default function VetDashboard() {
  const navigate = useNavigate();

  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => api.auth.me(),
  });

  const { data: appointments = [], isLoading: appointmentsLoading } = useQuery({
    queryKey: ['vetAppointments'],
    queryFn: () => api.entities.Appointment.list('-date', 100),
    enabled: !!user,
  });

  const { data: pets = [] } = useQuery({
    queryKey: ['allPets'],
    queryFn: () => api.entities.Pet.list('-created_date', 100),
    enabled: !!user,
  });

  useEffect(() => {
    if (!userLoading && user) {
      if (!user.user_type) {
        navigate(createPageUrl('Onboarding'));
      } else if (user.user_type !== 'veterinarian') {
        navigate(createPageUrl('Dashboard'));
      }
    }
  }, [user, userLoading, navigate]);

  if (userLoading || appointmentsLoading) {
    return (
      <VetSidebar user={user}>
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </VetSidebar>
    );
  }

  const todayAppointments = appointments.filter(
    apt => isToday(new Date(apt.date)) && apt.status !== 'cancelled'
  );

  const tomorrowAppointments = appointments.filter(
    apt => isTomorrow(new Date(apt.date)) && apt.status !== 'cancelled'
  );

  const pendingAppointments = appointments.filter(apt => apt.status === 'pending');
  const completedToday = todayAppointments.filter(apt => apt.status === 'completed');
  const upcomingToday = todayAppointments.filter(apt => apt.status !== 'completed');

  return (
    <VetSidebar user={user}>
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
      {/* Welcome Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, Dr. {user?.full_name?.split(' ').pop()}!
          </h1>
          <p className="text-gray-500 mt-1">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
        </div>
        {user && <NotificationPanel userEmail={user.email} accentColor="teal" />}
      </div>

      {/* Stats Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Today's Appointments"
          value={todayAppointments.length}
          icon={Calendar}
          color="teal"
        />
        <StatsCard
          title="Pending Confirmation"
          value={pendingAppointments.length}
          icon={Clock}
          color="orange"
        />
        <StatsCard
          title="Completed Today"
          value={completedToday.length}
          icon={CheckCircle}
          color="blue"
        />
        <StatsCard
          title="Total Patients"
          value={pets.length}
          icon={PawPrint}
          color="purple"
        />
      </div>

      {/* Alerts */}
      {pendingAppointments.length > 0 && (
        <Card className="border-l-4 border-l-amber-500 bg-amber-50/50 border-amber-100">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
              <div>
                <h4 className="font-semibold text-gray-900">Appointments Pending Confirmation</h4>
                <p className="text-sm text-gray-600 mt-1">
                  You have {pendingAppointments.length} appointment(s) waiting to be confirmed
                </p>
                <Link to={createPageUrl('VetAppointments?tab=pending')}>
                  <Button variant="link" className="p-0 h-auto text-amber-600 mt-2">
                    Review now <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Today's Schedule */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Today's Schedule</h2>
            <span className="text-sm text-gray-500">{upcomingToday.length} remaining</span>
          </div>

          {todayAppointments.length === 0 ? (
            <Card className="border-dashed border-2">
              <CardContent className="py-12 text-center">
                <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No appointments scheduled for today</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {todayAppointments.slice(0, 5).map((appointment) => {
                const pet = pets.find(p => p.id === appointment.pet_id);
                return (
                  <AppointmentCard
                    key={appointment.id}
                    appointment={appointment}
                    pet={pet}
                    isVetView
                  />
                );
              })}
              {todayAppointments.length > 5 && (
                <Link to={createPageUrl('VetAppointments')}>
                  <Button variant="outline" className="w-full">
                    View all {todayAppointments.length} appointments
                  </Button>
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Tomorrow's Preview */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Tomorrow's Preview</h2>
            <span className="text-sm text-gray-500">{tomorrowAppointments.length} scheduled</span>
          </div>

          {tomorrowAppointments.length === 0 ? (
            <Card className="border-dashed border-2">
              <CardContent className="py-12 text-center">
                <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No appointments scheduled for tomorrow</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {tomorrowAppointments.slice(0, 5).map((appointment) => {
                const pet = pets.find(p => p.id === appointment.pet_id);
                return (
                  <AppointmentCard
                    key={appointment.id}
                    appointment={appointment}
                    pet={pet}
                    isVetView
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <Card className="border-0 text-white" style={{background: 'linear-gradient(135deg, #0d9488, #0f766e)'}}>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center">
                <Stethoscope className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Quick Actions</h3>
                <p className="text-teal-100">Manage patient records and appointments</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Link to={createPageUrl('Patients')}>
                <Button className="bg-white text-teal-700 hover:bg-teal-50 gap-2">
                  <PawPrint className="w-5 h-5" />
                  View Patients
                </Button>
              </Link>
              <Link to={createPageUrl('VetRecords')}>
                <Button variant="outline" className="border-white text-white hover:bg-white/20 gap-2">
                  Add Record
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
    </VetSidebar>
  );
}