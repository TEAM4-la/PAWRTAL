import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl, getAppointmentStatus } from "@/utils";
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
  Stethoscope,
  ChevronRight
} from 'lucide-react';
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
    apt => {
      const status = getAppointmentStatus(apt);
      return isToday(new Date(apt.date + 'T00:00:00')) && status !== 'cancelled';
    }
  );

  const tomorrowAppointments = appointments.filter(
    apt => {
      const status = getAppointmentStatus(apt);
      return isTomorrow(new Date(apt.date + 'T00:00:00')) && status !== 'cancelled';
    }
  );

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const pendingAppointments = appointments.filter(apt => {
    const status = getAppointmentStatus(apt);
    return status === 'pending' && new Date(apt.date + 'T00:00:00') >= todayStart;
  });
  const completedToday = todayAppointments.filter(apt => getAppointmentStatus(apt) === 'completed');
  const upcomingToday = todayAppointments.filter(apt => getAppointmentStatus(apt) !== 'completed');

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
        <Card className="border-0 shadow-sm flex flex-col h-[550px]">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
            <h2 className="font-semibold text-gray-900 text-lg">Today's Schedule</h2>
            <span className="text-xs bg-teal-50 text-teal-700 px-2.5 py-1 rounded-full font-medium">
              {upcomingToday.length} remaining
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-3 min-h-0">
            {todayAppointments.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-12">
                <Calendar className="w-12 h-12 text-gray-300 mb-4 mx-auto" />
                <p className="text-gray-500">No appointments scheduled for today</p>
              </div>
            ) : (
              todayAppointments.map((appointment) => {
                const pet = pets.find(p => p.id === appointment.pet_id);
                return (
                  <AppointmentCard
                    key={appointment.id}
                    appointment={appointment}
                    pet={pet}
                    isVetView
                  />
                );
              })
            )}
          </div>

          <div className="p-4 border-t border-gray-100 bg-gray-50/50 rounded-b-xl flex-shrink-0">
            <Link to={createPageUrl('VetAppointments?tab=today')}>
              <Button variant="ghost" size="sm" className="text-teal-650 hover:text-teal-700 hover:bg-teal-50/50 w-full flex items-center justify-center gap-1 font-medium">
                View All Appointments <ChevronRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </Card>

        {/* Tomorrow's Preview */}
        <Card className="border-0 shadow-sm flex flex-col h-[550px]">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
            <h2 className="font-semibold text-gray-900 text-lg">Tomorrow's Preview</h2>
            <span className="text-xs bg-amber-50 text-amber-700 px-2.5 py-1 rounded-full font-medium">
              {tomorrowAppointments.length} scheduled
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-3 min-h-0">
            {tomorrowAppointments.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-12">
                <Calendar className="w-12 h-12 text-gray-300 mb-4 mx-auto" />
                <p className="text-gray-500">No appointments scheduled for tomorrow</p>
              </div>
            ) : (
              tomorrowAppointments.map((appointment) => {
                const pet = pets.find(p => p.id === appointment.pet_id);
                return (
                  <AppointmentCard
                    key={appointment.id}
                    appointment={appointment}
                    pet={pet}
                    isVetView
                  />
                );
              })
            )}
          </div>

          <div className="p-4 border-t border-gray-100 bg-gray-50/50 rounded-b-xl flex-shrink-0">
            <Link to={createPageUrl('VetAppointments?tab=tomorrow')}>
              <Button variant="ghost" size="sm" className="text-teal-650 hover:text-teal-700 hover:bg-teal-50/50 w-full flex items-center justify-center gap-1 font-medium">
                View Tomorrow's Schedule <ChevronRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </Card>
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