import React from 'react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, User, Stethoscope, Check, X, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from "@/lib/utils";

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
  const status = statusConfig[appointment.status] || statusConfig.pending;
  const StatusIcon = status.icon;

  return (
    <Card className="overflow-hidden border-0 bg-white hover:shadow-md transition-all duration-300">
      <div className="flex">
        <div className={cn(
          "w-2",
          appointment.status === 'pending' && "bg-amber-400",
          appointment.status === 'confirmed' && "bg-blue-500",
          appointment.status === 'completed' && "bg-green-500",
          appointment.status === 'cancelled' && "bg-red-400",
        )} />
        
        <div className="flex-1 p-5">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              {showPetInfo && pet && (
                <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-teal-50 to-teal-100 flex items-center justify-center">
                  {pet.photo_url ? (
                    <img src={pet.photo_url} alt={pet.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-lg font-bold text-teal-600">{pet.name?.[0]}</span>
                  )}
                </div>
              )}
              <div>
                {showPetInfo && pet && (
                  <h4 className="font-semibold text-gray-900">{pet.name}</h4>
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
                {format(new Date(appointment.date), 'EEEE, MMMM d, yyyy')}
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
          </div>

          {appointment.reason && (
            <p className="text-sm text-gray-500 mb-4 line-clamp-2">
              {appointment.reason}
            </p>
          )}

          {(onConfirm || onCancel || onComplete) && appointment.status !== 'completed' && appointment.status !== 'cancelled' && (
            <div className="flex gap-2 pt-4 border-t border-gray-100">
              {onConfirm && appointment.status === 'pending' && (
                <Button 
                  size="sm" 
                  className="bg-teal-600 hover:bg-teal-700 text-white"
                  onClick={() => onConfirm(appointment)}
                >
                  Confirm
                </Button>
              )}
              {onComplete && appointment.status === 'confirmed' && (
                <Button 
                  size="sm" 
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => onComplete(appointment)}
                >
                  Complete
                </Button>
              )}
              {onCancel && (
                <Button 
                  size="sm" 
                  variant="outline"
                  className="text-red-600 border-red-200 hover:bg-red-50"
                  onClick={() => onCancel(appointment)}
                >
                  Cancel
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}