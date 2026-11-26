import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/apiClient';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Stethoscope,
  Ticket,
  Clock,
  Sparkles,
  ChevronRight,
  UserPlus,
  Play,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Star,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';

export default function ClinicQueueTracker({
  appointments = [],
  currentUser,
  isVetView = false,
  isAdminView = false,
  onOpenWalkInModal,
  onCallAppointment,
  onCompleteAppointment,
}) {
  const queryClient = useQueryClient();
  const [showFullQueue, setShowFullQueue] = useState(true);

  // Filter today's appointments that are active in the clinic queue
  const todayStr = new Date().toISOString().split('T')[0];
  const todayQueue = appointments.filter(
    (a) => a.date === todayStr && a.status !== 'cancelled' && a.status !== 'expired'
  );

  // Currently in consultation
  const inConsultation = todayQueue.find(
    (a) => a.queue_status === 'in_consultation' || a.queue_status === 'in-consultation'
  );

  // Priority Standby patients (late arrivals who arrived past 10m grace period)
  const priorityStandbys = todayQueue.filter(
    (a) => a.queue_status === 'priority_standby' || a.queue_status === 'standby'
  );

  // Regular waiting patients in lobby
  const regularWaiting = todayQueue.filter(
    (a) => a.queue_status === 'waiting' && a.id !== inConsultation?.id
  );

  // Combine waiting list: Priority Standbys are ALWAYS first in line!
  const waitingQueue = [...priorityStandbys, ...regularWaiting];

  // Up next patient
  const upNext = waitingQueue[0];

  const callNextMutation = useMutation({
    mutationFn: (id) => api.entities.Appointment.callNext(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['vetAppointments'] });
      queryClient.invalidateQueries({ queryKey: ['allAppts'] });
      toast.success(`Calling Ticket #${data.queue_number || 'Next'} into Consultation Room!`);
    },
    onError: (err) => {
      toast.error(err?.message || 'Failed to call next patient');
    },
  });

  const handleCallPatient = (apt) => {
    if (inConsultation) {
      toast.warning(
        `Consultation currently in progress with ${inConsultation.pet_name || 'Patient'} (Ticket #${inConsultation.queue_number || ''}). Complete their visit before calling the next patient.`
      );
      return;
    }
    callNextMutation.mutate(apt.id);
  };

  return (
    <Card className="border border-teal-200/80 bg-gradient-to-r from-teal-50/70 via-white to-amber-50/50 shadow-sm overflow-hidden mb-6">
      <div className="p-4 sm:p-5">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-teal-100/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-600 text-white flex items-center justify-center shadow-sm">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                Today's Clinic Queue
                <Badge variant="outline" className="text-[10px] bg-white border-teal-300 text-teal-800 font-semibold px-2 py-0">
                  Live
                </Badge>
              </h2>
              <p className="text-xs text-gray-500">
                {waitingQueue.length} patient(s) waiting in clinic • {todayQueue.filter(a => a.status === 'completed').length} completed today
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onOpenWalkInModal && (
              <Button
                type="button"
                size="sm"
                onClick={onOpenWalkInModal}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-8 px-3 rounded-lg shadow-sm flex items-center gap-1.5"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>+ Walk-In Patient</span>
              </Button>
            )}
            {waitingQueue.length > 0 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowFullQueue(!showFullQueue)}
                className="text-xs h-8 text-gray-700"
              >
                {showFullQueue ? 'Hide Queue' : `View All (${waitingQueue.length})`}
              </Button>
            )}
          </div>
        </div>

        {/* 2 Main Columns: NOW SERVING vs UP NEXT */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-3.5">
          {/* Box 1: In Consultation */}
          <div className="p-3.5 rounded-xl bg-white border border-teal-100 shadow-xs flex flex-col justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-teal-700 flex items-center gap-1.5 mb-1.5">
                <span className="w-2 h-2 rounded-full bg-teal-500 animate-ping inline-block" />
                Now in Consultation Room
              </span>

              {inConsultation ? (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-base text-gray-900 truncate">
                      {inConsultation.pet_name || 'Patient'}
                    </span>
                    <Badge className="bg-teal-600 text-white font-bold text-xs">
                      Ticket #{inConsultation.queue_number || 'A-01'}
                    </Badge>
                  </div>

                  <p className="text-xs text-gray-600">
                    <span className="font-medium text-gray-700">Reason:</span> {inConsultation.reason || inConsultation.type?.replace('_', ' ')}
                  </p>
                  <p className="text-[11px] text-gray-500">
                    Owner: {inConsultation.owner_name || inConsultation.guest_owner_name || inConsultation.owner_email}
                  </p>
                </div>
              ) : (
                <div className="py-3 text-center text-gray-400 text-xs italic">
                  No patient currently inside. Doctor room is available.
                </div>
              )}
            </div>

            {inConsultation && onCompleteAppointment && isVetView && (
              <div className="pt-3 mt-2 border-t border-gray-100">
                <Button
                  size="sm"
                  onClick={() => onCompleteAppointment(inConsultation)}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold text-xs h-8 shadow-sm flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Complete Visit & Document Notes
                </Button>
              </div>
            )}
          </div>

          {/* Box 2: Up Next */}
          <div className="p-3.5 rounded-xl bg-white border border-amber-100 shadow-xs flex flex-col justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700 flex items-center gap-1.5 mb-1.5">
                <Ticket className="w-3.5 h-3.5 text-amber-600" />
                Up Next in Line
              </span>

              {upNext ? (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      {upNext.queue_status === 'priority_standby' && (
                        <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400 shrink-0" />
                      )}
                      <span className="font-bold text-base text-gray-900 truncate">
                        {upNext.pet_name || 'Patient'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {upNext.queue_status === 'priority_standby' ? (
                        <Badge className="bg-amber-500 text-white font-bold text-xs">
                          Priority Standby
                        </Badge>
                      ) : upNext.is_walk_in ? (
                        <Badge className="bg-blue-100 text-blue-800 font-semibold text-xs">
                          Walk-In
                        </Badge>
                      ) : null}
                      <Badge className="bg-indigo-100 text-indigo-900 font-bold text-xs border border-indigo-200">
                        #{upNext.queue_number || 'A-01'}
                      </Badge>
                    </div>
                  </div>

                  <p className="text-xs text-gray-600">
                    <span className="font-medium text-gray-700">Service:</span> {upNext.type?.replace('_', ' ')}
                  </p>
                  <p className="text-[11px] text-gray-500">
                    Owner: {upNext.owner_name || upNext.guest_owner_name || upNext.owner_email}
                  </p>
                </div>
              ) : (
                <div className="py-3 text-center text-gray-400 text-xs italic">
                  Waiting room is currently clear.
                </div>
              )}
            </div>

            {upNext && (isVetView || isAdminView) && (
              <div className="pt-3 mt-2 border-t border-gray-100">
                <Button
                  size="sm"
                  onClick={() => handleCallPatient(upNext)}
                  disabled={callNextMutation.isPending || !!inConsultation}
                  className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs h-8 shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  Call Next Patient into Room
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Collapsible Full Waiting List (Open by default, scrollable horizontally) */}
        {showFullQueue && waitingQueue.length > 0 && (
          <div className="mt-4 pt-3.5 border-t border-teal-100/80 space-y-2">
            <div>
              <span className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
                Waiting Patients Sequence ({waitingQueue.length})
              </span>
            </div>

            <div className="flex items-center gap-2.5 overflow-x-auto pb-2 pt-0.5 scrollbar-thin scrollbar-thumb-teal-200">
              {waitingQueue.map((apt, idx) => (
                <div
                  key={apt.id}
                  className={`shrink-0 min-w-[200px] sm:min-w-[220px] max-w-[260px] p-2.5 rounded-lg border text-xs flex items-center justify-between gap-2 shadow-xs transition-shadow hover:shadow-sm ${
                    apt.queue_status === 'priority_standby'
                      ? 'bg-amber-50/80 border-amber-300 text-amber-900 ring-1 ring-amber-200'
                      : apt.is_walk_in
                      ? 'bg-blue-50/80 border-blue-200 text-blue-900'
                      : 'bg-white border-gray-200 text-gray-800'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-gray-500">{idx + 1}.</span>
                      <span className="font-bold truncate text-gray-900">{apt.pet_name || 'Patient'}</span>
                    </div>
                    <p className="text-[11px] text-gray-500 truncate mt-0.5">
                      {apt.owner_name || apt.guest_owner_name || 'Walk-In Client'}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <Badge variant="outline" className={`font-bold text-xs ${
                      apt.queue_status === 'priority_standby' 
                        ? 'bg-amber-100 text-amber-800 border-amber-300' 
                        : apt.is_walk_in 
                        ? 'bg-blue-100 text-blue-800 border-blue-300' 
                        : 'bg-white text-gray-800'
                    }`}>
                      #{apt.queue_number || '00'}
                    </Badge>
                    {apt.queue_status === 'priority_standby' && (
                      <span className="text-[10px] font-bold text-amber-700 bg-amber-100/80 px-1 py-0.2 rounded">
                        Priority
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
