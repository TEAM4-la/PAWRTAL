import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl, formatDoctorName } from "@/utils";
import { api } from '@/api/apiClient';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  Fish,
  Pill,
  Activity,
  Waves
} from 'lucide-react';
import { format, startOfDay, parse, isToday } from 'date-fns';
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import OwnerSidebar from '@/components/layout/OwnerSidebar';
import BackButton from '@/components/ui/BackButton';

export const appointmentTypeConfigs = {
  // General check up: 45 mins gap starting from 8am up until 6:15pm. Break: 12pm to 1pm
  checkup: {
    label: 'General Checkup',
    gap: '45 mins',
    gapMinutes: 45,
    gapLabel: '45 mins gap',
    timeSlots: [
      '08:00 AM', '08:45 AM', '09:30 AM', '10:15 AM', '11:00 AM',
      '01:00 PM', '01:45 PM', '02:30 PM', '03:15 PM', '04:00 PM', '04:45 PM', '05:30 PM', '06:15 PM'
    ]
  },
  // Vaccination: 30 mins gap starting from 8am up until 6:30pm. Break: 12pm to 1pm
  vaccination: {
    label: 'Vaccination',
    gap: '30 mins',
    gapMinutes: 30,
    gapLabel: '30 mins gap',
    timeSlots: [
      '08:00 AM', '08:30 AM', '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
      '01:00 PM', '01:30 PM', '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM', '05:00 PM', '05:30 PM', '06:00 PM', '06:30 PM'
    ]
  },
  // Consultation: 30 mins gap starting from 8am up until 6:30pm. Break: 12pm to 1pm
  consultation: {
    label: 'Consultation',
    gap: '30 mins',
    gapMinutes: 30,
    gapLabel: '30 mins gap',
    timeSlots: [
      '08:00 AM', '08:30 AM', '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
      '01:00 PM', '01:30 PM', '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM', '05:00 PM', '05:30 PM', '06:00 PM', '06:30 PM'
    ]
  },
  // Deworming: 30 mins gap starting from 8am up until 6:30pm. Break: 12pm to 1pm
  deworming: {
    label: 'Deworming',
    gap: '30 mins',
    gapMinutes: 30,
    gapLabel: '30 mins gap',
    timeSlots: [
      '08:00 AM', '08:30 AM', '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
      '01:00 PM', '01:30 PM', '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM', '05:00 PM', '05:30 PM', '06:00 PM', '06:30 PM'
    ]
  },
  // Ultra sound: 45 mins gap starting from 8am up until 6:15pm. Break: 12pm to 1pm
  ultra_sound: {
    label: 'Ultra Sound',
    gap: '45 mins',
    gapMinutes: 45,
    gapLabel: '45 mins gap',
    timeSlots: [
      '08:00 AM', '08:45 AM', '09:30 AM', '10:15 AM', '11:00 AM',
      '01:00 PM', '01:45 PM', '02:30 PM', '03:15 PM', '04:00 PM', '04:45 PM', '05:30 PM', '06:15 PM'
    ]
  },
  // Grooming: 1 hour gap starting from 8am up until 6:00pm. Break: 12pm to 1pm
  grooming: {
    label: 'Grooming',
    gap: '1 hour',
    gapMinutes: 60,
    gapLabel: '1 hour gap',
    timeSlots: [
      '08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM',
      '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM', '06:00 PM'
    ]
  },
  // Dental care: 1 hour gap starting from 8am up until 6:00pm. Break: 12pm to 1pm
  dental: {
    label: 'Dental Care',
    gap: '1 hour',
    gapMinutes: 60,
    gapLabel: '1 hour gap',
    timeSlots: [
      '08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM',
      '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM', '06:00 PM'
    ]
  },
  // Surgery: 2 hours gap starting from 8am up until 5:00pm. Break: 12pm to 1pm
  surgery: {
    label: 'Surgery',
    gap: '2 hours',
    gapMinutes: 120,
    gapLabel: '2 hours gap',
    timeSlots: [
      '08:00 AM', '10:00 AM',
      '01:00 PM', '03:00 PM', '05:00 PM'
    ]
  },
};

