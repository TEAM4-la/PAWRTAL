import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from "@/utils";
import { api } from '@/api/apiClient';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  ArrowLeft, 
  Calendar as CalendarIcon, 
  Loader2,
  Stethoscope,
  Syringe,
  Scissors,
  Heart,
  AlertTriangle,
  Dog,
  Cat,
  Bird,
  Rabbit,
  Fish
} from 'lucide-react';
import { format, startOfDay } from 'date-fns';
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import OwnerSidebar from '@/components/layout/OwnerSidebar';

const appointmentTypes = [
  { value: 'checkup', label: 'General Checkup', icon: Stethoscope, color: 'bg-teal-100 text-teal-700' },
  { value: 'vaccination', label: 'Vaccination', icon: Syringe, color: 'bg-purple-100 text-purple-700' },
  { value: 'grooming', label: 'Grooming', icon: Scissors, color: 'bg-pink-100 text-pink-700' },
  { value: 'dental', label: 'Dental Care', icon: Heart, color: 'bg-blue-100 text-blue-700' },
  { value: 'follow_up', label: 'Follow-up', icon: CalendarIcon, color: 'bg-gray-100 text-gray-700' },
  { value: 'consultation', label: 'Consultation', icon: Stethoscope, color: 'bg-indigo-100 text-indigo-700' },
];

const timeSlots = [
  '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
  '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM', '05:00 PM'
];

const speciesIcons = {
  dog: Dog,
  cat: Cat,
  bird: Bird,
  rabbit: Rabbit,
  fish: Fish,
};

