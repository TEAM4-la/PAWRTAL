import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl, getAppointmentStatus } from "@/utils";
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
    queryFn: () => api.entities.Vaccination.filter({ pet_id: petId }, '-date_administered'),
    enabled: !!petId,
  });

  const { data: medications = [] } = useQuery({
    queryKey: ['medications', petId],
    queryFn: () => api.entities.Medication.filter({ pet_id: petId }),
    enabled: !!petId,
  });

  const { data: appointments = [] } = useQuery({
    queryKey: ['petAppointments', petId],
    queryFn: () => api.entities.Appointment.filter({ pet_id: petId }, '-date'),
    enabled: !!petId,
  });

  const { data: healthRecords = [] } = useQuery({
    queryKey: ['healthRecords', petId],
    queryFn: () => api.entities.HealthRecord.filter({ pet_id: petId }, '-date'),
    enabled: !!petId,
  });

  const { data: groomingRecords = [] } = useQuery({
    queryKey: ['groomingRecords', petId],
    queryFn: () => api.entities.GroomingRecord.filter({ pet_id: petId }, '-date'),
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
    <div className="p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      <Button
        variant="ghost"
        onClick={() => navigate(isClinicAdmin ? createPageUrl('AdminPatients') : createPageUrl('VetDashboard'))}
        className="gap-2 text-gray-600"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </Button>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Patient Info */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-0 shadow-lg overflow-hidden">
            <div className="h-32 bg-gradient-to-r from-teal-400 via-teal-500 to-orange-400" />
            <CardContent className="p-6 -mt-16">
              <div className="flex items-end gap-4">
                <div className="w-24 h-24 rounded-2xl overflow-hidden bg-white border-4 border-white shadow-lg flex items-center justify-center">
                  {pet.photo_url ? (
                    <img src={pet.photo_url} alt={pet.name} className="w-full h-full object-cover" />
                  ) : (
                    <Icon className="w-12 h-12 text-teal-300" />
                  )}
                </div>
                <div className="flex-1 pb-2">
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-bold text-gray-900">{pet.name}</h1>
                    <Badge className="capitalize bg-teal-100 text-teal-700">{pet.species}</Badge>
                  </div>
                  <p className="text-gray-500">{pet.breed || 'Mixed breed'} • {pet.gender} • {calculateAge(pet.date_of_birth)}</p>
                  {pet.microchip_id && (
                    <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-teal-50 text-teal-800 border border-teal-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" />
                      Microchip ID: <span className="font-mono font-bold">{pet.microchip_id}</span>
                    </div>
                  )}
                </div>
                {!isClinicAdmin && (
                  <Link to={createPageUrl(`VetAddRecord?petId=${pet.id}`)}>
                    <Button className="bg-teal-600 hover:bg-teal-700 text-white gap-2">
                      <Plus className="w-4 h-4" />
                      Add Record
                    </Button>
                  </Link>
                )}
              </div>

              <div className="grid grid-cols-3 gap-4 mt-6">
                <div className="p-3 bg-gray-50 rounded-xl text-center">
                  <Clock className="w-5 h-5 mx-auto text-teal-500 mb-1" />
                  <p className="text-sm text-gray-500">Age</p>
                  <p className="font-semibold">{calculateAge(pet.date_of_birth)}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl text-center">
                  <Weight className="w-5 h-5 mx-auto text-blue-500 mb-1" />
                  <p className="text-sm text-gray-500">Weight</p>
                  <p className="font-semibold">{pet.weight || '-'} kg</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl text-center">
                  <Calendar className="w-5 h-5 mx-auto text-purple-500 mb-1" />
                  <p className="text-sm text-gray-500">Visits</p>
                  <p className="font-semibold">{appointments.filter(a => a.status === 'completed').length}</p>
                </div>
              </div>

              {(pet.allergies?.length > 0 || pet.medical_conditions?.length > 0) && (
                <div className="mt-4 p-4 bg-amber-50 rounded-xl border border-amber-200">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-5 h-5 text-amber-600" />
                    <p className="font-semibold text-amber-800">Medical Alerts</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {pet.allergies?.map((allergy, i) => (
                      <Badge key={i} className="bg-red-100 text-red-700">Allergy: {allergy}</Badge>
                    ))}
                    {pet.medical_conditions?.map((condition, i) => (
                      <Badge key={i} className="bg-amber-100 text-amber-700">{condition}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Tabs defaultValue="records" className="space-y-4">
            <TabsList className="w-full flex overflow-x-auto h-auto p-1 bg-gray-100 gap-1 scrollbar-none">
              <TabsTrigger value="records" className="whitespace-nowrap px-4 py-2 flex-shrink-0">Records ({healthRecords.length})</TabsTrigger>
              <TabsTrigger value="vaccinations" className="whitespace-nowrap px-4 py-2 flex-shrink-0">Vaccinations ({vaccinations.length})</TabsTrigger>
              <TabsTrigger value="medications" className="whitespace-nowrap px-4 py-2 flex-shrink-0">Medications ({medications.length})</TabsTrigger>
              <TabsTrigger value="appointments" className="whitespace-nowrap px-4 py-2 flex-shrink-0">History ({appointments.length})</TabsTrigger>
              <TabsTrigger value="grooming" className="whitespace-nowrap px-4 py-2 flex-shrink-0">Grooming ({groomingRecords.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="records">
              {healthRecords.length === 0 ? (
                <Card className="p-8 text-center border-dashed border-2">
                  <FileText className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500">No health records yet</p>
                </Card>
              ) : (
                <div className="space-y-3">
                  {healthRecords.map((record) => (
                    <Card key={record.id} className="border-0 shadow-sm">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-semibold text-gray-900">{record.title}</h4>
                            <p className="text-sm text-gray-500">
                              {record.record_type.replace('_', ' ')} • {format(new Date(record.date + 'T00:00:00'), 'MMM d, yyyy')}
                            </p>
                          </div>
                          <Badge variant="outline">{record.is_visible_to_owner ? 'Visible' : 'Hidden'}</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="vaccinations">
              {vaccinations.length === 0 ? (
                <Card className="p-8 text-center border-dashed border-2">
                  <Syringe className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500">No vaccinations recorded</p>
                </Card>
              ) : (
                <div className="space-y-3">
                  {vaccinations.map((vax) => {
                    const isLatest = !vaccinations.some(v => 
                      v.vaccine_name.toLowerCase() === vax.vaccine_name.toLowerCase() && 
                      new Date(v.date_administered) > new Date(vax.date_administered + 'T00:00:00')
                    );
                    return (
                    <Card key={vax.id} className="border-0 shadow-sm">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0 flex-1">
                            <h4 className="font-semibold text-gray-900 truncate">{vax.vaccine_name}</h4>
                            <div className="text-sm text-gray-500 mt-0.5">
                              <p>{format(new Date(vax.date_administered + 'T00:00:00'), 'MMM d, yyyy')}</p>
                              {vax.batch_number && <p className="break-all mt-0.5 text-gray-400 text-xs">Batch: {vax.batch_number}</p>}
                            </div>
                          </div>
                          <div className="flex-shrink-0 mt-0.5">
                            {vax.next_due_date && isLatest && (
                              <Badge 
                                variant="outline"
                                className={
                                  isBefore(new Date(vax.next_due_date + 'T00:00:00'), new Date())
                                    ? 'bg-red-50 text-red-700 border-red-200'
                                    : 'bg-blue-50 text-blue-700 border-blue-200'
                                }
                              >
                                {isBefore(new Date(vax.next_due_date + 'T00:00:00'), new Date()) ? 'Overdue:' : 'Next dose:'} {format(new Date(vax.next_due_date + 'T00:00:00'), 'MMM d, yyyy')}
                              </Badge>
                            )}
                            {vax.next_due_date && !isLatest && (
                              <Badge variant="outline" className="bg-gray-50 text-gray-500 border-gray-200">
                                Renewed
                              </Badge>
                            )}
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
                <Card className="p-8 text-center border-dashed border-2">
                  <Pill className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500">No medications prescribed</p>
                </Card>
              ) : (
                <div className="space-y-3">
                  {medications.map((med) => {
                    const isStillActive = med.is_active && (!med.end_date || new Date(med.end_date + 'T00:00:00') >= new Date());
                    return (
                    <Card key={med.id} className="border-0 shadow-sm">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-semibold text-gray-900">{med.name}</h4>
                            <p className="text-sm text-gray-500">
                              {med.dosage} • {med.frequency}
                            </p>
                          </div>
                          <Badge className={isStillActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}>
                            {isStillActive ? 'Active' : 'Completed'}
                          </Badge>
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
                <Card className="p-8 text-center border-dashed border-2">
                  <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500">No appointment history</p>
                </Card>
              ) : (
                <div className="space-y-3">
                  {appointments.map((apt) => {
                    const status = getAppointmentStatus(apt);
                    return (
                    <Card key={apt.id} className="border-0 shadow-sm">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-semibold text-gray-900 capitalize">{apt.type.replace('_', ' ')}</h4>
                            <p className="text-sm text-gray-500">
                              {format(new Date(apt.date + 'T00:00:00'), 'MMM d, yyyy')} at {apt.time}
                            </p>
                          </div>
                          <Badge variant="outline" className={
                            status === 'completed' ? 'bg-green-50 text-green-700' :
                            status === 'cancelled' ? 'bg-red-50 text-red-700' :
                            status === 'expired' ? 'bg-gray-50 text-gray-700' :
                            'bg-blue-50 text-blue-700'
                          }>
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
                <Card className="p-8 text-center border-dashed border-2">
                  <Scissors className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500">No grooming records</p>
                </Card>
              ) : (
                <div className="space-y-3">
                  {groomingRecords.map((record) => (
                    <Card key={record.id} className="border-0 shadow-sm">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-semibold text-gray-900 capitalize">{record.grooming_type.replace(/_/g, ' ')}</h4>
                            <p className="text-sm text-gray-500">
                              {format(new Date(record.date + 'T00:00:00'), 'MMM d, yyyy')}
                              {record.groomer_name && ` • By: ${record.groomer_name}`}
                            </p>
                            {record.coat_style_notes && (
                              <p className="text-sm text-gray-600 mt-1">{record.coat_style_notes}</p>
                            )}
                            {record.observations && (
                              <p className="text-sm text-gray-500 mt-1">{record.observations}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {record.coat_condition_before && (
                              <Badge variant="outline" className="capitalize">{record.coat_condition_before.replace(/_/g, ' ')}</Badge>
                            )}
                            <Badge className={record.is_visible_to_owner ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}>
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
        <div>
          <Card className="border-0 shadow-sm sticky top-6">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="w-5 h-5 text-teal-600" />
                Owner Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Name</p>
                <p className="font-medium">{owner?.full_name || 'Not available'}</p>
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