const appointmentTypes = [
  { value: 'checkup', label: 'General Checkup', gap: '45 mins', icon: Stethoscope, color: 'bg-teal-100 text-teal-700' },
  { value: 'vaccination', label: 'Vaccination', gap: '30 mins', icon: Syringe, color: 'bg-purple-100 text-purple-700' },
  { value: 'deworming', label: 'Deworming', gap: '30 mins', icon: Pill, color: 'bg-amber-100 text-amber-700' },
  { value: 'grooming', label: 'Grooming', gap: '1 hour', icon: Scissors, color: 'bg-pink-100 text-pink-700' },
  { value: 'dental', label: 'Dental Care', gap: '1 hour', icon: Heart, color: 'bg-blue-100 text-blue-700' },
  { value: 'surgery', label: 'Surgery', gap: '2 hours', icon: Activity, color: 'bg-red-100 text-red-700' },
  { value: 'ultra_sound', label: 'Ultra Sound', gap: '45 mins', icon: Waves, color: 'bg-cyan-100 text-cyan-700' },
  { value: 'consultation', label: 'Consultation', gap: '30 mins', icon: Stethoscope, color: 'bg-indigo-100 text-indigo-700' },
];

function timeToMinutes(timeStr) {
  if (!timeStr) return null;
  const match = timeStr.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return null;
  let [ , hStr, mStr, period ] = match;
  let hours = parseInt(hStr, 10);
  const minutes = parseInt(mStr, 10);
  if (period.toUpperCase() === 'PM' && hours < 12) hours += 12;
  if (period.toUpperCase() === 'AM' && hours === 12) hours = 0;
  return hours * 60 + minutes;
}

const speciesIcons = {
  dog: Dog,
  cat: Cat,
  bird: Bird,
  rabbit: Rabbit,
  fish: Fish,
};

const DEFAULT_VET_EMAIL = 'RebeccaGoyena@pawrtal.com';

