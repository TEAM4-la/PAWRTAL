import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from "@/utils";
import { base44 } from '@/api/base44Client';
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
  FileText,
  Clock,
  Weight,
  Dog,
  Cat,
  Bird,
  Rabbit,
  Fish,
  AlertTriangle,
  Trash2
} from 'lucide-react';
import { format, differenceInYears, differenceInMonths } from 'date-fns';
import { toast } from "sonner";
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

const speciesIcons = {
  dog: Dog,
  cat: Cat,
  bird: Bird,
  rabbit: Rabbit,
  fish: Fish,
};

export default function PetProfile() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const petId = urlParams.get('id');

  const { data: pet, isLoading: petLoading } = useQuery({
    queryKey: ['pet', petId],
    queryFn: () => base44.entities.Pet.filter({ id: petId }),
    enabled: !!petId,
    select: (data) => data[0],
  });

  const { data: vaccinations = [] } = useQuery({
    queryKey: ['vaccinations', petId],
    queryFn: () => base44.entities.Vaccination.filter({ pet_id: petId }, '-date_administered'),
    enabled: !!petId,
  });

  const { data: medications = [] } = useQuery({
    queryKey: ['medications', petId],
    queryFn: () => base44.entities.Medication.filter({ pet_id: petId }),
    enabled: !!petId,
  });

  const { data: appointments = [] } = useQuery({
    queryKey: ['petAppointments', petId],
    queryFn: () => base44.entities.Appointment.filter({ pet_id: petId }, '-date'),
    enabled: !!petId,
  });

  const { data: healthRecords = [] } = useQuery({
    queryKey: ['healthRecords', petId],
    queryFn: () => base44.entities.HealthRecord.filter({ pet_id: petId, is_visible_to_owner: true }, '-date'),
    enabled: !!petId,
  });

  const deleteMutation = useMutation({
    mutationFn: () => base44.entities.Pet.delete(petId),
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!pet) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-500">Pet not found</p>
        <Link to={createPageUrl('MyPets')}>
          <Button className="mt-4">Back to My Pets</Button>
        </Link>
      </div>
    );
  }

  const Icon = speciesIcons[pet.species] || Dog;
  const activeMeds = medications.filter(m => m.is_active);

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      <Button
        variant="ghost"
        onClick={() => navigate(-1)}
        className="gap-2 text-gray-600"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </Button>

      {/* Header Card */}
      <Card className="overflow-hidden border-0 shadow-lg">
        <div className="relative h-48 bg-gradient-to-br from-teal-400 via-teal-500 to-orange-400">
          {pet.photo_url && (
            <img src={pet.photo_url} alt={pet.name} className="w-full h-full object-cover opacity-30 absolute inset-0" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        </div>
        
        <div className="relative px-6 pb-6">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-16">
            <div className="w-32 h-32 rounded-2xl overflow-hidden bg-white border-4 border-white shadow-lg flex items-center justify-center">
              {pet.photo_url ? (
                <img src={pet.photo_url} alt={pet.name} className="w-full h-full object-cover" />
              ) : (
                <Icon className="w-16 h-16 text-teal-300" />
              )}
            </div>
            
            <div className="flex-1 sm:pb-2">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1 className="text-3xl font-bold text-gray-900">{pet.name}</h1>
                <Badge className="capitalize bg-teal-100 text-teal-700">{pet.species}</Badge>
              </div>
              <p className="text-gray-600">{pet.breed || 'Mixed breed'} • {pet.gender}</p>
            </div>

            <div className="flex gap-2 sm:pb-2">
              <Link to={createPageUrl(`PetQR?id=${pet.id}`)}>
                <Button variant="outline" className="gap-2">
                  <QrCode className="w-4 h-4" />
                  QR Code
                </Button>
              </Link>
              <Link to={createPageUrl(`EditPet?id=${pet.id}`)}>
                <Button variant="outline" className="gap-2">
                  <Edit className="w-4 h-4" />
                  Edit
                </Button>
              </Link>
              <Link to={createPageUrl(`BookAppointment?petId=${pet.id}`)}>
                <Button className="gap-2 bg-teal-600 hover:bg-teal-700">
                  <Calendar className="w-4 h-4" />
                  Book
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </Card>

      {/* Stats Grid */}
      <div className="grid sm:grid-cols-4 gap-4">
        <Card className="p-4 text-center border-0 shadow-sm">
          <Clock className="w-8 h-8 mx-auto text-teal-500 mb-2" />
          <p className="text-2xl font-bold text-gray-900">{calculateAge(pet.date_of_birth)}</p>
          <p className="text-sm text-gray-500">Age</p>
        </Card>
        <Card className="p-4 text-center border-0 shadow-sm">
          <Weight className="w-8 h-8 mx-auto text-blue-500 mb-2" />
          <p className="text-2xl font-bold text-gray-900">{pet.weight || '-'} kg</p>
          <p className="text-sm text-gray-500">Weight</p>
        </Card>
        <Card className="p-4 text-center border-0 shadow-sm">
          <Syringe className="w-8 h-8 mx-auto text-purple-500 mb-2" />
          <p className="text-2xl font-bold text-gray-900">{vaccinations.length}</p>
          <p className="text-sm text-gray-500">Vaccinations</p>
        </Card>
        <Card className="p-4 text-center border-0 shadow-sm">
          <Calendar className="w-8 h-8 mx-auto text-orange-500 mb-2" />
          <p className="text-2xl font-bold text-gray-900">{appointments.length}</p>
          <p className="text-sm text-gray-500">Appointments</p>
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
                        <Badge key={i} variant="outline" className="bg-red-100 text-red-700 border-red-200">
                          {allergy}
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
                        <Badge key={i} variant="outline" className="bg-amber-100 text-amber-700 border-amber-200">
                          {condition}
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
        <TabsList className="bg-gray-100 p-1">
          <TabsTrigger value="vaccinations" className="gap-2">
            <Syringe className="w-4 h-4" />
            Vaccinations
          </TabsTrigger>
          <TabsTrigger value="medications" className="gap-2">
            <Pill className="w-4 h-4" />
            Medications
          </TabsTrigger>
          <TabsTrigger value="records" className="gap-2">
            <FileText className="w-4 h-4" />
            Records
          </TabsTrigger>
          <TabsTrigger value="appointments" className="gap-2">
            <Calendar className="w-4 h-4" />
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
                  {vaccinations.map((vax) => (
                    <div key={vax.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                          <Syringe className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{vax.vaccine_name}</p>
                          <p className="text-sm text-gray-500">
                            {format(new Date(vax.date_administered), 'MMM d, yyyy')}
                          </p>
                        </div>
                      </div>
                      {vax.next_due_date && (
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                          Next: {format(new Date(vax.next_due_date), 'MMM d, yyyy')}
                        </Badge>
                      )}
                    </div>
                  ))}
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
                  {medications.map((med) => (
                    <div key={med.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${med.is_active ? 'bg-green-100' : 'bg-gray-100'}`}>
                          <Pill className={`w-5 h-5 ${med.is_active ? 'text-green-600' : 'text-gray-400'}`} />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{med.name}</p>
                          <p className="text-sm text-gray-500">{med.dosage} • {med.frequency}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className={med.is_active ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-500'}>
                        {med.is_active ? 'Active' : 'Completed'}
                      </Badge>
                    </div>
                  ))}
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
                    <div key={record.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-teal-100 flex items-center justify-center">
                          <FileText className="w-5 h-5 text-teal-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{record.title}</p>
                          <p className="text-sm text-gray-500">
                            {record.record_type.replace('_', ' ')} • {format(new Date(record.date), 'MMM d, yyyy')}
                          </p>
                        </div>
                      </div>
                      {record.file_url && (
                        <a href={record.file_url} target="_blank" rel="noopener noreferrer">
                          <Button variant="outline" size="sm">View</Button>
                        </a>
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
                  {appointments.map((apt) => (
                    <div key={apt.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                          <Calendar className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 capitalize">{apt.type.replace('_', ' ')}</p>
                          <p className="text-sm text-gray-500">
                            {format(new Date(apt.date), 'MMM d, yyyy')} at {apt.time}
                          </p>
                        </div>
                      </div>
                      <Badge 
                        variant="outline" 
                        className={
                          apt.status === 'completed' ? 'bg-green-50 text-green-700 border-green-200' :
                          apt.status === 'cancelled' ? 'bg-red-50 text-red-700 border-red-200' :
                          apt.status === 'confirmed' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                          'bg-amber-50 text-amber-700 border-amber-200'
                        }
                      >
                        {apt.status}
                      </Badge>
                    </div>
                  ))}
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
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => deleteMutation.mutate()}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Remove
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}