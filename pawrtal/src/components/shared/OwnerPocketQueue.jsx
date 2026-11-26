import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Ticket,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Stethoscope,
  Bell,
  Users,
} from 'lucide-react';

export default function OwnerPocketQueue({ todayAppointment, pet, clinicQueue = [] }) {
  if (!todayAppointment) return null;

  const isCompleted =
    todayAppointment.status === 'completed' ||
    todayAppointment.queue_status === 'completed';

  const servingNow = clinicQueue.find(
    (a) => a.queue_status === 'in_consultation' || a.queue_status === 'in-consultation'
  );

  const isMyTurn =
    !isCompleted &&
    (todayAppointment.queue_status === 'in_consultation' ||
      todayAppointment.queue_status === 'in-consultation');

  // Waiting list in clinic
  const waitingList = clinicQueue.filter(
    (a) => a.queue_status === 'priority_standby' || a.queue_status === 'waiting'
  );

  const myIndex = waitingList.findIndex((a) => a.id === todayAppointment.id);
  const patientsAhead = myIndex >= 0 ? myIndex : 0;

  return (
    <Card
      className={`border overflow-hidden transition-all duration-300 shadow-sm ${
        isCompleted
          ? 'bg-gradient-to-r from-emerald-50 via-white to-teal-50 border-emerald-200'
          : isMyTurn
          ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white border-emerald-400 shadow-md animate-pulse'
          : todayAppointment.queue_number
          ? 'bg-gradient-to-r from-blue-50 via-white to-indigo-50 border-blue-200'
          : 'bg-gradient-to-r from-amber-50 via-white to-orange-50 border-amber-200'
      }`}
    >
      <div className="p-4 sm:p-5">
        {isCompleted ? (
          /* Visit Completed */
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700 shrink-0">
                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap mb-0.5">
                  <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
                    Visit Completed
                  </span>
                  <Badge className="bg-emerald-600 text-white font-semibold text-[10px] px-2 py-0">
                    Completed Today
                  </Badge>
                </div>
                <h4 className="font-bold text-gray-900 text-sm sm:text-base">
                  {pet?.name || todayAppointment.pet_name} — {todayAppointment.type?.replace('_', ' ')}
                </h4>
                <p className="text-xs text-gray-600 mt-0.5">
                  Your consultation with {todayAppointment.vet_name || 'Dr. Rebecca Goyena'} is complete. Consultation notes & prescriptions have been saved.
                </p>
              </div>
            </div>
            <Link to={createPageUrl('HealthRecords')} className="shrink-0 w-full sm:w-auto">
              <Button size="sm" variant="outline" className="w-full sm:w-auto border-emerald-300 text-emerald-800 hover:bg-emerald-50 text-xs font-medium h-8 shadow-xs">
                View Health Records
              </Button>
            </Link>
          </div>
        ) : isMyTurn ? (
          /* It's their turn! */
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0">
                <Bell className="w-6 h-6 text-white animate-bounce" />
              </div>
              <div>
                <span className="text-xs uppercase font-extrabold tracking-wider text-emerald-100">
                  It's Your Turn!
                </span>
                <h3 className="text-lg sm:text-xl font-black text-white">
                  Ticket #{todayAppointment.queue_number} — {pet?.name || todayAppointment.pet_name}
                </h3>
                <p className="text-xs text-emerald-100 mt-0.5">
                  Please proceed to the Consultation Room with Dr. {todayAppointment.vet_name || 'Goyena'}.
                </p>
              </div>
            </div>
            <Badge className="bg-white text-emerald-800 font-extrabold text-sm px-4 py-1.5 shadow-sm">
              NOW SERVING
            </Badge>
          </div>
        ) : todayAppointment.queue_number ? (
          /* Checked in and waiting */
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-blue-100 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
                  <Ticket className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900">
                    Live Clinic Queue • {pet?.name || todayAppointment.pet_name}
                  </h3>
                  <p className="text-[11px] text-gray-500">
                    VM Veterinary Clinic • Today at {todayAppointment.time}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto">
                {todayAppointment.queue_status === 'priority_standby' && (
                  <Badge className="bg-amber-500 text-white font-bold text-xs py-0.5">
                    Priority Standby
                  </Badge>
                )}
                <Badge className="bg-indigo-600 text-white font-black text-sm px-3 py-1 shadow-xs">
                  YOUR TICKET: #{todayAppointment.queue_number}
                </Badge>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1 text-xs">
              <div className="p-2.5 rounded-lg bg-white/80 border border-blue-100">
                <span className="text-[10px] font-semibold text-gray-400 block uppercase">Currently Serving</span>
                <span className="font-bold text-gray-900 text-sm">
                  {servingNow ? `Ticket #${servingNow.queue_number}` : 'Room Available'}
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-white/80 border border-blue-100">
                <span className="text-[10px] font-semibold text-gray-400 block uppercase">Ahead in Line</span>
                <span className="font-bold text-gray-900 text-sm">
                  {patientsAhead === 0 ? 'You are Next!' : `${patientsAhead} patient(s)`}
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-white/80 border border-blue-100 col-span-2 sm:col-span-1">
                <span className="text-[10px] font-semibold text-gray-400 block uppercase">Est. Wait</span>
                <span className="font-bold text-teal-700 text-sm">
                  {patientsAhead === 0 ? 'Any minute now' : `~${patientsAhead * 15} mins`}
                </span>
              </div>
            </div>
          </div>
        ) : (
          /* Scheduled for today but not checked in yet */
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700 shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">
                  Appointment Today at {todayAppointment.time}
                </span>
                <h4 className="font-semibold text-gray-900 text-sm">
                  {pet?.name || todayAppointment.pet_name} — {todayAppointment.type?.replace('_', ' ')}
                </h4>
                <p className="text-xs text-gray-600 mt-0.5">
                  When you arrive at the clinic, check in at the front desk to receive your live queue number.
                </p>
              </div>
            </div>
            <Badge variant="outline" className="border-amber-300 text-amber-900 font-semibold text-xs px-3 py-1 bg-white shrink-0">
              Awaiting Arrival
            </Badge>
          </div>
        )}
      </div>
    </Card>
  );
}