export default function BookAppointment() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const preselectedPetId = urlParams.get('petId');

  const [formData, setFormData] = useState({
    pet_id: preselectedPetId || '',
    vet_email: DEFAULT_VET_EMAIL,
    type: '',
    date: null,
    time: '',
    reason: '',
  });
  const [vetManuallySelected, setVetManuallySelected] = useState(false);
  const [errors, setErrors] = useState({});

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => api.auth.me(),
  });

  const { data: veterinarians = [] } = useQuery({
    queryKey: ['clinicVeterinarians'],
    queryFn: () => api.entities.User.veterinarians(),
  });

  const rebeccaVet = useMemo(() => {
    return veterinarians.find(
      (v) =>
        (v.email || '').toLowerCase() === 'rebeccagoyena@pawrtal.com' ||
        (v.full_name || '').toLowerCase().includes('rebecca') ||
        (v.display_name || '').toLowerCase().includes('rebecca')
    ) || (veterinarians.length > 0 ? veterinarians[0] : null);
  }, [veterinarians]);

  const defaultVetEmail = rebeccaVet?.email || DEFAULT_VET_EMAIL;

  // Compute the current value for the Select dropdown
  const currentVetSelectValue = useMemo(() => {
    if (vetManuallySelected) {
      if (!formData.vet_email || formData.vet_email === 'any') return 'any';
      const match = veterinarians.find(
        (v) => (v.email || '').toLowerCase() === (formData.vet_email || '').toLowerCase()
      );
      return match ? match.email : formData.vet_email;
    }
    return defaultVetEmail;
  }, [vetManuallySelected, formData.vet_email, defaultVetEmail, veterinarians]);

  // Default preferred veterinarian to Dr. Rebecca Goyena if not manually overridden
  React.useEffect(() => {
    if (!vetManuallySelected && defaultVetEmail) {
      if (formData.vet_email !== defaultVetEmail) {
        setFormData((prev) => ({
          ...prev,
          vet_email: defaultVetEmail,
        }));
      }
    }
  }, [veterinarians, defaultVetEmail, vetManuallySelected, formData.vet_email]);

  const { data: pets = [], isLoading: petsLoading } = useQuery({
    queryKey: ['pets', user?.email],
    queryFn: () => api.entities.Pet.filter({ owner_email: user?.email }),
    enabled: !!user?.email,
  });

  // Fetch ALL appointments for the selected date to prevent double-booking
  // staleTime: 0 so data is always considered stale and refetched on mount/focus
  const selectedDateStr = formData.date ? format(formData.date, 'yyyy-MM-dd') : null;
  const { data: bookedAppointments = [] } = useQuery({
    queryKey: ['bookedSlots', selectedDateStr],
    queryFn: () => api.entities.Appointment.filter({ date: selectedDateStr }),
    enabled: !!selectedDateStr,
    staleTime: 0,           // Always refetch — never use stale cache for availability
    refetchOnMount: true,   // Refetch every time the component mounts
    refetchOnWindowFocus: true, // Refetch when user switches tabs and comes back
  });

  // Set of time strings that are already taken on this date
  // Block pending, confirmed, AND accepted — only completed/cancelled/expired free up a slot.
  // When a specific veterinarian is chosen, only their slots (or clinic capacity) block the time.
  // When "Any Available" is chosen, slots are blocked only if all veterinarians are occupied.
  const activeTimeSlots = useMemo(() => {
    if (formData.type && appointmentTypeConfigs[formData.type]) {
      return appointmentTypeConfigs[formData.type].timeSlots;
    }
    return appointmentTypeConfigs.checkup.timeSlots;
  }, [formData.type]);

  // Set of time strings that are already taken or overlapping on this date
  const bookedTimes = useMemo(() => {
    const activeAppts = bookedAppointments.filter(
      (apt) => apt.status === 'pending' || apt.status === 'confirmed' || apt.status === 'accepted'
    );

    const taken = new Set();
    const vetCount = veterinarians.length || 1;
    const currentGap = (formData.type && appointmentTypeConfigs[formData.type])
      ? appointmentTypeConfigs[formData.type].gapMinutes
      : 30;

    activeTimeSlots.forEach((slotTime) => {
      const slotStart = timeToMinutes(slotTime);
      if (slotStart === null) return;
      const slotEnd = slotStart + currentGap;

      // Find active appointments that overlap with this time window: [slotStart, slotEnd)
      const overlappingAppts = activeAppts.filter((apt) => {
        if (apt.time === slotTime) return true;
        const apptStart = timeToMinutes(apt.time);
        if (apptStart === null) return false;
        const apptGap = (apt.type && appointmentTypeConfigs[apt.type])
          ? appointmentTypeConfigs[apt.type].gapMinutes
          : 30;
        const apptEnd = apptStart + apptGap;
        return Math.max(slotStart, apptStart) < Math.min(slotEnd, apptEnd);
      });

      const effectiveVetEmail = vetManuallySelected
        ? (formData.vet_email === 'any' ? null : (formData.vet_email || defaultVetEmail))
        : defaultVetEmail;

      if (effectiveVetEmail) {
        // Specific vet selected: blocked if that vet is booked OR all clinic capacity is booked
        const selectedVetEmailLower = effectiveVetEmail.toLowerCase();
        const vetIsBooked = overlappingAppts.some((apt) => (apt.vet_email || '').toLowerCase() === selectedVetEmailLower);
        const clinicAtCapacity = overlappingAppts.length >= vetCount;
        if (vetIsBooked || clinicAtCapacity) {
          taken.add(slotTime);
        }
      } else {
        // "Any Available" selected: blocked only if all vets are booked at this time
        if (overlappingAppts.length >= vetCount) {
          taken.add(slotTime);
        }
      }
    });

    return taken;
  }, [bookedAppointments, formData.vet_email, formData.type, veterinarians, activeTimeSlots, vetManuallySelected, defaultVetEmail]);

  /**
   * Returns true if a time slot should be disabled.
   * Rules:
   *   1. Already booked (pending or accepted appointment exists at that time on that date)
   *   2. Today only: slot is within 30 minutes from now (transport buffer)
   */
  const isSlotDisabled = (timeStr) => {
    if (bookedTimes.has(timeStr)) return true;

    if (!formData.date || !isToday(formData.date)) return false;

    // Parse the slot into today's datetime — date-fns format: hh=12h, mm=minutes, a=AM/PM
    let slotDate = parse(timeStr, 'hh:mm a', new Date());
    if (isNaN(slotDate.getTime())) {
      slotDate = parse(timeStr, 'h:mm a', new Date());
    }
    const now = new Date();
    // Disable if slot time is <= now + 30 minutes
    if (isNaN(slotDate.getTime())) return false; // safety guard
    return slotDate.getTime() <= now.getTime() + 30 * 60 * 1000;
  };

  const createMutation = useMutation({
    queryKey: ['createAppointment'],
    mutationFn: (data) => {
      let finalVetEmail = null;
      if (vetManuallySelected) {
        finalVetEmail = (!data.vet_email || data.vet_email === 'any') ? null : data.vet_email;
      } else {
        finalVetEmail = defaultVetEmail || DEFAULT_VET_EMAIL;
      }

      return api.entities.Appointment.create({
        ...data,
        owner_email: user?.email,
        vet_email: finalVetEmail,
        status: 'pending',
        date: format(data.date, 'yyyy-MM-dd'),
      });
    },
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
    <div className="p-3.5 sm:p-6 lg:p-8 max-w-3xl mx-auto space-y-4 sm:space-y-6 w-full max-w-full min-w-0 overflow-x-hidden">
      <BackButton
        onClick={() => preselectedPetId ? navigate(createPageUrl(`PetProfile?id=${preselectedPetId}`)) : navigate(createPageUrl('Dashboard'))}
        className="mb-4 sm:mb-6"
      />

      <Card className="border-0 shadow-lg">
        <CardHeader className="border-b border-gray-200 bg-gradient-to-r from-amber-50 to-orange-50 p-4 sm:p-6">
          <CardTitle className="text-xl sm:text-2xl flex items-center gap-2.5 sm:gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white shadow-md shadow-orange-100 shrink-0">
              <CalendarIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            Book Appointment
          </CardTitle>
          <p className="text-gray-500 text-xs sm:text-sm mt-0.5 sm:mt-1">Schedule a visit with our veterinary team</p>
        </CardHeader>

        <CardContent className="p-4 sm:p-6">
          <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
            {/* Select Pet */}
            <div>
              <Label className="text-sm font-medium mb-2.5 sm:mb-3 block">
                Select Pet <span className="text-red-500">*</span>
              </Label>
              {pets.length === 0 ? (
                <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 text-amber-800">
                  <p className="font-medium">No pets found</p>
                  <p className="text-sm mt-1">Please add a pet first before booking an appointment.</p>
                  <Button
                    type="button"
                    onClick={() => navigate(createPageUrl('AddPet'))}
                    className="mt-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
                  >
                    Add Pet
                  </Button>
                </div>
              ) : (
                <div className={cn("grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 p-1 sm:p-2 rounded-xl transition-all border", errors.pet_id ? "border-red-500 bg-red-50/5" : "border-transparent")}>
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
                          "flex items-center gap-2.5 sm:gap-3 p-2.5 sm:p-3.5 rounded-xl border-2 cursor-pointer transition-all min-w-0 overflow-hidden",
                          isSelected
                            ? "border-orange-500 bg-orange-50/60 shadow-xs"
                            : "border-gray-200 hover:border-gray-300 bg-white"
                        )}
                      >
                        <div className={cn(
                          "w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden flex items-center justify-center shrink-0",
                          isSelected ? "bg-orange-100" : "bg-gray-100"
                        )}>
                          {pet.photo_url ? (
                            <img src={pet.photo_url} alt={pet.name} className="w-full h-full object-cover" />
                          ) : (
                            <Icon className={cn("w-5 h-5 sm:w-6 sm:h-6", isSelected ? "text-orange-600" : "text-gray-400")} />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-gray-900 truncate text-sm sm:text-base">{pet.name}</p>
                          <p className="text-xs sm:text-sm text-gray-500 truncate">{pet.breed || pet.species}</p>
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
              <Label className="text-sm font-medium mb-2.5 sm:mb-3 block">
                Appointment Type <span className="text-red-500">*</span>
              </Label>
              <div className={cn("grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 p-1 sm:p-2 rounded-xl transition-all border", errors.type ? "border-red-500 bg-red-50/5" : "border-transparent")}>
                {appointmentTypes.map((type) => {
                  const isSelected = formData.type === type.value;
                  return (
                    <div
                      key={type.value}
                      onClick={() => {
                        const newSlots = appointmentTypeConfigs[type.value]?.timeSlots || [];
                        setFormData(prev => ({
                          ...prev,
                          type: type.value,
                          time: newSlots.includes(prev.time) ? prev.time : '',
                        }));
                        setErrors(prev => ({ ...prev, type: false }));
                      }}
                      className={cn(
                        "flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3.5 rounded-xl border-2 cursor-pointer transition-all min-w-0 overflow-hidden",
                        isSelected
                          ? "border-orange-500 bg-orange-50/60 shadow-sm"
                          : "border-gray-200 hover:border-gray-300 bg-white"
                      )}
                    >
                      <div className={cn("p-1.5 sm:p-2 rounded-lg shrink-0", type.color)}>
                        <type.icon className="w-4 h-4 sm:w-5 sm:h-5" />
                      </div>
                      <div className="min-w-0 flex-1 overflow-hidden">
                        <span className="font-medium text-gray-900 block truncate text-xs sm:text-sm md:text-base leading-tight">{type.label}</span>
                        <span className="text-[11px] sm:text-xs text-gray-500 font-normal block truncate mt-0.5">{type.gap} gap</span>
                      </div>
                    </div>
                  );
                })}
              </div>
              {errors.type && (
                <p className="text-sm text-red-600 mt-1.5">Please select an appointment type.</p>
              )}
            </div>

            {/* Preferred Veterinarian Selection (Dropdown) */}
            <div>
              <Label htmlFor="vet-selection" className="text-sm font-medium mb-3 flex items-center gap-2">
                <Stethoscope className="w-4 h-4 text-orange-600" />
                Select Preferred Veterinarian <span className="text-gray-400 font-normal text-xs">(Optional)</span>
              </Label>
              <Select
                value={currentVetSelectValue}
                onValueChange={(val) => {
                  setVetManuallySelected(true);
                  setFormData(prev => ({
                    ...prev,
                    vet_email: val,
                    time: '', // reset selected time slot when vet changes to prevent booking a taken slot
                  }));
                }}
              >
                <SelectTrigger id="vet-selection" className="h-12 rounded-xl bg-white border-gray-200">
                  <SelectValue placeholder="Choose a veterinarian" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">
                    Any Available Veterinarian (Fastest)
                  </SelectItem>
                  {veterinarians.length === 0 ? (
                    <SelectItem value={DEFAULT_VET_EMAIL}>
                      Dr. Rebecca Goyena (Preferred)
                    </SelectItem>
                  ) : (
                    veterinarians.map((vet) => {
                      const isRebecca = (vet.email || '').toLowerCase() === 'rebeccagoyena@pawrtal.com' ||
                                        (vet.full_name || '').toLowerCase().includes('rebecca') ||
                                        (vet.display_name || '').toLowerCase().includes('rebecca');
                      return (
                        <SelectItem key={vet.email} value={vet.email}>
                          {formatDoctorName(vet.full_name, vet.email)}
                          {isRebecca ? ' (Preferred)' : ''}
                          {vet.specialization ? ` (${vet.specialization})` : ''}
                        </SelectItem>
                      );
                    })
                  )}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-400 mt-1.5">
                Choosing a specific veterinarian will check their direct schedule availability.
              </p>
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
                  className={cn("h-12 mt-0", errors.date ? "border-red-500 bg-red-50/10 focus-visible:ring-red-500 pr-16" : "")}
                />
                {errors.date && (
                  <AlertTriangle className="w-5 h-5 text-red-500 absolute right-10 top-1/2 -translate-y-1/2" />
                )}
              </div>
              {errors.date && (
                <p className="text-sm text-red-600 mt-1.5">Please select a preferred date.</p>
              )}
            </div>

            {/* Time Selection */}
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-3">
                <Label className="text-sm font-medium">
                  Preferred Time <span className="text-red-500">*</span>
                </Label>
                {formData.type && appointmentTypeConfigs[formData.type] && (
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-800 w-fit">
                    {appointmentTypeConfigs[formData.type].gapLabel} • 12:00 PM – 1:00 PM Lunch Break
                  </span>
                )}
              </div>

              <div className={cn("grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-1.5 sm:gap-2 p-1.5 sm:p-2 rounded-xl transition-all border", errors.time ? "border-red-500 bg-red-50/5" : "border-transparent")}>
                {activeTimeSlots.map((time) => {
                  const isSelected = formData.time === time;
                  const disabled = isSlotDisabled(time);
                  const isBooked = bookedTimes.has(time);
                  return (
                    <div key={time} className="relative group">
                      <Button
                        type="button"
                        variant={isSelected ? "default" : "outline"}
                        disabled={disabled}
                        onClick={() => {
                          if (disabled) return;
                          setFormData({ ...formData, time });
                          setErrors(prev => ({ ...prev, time: false }));
                        }}
                        className={cn(
                          "h-9 sm:h-10 w-full text-[11px] sm:text-xs font-medium px-1 sm:px-2 transition-all",
                          isSelected && "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-sm",
                          disabled && isBooked && "opacity-40 line-through cursor-not-allowed bg-red-50 border-red-200 text-red-400",
                          disabled && !isBooked && "opacity-40 cursor-not-allowed bg-gray-50 text-gray-400"
                        )}
                      >
                        {time}
                      </Button>
                      {/* Tooltip label on hover when disabled */}
                      {disabled && (
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 bg-gray-800 text-white text-[10px] rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                          {isBooked ? 'Already booked' : 'Too soon — 30 min gap required'}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              {/* Legend */}
              {formData.date && (
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-2.5 text-xs text-gray-500">
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-sm bg-orange-500 inline-block" /> Available
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-sm bg-red-100 border border-red-200 inline-block" /> Already booked
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-sm bg-gray-100 border border-gray-200 inline-block" /> Too soon (30-min buffer)
                  </span>
                  <span className="flex items-center gap-1.5 text-amber-800 bg-amber-50 px-2 py-0.5 rounded font-medium">
                    12:00 PM – 1:00 PM Break Excluded
                  </span>
                </div>
              )}
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
                className="min-h-[100px] focus-visible:ring-orange-400"
              />
            </div>

            {/* Submit */}
            <div className="flex gap-4 pt-4 border-t">
              <Button
                type="submit"
                disabled={createMutation.isPending || pets.length === 0}
                className="flex-1 h-12 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-sm shadow-orange-100"
              >
                {createMutation.isPending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  'Book Appointment'
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => preselectedPetId ? navigate(createPageUrl(`PetProfile?id=${preselectedPetId}`)) : navigate(createPageUrl('Dashboard'))}
                className="flex-1 h-12"
              >
                Cancel
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