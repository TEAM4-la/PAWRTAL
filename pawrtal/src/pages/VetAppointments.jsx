import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import AppointmentCard from "@/components/shared/AppointmentCard";
import EmptyState from "@/components/shared/EmptyState";
import { useNavigate } from 'react-router-dom';
import { Calendar as CalendarIcon, Clock, CheckCircle, Search, Filter, ChevronLeft } from 'lucide-react';
import { format, isToday, isTomorrow, isAfter, isBefore, startOfDay } from 'date-fns';
import { toast } from "sonner";

export default function VetAppointments() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const defaultTab = urlParams.get('tab') || 'today';
  
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState(null);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ['vetAppointments'],
    queryFn: () => base44.entities.Appointment.list('-date', 200),
    enabled: !!user,
  });

  const { data: pets = [] } = useQuery({
    queryKey: ['allPets'],
    queryFn: () => base44.entities.Pet.list(),
    enabled: !!user,
  });

  const confirmMutation = useMutation({
    mutationFn: (apt) => base44.entities.Appointment.update(apt.id, { status: 'confirmed' }),
    onSuccess: () => {
      queryClient.invalidateQueries(['vetAppointments']);
      toast.success('Appointment confirmed');
    }
  });

  const completeMutation = useMutation({
    mutationFn: (apt) => base44.entities.Appointment.update(apt.id, { status: 'completed' }),
    onSuccess: () => {
      queryClient.invalidateQueries(['vetAppointments']);
      toast.success('Appointment marked as completed');
    }
  });

  const cancelMutation = useMutation({
    mutationFn: (apt) => base44.entities.Appointment.update(apt.id, { status: 'cancelled' }),
    onSuccess: () => {
      queryClient.invalidateQueries(['vetAppointments']);
      toast.success('Appointment cancelled');
    }
  });

  const today = startOfDay(new Date());

  const filterAppointments = (appointments) => {
    let filtered = appointments;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(apt => {
        const pet = pets.find(p => p.id === apt.pet_id);
        return pet?.name.toLowerCase().includes(term) || 
               apt.owner_email?.toLowerCase().includes(term) ||
               apt.type?.toLowerCase().includes(term);
      });
    }

    if (selectedDate) {
      filtered = filtered.filter(apt => 
        format(new Date(apt.date), 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd')
      );
    }

    return filtered;
  };

  const todayAppointments = filterAppointments(
    appointments.filter(apt => isToday(new Date(apt.date)) && apt.status !== 'cancelled')
  );

  const tomorrowAppointments = filterAppointments(
    appointments.filter(apt => isTomorrow(new Date(apt.date)) && apt.status !== 'cancelled')
  );

  const pendingAppointments = filterAppointments(
    appointments.filter(apt => apt.status === 'pending' && isAfter(new Date(apt.date), today))
  );

  const upcomingAppointments = filterAppointments(
    appointments.filter(apt => 
      apt.status !== 'cancelled' && 
      apt.status !== 'completed' && 
      isAfter(new Date(apt.date), today)
    )
  );

  const completedAppointments = filterAppointments(
    appointments.filter(apt => apt.status === 'completed')
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const renderAppointmentList = (appointments) => {
    if (appointments.length === 0) {
      return (
        <Card className="border-dashed border-2">
          <EmptyState
            icon={CalendarIcon}
            title="No appointments found"
            description="No appointments match your current filters"
          />
        </Card>
      );
    }

    return (
      <div className="space-y-4">
        {appointments.map((appointment) => {
          const pet = pets.find(p => p.id === appointment.pet_id);
          return (
            <AppointmentCard
              key={appointment.id}
              appointment={appointment}
              pet={pet}
              isVetView
              onConfirm={confirmMutation.mutate}
              onComplete={completeMutation.mutate}
              onCancel={cancelMutation.mutate}
            />
          );
        })}
      </div>
    );
  };

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-teal-700 transition-colors mb-2">
        <ChevronLeft className="w-4 h-4" /> Back
      </button>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Appointments</h1>
          <p className="text-gray-500 mt-1">Manage clinic appointments</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search by pet name or owner..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="gap-2">
              <CalendarIcon className="w-4 h-4" />
              {selectedDate ? format(selectedDate, 'MMM d, yyyy') : 'Filter by date'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              initialFocus
            />
            {selectedDate && (
              <div className="p-3 border-t">
                <Button variant="ghost" size="sm" onClick={() => setSelectedDate(null)} className="w-full">
                  Clear filter
                </Button>
              </div>
            )}
          </PopoverContent>
        </Popover>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-gray-100 p-1 flex-wrap">
          <TabsTrigger value="today" className="gap-2">
            <CalendarIcon className="w-4 h-4" />
            Today ({todayAppointments.length})
          </TabsTrigger>
          <TabsTrigger value="tomorrow" className="gap-2">
            Tomorrow ({tomorrowAppointments.length})
          </TabsTrigger>
          <TabsTrigger value="pending" className="gap-2">
            <Clock className="w-4 h-4" />
            Pending ({pendingAppointments.length})
          </TabsTrigger>
          <TabsTrigger value="upcoming" className="gap-2">
            Upcoming ({upcomingAppointments.length})
          </TabsTrigger>
          <TabsTrigger value="completed" className="gap-2">
            <CheckCircle className="w-4 h-4" />
            Completed
          </TabsTrigger>
        </TabsList>

        <TabsContent value="today" className="mt-6">
          {renderAppointmentList(todayAppointments)}
        </TabsContent>

        <TabsContent value="tomorrow" className="mt-6">
          {renderAppointmentList(tomorrowAppointments)}
        </TabsContent>

        <TabsContent value="pending" className="mt-6">
          {renderAppointmentList(pendingAppointments)}
        </TabsContent>

        <TabsContent value="upcoming" className="mt-6">
          {renderAppointmentList(upcomingAppointments)}
        </TabsContent>

        <TabsContent value="completed" className="mt-6">
          {renderAppointmentList(completedAppointments.slice(0, 20))}
        </TabsContent>
      </Tabs>
    </div>
  );
}