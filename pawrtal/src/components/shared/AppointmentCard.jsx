import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Calendar, Clock, User, Stethoscope, Check, X, AlertCircle } from 'lucide-react';
import { format, parse } from 'date-fns';
import { cn } from "@/lib/utils";
import { getAppointmentStatus, formatDoctorName } from "@/utils";

const statusConfig = {
  pending: { 
    color: 'bg-amber-100 text-amber-700 border-amber-200', 
    icon: AlertCircle,
    label: 'Pending'
  },
  confirmed: { 
    color: 'bg-blue-100 text-blue-700 border-blue-200', 
    icon: Check,
    label: 'Confirmed'
  },
  completed: { 
    color: 'bg-green-100 text-green-700 border-green-200', 
    icon: Check,
    label: 'Completed'
  },
  cancelled: { 
    color: 'bg-red-100 text-red-700 border-red-200', 
    icon: X,
    label: 'Cancelled'
  },
  expired: {
    color: 'bg-gray-100 text-gray-700 border-gray-200',
    icon: Clock,
    label: 'Expired'
  },
};

const typeColors = {
  checkup: 'bg-teal-50 text-teal-700',
  vaccination: 'bg-purple-50 text-purple-700',
  surgery: 'bg-red-50 text-red-700',
  grooming: 'bg-pink-50 text-pink-700',
  dental: 'bg-blue-50 text-blue-700',
  emergency: 'bg-orange-50 text-orange-700',
  follow_up: 'bg-gray-50 text-gray-700',
  consultation: 'bg-indigo-50 text-indigo-700',
  deworming: 'bg-amber-50 text-amber-700',
  ultra_sound: 'bg-cyan-50 text-cyan-700',
  ultrasound: 'bg-cyan-50 text-cyan-700',
};

