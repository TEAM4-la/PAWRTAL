import React, { useState, useMemo } from 'react';
import { api } from '@/api/apiClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AppointmentCard from "@/components/shared/AppointmentCard";
import CompleteAppointmentModal from "@/components/shared/CompleteAppointmentModal";
import QuickWalkInModal from "@/components/shared/QuickWalkInModal";
import ClinicQueueTracker from "@/components/shared/ClinicQueueTracker";
import EmptyState from "@/components/shared/EmptyState";
import VetSidebar from '@/components/layout/VetSidebar';
import BackButton from '@/components/ui/BackButton';
import { useNavigate } from 'react-router-dom';
import { Calendar as CalendarIcon, Clock, CheckCircle, Search, Filter, ChevronLeft, ChevronDown, ChevronUp, AlertCircle, XCircle } from 'lucide-react';
import { format, isToday, isTomorrow, isAfter, isBefore, startOfDay, parse } from 'date-fns';
import { cn } from "@/lib/utils";
import { createPageUrl, getAppointmentStatus } from "@/utils";
import { toast } from "sonner";

export default function VetAppointments() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const defaultTab = urlParams.get('tab') || 'today';
  
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState(null);
  const [scopeFilter, setScopeFilter] = useState('all'); // 'all' | 'mine' | 'unassigned'
  const [completingApt, setCompletingApt] = useState(null);
  const [isWalkInOpen, setIsWalkInOpen] = useState(false);
  const [isCompletedExpanded, setIsCompletedExpanded] = useState(false);

  const checkInMutation = useMutation({
    mutationFn: ({ apt, isStandby }) => api.entities.Appointment.checkIn(apt.id, isStandby),
    onSuccess: (data) => {
      queryClient.invalidateQueries(['vetAppointments']);
      queryClient.invalidateQueries(['allAppts']);
      toast.success(
        `Checked in! Ticket #${data.queue_number || 'A-01'} issued${data.queue_status === 'priority_standby' ? ' (Priority Standby)' : ''}.`
      );
    },
    onError: (err) => {
      toast.error(err?.message || 'Failed to check in appointment');
    }
  });

  const callPatientMutation = useMutation({
    mutationFn: (apt) => api.entities.Appointment.callNext(apt.id),
    onSuccess: (data) => {
      queryClient.invalidateQueries(['vetAppointments']);
      queryClient.invalidateQueries(['allAppts']);
      toast.success(`Calling Ticket #${data.queue_number || ''} (${data.pet_name || 'Patient'}) into room!`);
    },
    onError: (err) => {
      toast.error(err?.message || 'Failed to call patient');
    }
  });

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => api.auth.me(),
  });

  const { data: rawAppointments = [], isLoading } = useQuery({
    queryKey: ['vetAppointments', user?.email],
    queryFn: () => api.entities.Appointment.filter({ 
      vet_email: user?.email, 
      include_unassigned: true 
    }, '-date', 200),
    enabled: !!user?.email,
  });

  // Only include:
  // 1. Dedicated appointments assigned to this doctor (case-insensitive)
  // 2. Unassigned clinic appointments ("Any Available Veterinarian") that are still pending
  const appointments = useMemo(() => {
    if (!user?.email) return [];
    const myEmail = user.email.toLowerCase();
    return rawAppointments.filter(apt => {
      if (apt.vet_email && apt.vet_email.toLowerCase() === myEmail) {
        return true;
      }
      if (!apt.vet_email || apt.vet_email.trim() === '') {
        return apt.status === 'pending';
      }
      return false;
    });
  }, [rawAppointments, user?.email]);

  const { data: pets = [] } = useQuery({
    queryKey: ['allPets'],
    queryFn: () => api.entities.Pet.list(),
    enabled: !!user,
  });

  const confirmMutation = useMutation({
    mutationFn: (apt) => api.entities.Appointment.update(apt.id, { 
      status: 'confirmed',
      vet_email: user?.email 
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['vetAppointments']);

    },
    onError: (err) => {
      queryClient.invalidateQueries(['vetAppointments']);
      toast.error(err?.message || 'Failed to confirm appointment');
    }
  });

  const completeMutation = useMutation({
    mutationFn: (apt) => api.entities.Appointment.update(apt.id, { 
      status: 'completed',
      vet_email: apt.vet_email || user?.email 
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['vetAppointments']);
      toast.success('Appointment marked as completed');
    },
    onError: (err) => {
      queryClient.invalidateQueries(['vetAppointments']);
      toast.error(err?.message || 'Failed to complete appointment');
    }
  });

  const cancelMutation = useMutation({
    mutationFn: (apt) => api.entities.Appointment.update(apt.id, { status: 'cancelled', reason: apt.reason }),
    onSuccess: () => {
      queryClient.invalidateQueries(['vetAppointments']);
      toast.success('Appointment cancelled');
    },
    onError: (err) => {
      queryClient.invalidateQueries(['vetAppointments']);
      toast.error(err?.message || 'Failed to cancel appointment');
    }
  });

  const today = startOfDay(new Date());

  const filterAppointments = (list) => {
    let filtered = list;

    if (scopeFilter === 'mine') {
      filtered = filtered.filter(apt => apt.vet_email && apt.vet_email.toLowerCase() === user?.email?.toLowerCase());
    } else if (scopeFilter === 'unassigned') {
      filtered = filtered.filter(apt => !apt.vet_email || apt.vet_email.trim() === '');
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(apt => {
        const pet = pets.find(p => p.id === apt.pet_id);
        return pet?.name?.toLowerCase().includes(term) || 
               apt.owner_email?.toLowerCase().includes(term) ||
               apt.type?.toLowerCase().includes(term);
      });
    }

    if (selectedDate) {
      filtered = filtered.filter(apt => 
        format(new Date(apt.date + 'T00:00:00'), 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd')
      );
    }

    return filtered;
  };

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

  const getStatusPriority = (apt) => {
    const status = getAppointmentStatus(apt);
    // Priority 1: Unconfirmed pending bookings require immediate vet attention
    if (status === 'pending') return 1;

    // Priority 2: Active in-clinic queue (patients currently in clinic or room)
    if (apt.queue_status === 'in_consultation' || apt.queue_status === 'in_room') return 2;
    if (apt.queue_status === 'called') return 3;
    if (apt.queue_status === 'waiting' || apt.queue_status === 'priority_standby') return 4;

    // Priority 3: Confirmed upcoming appointments
    if (status === 'confirmed') return 5;

    // Priority 4: Completed visits (already finished)
    if (status === 'completed') return 6;

    // Priority 5: Cancelled / Expired
    return 7;
  };

  const sortAppointmentsByPriority = (list) => {
    return [...list].sort((a, b) => {
      const priorityA = getStatusPriority(a);
      const priorityB = getStatusPriority(b);
      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }
      // Secondary sort: chronological by date and time (earlier first)
      const timeA = parseAppointmentDateTime(a).getTime();
      const timeB = parseAppointmentDateTime(b).getTime();
      return timeA - timeB;
    });
  };

  const rawToday = filterAppointments(
    appointments.filter(apt => {
      const status = getAppointmentStatus(apt);
      return isToday(new Date(apt.date + 'T00:00:00')) && status !== 'cancelled';
    })
  );
  const todayAppointments = sortAppointmentsByPriority(rawToday);
  const todayActive = todayAppointments.filter(apt => getAppointmentStatus(apt) !== 'completed');
  const todayCompleted = todayAppointments.filter(apt => getAppointmentStatus(apt) === 'completed');
  const todayPendingCount = todayAppointments.filter(apt => getAppointmentStatus(apt) === 'pending').length;

  const tomorrowAppointments = sortAppointmentsByPriority(
    filterAppointments(
      appointments.filter(apt => {
        const status = getAppointmentStatus(apt);
        return isTomorrow(new Date(apt.date + 'T00:00:00')) && status !== 'cancelled';
      })
    )
  );

  const pendingAppointments = filterAppointments(
    appointments.filter(apt => {
      const aptDate = new Date(apt.date + 'T00:00:00');
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const status = getAppointmentStatus(apt);
      return status === 'pending' && aptDate >= todayStart;
    })
  ).sort((a, b) => parseAppointmentDateTime(a).getTime() - parseAppointmentDateTime(b).getTime());

  const upcomingAppointments = sortAppointmentsByPriority(
    filterAppointments(
      appointments.filter(apt => {
        const status = getAppointmentStatus(apt);
        return status !== 'cancelled' && 
        status !== 'completed' && 
        status !== 'expired' && 
        !isBefore(new Date(apt.date + 'T00:00:00'), today);
      })
    )
  );

  const completedAppointments = filterAppointments(
    appointments.filter(apt => getAppointmentStatus(apt) === 'completed')
  ).sort((a, b) => parseAppointmentDateTime(b).getTime() - parseAppointmentDateTime(a).getTime());

  const cancelledAppointments = filterAppointments(
    appointments.filter(apt => getAppointmentStatus(apt) === 'cancelled')
  ).sort((a, b) => parseAppointmentDateTime(b).getTime() - parseAppointmentDateTime(a).getTime());

  const renderAppointmentList = (appointments) => {
    if (appointments.length === 0) {
      return (
        <Card className="border-dashed border-2 border-gray-300 bg-white">
          <EmptyState
            icon={CalendarIcon}
            title="No appointments found"
            colorScheme="teal"
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
              onComplete={(apt) => setCompletingApt(apt)}
              onCheckIn={(apt, isStandby) => checkInMutation.mutate({ apt, isStandby })}
              onCallPatient={(apt) => callPatientMutation.mutate(apt)}
              onCancel={cancelMutation.mutate}
            />
          );
        })}
      </div>
    );
  };

  const content = (
    <div className="p-3.5 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-4 sm:space-y-6">
      <BackButton to={createPageUrl('VetDashboard')} />
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Appointments</h1>
          <p className="text-gray-500 text-xs sm:text-sm mt-0.5 sm:mt-1">Manage clinic appointments</p>
        </div>
      </div>

      <ClinicQueueTracker
        appointments={appointments}
        currentUser={user}
        isVetView
        onOpenWalkInModal={() => setIsWalkInOpen(true)}
        onCompleteAppointment={(apt) => setCompletingApt(apt)}
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row flex-wrap gap-2.5 sm:gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search by pet name or owner..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-10 text-sm"
          />
        </div>

        <Select value={scopeFilter} onValueChange={setScopeFilter}>
          <SelectTrigger className="w-full sm:w-[190px] h-10 bg-white text-sm">
            <SelectValue placeholder="All visible" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Visible ({appointments.length})</SelectItem>
            <SelectItem value="mine">Assigned to Me</SelectItem>
            <SelectItem value="unassigned">Unassigned Pool</SelectItem>
          </SelectContent>
        </Select>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="gap-2 w-full sm:w-auto h-10 text-sm">
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
        <TabsList className="w-full flex justify-start items-center overflow-x-auto lg:grid lg:grid-cols-6 h-auto p-1 bg-gray-100 gap-1 scrollbar-none rounded-xl">
          <TabsTrigger value="today" className="gap-1.5 whitespace-nowrap px-3 py-2 flex-shrink-0 text-xs sm:text-sm">
            <CalendarIcon className="w-4 h-4" />
            Today ({todayAppointments.length})
          </TabsTrigger>
          <TabsTrigger value="tomorrow" className="gap-1.5 whitespace-nowrap px-3 py-2 flex-shrink-0 text-xs sm:text-sm">
            Tomorrow ({tomorrowAppointments.length})
          </TabsTrigger>
          <TabsTrigger 
            value="pending" 
            className={cn(
              "gap-1.5 whitespace-nowrap px-3 py-2 flex-shrink-0 text-xs sm:text-sm",
              pendingAppointments.length > 0 && "text-amber-800 font-semibold"
            )}
          >
            <Clock className={cn("w-4 h-4", pendingAppointments.length > 0 && "text-amber-600")} />
            Pending ({pendingAppointments.length})
            {pendingAppointments.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse ml-0.5" />
            )}
          </TabsTrigger>
          <TabsTrigger value="upcoming" className="gap-1.5 whitespace-nowrap px-3 py-2 flex-shrink-0 text-xs sm:text-sm">
            Upcoming ({upcomingAppointments.length})
          </TabsTrigger>
          <TabsTrigger value="completed" className="gap-1.5 whitespace-nowrap px-3 py-2 flex-shrink-0 text-xs sm:text-sm">
            <CheckCircle className="w-4 h-4" />
            Completed
          </TabsTrigger>
          <TabsTrigger value="cancelled" className="gap-1.5 whitespace-nowrap px-3 py-2 flex-shrink-0 text-xs sm:text-sm">
            <XCircle className="w-4 h-4" />
            Cancelled
          </TabsTrigger>
        </TabsList>

        <TabsContent value="today" className="mt-6 space-y-4">
          {todayPendingCount > 0 && (
            <div className="flex items-center justify-between p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-sm">
              <div className="flex items-center gap-2.5">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                <span>
                  <strong>{todayPendingCount} appointment{todayPendingCount === 1 ? '' : 's'}</strong> awaiting confirmation today.
                </span>
              </div>
              <span className="text-xs font-semibold uppercase tracking-wider bg-amber-100 text-amber-800 px-2 py-0.5 rounded-md">
                Needs Attention
              </span>
            </div>
          )}

          {todayAppointments.length === 0 ? (
            <Card className="border-dashed border-2 border-gray-300 bg-white">
              <EmptyState
                icon={CalendarIcon}
                title="No appointments found"
                colorScheme="teal"
                description="No appointments match your current filters"
              />
            </Card>
          ) : todayActive.length > 0 ? (
            <>
              {/* Active & Pending Appointments */}
              {renderAppointmentList(todayActive)}

              {/* Completed Appointments Collapsible Section */}
              {todayCompleted.length > 0 && (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setIsCompletedExpanded(!isCompletedExpanded)}
                    className="w-full flex items-center justify-between p-3.5 bg-gray-50 hover:bg-gray-100 rounded-xl border border-gray-200 transition-colors text-left group"
                  >
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                      <span className="font-semibold text-gray-800 text-sm">
                        Completed Visits Today ({todayCompleted.length})
                      </span>
                      <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-medium">
                        Finished
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium group-hover:text-gray-700">
                      <span>{isCompletedExpanded ? 'Hide completed' : 'Show completed'}</span>
                      {isCompletedExpanded ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </div>
                  </button>

                  {isCompletedExpanded && (
                    <div className="mt-3 space-y-4">
                      {renderAppointmentList(todayCompleted)}
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <>
              {/* All appointments today are completed */}
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div>
                    <h4 className="font-semibold text-emerald-900 text-sm">All visits completed for today!</h4>
                    <p className="text-xs text-emerald-700">All {todayCompleted.length} scheduled visits have been finished.</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsCompletedExpanded(!isCompletedExpanded)}
                  className="bg-white text-xs border-emerald-300 text-emerald-800 hover:bg-emerald-100/50"
                >
                  {isCompletedExpanded ? 'Hide Visits' : `View Completed (${todayCompleted.length})`}
                </Button>
              </div>

              {isCompletedExpanded && (
                <div className="space-y-4">
                  {renderAppointmentList(todayCompleted)}
                </div>
              )}
            </>
          )}
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

        <TabsContent value="cancelled" className="mt-6">
          {renderAppointmentList(cancelledAppointments)}
        </TabsContent>
      </Tabs>

      {completingApt && (
        <CompleteAppointmentModal
          isOpen={!!completingApt}
          appointment={completingApt}
          pet={pets.find(p => p.id === completingApt.pet_id)}
          currentUser={user}
          onClose={() => setCompletingApt(null)}
          onSuccess={() => {
            queryClient.invalidateQueries(['vetAppointments']);
          }}
        />
      )}

      <QuickWalkInModal
        isOpen={isWalkInOpen}
        onClose={() => setIsWalkInOpen(false)}
        defaultVetEmail={user?.email}
      />
    </div>
  );

  if (isLoading) {
    return (
      <VetSidebar user={user}>
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </VetSidebar>
    );
  }

  return (
    <VetSidebar user={user}>
      {content}
    </VetSidebar>
  );
}