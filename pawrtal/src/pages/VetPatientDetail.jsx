import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import backgroundImg from '@/assets/background.png';
import { createPageUrl, getAppointmentStatus, formatDoctorName } from "@/utils";
import BackButton from '@/components/ui/BackButton';
import { api, userTypeToRole } from '@/api/apiClient';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
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
  User,
  Phone,
  Mail,
  Plus
} from 'lucide-react';
import { format, differenceInYears, differenceInMonths, isBefore } from 'date-fns';
import { cn } from "@/lib/utils";
import VetSidebar from '@/components/layout/VetSidebar';
import AdminSidebar from '@/components/layout/AdminSidebar';

const speciesIcons = {
  dog: Dog,
  cat: Cat,
  bird: Bird,
  rabbit: Rabbit,
  fish: Fish,
};

export default function VetPatientDetail() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const petId = urlParams.get('id');

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => api.auth.me(),
  });

  const { data: pet, isLoading: petLoading } = useQuery({
    queryKey: ['pet', petId],
    queryFn: () => api.entities.Pet.filter({ id: petId }),
    enabled: !!petId,
    select: (data) => data[0],
  });

  const { data: owner } = useQuery({
    queryKey: ['petOwner', pet?.owner_email],
    queryFn: () => api.entities.User.filter({ email: pet?.owner_email }),
    enabled: !!pet?.owner_email,
    select: (data) => data[0],
  });

  const { data: vaccinations = [] } = useQuery({
    queryKey: ['vaccinations', petId],
    queryFn: async () => {
      const data = await api.entities.Vaccination.filter({ pet_id: petId }, '-date_administered');
      return (data || []).sort((a, b) => {
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
      const data = await api.entities.Medication.filter({ pet_id: petId }, '-start_date');
      return (data || []).sort((a, b) => new Date(b.start_date || 0) - new Date(a.start_date || 0));
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
      const data = await api.entities.HealthRecord.filter({ pet_id: petId }, '-date');
      return (data || []).sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
    },
    enabled: !!petId,
  });

  const { data: groomingRecords = [] } = useQuery({
    queryKey: ['groomingRecords', petId],
    queryFn: async () => {
      const data = await api.entities.GroomingRecord.filter({ pet_id: petId }, '-date');
      return (data || []).sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
    },
    enabled: !!petId,
  });

  const calculateAge = (dob) => {
    if (!dob) return 'Unknown';
    const years = differenceInYears(new Date(), new Date(dob));
    const months = differenceInMonths(new Date(), new Date(dob)) % 12;
    if (years === 0) return `${months} month${months !== 1 ? 's' : ''}`;
    if (months === 0) return `${years} year${years !== 1 ? 's' : ''}`;
    return `${years}y ${months}m`;
  };

  const isClinicAdmin = userTypeToRole(user?.user_type) === 'admin';
  const Sidebar = isClinicAdmin ? AdminSidebar : VetSidebar;

  if (petLoading) {
    return (
      <Sidebar user={user} currentUser={user}>
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </Sidebar>
    );
  }

  if (!pet) {
    return (
      <Sidebar user={user} currentUser={user}>
        <div className="p-6 text-center">
          <p className="text-gray-500">Patient not found</p>
          <Link to={isClinicAdmin ? createPageUrl('AdminPatients') : createPageUrl('Patients')}>
            <Button className="mt-4">Back to Patients</Button>
          </Link>
        </div>
      </Sidebar>
    );
  }

  const Icon = speciesIcons[pet.species] || Dog;

  return (
    <Sidebar user={user} currentUser={user}>
    <div className="p-3.5 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-4 sm:space-y-6 w-full max-w-full min-w-0 overflow-x-hidden">
      <BackButton
        onClick={() => navigate(isClinicAdmin ? createPageUrl('AdminPatients') : createPageUrl('Patients'))}
        className="mb-2"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 min-w-0">
        {/* Patient Info */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6 min-w-0">
          <Card className="border border-gray-100 shadow-md overflow-hidden bg-white">
            <div className="relative h-28 sm:h-36 bg-teal-600 overflow-hidden">
              <img 
                src={backgroundImg} 
                alt="Pawrtal Pattern" 
                className="w-full h-full object-cover opacity-20 mix-blend-overlay pointer-events-none select-none" 
              />
            </div>
            <CardContent className="relative z-10 p-3.5 sm:p-6 pt-3">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 sm:gap-4">
                <div className="flex flex-col sm:flex-row sm:items-end gap-3 sm:gap-4 min-w-0">
                  <div className="relative z-20 -mt-12 sm:-mt-16 w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden bg-white border-4 border-white shadow-lg flex items-center justify-center shrink-0">
                    {pet.photo_url ? (
                      <img src={pet.photo_url} alt={pet.name} className="w-full h-full object-cover" />
                    ) : (
                      <Icon className="w-10 h-10 sm:w-12 sm:h-12 text-teal-400" />
                    )}
                  </div>
                  <div className="pb-1 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">{pet.name}</h1>
                      <Badge className="capitalize bg-teal-50 text-teal-700 border border-teal-200 text-xs">{pet.species}</Badge>
                    </div>
                    <p className="text-gray-500 text-xs sm:text-sm">{pet.breed || 'Mixed breed'} • {pet.gender} • {calculateAge(pet.date_of_birth)}</p>
                    {pet.microchip_id && (
                      <div className="mt-1.5 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-teal-50 text-teal-800 border border-teal-200 max-w-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse shrink-0" />
                        <span className="truncate">Microchip ID: <span className="font-mono font-bold">{pet.microchip_id}</span></span>
                      </div>
                    )}
                  </div>
                </div>
                {!isClinicAdmin && (
                  <Link to={createPageUrl(`VetAddRecord?petId=${pet.id}`)} className="w-full sm:w-auto">
                    <Button className="w-full sm:w-auto bg-teal-600 hover:bg-teal-700 text-white gap-2 text-xs sm:text-sm h-9 sm:h-10">
                      <Plus className="w-4 h-4" />
                      Add Record
                    </Button>
                  </Link>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2 sm:gap-4 mt-4 sm:mt-6">
                <div className="p-2 sm:p-3 bg-gray-50 rounded-xl text-center min-w-0">
                  <Clock className="w-4 h-4 sm:w-5 sm:h-5 mx-auto text-teal-500 mb-1" />
                  <p className="text-xs sm:text-sm text-gray-500">Age</p>
                  <p className="font-semibold text-xs sm:text-base truncate">{calculateAge(pet.date_of_birth)}</p>
                </div>
                <div className="p-2 sm:p-3 bg-gray-50 rounded-xl text-center min-w-0">
                  <Weight className="w-4 h-4 sm:w-5 sm:h-5 mx-auto text-blue-500 mb-1" />
                  <p className="text-xs sm:text-sm text-gray-500">Weight</p>
                  <p className="font-semibold text-xs sm:text-base truncate">{pet.weight || '-'} kg</p>
                </div>
                <div className="p-2 sm:p-3 bg-gray-50 rounded-xl text-center min-w-0">
                  <Calendar className="w-4 h-4 sm:w-5 sm:h-5 mx-auto text-purple-500 mb-1" />
                  <p className="text-xs sm:text-sm text-gray-500">Visits</p>
                  <p className="font-semibold text-xs sm:text-base truncate">{appointments.filter(a => a.status === 'completed').length}</p>
                </div>
              </div>

              {(pet.allergies?.length > 0 || pet.medical_conditions?.length > 0) && (
                <div className="mt-4 p-3 sm:p-4 bg-amber-50 rounded-xl border border-amber-200">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600 shrink-0" />
                    <p className="font-semibold text-amber-800 text-xs sm:text-sm">Medical Alerts</p>
                  </div>
                  <div className="flex flex-wrap gap-1.5 sm:gap-2">
                    {pet.allergies?.map((allergy, i) => (
                      <Badge key={i} className="bg-red-100 text-red-700 max-w-full text-xs">
                        <span className="truncate max-w-[240px] sm:max-w-md break-all" title={allergy}>
                          Allergy: {allergy}
                        </span>
                      </Badge>
                    ))}
                    {pet.medical_conditions?.map((condition, i) => (
                      <Badge key={i} className="bg-amber-100 text-amber-700 max-w-full text-xs">
                        <span className="truncate max-w-[240px] sm:max-w-md break-all" title={condition}>
                          {condition}
                        </span>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Tabs defaultValue="records" className="space-y-4">
            <TabsList className="w-full flex justify-start items-center overflow-x-auto h-auto p-1 bg-gray-100 gap-1 scrollbar-none rounded-xl">
              <TabsTrigger value="records" className="whitespace-nowrap px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm flex-shrink-0">Records ({healthRecords.length})</TabsTrigger>
              <TabsTrigger value="vaccinations" className="whitespace-nowrap px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm flex-shrink-0">Vaccinations ({vaccinations.length})</TabsTrigger>
              <TabsTrigger value="medications" className="whitespace-nowrap px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm flex-shrink-0">Medications ({medications.length})</TabsTrigger>
              <TabsTrigger value="appointments" className="whitespace-nowrap px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm flex-shrink-0">History ({appointments.length})</TabsTrigger>
              <TabsTrigger value="grooming" className="whitespace-nowrap px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm flex-shrink-0">Grooming ({groomingRecords.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="records">
              {healthRecords.length === 0 ? (
                <Card className="p-8 text-center border-dashed border-2 border-gray-300 bg-white">
                  <FileText className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500">No health records yet</p>
                </Card>
              ) : (
                <div className="space-y-3">
                  {healthRecords.map((record) => (
                    <Card key={record.id} className="border-0 shadow-sm">
                      <CardContent className="p-3.5 sm:p-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-4">
                          <div className="min-w-0 flex-1">
                            <h4 className="font-semibold text-gray-900 text-sm sm:text-base break-words">{record.title}</h4>
                            <p className="text-xs sm:text-sm text-gray-500">
                              {record.record_type.replace('_', ' ')} • {format(new Date(record.date + 'T00:00:00'), 'MMM d, yyyy')}
                              {formatDoctorName(record.vet_name, record.vet_email) && (
                                <span className="text-teal-700 font-medium ml-2">
                                  • Added by: {formatDoctorName(record.vet_name, record.vet_email)}
                                </span>
                              )}
                            </p>
                          </div>
                          <Badge variant="outline" className="w-fit self-start sm:self-center shrink-0 text-xs">{record.is_visible_to_owner ? 'Visible' : 'Hidden'}</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="vaccinations">
              {vaccinations.length === 0 ? (
                <Card className="p-8 text-center border-dashed border-2 border-gray-300 bg-white">
                  <Syringe className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500">No vaccinations recorded</p>
                </Card>
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
                    <Card key={vax.id} className="border-0 shadow-sm">
                      <CardContent className="p-3.5 sm:p-4">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2.5 sm:gap-4">
                          <div className="min-w-0 flex-1">
                            <h4 className="font-semibold text-gray-900 text-sm sm:text-base break-words">{vax.vaccine_name}</h4>
                            <div className="text-xs sm:text-sm text-gray-500 mt-0.5">
                              <p>
                                {format(new Date(vax.date_administered + 'T00:00:00'), 'MMM d, yyyy')}
                                {formatDoctorName(vax.administered_by) && (
                                  <span className="text-gray-500 font-medium ml-2">
                                    • Administered by: {formatDoctorName(vax.administered_by)}
                                  </span>
                                )}
                              </p>
                              {vax.batch_number && <p className="break-all mt-0.5 text-gray-400 text-xs">Batch: {vax.batch_number}</p>}
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 self-start sm:self-center shrink-0 flex-wrap">
                            {vax.next_due_date && isLatest && (
                              <Badge 
                                variant="outline"
                                className={cn(
                                  "w-fit text-xs",
                                  isBefore(new Date(vax.next_due_date + 'T00:00:00'), new Date())
                                    ? 'bg-red-50 text-red-700 border-red-200'
                                    : 'bg-blue-50 text-blue-700 border-blue-200'
                                )}
                              >
                                {isBefore(new Date(vax.next_due_date + 'T00:00:00'), new Date()) ? 'Overdue:' : 'Next dose:'} {format(new Date(vax.next_due_date + 'T00:00:00'), 'MMM d, yyyy')}
                              </Badge>
                            )}
                            {!vax.next_due_date && isLatest && (
                              <Badge variant="outline" className="w-fit text-xs bg-green-50 text-green-700 border-green-200">
                                Up to date
                              </Badge>
                            )}
                            {!isLatest && (
                              <Badge variant="outline" className="w-fit text-xs bg-gray-50 text-gray-500 border-gray-200">
                                Renewed
                              </Badge>
                            )}
                            <Badge className={cn("text-xs", vax.is_visible_to_owner !== false ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500')}>
                              {vax.is_visible_to_owner !== false ? 'Visible' : 'Hidden'}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )})}
                </div>
              )}
            </TabsContent>

            <TabsContent value="medications">
              {medications.length === 0 ? (
                <Card className="p-8 text-center border-dashed border-2 border-gray-300 bg-white">
                  <Pill className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500">No medications prescribed</p>
                </Card>
              ) : (
                <div className="space-y-3">
                  {medications.map((med) => {
                    const isStillActive = med.is_active && (!med.end_date || new Date(med.end_date + 'T00:00:00') >= new Date());
                    return (
                    <Card key={med.id} className="border-0 shadow-sm">
                      <CardContent className="p-3.5 sm:p-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-4">
                          <div className="min-w-0 flex-1">
                            <h4 className="font-semibold text-gray-900 text-sm sm:text-base break-words">{med.name}</h4>
                            <p className="text-xs sm:text-sm text-gray-500">
                              {med.quantity ? `Qty: ${med.quantity} • ` : ''}{med.dosage} • {med.frequency}
                              {formatDoctorName(med.prescribed_by) && (
                                <span className="text-teal-700 font-medium ml-2">
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
                          <div className="flex items-center gap-1.5 self-start sm:self-center shrink-0 flex-wrap">
                            <Badge className={cn("w-fit text-xs", isStillActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500')}>
                              {isStillActive ? 'Active' : 'Completed'}
                            </Badge>
                            <Badge className={cn("text-xs", med.is_visible_to_owner !== false ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500')}>
                              {med.is_visible_to_owner !== false ? 'Visible' : 'Hidden'}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            <TabsContent value="appointments">
              {appointments.length === 0 ? (
                <Card className="p-8 text-center border-dashed border-2 border-gray-300 bg-white">
                  <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500">No appointment history</p>
                </Card>
              ) : (
                <div className="space-y-3">
                  {appointments.map((apt) => {
                    const status = getAppointmentStatus(apt);
                    return (
                    <Card key={apt.id} className="border-0 shadow-sm">
                      <CardContent className="p-3.5 sm:p-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-4">
                          <div className="min-w-0 flex-1">
                            <h4 className="font-semibold text-gray-900 text-sm sm:text-base capitalize truncate">{apt.type.replace('_', ' ')}</h4>
                            <p className="text-xs sm:text-sm text-gray-500">
                              {format(new Date(apt.date + 'T00:00:00'), 'MMM d, yyyy')} at {apt.time}
                              {formatDoctorName(apt.vet_name, apt.vet_email) && (
                                <span className="text-teal-700 font-medium ml-2">
                                  • Doctor: {formatDoctorName(apt.vet_name, apt.vet_email)}
                                </span>
                              )}
                            </p>
                          </div>
                          <Badge variant="outline" className={cn(
                            "w-fit self-start sm:self-center shrink-0 text-xs",
                            status === 'completed' ? 'bg-green-50 text-green-700' :
                            status === 'cancelled' ? 'bg-red-50 text-red-700' :
                            status === 'expired' ? 'bg-gray-50 text-gray-700' :
                            'bg-blue-50 text-blue-700'
                          )}>
                            {status}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            <TabsContent value="grooming">
              {groomingRecords.length === 0 ? (
                <Card className="p-8 text-center border-dashed border-2 border-gray-300 bg-white">
                  <Scissors className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500">No grooming records</p>
                </Card>
              ) : (
                <div className="space-y-3">
                  {groomingRecords.map((record) => (
                    <Card key={record.id} className="border-0 shadow-sm">
                      <CardContent className="p-3.5 sm:p-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-4">
                          <div className="min-w-0 flex-1">
                            <h4 className="font-semibold text-gray-900 text-sm sm:text-base capitalize truncate">{record.grooming_type.replace(/_/g, ' ')}</h4>
                            <p className="text-xs sm:text-sm text-gray-500">
                              {format(new Date(record.date + 'T00:00:00'), 'MMM d, yyyy')}
                              {record.groomer_name && (
                                <span className="text-teal-700 font-medium ml-2">
                                  • Handled by: {formatDoctorName(record.groomer_name) || record.groomer_name}
                                </span>
                              )}
                            </p>
                            {record.coat_style_notes && (
                              <p className="text-xs sm:text-sm text-gray-600 mt-1 break-words">{record.coat_style_notes}</p>
                            )}
                            {record.observations && (
                              <p className="text-xs sm:text-sm text-gray-500 mt-1 break-words">{record.observations}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 self-start sm:self-center shrink-0 flex-wrap">
                            {record.coat_condition_before && (
                              <Badge variant="outline" className="capitalize text-xs">{record.coat_condition_before.replace(/_/g, ' ')}</Badge>
                            )}
                            <Badge className={cn("text-xs", record.is_visible_to_owner ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500')}>
                              {record.is_visible_to_owner ? 'Visible' : 'Hidden'}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Owner Info Sidebar */}
        <div className="min-w-0">
          <Card className="border-0 shadow-sm sticky top-6">
            <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-3">
              <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                <User className="w-5 h-5 text-teal-600 shrink-0" />
                Owner Information
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-2 sm:pt-3 space-y-3 sm:space-y-4">
              <div>
                <p className="text-xs sm:text-sm text-gray-500">Name</p>
                <p className="font-medium text-sm sm:text-base">{owner?.full_name || 'Not available'}</p>
              </div>
              {owner?.email && (
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <a href={`mailto:${owner.email}`} className="font-medium text-teal-600 flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    {owner.email}
                  </a>
                </div>
              )}
              {owner?.phone && (
                <div>
                  <p className="text-sm text-gray-500">Phone</p>
                  <a href={`tel:${owner.phone}`} className="font-medium text-teal-600 flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    {owner.phone}
                  </a>
                </div>
              )}
              {owner?.address && (
                <div>
                  <p className="text-sm text-gray-500">Address</p>
                  <p className="font-medium">{owner.address}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
    </Sidebar>
  );
}