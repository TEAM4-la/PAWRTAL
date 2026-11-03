import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { createPageUrl, getAppointmentStatus } from "@/utils";
import { api } from '@/api/apiClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AppointmentCard from "@/components/shared/AppointmentCard";
import EmptyState from "@/components/shared/EmptyState";
import OwnerSidebar from '@/components/layout/OwnerSidebar';
import BackButton from '@/components/ui/BackButton';
import { Plus, Calendar, Clock, CheckCircle, ChevronLeft, CalendarCheck } from 'lucide-react';
import { isAfter, isBefore, parse } from 'date-fns';
import { toast } from "sonner";

const parseAppointmentDateTime = (apt) => {
  if (!apt || !apt.date) return new Date(8640000000000000);
  try {
    if (apt.time) {
      const dt = parse(`${apt.date} ${apt.time}`, 'yyyy-MM-dd hh:mm a', new Date());
      if (!isNaN(dt.getTime())) return dt;
    }
    const d = new Date(apt.date + 'T00:00:00');
    if (!isNaN(d.getTime())) return d;
  } catch {
    // fallback
  }
  return new Date(apt.date);
};

export default function Appointments() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  const searchParams = new URLSearchParams(location.search);
  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(
    tabParam && ['upcoming', 'past', 'confirmed', 'cancelled'].includes(tabParam)
      ? tabParam
      : 'upcoming'
  );

  useEffect(() => {
    if (tabParam && ['upcoming', 'past', 'confirmed', 'cancelled'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => api.auth.me(),
  });

  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ['appointments', user?.email],
    queryFn: () => api.entities.Appointment.filter({ owner_email: user?.email }, '-date'),
    enabled: !!user?.email,
  });

  const { data: pets = [] } = useQuery({
    queryKey: ['pets', user?.email],
    queryFn: () => api.entities.Pet.filter({ owner_email: user?.email }),
    enabled: !!user?.email,
  });

  const cancelMutation = useMutation({
    mutationFn: (apt) => api.entities.Appointment.update(apt.id, { status: 'cancelled', reason: apt.reason }),
    onSuccess: () => {
      queryClient.invalidateQueries(['appointments']);
      toast.success('Appointment cancelled');
    }
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcomingAppointments = appointments
    .filter(apt => {
      const status = getAppointmentStatus(apt);
      return status !== 'cancelled' && status !== 'completed' && status !== 'expired' && !isBefore(new Date(apt.date + 'T00:00:00'), today);
    })
    .sort((a, b) => {
      const timeA = parseAppointmentDateTime(a).getTime();
      const timeB = parseAppointmentDateTime(b).getTime();
      return timeA - timeB;
    });

  const pastAppointments = appointments
    .filter(apt => {
      const status = getAppointmentStatus(apt);
      return status === 'completed' || status === 'expired' || isBefore(new Date(apt.date + 'T00:00:00'), today);
    })
    .sort((a, b) => {
      const timeA = parseAppointmentDateTime(a).getTime();
      const timeB = parseAppointmentDateTime(b).getTime();
      return timeB - timeA;
    });

  const confirmedAppointments = appointments
    .filter(apt => getAppointmentStatus(apt) === 'confirmed')
    .sort((a, b) => {
      const timeA = parseAppointmentDateTime(a).getTime();
      const timeB = parseAppointmentDateTime(b).getTime();
      return timeA - timeB;
    });

  const cancelledAppointments = appointments
    .filter(apt => getAppointmentStatus(apt) === 'cancelled')
    .sort((a, b) => {
      const timeA = parseAppointmentDateTime(a).getTime();
      const timeB = parseAppointmentDateTime(b).getTime();
      return timeB - timeA;
    });

  const content = (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
      <BackButton to={createPageUrl('Dashboard')} />
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Appointments</h1>
          <p className="text-gray-500 mt-1">Manage your veterinary appointments</p>
        </div>
        <Link to={createPageUrl('BookAppointment')}>
          <Button className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white gap-2 shadow-sm shadow-orange-100">
            <Plus className="w-5 h-5" />
            Book Appointment
          </Button>
        </Link>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-gray-100 p-1 w-full sm:w-auto">
          <TabsTrigger value="upcoming" className="gap-2 flex-1 sm:flex-none">
            <Clock className="w-4 h-4" />
            Upcoming ({upcomingAppointments.length})
          </TabsTrigger>
          <TabsTrigger value="past" className="gap-2 flex-1 sm:flex-none">
            <CheckCircle className="w-4 h-4" />
            Past ({pastAppointments.length})
          </TabsTrigger>
          <TabsTrigger value="confirmed" className="gap-2 flex-1 sm:flex-none">
            <CalendarCheck className="w-4 h-4" />
            Confirmed ({confirmedAppointments.length})
          </TabsTrigger>
          <TabsTrigger value="cancelled" className="gap-2 flex-1 sm:flex-none">
            Cancelled ({cancelledAppointments.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="mt-6">
          {upcomingAppointments.length === 0 ? (
            <Card className="border-dashed border-2 border-gray-300 bg-white">
              <EmptyState
                icon={Calendar}
                title="No upcoming appointments"
                description="Book your next vet visit to keep your pet healthy"
                actionLabel="Book Appointment"
                onAction={() => navigate(createPageUrl('BookAppointment'))}
              />
            </Card>
          ) : (
            <div className="space-y-4">
              {upcomingAppointments.map((appointment) => {
                const pet = pets.find(p => p.id === appointment.pet_id);
                return (
                  <AppointmentCard
                    key={appointment.id}
                    appointment={appointment}
                    pet={pet}
                    onCancel={cancelMutation.mutate}
                  />
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="past" className="mt-6">
          {pastAppointments.length === 0 ? (
            <Card className="border-dashed border-2 border-gray-300 bg-white">
              <EmptyState
                icon={CheckCircle}
                title="No past appointments"
                description="Your completed appointments will appear here"
              />
            </Card>
          ) : (
            <div className="space-y-4">
              {pastAppointments.map((appointment) => {
                const pet = pets.find(p => p.id === appointment.pet_id);
                return (
                  <AppointmentCard
                    key={appointment.id}
                    appointment={appointment}
                    pet={pet}
                  />
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="confirmed" className="mt-6">
          {confirmedAppointments.length === 0 ? (
            <Card className="border-dashed border-2 border-gray-300 bg-white">
              <EmptyState
                icon={CalendarCheck}
                title="No confirmed appointments"
                description="Approved bookings from the clinic will appear here"
              />
            </Card>
          ) : (
            <div className="space-y-4">
              {confirmedAppointments.map((appointment) => {
                const pet = pets.find(p => p.id === appointment.pet_id);
                return (
                  <AppointmentCard
                    key={appointment.id}
                    appointment={appointment}
                    pet={pet}
                    onCancel={cancelMutation.mutate}
                  />
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="cancelled" className="mt-6">
          {cancelledAppointments.length === 0 ? (
            <Card className="border-dashed border-2 border-gray-300 bg-white">
              <EmptyState
                icon={Calendar}
                title="No cancelled appointments"
                description="Cancelled appointments will appear here"
              />
            </Card>
          ) : (
            <div className="space-y-4">
              {cancelledAppointments.map((appointment) => {
                const pet = pets.find(p => p.id === appointment.pet_id);
                return (
                  <AppointmentCard
                    key={appointment.id}
                    appointment={appointment}
                    pet={pet}
                  />
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );

  if (isLoading) {
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