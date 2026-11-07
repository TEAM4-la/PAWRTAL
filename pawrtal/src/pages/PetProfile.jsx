import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import backgroundImg from '@/assets/background.png';
import { createPageUrl, getAppointmentStatus, formatDoctorName } from "@/utils";
import BackButton from '@/components/ui/BackButton';
import { api } from '@/api/apiClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Edit,
  QrCode,
  Calendar,
  Syringe,
  Pill,
  Scissors,
  FileText,
  Clock,
  Weight,
  Dog,
  Cat,
  Bird,
  Rabbit,
  Fish,
  AlertTriangle,
  Trash2,
  ExternalLink
} from 'lucide-react';
import { format, differenceInYears, differenceInMonths, isBefore } from 'date-fns';
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import OwnerSidebar from '@/components/layout/OwnerSidebar';

const speciesIcons = {
  dog: Dog,
  cat: Cat,
  bird: Bird,
  rabbit: Rabbit,
  fish: Fish,
};

const parseAttachments = (record) => {
  if (Array.isArray(record?.file_urls) && record.file_urls.length > 0) {
    return record.file_urls.filter(Boolean);
  }
  if (!record?.file_url) return [];
  const raw = String(record.file_url).trim();
  if (raw.startsWith('[') && raw.endsWith(']')) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.filter(Boolean);
    } catch {}
  }
  if (raw.includes(',')) {
    return raw.split(',').map(s => s.trim()).filter(Boolean);
  }
  return [raw];
};

