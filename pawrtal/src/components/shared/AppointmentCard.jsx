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
        
        <div className="flex-1 p-5">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              {showPetInfo && (pet || appointment.pet_name) && (
                <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-amber-50 to-orange-100 flex items-center justify-center">
                  {pet?.photo_url ? (
                    <img src={pet.photo_url} alt={pet.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-lg font-bold text-orange-600">{(pet?.name || appointment.pet_name)?.[0]}</span>
                  )}
                </div>
              )}
              <div>
                {showPetInfo && (pet || appointment.pet_name) && (
                  <h4 className="font-semibold text-gray-900">{pet?.name || appointment.pet_name}</h4>
                )}
                <Badge className={cn("mt-1", typeColors[appointment.type])}>
                  {appointment.type.replace('_', ' ')}
                </Badge>
              </div>
            </div>
            
            <Badge className={cn("flex items-center gap-1", status.color)}>
              <StatusIcon className="w-3 h-3" />
              {status.label}
            </Badge>
          </div>

          <div className="space-y-2 mb-4">
            <div className="flex items-center gap-2 text-gray-600">
              <Calendar className="w-4 h-4 text-gray-400" />
              <span className="text-sm">
                {format(new Date(appointment.date + 'T00:00:00'), 'EEEE, MMMM d, yyyy')}
              </span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Clock className="w-4 h-4 text-gray-400" />
              <span className="text-sm">{appointment.time}</span>
            </div>
            {isVetView && appointment.owner_email && (
              <div className="flex items-center gap-2 text-gray-600">
                <User className="w-4 h-4 text-gray-400" />
                <span className="text-sm">{appointment.owner_email}</span>
              </div>
            )}
            {isVetView && !appointment.vet_email && (
              <div className="flex items-center gap-2 text-amber-700">
                <Stethoscope className="w-4 h-4 text-amber-600" />
                <span className="text-sm font-medium bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                  Unassigned (Clinic Pool)
                </span>
              </div>
            )}
            {isVetView && appointment.vet_email && (
              <div className="flex items-center gap-2 text-teal-700">
                <Stethoscope className="w-4 h-4 text-teal-600" />
                <span className="text-sm font-medium">Assigned to: {appointment.vet_email}</span>
              </div>
            )}
            {!isVetView && appointment.vet_email && (
              <div className="flex items-center gap-2 text-orange-700">
                <Stethoscope className="w-4 h-4 text-orange-600" />
                <span className="text-sm font-medium">Assigned: {appointment.vet_email}</span>
              </div>
            )}
          </div>

          {appointment.reason && (
            <p className="text-sm text-gray-500 mb-4 whitespace-pre-line break-words">
              {appointment.reason}
            </p>
          )}

          {(onConfirm || onCancel || onComplete) && derivedStatus !== 'completed' && derivedStatus !== 'cancelled' && derivedStatus !== 'expired' && (
            <div className="flex gap-2 pt-4 border-t border-gray-100">
              {onConfirm && derivedStatus === 'pending' && (
                <Button 
                  size="sm" 
                  className={cn(
                    "text-white transition-colors",
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
                  className="bg-green-600 hover:bg-green-700"
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
                  className="text-red-600 border-red-200 hover:bg-red-50"
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
                  const newReason = appointment.reason 
                    ? `${appointment.reason}\n\nCancellation Reason: ${cancelReason}`
                    : `Cancellation Reason: ${cancelReason}`;
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