export default function AppointmentCard({ 
  appointment, 
  pet, 
  showPetInfo = true,
  onConfirm,
  onCancel,
  onComplete,
  isVetView = false 
}) {
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  
  const derivedStatus = getAppointmentStatus(appointment);

  const status = statusConfig[derivedStatus] || statusConfig.pending;
  const StatusIcon = status.icon;

  // The Complete Appointment button should only be clickable when the booked date and time have been reached.
  let isTimeReached = true;
  try {
    const appointmentDateTime = parse(`${appointment.date} ${appointment.time}`, 'yyyy-MM-dd hh:mm a', new Date());
    isTimeReached = new Date() >= appointmentDateTime;
  } catch (e) {
    console.error('Error parsing appointment datetime in AppointmentCard:', e);
  }

  return (
    <Card className="overflow-hidden border-0 bg-white hover:shadow-md transition-all duration-300">
      <div className="flex">
        <div className={cn(
          "w-2",
          derivedStatus === 'pending' && "bg-amber-400",
          derivedStatus === 'confirmed' && "bg-blue-500",
          derivedStatus === 'completed' && "bg-green-500",
          derivedStatus === 'cancelled' && "bg-red-400",
          derivedStatus === 'expired' && "bg-gray-400",
        )} />
        
        <div className="flex-1 p-3.5 sm:p-5 min-w-0">
          <div className="flex items-start justify-between gap-2.5 mb-3 sm:mb-4">
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
              {showPetInfo && (pet || appointment.pet_name) && (
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden bg-gradient-to-br from-amber-50 to-orange-100 flex items-center justify-center shrink-0">
                  {pet?.photo_url ? (
                    <img src={pet.photo_url} alt={pet.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-base sm:text-lg font-bold text-orange-600">{(pet?.name || appointment.pet_name)?.[0]}</span>
                  )}
                </div>
              )}
              <div className="min-w-0 flex-1">
                {showPetInfo && (pet || appointment.pet_name) && (
                  <h4 className="font-semibold text-gray-900 text-sm sm:text-base truncate">{pet?.name || appointment.pet_name}</h4>
                )}
                <Badge className={cn("mt-0.5 sm:mt-1 capitalize text-xs", typeColors[appointment.type] || "bg-gray-100 text-gray-700")}>
                  {appointment.type?.replace('_', ' ')}
                </Badge>
              </div>
            </div>
            
            <Badge className={cn("flex items-center gap-1 shrink-0 text-xs py-0.5 px-2", status.color)}>
              <StatusIcon className="w-3 h-3" />
              {status.label}
            </Badge>
          </div>

          <div className="space-y-1.5 sm:space-y-2 mb-3 sm:mb-4">
            <div className="flex items-center gap-2 text-gray-600">
              <Calendar className="w-4 h-4 text-gray-400 shrink-0" />
              <span className="text-xs sm:text-sm">
                {format(new Date(appointment.date + 'T00:00:00'), 'EEEE, MMMM d, yyyy')}
              </span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Clock className="w-4 h-4 text-gray-400 shrink-0" />
              <span className="text-xs sm:text-sm">{appointment.time}</span>
            </div>
            {isVetView && appointment.owner_email && (
              <div className="flex items-center gap-2 text-gray-600">
                <User className="w-4 h-4 text-gray-400 shrink-0" />
                <span className="text-xs sm:text-sm truncate">{appointment.owner_email}</span>
              </div>
            )}
            {isVetView && !appointment.vet_email && (
              <div className="flex items-center gap-2 text-amber-700">
                <Stethoscope className="w-4 h-4 text-amber-600 shrink-0" />
                <span className="text-xs sm:text-sm font-medium bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                  Unassigned (Clinic Pool)
                </span>
              </div>
            )}
            {isVetView && appointment.vet_email && (
              <div className="flex items-center gap-2 text-teal-700">
                <Stethoscope className="w-4 h-4 text-teal-600 shrink-0" />
                <span className="text-xs sm:text-sm font-medium truncate">Assigned to: {appointment.vet_email}</span>
              </div>
            )}
            {!isVetView && appointment.vet_email && (
              <div className="flex items-center gap-2 text-orange-700">
                <Stethoscope className="w-4 h-4 text-orange-600 shrink-0" />
                <span className="text-xs sm:text-sm font-medium truncate">Assigned: {appointment.vet_email}</span>
              </div>
            )}
          </div>

          {appointment.reason && (
            <p className="text-xs sm:text-sm text-gray-500 mb-3 sm:mb-4 whitespace-pre-line break-words bg-gray-50 p-2.5 rounded-lg border border-gray-100">
              {appointment.reason}
            </p>
          )}

          {(onConfirm || onCancel || onComplete) && derivedStatus !== 'completed' && derivedStatus !== 'cancelled' && derivedStatus !== 'expired' && (
            <div className="flex flex-wrap sm:flex-nowrap gap-2 pt-3 sm:pt-4 border-t border-gray-100">
              {onConfirm && derivedStatus === 'pending' && (
                <Button 
                  size="sm" 
                  className={cn(
                    "flex-1 sm:flex-initial text-white transition-colors h-9 text-xs sm:text-sm",
                    !appointment.vet_email ? "bg-amber-600 hover:bg-amber-700" : "bg-teal-600 hover:bg-teal-700"
                  )}
                  onClick={() => onConfirm(appointment)}
                >
                  {!appointment.vet_email ? "Accept & Confirm" : "Confirm"}
                </Button>
              )}
              {onComplete && derivedStatus === 'confirmed' && (
                <Button 
                  size="sm" 
                  className="flex-1 sm:flex-initial bg-green-600 hover:bg-green-700 h-9 text-xs sm:text-sm"
                  onClick={() => onComplete(appointment)}
                  disabled={!isTimeReached}
                >
                  Complete
                </Button>
              )}
              {onCancel && (
                <Button 
                  size="sm" 
                  variant="outline"
                  className="flex-1 sm:flex-initial text-red-600 border-red-200 hover:bg-red-50 h-9 text-xs sm:text-sm"
                  onClick={() => setIsCancelOpen(true)}
                >
                  Cancel
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Cancel Dialog (rendered for both vet and owner views) */}
      {onCancel && (
        <Dialog open={isCancelOpen} onOpenChange={setIsCancelOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Are you sure you want to cancel?</DialogTitle>
              <DialogDescription>
                {isVetView
                  ? 'Please provide a reason for cancelling this appointment. The pet owner will see this reason.'
                  : 'Please provide a reason for cancelling this appointment.'}
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Input 
                placeholder="Cancellation reason..." 
                value={cancelReason} 
                onChange={(e) => setCancelReason(e.target.value)} 
              />
            </div>
            <DialogFooter>
              <Button 
                className="!bg-red-600 hover:!bg-red-700 !text-white"
                disabled={!cancelReason.trim()}
                onClick={() => {
                  const roleTag = isVetView ? 'Veterinarian' : 'Pet Owner';
                  const newReason = appointment.reason 
                    ? `${appointment.reason}\n\nCancellation Reason (by ${roleTag}): ${cancelReason}`
                    : `Cancellation Reason (by ${roleTag}): ${cancelReason}`;
                  setIsCancelOpen(false);
                  setCancelReason("");
                  setTimeout(() => {
                    onCancel({ ...appointment, reason: newReason });
                  }, 300);
                }}
              >
                Confirm Cancel
              </Button>
              <Button variant="outline" onClick={() => setIsCancelOpen(false)}>Back</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </Card>
  );
}