export default function PetProfile() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const petId = urlParams.get('id');

  const { data: user } = useQuery({ queryKey: ['me'], queryFn: () => api.auth.me() });

  const { data: pet, isLoading: petLoading } = useQuery({
    queryKey: ['pet', petId],
    queryFn: () => api.entities.Pet.filter({ id: petId }),
    enabled: !!petId,
    select: (data) => data[0],
  });

  const { data: vaccinations = [] } = useQuery({
    queryKey: ['vaccinations', petId],
    queryFn: async () => {
      const data = await api.entities.Vaccination.filter({ pet_id: petId, is_visible_to_owner: true }, '-date_administered');
      return (data || []).filter(v => v.is_visible_to_owner !== false).sort((a, b) => {
        const diff = new Date(b.date_administered || 0) - new Date(a.date_administered || 0);
        if (diff !== 0) return diff;
        const nextDiff = (b.next_due_date || '').localeCompare(a.next_due_date || '');
        if (nextDiff !== 0) return nextDiff;
        return (b.id || '').localeCompare(a.id || '');
      });
    },
    enabled: !!petId,
  });

  const { data: medications = [] } = useQuery({
    queryKey: ['medications', petId],
    queryFn: async () => {
      const data = await api.entities.Medication.filter({ pet_id: petId, is_visible_to_owner: true }, '-start_date');
      return (data || []).filter(m => m.is_visible_to_owner !== false).sort((a, b) => new Date(b.start_date || 0) - new Date(a.start_date || 0));
    },
    enabled: !!petId,
  });

  const { data: appointments = [] } = useQuery({
    queryKey: ['petAppointments', petId],
    queryFn: async () => {
      const data = await api.entities.Appointment.filter({ pet_id: petId }, '-date');
      return (data || []).sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
    },
    enabled: !!petId,
  });

  const { data: healthRecords = [] } = useQuery({
    queryKey: ['healthRecords', petId],
    queryFn: async () => {
      const data = await api.entities.HealthRecord.filter({ pet_id: petId, is_visible_to_owner: true }, '-date');
      return (data || []).sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
    },
    enabled: !!petId,
  });

  const { data: groomingRecords = [] } = useQuery({
    queryKey: ['groomingRecords', petId],
    queryFn: async () => {
      const data = await api.entities.GroomingRecord.filter({ pet_id: petId, is_visible_to_owner: true }, '-date');
      return (data || []).sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
    },
    enabled: !!petId,
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.entities.Pet.delete(petId),
    onSuccess: () => {
      toast.success('Pet removed');
      navigate(createPageUrl('MyPets'));
    }
  });

  const calculateAge = (dob) => {
    if (!dob) return 'Unknown';
    const years = differenceInYears(new Date(), new Date(dob));
    const months = differenceInMonths(new Date(), new Date(dob)) % 12;
    if (years === 0) return `${months} month${months !== 1 ? 's' : ''}`;
    if (months === 0) return `${years} year${years !== 1 ? 's' : ''}`;
    return `${years}y ${months}m`;
  };

  if (petLoading) {
    return (
      <OwnerSidebar user={user}>
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-amber-700 border-t-transparent rounded-full animate-spin" />
        </div>
      </OwnerSidebar>
    );
  }

  if (!pet) {
    return (
      <OwnerSidebar user={user}>
        <div className="p-6 text-center">
          <p className="text-gray-500">Pet not found</p>
          <Link to={createPageUrl('MyPets')}>
            <Button className="mt-4">Back to My Pets</Button>
          </Link>
        </div>
      </OwnerSidebar>
    );
  }

  // Authorization check: only the pet's owner, vets, or admins can view the private profile
  const userType = (user?.user_type || '').toLowerCase();
  const isOwner = user?.email && pet?.owner_email && user.email.toLowerCase() === pet.owner_email.toLowerCase();
  const isVetOrAdmin = userType === 'veterinarian' || userType === 'admin';

  if (user && pet && !isOwner && !isVetOrAdmin) {
    return (
      <OwnerSidebar user={user}>
        <div className="min-h-screen flex items-center justify-center p-6">
          <Card className="max-w-md text-center p-8 border-0 shadow-lg">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">Access Denied</h1>
            <p className="text-gray-500 mb-6">
              You don't have permission to view this pet's private records. Only the pet's owner or veterinary staff can access this information.
            </p>
            <div className="flex flex-col gap-3">
              <Link to={createPageUrl('Dashboard')}>
                <Button className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white">
                  Go to My Dashboard
                </Button>
              </Link>
              <Link to={createPageUrl(`PublicPetProfile?id=${petId}`)}>
                <Button variant="outline" className="w-full">
                  View Public Profile
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </OwnerSidebar>
    );
  }

  const Icon = speciesIcons[pet.species] || Dog;
  const activeMeds = medications.filter(m => m.is_active);

  const content = (
    <div className="p-3.5 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-4 sm:space-y-6 w-full max-w-full min-w-0 overflow-x-hidden">
      <BackButton to={createPageUrl('Dashboard')} className="mb-1 sm:mb-2" />

      {/* Header Card */}
      <Card className="overflow-hidden border border-gray-100 shadow-md bg-white">
        {/* Cover Banner: Solid Pawrtal light teal with subtle authentic pet doodle texture (No AI gradient) */}
        <div className="relative h-36 sm:h-48 bg-gradient-to-r from-amber-500 to-orange-500 overflow-hidden">
          <img 
            src={backgroundImg} 
            alt="Pawrtal Pattern" 
            className="w-full h-full object-cover opacity-20 mix-blend-overlay pointer-events-none select-none" 
          />
        </div>
        
        <div className="relative z-10 px-3.5 sm:px-6 pb-4 sm:pb-6 pt-3">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 sm:gap-4">
            {/* Avatar & Pet Info Group */}
            <div className="flex flex-col sm:flex-row sm:items-end gap-3 sm:gap-5 min-w-0">
              {/* Pet Avatar - overlaps banner */}
              <div className="relative z-20 -mt-12 sm:-mt-20 w-20 h-20 sm:w-32 sm:h-32 rounded-2xl overflow-hidden bg-white border-4 border-white shadow-lg flex items-center justify-center shrink-0">
                {pet.photo_url ? (
                  <img src={pet.photo_url} alt={pet.name} className="w-full h-full object-cover" />
                ) : (
                  <Icon className="w-12 h-12 sm:w-16 sm:h-16 text-orange-400" />
                )}
              </div>
              
              {/* Pet Name, Species, Breed & Microchip */}
              <div className="pb-1 min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight truncate">{pet.name}</h1>
                  <Badge className="capitalize bg-orange-50 text-orange-700 border border-orange-200 font-medium px-2.5 py-0.5 text-xs">
                    {pet.species}
                  </Badge>
                </div>
                <p className="text-gray-500 font-medium text-xs sm:text-sm">
                  {pet.breed || 'Mixed breed'} • {pet.gender}
                </p>
                {pet.microchip_id && (
                  <div className="mt-1.5 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-50 text-orange-800 border border-orange-200 max-w-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse shrink-0" />
                    <span className="truncate">Microchip ID: <span className="font-mono font-bold">{pet.microchip_id}</span></span>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-2 pb-1 w-full sm:w-auto">
              <Link to={createPageUrl(`PetQr?id=${pet.id}`)} className="flex-1 sm:flex-initial">
                <Button variant="outline" className="w-full gap-1.5 text-xs sm:text-sm h-9 sm:h-10 border-gray-300 hover:border-orange-200 hover:bg-orange-50 hover:text-orange-600">
                  <QrCode className="w-4 h-4" />
                  QR Code
                </Button>
              </Link>
              <Link to={createPageUrl(`EditPet?id=${pet.id}`)} className="flex-1 sm:flex-initial">
                <Button variant="outline" className="w-full gap-1.5 text-xs sm:text-sm h-9 sm:h-10 border-gray-300 hover:border-orange-200 hover:bg-orange-50 hover:text-orange-600">
                  <Edit className="w-4 h-4" />
                  Edit
                </Button>
              </Link>
              <Link to={createPageUrl(`BookAppointment?petId=${pet.id}`)} className="flex-1 sm:flex-initial">
                <Button className="w-full gap-1.5 text-xs sm:text-sm h-9 sm:h-10 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-sm shadow-orange-100">
                  <Calendar className="w-4 h-4" />
                  Book
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4">
        <Card className="p-3 sm:p-4 text-center border-0 shadow-sm min-w-0">
          <Clock className="w-6 h-6 sm:w-8 sm:h-8 mx-auto text-orange-500 mb-1.5" />
          <p className="text-lg sm:text-2xl font-bold text-gray-900 truncate">{calculateAge(pet.date_of_birth)}</p>
          <p className="text-xs sm:text-sm text-gray-500">Age</p>
        </Card>
        <Card className="p-3 sm:p-4 text-center border-0 shadow-sm min-w-0">
          <Weight className="w-6 h-6 sm:w-8 sm:h-8 mx-auto text-blue-500 mb-1.5" />
          <p className="text-lg sm:text-2xl font-bold text-gray-900 truncate">{pet.weight || '-'} kg</p>
          <p className="text-xs sm:text-sm text-gray-500">Weight</p>
        </Card>
        <Card className="p-3 sm:p-4 text-center border-0 shadow-sm min-w-0">
          <Syringe className="w-6 h-6 sm:w-8 sm:h-8 mx-auto text-purple-500 mb-1.5" />
          <p className="text-lg sm:text-2xl font-bold text-gray-900 truncate">{vaccinations.length}</p>
          <p className="text-xs sm:text-sm text-gray-500">Vaccinations</p>
        </Card>
        <Card className="p-3 sm:p-4 text-center border-0 shadow-sm min-w-0">
          <Calendar className="w-6 h-6 sm:w-8 sm:h-8 mx-auto text-orange-500 mb-1.5" />
          <p className="text-lg sm:text-2xl font-bold text-gray-900 truncate">{appointments.length}</p>
          <p className="text-xs sm:text-sm text-gray-500">Appointments</p>
        </Card>
      </div>

      {/* Alerts */}
      {(pet.allergies?.length > 0 || pet.medical_conditions?.length > 0) && (
        <Card className="border-l-4 border-l-amber-500 bg-amber-50/50 border-amber-100">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
              <div className="space-y-2">
                {pet.allergies?.length > 0 && (
                  <div>
                    <p className="font-medium text-gray-900">Allergies:</p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {pet.allergies.map((allergy, i) => (
                        <Badge key={i} variant="outline" className="bg-red-100 text-red-700 border-red-200 max-w-full">
                          <span className="truncate max-w-[260px] sm:max-w-md break-all" title={allergy}>
                            {allergy}
                          </span>
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {pet.medical_conditions?.length > 0 && (
                  <div>
                    <p className="font-medium text-gray-900">Medical Conditions:</p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {pet.medical_conditions.map((condition, i) => (
                        <Badge key={i} variant="outline" className="bg-amber-100 text-amber-700 border-amber-200 max-w-full">
                          <span className="truncate max-w-[260px] sm:max-w-md break-all" title={condition}>
                            {condition}
                          </span>
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs defaultValue="vaccinations" className="space-y-4">
        <TabsList className="w-full flex justify-start items-center overflow-x-auto h-auto p-1 bg-gray-100 gap-1 scrollbar-none rounded-xl">
          <TabsTrigger value="vaccinations" className="gap-1.5 whitespace-nowrap px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm flex-shrink-0">
            <Syringe className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            Vaccinations
          </TabsTrigger>
          <TabsTrigger value="medications" className="gap-1.5 whitespace-nowrap px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm flex-shrink-0">
            <Pill className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            Medications
          </TabsTrigger>
          <TabsTrigger value="records" className="gap-1.5 whitespace-nowrap px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm flex-shrink-0">
            <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            Records
          </TabsTrigger>
          <TabsTrigger value="grooming" className="gap-1.5 whitespace-nowrap px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm flex-shrink-0">
            <Scissors className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            Grooming
          </TabsTrigger>
          <TabsTrigger value="appointments" className="gap-1.5 whitespace-nowrap px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm flex-shrink-0">
            <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="vaccinations">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Vaccination History</CardTitle>
            </CardHeader>
            <CardContent>
              {vaccinations.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No vaccination records yet</p>
              ) : (
                <div className="space-y-3">
                  {vaccinations.map((vax) => {
                    const isLatest = !vaccinations.some(v => 
                      v.id !== vax.id &&
                      v.vaccine_name?.trim().toLowerCase() === vax.vaccine_name?.trim().toLowerCase() && 
                      (
                        v.date_administered > vax.date_administered || 
                        (v.date_administered === vax.date_administered && (v.next_due_date || '') > (vax.next_due_date || '')) ||
                        (v.date_administered === vax.date_administered && (v.next_due_date || '') === (vax.next_due_date || '') && v.id > vax.id)
                      )
                    );
                    return (
                    <div key={vax.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3 sm:p-4 bg-gray-50 rounded-xl min-w-0">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center shrink-0">
                          <Syringe className="w-5 h-5 text-purple-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-gray-900 break-words text-sm sm:text-base">{vax.vaccine_name}</p>
                          <p className="text-xs sm:text-sm text-gray-500">
                            {format(new Date(vax.date_administered + 'T00:00:00'), 'MMM d, yyyy')}
                            {formatDoctorName(vax.administered_by) && (
                              <span className="text-orange-700 font-medium ml-2">
                                • Added by: {formatDoctorName(vax.administered_by)}
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                      {vax.next_due_date && isLatest && (
                        <Badge variant="outline" className={cn("w-fit self-start sm:self-center shrink-0 text-xs", isBefore(new Date(vax.next_due_date + 'T00:00:00'), new Date()) ? "bg-red-50 text-red-700 border-red-200" : "bg-blue-50 text-blue-700 border-blue-200")}>
                          {isBefore(new Date(vax.next_due_date + 'T00:00:00'), new Date()) ? "Overdue:" : "Next dose:"} {format(new Date(vax.next_due_date + 'T00:00:00'), 'MMM d, yyyy')}
                        </Badge>
                      )}
                      {!vax.next_due_date && isLatest && (
                        <Badge variant="outline" className="w-fit self-start sm:self-center shrink-0 text-xs bg-green-50 text-green-700 border-green-200">
                          Up to date
                        </Badge>
                      )}
                      {!isLatest && (
                        <Badge variant="outline" className="w-fit self-start sm:self-center shrink-0 text-xs bg-gray-50 text-gray-500 border-gray-200">
                          Renewed
                        </Badge>
                      )}
                    </div>
                  )})}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="medications">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Current Medications</CardTitle>
            </CardHeader>
            <CardContent>
              {medications.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No medications</p>
              ) : (
                <div className="space-y-3">
                  {medications.map((med) => {
                    const isStillActive = med.is_active && (!med.end_date || new Date(med.end_date + 'T00:00:00') >= new Date());
                    return (
                    <div key={med.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3 sm:p-4 bg-gray-50 rounded-xl min-w-0">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${isStillActive ? 'bg-green-100' : 'bg-gray-100'}`}>
                          <Pill className={`w-5 h-5 ${isStillActive ? 'text-green-600' : 'text-gray-400'}`} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-gray-900 break-words text-sm sm:text-base">{med.name}</p>
                          <p className="text-xs sm:text-sm text-gray-500">
                            {med.quantity ? `Qty: ${med.quantity} • ` : ''}{med.dosage} • {med.frequency}
                            {formatDoctorName(med.prescribed_by) && (
                              <span className="text-orange-700 font-medium ml-2">
                                • Prescribed by: {formatDoctorName(med.prescribed_by)}
                              </span>
                            )}
                          </p>
                          {(med.start_date || med.end_date) && (
                            <p className="text-xs text-gray-500 mt-1 flex items-center gap-1.5 flex-wrap">
                              <Calendar className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                              <span>
                                {med.start_date ? `Start: ${format(new Date(med.start_date + 'T00:00:00'), 'MMM d, yyyy')}` : ''}
                                {med.start_date && med.end_date ? ' — ' : ''}
                                {med.end_date ? `End: ${format(new Date(med.end_date + 'T00:00:00'), 'MMM d, yyyy')}` : ''}
                              </span>
                            </p>
                          )}
                          {med.notes && (
                            <p className="text-xs text-gray-400 italic mt-0.5 break-words">
                              Note: {med.notes}
                            </p>
                          )}
                        </div>
                      </div>
                      <Badge variant="outline" className={cn("w-fit self-start sm:self-center shrink-0 text-xs", isStillActive ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-500')}>
                        {isStillActive ? 'Active' : 'Completed'}
                      </Badge>
                    </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="records">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Health Records</CardTitle>
            </CardHeader>
            <CardContent>
              {healthRecords.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No health records yet</p>
              ) : (
                <div className="space-y-3">
                  {healthRecords.map((record) => (
                    <div key={record.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3 sm:p-4 bg-gray-50 rounded-xl min-w-0">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                          <FileText className="w-5 h-5 text-orange-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-gray-900 break-words text-sm sm:text-base">{record.title}</p>
                          <p className="text-xs sm:text-sm text-gray-500">
                            {record.record_type.replace('_', ' ')} • {format(new Date(record.date + 'T00:00:00'), 'MMM d, yyyy')}
                            {formatDoctorName(record.vet_name, record.vet_email) && (
                              <span className="text-orange-700 font-medium ml-2">
                                • Added by: {formatDoctorName(record.vet_name, record.vet_email)}
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                      {(() => {
                        const attachments = parseAttachments(record);
                        if (attachments.length === 0) return null;
                        if (attachments.length === 1) {
                          return (
                            <a href={attachments[0]} target="_blank" rel="noopener noreferrer" className="self-start sm:self-center shrink-0">
                              <Button variant="outline" size="sm" className="gap-1.5 h-8 text-xs">
                                <ExternalLink className="w-3.5 h-3.5" />
                                View
                              </Button>
                            </a>
                          );
                        }
                        return (
                          <div className="flex flex-wrap items-center gap-1.5 self-start sm:self-center shrink-0 max-w-xs">
                            {attachments.map((url, i) => (
                              <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                                <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5 px-2.5">
                                  <ExternalLink className="w-3 h-3" />
                                  Attachment {i + 1}
                                </Button>
                              </a>
                            ))}
                          </div>
                        );
                      })()}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="grooming">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Grooming History</CardTitle>
            </CardHeader>
            <CardContent>
              {groomingRecords.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No grooming records yet</p>
              ) : (
                <div className="space-y-3">
                  {groomingRecords.map((record) => (
                    <div key={record.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3 sm:p-4 bg-gray-50 rounded-xl min-w-0">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-10 h-10 rounded-lg bg-pink-100 flex items-center justify-center shrink-0">
                          <Scissors className="w-5 h-5 text-pink-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-gray-900 capitalize text-sm sm:text-base truncate">{record.grooming_type.replace(/_/g, ' ')}</p>
                          <p className="text-xs sm:text-sm text-gray-500">
                            {format(new Date(record.date + 'T00:00:00'), 'MMM d, yyyy')}
                            {record.groomer_name && (
                              <span className="text-orange-700 font-medium ml-2">
                                • Handled by: {formatDoctorName(record.groomer_name) || record.groomer_name}
                              </span>
                            )}
                          </p>
                          {record.coat_style_notes && (
                            <p className="text-xs sm:text-sm text-gray-600 mt-1 break-words">{record.coat_style_notes}</p>
                          )}
                        </div>
                      </div>
                      {record.coat_condition_before && (
                        <div className="self-start sm:self-center shrink-0">
                          <Badge variant="outline" className="bg-pink-50 text-pink-700 border-pink-200 capitalize text-xs">
                            {record.coat_condition_before.replace(/_/g, ' ')}
                          </Badge>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appointments">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Appointment History</CardTitle>
            </CardHeader>
            <CardContent>
              {appointments.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No appointments yet</p>
              ) : (
                <div className="space-y-3">
                  {appointments.map((apt) => {
                    const status = getAppointmentStatus(apt);
                    return (
                    <div key={apt.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3 sm:p-4 bg-gray-50 rounded-xl min-w-0">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                          <Calendar className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-gray-900 capitalize text-sm sm:text-base truncate">{apt.type.replace('_', ' ')}</p>
                          <p className="text-xs sm:text-sm text-gray-500">
                            {format(new Date(apt.date + 'T00:00:00'), 'MMM d, yyyy')} at {apt.time}
                            {formatDoctorName(apt.vet_name, apt.vet_email) && (
                              <span className="text-orange-700 font-medium ml-2">
                                • Doctor: {formatDoctorName(apt.vet_name, apt.vet_email)}
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="self-start sm:self-center shrink-0">
                        <Badge 
                          variant="outline" 
                          className={cn(
                            "text-xs capitalize",
                            status === 'completed' ? 'bg-green-50 text-green-700 border-green-200' :
                            status === 'cancelled' ? 'bg-red-50 text-red-700 border-red-200' :
                            status === 'confirmed' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                            status === 'expired' ? 'bg-gray-50 text-gray-700 border-gray-200' :
                            'bg-amber-50 text-amber-700 border-amber-200'
                          )}
                        >
                          {status}
                        </Badge>
                      </div>
                    </div>
                  )})}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Delete Section */}
      <Card className="border-red-200 bg-red-50/30">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-red-700">Danger Zone</p>
              <p className="text-sm text-red-600">Remove this pet from your account</p>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-100">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Remove Pet
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently remove {pet.name} and all associated records. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogAction
                    onClick={() => deleteMutation.mutate()}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Remove
                  </AlertDialogAction>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <OwnerSidebar user={user}>
      {content}
    </OwnerSidebar>
  );
}
