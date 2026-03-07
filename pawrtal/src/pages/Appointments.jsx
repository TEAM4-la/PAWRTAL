import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from "@/utils";
import { api } from '@/api/apiClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AppointmentCard from "@/components/shared/AppointmentCard";
import EmptyState from "@/components/shared/EmptyState";
import OwnerSidebar from '@/components/layout/OwnerSidebar';
import { Plus, Calendar, Clock, CheckCircle, ChevronLeft } from 'lucide-react';
import { isAfter, isBefore } from 'date-fns';
import { toast } from "sonner";

export default function Appointments() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('upcoming');

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
    mutationFn: (apt) => api.entities.Appointment.update(apt.id, { status: 'cancelled' }),
    onSuccess: () => {
      queryClient.invalidateQueries(['appointments']);
      toast.success('Appointment cancelled');
    }
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcomingAppointments = appointments.filter(
    apt => apt.status !== 'cancelled' && apt.status !== 'completed' && isAfter(new Date(apt.date), today)
  );

  const pastAppointments = appointments.filter(
    apt => apt.status === 'completed' || isBefore(new Date(apt.date), today)
  );

  const cancelledAppointments = appointments.filter(apt => apt.status === 'cancelled');

  const content = (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
      <button onClick={() => navigate(createPageUrl('Dashboard'))} className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-amber-700 transition-colors mb-2">
        <ChevronLeft className="w-4 h-4" /> Back
      </button>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Appointments</h1>
          <p className="text-gray-500 mt-1">Manage your veterinary appointments</p>
        </div>
        <Link to={createPageUrl('BookAppointment')}>
          <Button className="bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white gap-2">
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
          <TabsTrigger value="cancelled" className="gap-2 flex-1 sm:flex-none">
            Cancelled ({cancelledAppointments.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="mt-6">
          {upcomingAppointments.length === 0 ? (
            <Card className="border-dashed border-2">
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
            <Card className="border-dashed border-2">
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

        <TabsContent value="cancelled" className="mt-6">
          {cancelledAppointments.length === 0 ? (
            <Card className="border-dashed border-2">
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