export default function BookAppointment() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const preselectedPetId = urlParams.get('petId');

  const [formData, setFormData] = useState({
    pet_id: preselectedPetId || '',
    type: '',
    date: null,
    time: '',
    reason: '',
  });
  const [errors, setErrors] = useState({});

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => api.auth.me(),
  });

  const { data: pets = [], isLoading: petsLoading } = useQuery({
    queryKey: ['pets', user?.email],
    queryFn: () => api.entities.Pet.filter({ owner_email: user?.email }),
    enabled: !!user?.email,
  });

  const createMutation = useMutation({
    queryKey: ['createAppointment'],
    mutationFn: (data) => api.entities.Appointment.create({
      ...data,
      owner_email: user?.email,
      status: 'pending',
      date: format(data.date, 'yyyy-MM-dd'),
    }),
    onSuccess: () => {
      toast.success('Appointment booked successfully!');
      navigate(createPageUrl('Appointments'));
    },
    onError: () => {
      toast.error('Failed to book appointment');
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!formData.pet_id) newErrors.pet_id = true;
    if (!formData.type) newErrors.type = true;
    if (!formData.date) newErrors.date = true;
    if (!formData.time) newErrors.time = true;

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      return;
    }
    createMutation.mutate(formData);
  };

  /** Earliest selectable day (today); same pattern as Add Pet DOB but with a minimum instead of max. */
  const minAppointmentDateStr = format(startOfDay(new Date()), 'yyyy-MM-dd');
  const maxAppointmentDateStr = `${new Date().getFullYear()}-12-31`;

  const content = (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto">
      <Button
        variant="ghost"
        onClick={() => preselectedPetId ? navigate(createPageUrl(`PetProfile?id=${preselectedPetId}`)) : navigate(createPageUrl('Dashboard'))}
        className="mb-6 gap-2 text-gray-600"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </Button>

      <Card className="border-0 shadow-lg">
        <CardHeader className="border-b bg-gradient-to-r from-teal-50 to-orange-50">
          <CardTitle className="text-2xl flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-teal-500 flex items-center justify-center text-white">
              <CalendarIcon className="w-6 h-6 text-white" />
            </div>
            Book Appointment
          </CardTitle>
          <p className="text-gray-500">Schedule a visit with our veterinary team</p>
        </CardHeader>

        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Select Pet */}
            <div>
              <Label className="text-sm font-medium mb-3 block">
                Select Pet <span className="text-red-500">*</span>
              </Label>
              {pets.length === 0 ? (
                <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 text-amber-800">
                  <p className="font-medium">No pets found</p>
                  <p className="text-sm mt-1">Please add a pet first before booking an appointment.</p>
                  <Button
                    type="button"
                    onClick={() => navigate(createPageUrl('AddPet'))}
                    className="mt-3 bg-amber-500 hover:bg-amber-600"
                  >
                    Add Pet
                  </Button>
                </div>
              ) : (
                <div className={cn("grid sm:grid-cols-2 gap-3 p-2 rounded-xl transition-all border", errors.pet_id ? "border-red-500 bg-red-50/5" : "border-transparent")}>
                  {pets.map((pet) => {
                    const Icon = speciesIcons[pet.species] || Dog;
                    const isSelected = formData.pet_id === pet.id;
                    return (
                      <div
                        key={pet.id}
                        onClick={() => {
                          setFormData({ ...formData, pet_id: pet.id });
                          setErrors(prev => ({ ...prev, pet_id: false }));
                        }}
                        className={cn(
                          "flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all",
                          isSelected
                            ? "border-teal-500 bg-teal-50"
                            : "border-gray-200 hover:border-gray-300"
                        )}
                      >
                        <div className={cn(
                          "w-12 h-12 rounded-full overflow-hidden flex items-center justify-center",
                          isSelected ? "bg-teal-100" : "bg-gray-100"
                        )}>
                          {pet.photo_url ? (
                            <img src={pet.photo_url} alt={pet.name} className="w-full h-full object-cover" />
                          ) : (
                            <Icon className={cn("w-6 h-6", isSelected ? "text-teal-600" : "text-gray-400")} />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{pet.name}</p>
                          <p className="text-sm text-gray-500">{pet.breed || pet.species}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              {errors.pet_id && (
                <p className="text-sm text-red-600 mt-1.5">Please select a pet.</p>
              )}
            </div>

            {/* Appointment Type */}
            <div>
              <Label className="text-sm font-medium mb-3 block">
                Appointment Type <span className="text-red-500">*</span>
              </Label>
              <div className={cn("grid sm:grid-cols-2 gap-3 p-2 rounded-xl transition-all border", errors.type ? "border-red-500 bg-red-50/5" : "border-transparent")}>
                {appointmentTypes.map((type) => {
                  const isSelected = formData.type === type.value;
                  return (
                    <div
                      key={type.value}
                      onClick={() => {
                        setFormData({ ...formData, type: type.value });
                        setErrors(prev => ({ ...prev, type: false }));
                      }}
                      className={cn(
                        "flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all",
                        isSelected
                          ? "border-teal-500 bg-teal-50"
                          : "border-gray-200 hover:border-gray-300"
                      )}
                    >
                      <div className={cn("p-2 rounded-lg", type.color)}>
                        <type.icon className="w-5 h-5" />
                      </div>
                      <span className="font-medium text-gray-900">{type.label}</span>
                    </div>
                  );
                })}
              </div>
              {errors.type && (
                <p className="text-sm text-red-600 mt-1.5">Please select an appointment type.</p>
              )}
            </div>

            {/* Date Selection — native picker like Add Pet (Date of birth); min = today, no past dates */}
            <div>
              <Label htmlFor="appointment-date" className="text-sm font-medium mb-3 block">
                Preferred Date <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="appointment-date"
                  type="date"
                  min={minAppointmentDateStr}
                  max={maxAppointmentDateStr}
                  value={formData.date ? format(formData.date, 'yyyy-MM-dd') : ''}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (!v) {
                      setFormData({ ...formData, date: null });
                      return;
                    }
                    const [y, m, d] = v.split('-').map(Number);
                    setFormData({ ...formData, date: new Date(y, m - 1, d) });
                    setErrors(prev => ({ ...prev, date: false }));
                  }}
                  className={cn("h-12 mt-0 pr-10", errors.date ? "border-red-500 bg-red-50/10 focus-visible:ring-red-500" : "")}
                />
                {errors.date && (
                  <AlertTriangle className="w-5 h-5 text-red-500 absolute right-3 top-1/2 -translate-y-1/2" />
                )}
              </div>
              {errors.date && (
                <p className="text-sm text-red-600 mt-1.5">Please select a preferred date.</p>
              )}
            </div>

            {/* Time Selection */}
            <div>
              <Label className="text-sm font-medium mb-3 block">
                Preferred Time <span className="text-red-500">*</span>
              </Label>
              <div className={cn("grid grid-cols-3 sm:grid-cols-4 gap-2 p-2 rounded-xl transition-all border", errors.time ? "border-red-500 bg-red-50/5" : "border-transparent")}>
                {timeSlots.map((time) => {
                  const isSelected = formData.time === time;
                  return (
                    <Button
                      key={time}
                      type="button"
                      variant={isSelected ? "default" : "outline"}
                      onClick={() => {
                        setFormData({ ...formData, time });
                        setErrors(prev => ({ ...prev, time: false }));
                      }}
                      className={cn(
                        "h-10",
                        isSelected && "bg-teal-500 hover:bg-teal-600"
                      )}
                    >
                      {time}
                    </Button>
                  );
                })}
              </div>
              {errors.time && (
                <p className="text-sm text-red-600 mt-1.5">Please select a preferred time.</p>
              )}
            </div>

            {/* Reason */}
            <div>
              <Label htmlFor="reason" className="text-sm font-medium mb-2 block">
                Reason for Visit
              </Label>
              <Textarea
                id="reason"
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                placeholder="Describe your pet's symptoms or the reason for this visit..."
                className="min-h-[100px]"
              />
            </div>

            {/* Submit */}
            <div className="flex gap-4 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => preselectedPetId ? navigate(createPageUrl(`PetProfile?id=${preselectedPetId}`)) : navigate(createPageUrl('Dashboard'))}
                className="flex-1 h-12"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || pets.length === 0}
                className="flex-1 h-12 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white"
              >
                {createMutation.isPending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  'Book Appointment'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );

  if (petsLoading) {
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