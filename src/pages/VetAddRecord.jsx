import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from "@/utils";
import { api } from '@/api/apiClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeft, 
  Upload, 
  Loader2, 
  FileText,
  Syringe,
  Pill,
  Dog,
  Cat,
  Bird,
  Rabbit,
  Fish
} from 'lucide-react';
import { format, addMonths, addYears } from 'date-fns';
import { toast } from "sonner";
import VetSidebar from '@/components/layout/VetSidebar';

const recordTypes = [
  { value: 'lab_result', label: 'Lab Result' },
  { value: 'prescription', label: 'Prescription' },
  { value: 'diagnosis', label: 'Diagnosis' },
  { value: 'treatment', label: 'Treatment' },
  { value: 'surgery', label: 'Surgery' },
  { value: 'imaging', label: 'Imaging' },
  { value: 'dental', label: 'Dental' },
  { value: 'other', label: 'Other' },
];

const speciesIcons = {
  dog: Dog,
  cat: Cat,
  bird: Bird,
  rabbit: Rabbit,
  fish: Fish,
};

export default function VetAddRecord() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const preselectedPetId = urlParams.get('petId');
  
  const [activeTab, setActiveTab] = useState('record');
  const [isUploading, setIsUploading] = useState(false);

  const [recordForm, setRecordForm] = useState({
    pet_id: preselectedPetId || '',
    record_type: 'diagnosis',
    title: '',
    description: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    file_url: '',
    is_visible_to_owner: true,
  });

  const [vaccinationForm, setVaccinationForm] = useState({
    pet_id: preselectedPetId || '',
    vaccine_name: '',
    date_administered: format(new Date(), 'yyyy-MM-dd'),
    next_due_date: '',
    batch_number: '',
    notes: '',
  });

  const [medicationForm, setMedicationForm] = useState({
    pet_id: preselectedPetId || '',
    name: '',
    dosage: '',
    frequency: '',
    start_date: format(new Date(), 'yyyy-MM-dd'),
    end_date: '',
    notes: '',
    is_active: true,
  });

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => api.auth.me(),
  });

  const { data: pets = [] } = useQuery({
    queryKey: ['allPets'],
    queryFn: () => api.entities.Pet.list(),
    enabled: !!user,
  });

  const createRecordMutation = useMutation({
    mutationFn: (data) => api.entities.HealthRecord.create({
      ...data,
      vet_email: user?.email,
      vet_name: user?.full_name,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['allHealthRecords']);
      toast.success('Health record added!');
      navigate(createPageUrl('VetRecords'));
    }
  });

  const createVaccinationMutation = useMutation({
    mutationFn: (data) => api.entities.Vaccination.create({
      ...data,
      administered_by: user?.full_name,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['vaccinations']);
      toast.success('Vaccination recorded!');
      navigate(createPageUrl('VetRecords'));
    }
  });

  const createMedicationMutation = useMutation({
    mutationFn: (data) => api.entities.Medication.create({
      ...data,
      prescribed_by: user?.full_name,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['medications']);
      toast.success('Medication prescribed!');
      navigate(createPageUrl('VetRecords'));
    }
  });

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const { file_url } = await api.integrations.Core.UploadFile({ file });
      setRecordForm(prev => ({ ...prev, file_url }));
      toast.success('File uploaded!');
    } catch (error) {
      toast.error('Failed to upload file');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRecordSubmit = (e) => {
    e.preventDefault();
    if (!recordForm.pet_id || !recordForm.title) {
      toast.error('Please fill in required fields');
      return;
    }
    createRecordMutation.mutate(recordForm);
  };

  const handleVaccinationSubmit = (e) => {
    e.preventDefault();
    if (!vaccinationForm.pet_id || !vaccinationForm.vaccine_name) {
      toast.error('Please fill in required fields');
      return;
    }
    createVaccinationMutation.mutate(vaccinationForm);
  };

  const handleMedicationSubmit = (e) => {
    e.preventDefault();
    if (!medicationForm.pet_id || !medicationForm.name) {
      toast.error('Please fill in required fields');
      return;
    }
    createMedicationMutation.mutate(medicationForm);
  };

  const selectedPet = pets.find(p => p.id === (recordForm.pet_id || vaccinationForm.pet_id || medicationForm.pet_id));

  return (
    <VetSidebar user={user}>
    <div className="p-6 lg:p-8 max-w-3xl mx-auto">
      <Button
        variant="ghost"
        onClick={() => navigate(createPageUrl('VetDashboard'))}
        className="mb-6 gap-2 text-gray-600"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </Button>

      <Card className="border-0 shadow-lg">
        <CardHeader className="border-b bg-gradient-to-r from-teal-50 to-orange-50">
          <CardTitle className="text-2xl">Add Medical Record</CardTitle>
          <p className="text-gray-500">
            {selectedPet ? `Recording for ${selectedPet.name}` : 'Select a patient to add records'}
          </p>
        </CardHeader>

        <CardContent className="p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full grid grid-cols-3 mb-6">
              <TabsTrigger value="record" className="gap-2">
                <FileText className="w-4 h-4" />
                Health Record
              </TabsTrigger>
              <TabsTrigger value="vaccination" className="gap-2">
                <Syringe className="w-4 h-4" />
                Vaccination
              </TabsTrigger>
              <TabsTrigger value="medication" className="gap-2">
                <Pill className="w-4 h-4" />
                Medication
              </TabsTrigger>
            </TabsList>

            {/* Health Record Form */}
            <TabsContent value="record">
              <form onSubmit={handleRecordSubmit} className="space-y-5">
                <div>
                  <Label className="text-sm font-medium">Patient *</Label>
                  <Select value={recordForm.pet_id} onValueChange={(v) => setRecordForm({...recordForm, pet_id: v})}>
                    <SelectTrigger className="mt-1.5">
                      <SelectValue placeholder="Select patient" />
                    </SelectTrigger>
                    <SelectContent>
                      {pets.map(pet => (
                        <SelectItem key={pet.id} value={pet.id}>
                          {pet.name} ({pet.species})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Record Type</Label>
                    <Select value={recordForm.record_type} onValueChange={(v) => setRecordForm({...recordForm, record_type: v})}>
                      <SelectTrigger className="mt-1.5">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {recordTypes.map(type => (
                          <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Date</Label>
                    <Input
                      type="date"
                      value={recordForm.date}
                      onChange={(e) => setRecordForm({...recordForm, date: e.target.value})}
                      className="mt-1.5"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium">Title *</Label>
                  <Input
                    value={recordForm.title}
                    onChange={(e) => setRecordForm({...recordForm, title: e.target.value})}
                    placeholder="e.g., Annual checkup results"
                    className="mt-1.5"
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium">Description</Label>
                  <Textarea
                    value={recordForm.description}
                    onChange={(e) => setRecordForm({...recordForm, description: e.target.value})}
                    placeholder="Enter detailed notes..."
                    className="mt-1.5 min-h-[120px]"
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium">Attachment</Label>
                  <label className="mt-1.5 block">
                    <div className="flex items-center justify-center px-4 py-6 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-teal-300 transition-colors">
                      {isUploading ? (
                        <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                      ) : recordForm.file_url ? (
                        <span className="text-sm text-teal-600">File attached ✓</span>
                      ) : (
                        <span className="text-sm text-gray-500 flex items-center gap-2">
                          <Upload className="w-5 h-5" />
                          Upload file (PDF, images)
                        </span>
                      )}
                    </div>
                    <input type="file" onChange={handleFileUpload} className="hidden" />
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div>
                    <p className="font-medium text-gray-900">Visible to Owner</p>
                    <p className="text-sm text-gray-500">Owner can view this record</p>
                  </div>
                  <Switch
                    checked={recordForm.is_visible_to_owner}
                    onCheckedChange={(checked) => setRecordForm({...recordForm, is_visible_to_owner: checked})}
                  />
                </div>

                <Button type="submit" disabled={createRecordMutation.isPending} className="w-full h-12 bg-teal-600 hover:bg-teal-700">
                  {createRecordMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Save Record'}
                </Button>
              </form>
            </TabsContent>

            {/* Vaccination Form */}
            <TabsContent value="vaccination">
              <form onSubmit={handleVaccinationSubmit} className="space-y-5">
                <div>
                  <Label className="text-sm font-medium">Patient *</Label>
                  <Select value={vaccinationForm.pet_id} onValueChange={(v) => setVaccinationForm({...vaccinationForm, pet_id: v})}>
                    <SelectTrigger className="mt-1.5">
                      <SelectValue placeholder="Select patient" />
                    </SelectTrigger>
                    <SelectContent>
                      {pets.map(pet => (
                        <SelectItem key={pet.id} value={pet.id}>
                          {pet.name} ({pet.species})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-sm font-medium">Vaccine Name *</Label>
                  <Input
                    value={vaccinationForm.vaccine_name}
                    onChange={(e) => setVaccinationForm({...vaccinationForm, vaccine_name: e.target.value})}
                    placeholder="e.g., Rabies, DHPP, FVRCP"
                    className="mt-1.5"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Date Administered</Label>
                    <Input
                      type="date"
                      value={vaccinationForm.date_administered}
                      onChange={(e) => setVaccinationForm({...vaccinationForm, date_administered: e.target.value})}
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Next Due Date</Label>
                    <Input
                      type="date"
                      value={vaccinationForm.next_due_date}
                      onChange={(e) => setVaccinationForm({...vaccinationForm, next_due_date: e.target.value})}
                      className="mt-1.5"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium">Batch Number</Label>
                  <Input
                    value={vaccinationForm.batch_number}
                    onChange={(e) => setVaccinationForm({...vaccinationForm, batch_number: e.target.value})}
                    placeholder="Vaccine batch/lot number"
                    className="mt-1.5"
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium">Notes</Label>
                  <Textarea
                    value={vaccinationForm.notes}
                    onChange={(e) => setVaccinationForm({...vaccinationForm, notes: e.target.value})}
                    placeholder="Any additional notes..."
                    className="mt-1.5"
                  />
                </div>

                <Button type="submit" disabled={createVaccinationMutation.isPending} className="w-full h-12 bg-teal-600 hover:bg-teal-700">
                  {createVaccinationMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Record Vaccination'}
                </Button>
              </form>
            </TabsContent>

            {/* Medication Form */}
            <TabsContent value="medication">
              <form onSubmit={handleMedicationSubmit} className="space-y-5">
                <div>
                  <Label className="text-sm font-medium">Patient *</Label>
                  <Select value={medicationForm.pet_id} onValueChange={(v) => setMedicationForm({...medicationForm, pet_id: v})}>
                    <SelectTrigger className="mt-1.5">
                      <SelectValue placeholder="Select patient" />
                    </SelectTrigger>
                    <SelectContent>
                      {pets.map(pet => (
                        <SelectItem key={pet.id} value={pet.id}>
                          {pet.name} ({pet.species})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-sm font-medium">Medication Name *</Label>
                  <Input
                    value={medicationForm.name}
                    onChange={(e) => setMedicationForm({...medicationForm, name: e.target.value})}
                    placeholder="e.g., Amoxicillin"
                    className="mt-1.5"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Dosage</Label>
                    <Input
                      value={medicationForm.dosage}
                      onChange={(e) => setMedicationForm({...medicationForm, dosage: e.target.value})}
                      placeholder="e.g., 250mg"
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Frequency</Label>
                    <Input
                      value={medicationForm.frequency}
                      onChange={(e) => setMedicationForm({...medicationForm, frequency: e.target.value})}
                      placeholder="e.g., Twice daily"
                      className="mt-1.5"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Start Date</Label>
                    <Input
                      type="date"
                      value={medicationForm.start_date}
                      onChange={(e) => setMedicationForm({...medicationForm, start_date: e.target.value})}
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium">End Date</Label>
                    <Input
                      type="date"
                      value={medicationForm.end_date}
                      onChange={(e) => setMedicationForm({...medicationForm, end_date: e.target.value})}
                      className="mt-1.5"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium">Instructions</Label>
                  <Textarea
                    value={medicationForm.notes}
                    onChange={(e) => setMedicationForm({...medicationForm, notes: e.target.value})}
                    placeholder="Special instructions..."
                    className="mt-1.5"
                  />
                </div>

                <Button type="submit" disabled={createMedicationMutation.isPending} className="w-full h-12 bg-teal-600 hover:bg-teal-700">
                  {createMedicationMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Prescribe Medication'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
    </VetSidebar>
  );
}