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
  Scissors,
  Dog,
  Cat,
  Bird,
  Rabbit,
  Fish,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Package
} from 'lucide-react';
import { format, addMonths, addYears } from 'date-fns';
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import VetSidebar from '@/components/layout/VetSidebar';

const recordTypes = [
  { value: 'diagnosis', label: 'Diagnosis' },
  { value: 'treatment', label: 'Treatment' },
  { value: 'prescription', label: 'Prescription' },
  { value: 'vaccination', label: 'Vaccination' },
  { value: 'medication', label: 'Medication' },
  { value: 'grooming', label: 'Grooming' },
  { value: 'lab_result', label: 'Lab Result' },
  { value: 'surgery', label: 'Surgery' },
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

  // Date range limits — restrict all dates to current year to prevent trolling
  const currentYear = new Date().getFullYear();
  const minCurrentYear = `${currentYear}-01-01`;   // Jan 1 of this year
  const maxCurrentYear = `${currentYear}-12-31`;   // Dec 31 of this year
  const maxNextYear    = `${currentYear + 1}-12-31`; // Dec 31 of next year (for forward-looking fields)

  /** Live character counter shown below capped inputs. */
  const CharCount = ({ value, max }) => {
    const len = (value || '').length;
    const pct = len / max;
    const color = pct >= 0.95 ? 'text-red-500' : pct >= 0.8 ? 'text-amber-500' : 'text-gray-400';
    if (len === 0) return null; // hide until user starts typing
    return (
      <p className={`text-xs mt-1 text-right ${color}`}>
        {len}/{max} characters{pct >= 0.95 ? ' — limit reached!' : pct >= 0.8 ? ' — almost full' : ''}
      </p>
    );
  };
  
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

  const [groomingForm, setGroomingForm] = useState({
    pet_id: preselectedPetId || '',
    date: format(new Date(), 'yyyy-MM-dd'),
    groomer_name: '',
    grooming_type: '',
    coat_condition_before: '',
    coat_style_notes: '',
    observations: '',
    is_visible_to_owner: true,
  });

  const [recordErrors, setRecordErrors] = useState({});
  const [vaccinationErrors, setVaccinationErrors] = useState({});
  const [medicationErrors, setMedicationErrors] = useState({});
  const [groomingErrors, setGroomingErrors] = useState({});

  const [showVaccineSuggestions, setShowVaccineSuggestions] = useState(false);
  const [showMedicationSuggestions, setShowMedicationSuggestions] = useState(false);

  // Fetch clinical inventory
  const { data: inventoryItems = [] } = useQuery({
    queryKey: ['clinicalInventory'],
    queryFn: () => api.entities.InventoryItem.list({ limit: 500 }),
    staleTime: 30000,
  });

  const vaccineInventory = React.useMemo(() => {
    return inventoryItems.filter(i => (i.item_type || '').toLowerCase() === 'vaccine');
  }, [inventoryItems]);

  const medicationInventory = React.useMemo(() => {
    return inventoryItems.filter(i => (i.item_type || '').toLowerCase() === 'medication');
  }, [inventoryItems]);

  // Current matched inventory items (exact or prefix match)
  const matchedVaccine = React.useMemo(() => {
    const raw = (vaccinationForm.vaccine_name || '').trim().toLowerCase();
    if (!raw) return null;
    return vaccineInventory.find(i => i.name.toLowerCase() === raw) ||
           vaccineInventory.find(i => i.name.toLowerCase().startsWith(raw)) || null;
  }, [vaccineInventory, vaccinationForm.vaccine_name]);

  const matchedMedication = React.useMemo(() => {
    const raw = (medicationForm.name || '').trim().toLowerCase();
    if (!raw) return null;
    return medicationInventory.find(i => i.name.toLowerCase() === raw) ||
           medicationInventory.find(i => i.name.toLowerCase().startsWith(raw)) || null;
  }, [medicationInventory, medicationForm.name]);

  // Suggestions while typing
  const vaccineSuggestions = React.useMemo(() => {
    const query = (vaccinationForm.vaccine_name || '').trim().toLowerCase();
    if (!query) return [];
    return vaccineInventory.filter(i => 
      i.name.toLowerCase().includes(query) ||
      (i.category && i.category.toLowerCase().includes(query)) ||
      (i.sku && i.sku.toLowerCase().includes(query))
    );
  }, [vaccineInventory, vaccinationForm.vaccine_name]);

  const medicationSuggestions = React.useMemo(() => {
    const query = (medicationForm.name || '').trim().toLowerCase();
    if (!query) return [];
    return medicationInventory.filter(i => 
      i.name.toLowerCase().includes(query) ||
      (i.category && i.category.toLowerCase().includes(query)) ||
      (i.sku && i.sku.toLowerCase().includes(query))
    );
  }, [medicationInventory, medicationForm.name]);

  const isVaccineBlocked = matchedVaccine && (matchedVaccine.is_expired || matchedVaccine.is_out_of_stock || matchedVaccine.quantity <= 0);
  const isMedicationBlocked = matchedMedication && (matchedMedication.is_expired || matchedMedication.is_out_of_stock || matchedMedication.quantity <= 0);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => api.auth.me(),
  });

  const { data: pets = [] } = useQuery({
    queryKey: ['vetConnectedPets', user?.email],
    queryFn: () => api.entities.Pet.list(),
    enabled: !!user,
  });

  const { data: users = [] } = useQuery({
    queryKey: ['allUsers'],
    queryFn: () => api.entities.User.list(),
    enabled: !!user,
  });

  const { data: emergencyPetList } = useQuery({
    queryKey: ['emergencyPet', preselectedPetId],
    queryFn: () => api.entities.Pet.filter({ id: preselectedPetId }),
    enabled: !!preselectedPetId,
  });

  const availablePets = React.useMemo(() => {
    const list = [...pets];
    if (emergencyPetList?.[0] && !list.some(p => p.id === emergencyPetList[0].id)) {
      list.push(emergencyPetList[0]);
    }
    return list;
  }, [pets, emergencyPetList]);

  const getOwnerName = (ownerEmail) => {
    if (!ownerEmail) return 'Unknown Owner';
    const owner = users.find(u => u.email?.toLowerCase() === ownerEmail.toLowerCase());
    return owner?.full_name || ownerEmail;
  };

  const getPetDisplayLabel = (pet) => {
    const speciesCap = pet.species ? pet.species.charAt(0).toUpperCase() + pet.species.slice(1) : 'Pet';
    const breedPart = pet.breed ? ` • ${pet.breed}` : '';
    const ownerName = getOwnerName(pet.owner_email);
    return `${pet.name} (${speciesCap}${breedPart}) — Owner: ${ownerName}`;
  };

  const createRecordMutation = useMutation({
    mutationFn: (data) => api.entities.HealthRecord.create({
      ...data,
      vet_email: user?.email,
      vet_name: user?.full_name,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allHealthRecords'] });
      queryClient.invalidateQueries({ queryKey: ['healthRecords'] });
      toast.success('Health record added!');
      navigate(createPageUrl('VetRecords'));
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to save record');
    }
  });

  const createVaccinationMutation = useMutation({
    mutationFn: async (data) => {
      const res = await api.entities.Vaccination.create({
        ...data,
        administered_by: user?.full_name,
      });
      if (matchedVaccine && matchedVaccine.quantity > 0) {
        try {
          await api.entities.InventoryItem.adjustStock(matchedVaccine.id, { mode: 'subtract', amount: 1 });
        } catch {}
      }
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vaccinations'] });
      queryClient.invalidateQueries({ queryKey: ['clinicalInventory'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      toast.success('Vaccination recorded!');
      navigate(createPageUrl('VetRecords'));
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to save vaccination');
    }
  });

  const createMedicationMutation = useMutation({
    mutationFn: async (data) => {
      const res = await api.entities.Medication.create({
        ...data,
        prescribed_by: user?.full_name,
      });
      if (matchedMedication && matchedMedication.quantity > 0) {
        try {
          await api.entities.InventoryItem.adjustStock(matchedMedication.id, { mode: 'subtract', amount: 1 });
        } catch {}
      }
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medications'] });
      queryClient.invalidateQueries({ queryKey: ['clinicalInventory'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      toast.success('Medication prescribed!');
      navigate(createPageUrl('VetRecords'));
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to save medication');
    }
  });

  const createGroomingMutation = useMutation({
    mutationFn: (data) => api.entities.GroomingRecord.create({ ...data, groomer_name: data.groomer_name?.trim() || user?.full_name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groomingRecords'] });
      toast.success('Grooming record added!');
      navigate(createPageUrl('VetRecords'));
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to save grooming record');
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
    const newErrors = {};
    if (!recordForm.pet_id) newErrors.pet_id = true;
    if (!recordForm.title) newErrors.title = true;

    setRecordErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      return;
    }
    createRecordMutation.mutate(recordForm);
  };

  const handleVaccinationSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!vaccinationForm.pet_id) newErrors.pet_id = true;
    if (!vaccinationForm.vaccine_name) newErrors.vaccine_name = true;
    if (!vaccinationForm.next_due_date) newErrors.next_due_date = true;

    setVaccinationErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      return;
    }

    if (matchedVaccine) {
      if (matchedVaccine.is_expired) {
        toast.error(`Cannot save: ${matchedVaccine.name} expired on ${matchedVaccine.expiration_date}.`);
        return;
      }
      if (matchedVaccine.is_out_of_stock || matchedVaccine.quantity <= 0) {
        toast.error(`Cannot save: ${matchedVaccine.name} is out of stock (0 left in inventory).`);
        return;
      }
    }

    createVaccinationMutation.mutate(vaccinationForm);
  };

  const handleMedicationSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!medicationForm.pet_id) newErrors.pet_id = true;
    if (!medicationForm.name) newErrors.name = true;
    if (!medicationForm.dosage || !medicationForm.dosage.trim()) newErrors.dosage = true;
    if (!medicationForm.end_date) newErrors.end_date = true;

    setMedicationErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      return;
    }

    if (matchedMedication) {
      if (matchedMedication.is_expired) {
        toast.error(`Cannot save: ${matchedMedication.name} expired on ${matchedMedication.expiration_date}.`);
        return;
      }
      if (matchedMedication.is_out_of_stock || matchedMedication.quantity <= 0) {
        toast.error(`Cannot save: ${matchedMedication.name} is out of stock (0 left in inventory).`);
        return;
      }
    }

    createMedicationMutation.mutate(medicationForm);
  };

  const handleGroomingSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!groomingForm.pet_id) newErrors.pet_id = true;
    if (!groomingForm.grooming_type) newErrors.grooming_type = true;
    if (!groomingForm.coat_condition_before) newErrors.coat_condition_before = true;

    setGroomingErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      return;
    }
    createGroomingMutation.mutate(groomingForm);
  };

  const selectedPet = availablePets.find(p => p.id === (recordForm.pet_id || vaccinationForm.pet_id || medicationForm.pet_id || groomingForm.pet_id));

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
            <TabsList className="w-full grid grid-cols-2 md:grid-cols-4 h-auto p-1 gap-2 mb-6">
              <TabsTrigger value="record" className="gap-2 py-2">
                <FileText className="w-4 h-4" />
                Health Record
              </TabsTrigger>
              <TabsTrigger value="vaccination" className="gap-2 py-2">
                <Syringe className="w-4 h-4" />
                Vaccination
              </TabsTrigger>
              <TabsTrigger value="medication" className="gap-2 py-2">
                <Pill className="w-4 h-4" />
                Medication
              </TabsTrigger>
              <TabsTrigger value="grooming" className="gap-2 py-2">
                <Scissors className="w-4 h-4" />
                Grooming
              </TabsTrigger>
            </TabsList>

            {/* Health Record Form */}
            <TabsContent value="record">
              <form onSubmit={handleRecordSubmit} className="space-y-5">
                <div>
                  <Label className="text-sm font-medium">Patient *</Label>
                  <div className="relative mt-1.5">
                    <Select
                      value={recordForm.pet_id}
                      onValueChange={(v) => {
                        setRecordForm({...recordForm, pet_id: v});
                        setRecordErrors(prev => ({ ...prev, pet_id: false }));
                      }}
                    >
                      <SelectTrigger className={cn(recordErrors.pet_id ? "border-red-500 bg-red-50/10 focus:ring-red-500 [&>span]:pr-8" : "")}>
                        <SelectValue placeholder="Select patient" />
                      </SelectTrigger>
                      {recordErrors.pet_id && (
                        <AlertTriangle className="w-5 h-5 text-red-500 absolute right-9 top-1/2 -translate-y-1/2 pointer-events-none" />
                      )}
                      <SelectContent>
                        {availablePets.map(pet => (
                          <SelectItem key={pet.id} value={pet.id}>
                            {getPetDisplayLabel(pet)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {recordErrors.pet_id && (
                    <p className="text-sm text-red-600 mt-1.5">Please select a patient.</p>
                  )}
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
                      min={minCurrentYear}
                      max={maxCurrentYear}
                      value={recordForm.date}
                      onChange={(e) => setRecordForm({...recordForm, date: e.target.value})}
                      className="mt-1.5"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium">Title *</Label>
                  <div className="relative mt-1.5">
                    <Input
                      maxLength={200}
                      value={recordForm.title}
                      onChange={(e) => {
                        setRecordForm({...recordForm, title: e.target.value});
                        setRecordErrors(prev => ({ ...prev, title: false }));
                      }}
                      placeholder="e.g., Annual checkup results"
                      className={cn("pr-10", recordErrors.title ? "border-red-500 bg-red-50/10 focus-visible:ring-red-500" : "")}
                    />
                    {recordErrors.title && (
                      <AlertTriangle className="w-5 h-5 text-red-500 absolute right-3 top-1/2 -translate-y-1/2" />
                    )}
                  </div>
                  {recordErrors.title && (
                    <p className="text-sm text-red-600 mt-1.5">Please enter a title.</p>
                  )}
                  <CharCount value={recordForm.title} max={200} />
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

                <Button type="submit" disabled={createRecordMutation.isPending} className="w-full h-12 bg-teal-600 hover:bg-teal-700 text-white font-medium shadow-sm">
                  {createRecordMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Save Record'}
                </Button>
              </form>
            </TabsContent>

            {/* Vaccination Form */}
            <TabsContent value="vaccination">
              <form onSubmit={handleVaccinationSubmit} className="space-y-5">
                <div>
                  <Label className="text-sm font-medium">Patient *</Label>
                  <div className="relative mt-1.5">
                    <Select
                      value={vaccinationForm.pet_id}
                      onValueChange={(v) => {
                        setVaccinationForm({...vaccinationForm, pet_id: v});
                        setVaccinationErrors(prev => ({ ...prev, pet_id: false }));
                      }}
                    >
                      <SelectTrigger className={cn(vaccinationErrors.pet_id ? "border-red-500 bg-red-50/10 focus:ring-red-500 [&>span]:pr-8" : "")}>
                        <SelectValue placeholder="Select patient" />
                      </SelectTrigger>
                      {vaccinationErrors.pet_id && (
                        <AlertTriangle className="w-5 h-5 text-red-500 absolute right-9 top-1/2 -translate-y-1/2 pointer-events-none" />
                      )}
                      <SelectContent>
                        {availablePets.map(pet => (
                          <SelectItem key={pet.id} value={pet.id}>
                            {getPetDisplayLabel(pet)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {vaccinationErrors.pet_id && (
                    <p className="text-sm text-red-600 mt-1.5">Please select a patient.</p>
                  )}
                </div>

                <div>
                  <Label className="text-sm font-medium">Vaccine Name *</Label>
                  <div className="relative mt-1.5">
                    <Input
                      maxLength={200}
                      value={vaccinationForm.vaccine_name}
                      onFocus={() => setShowVaccineSuggestions(true)}
                      onBlur={() => setTimeout(() => setShowVaccineSuggestions(false), 200)}
                      onChange={(e) => {
                        setVaccinationForm({...vaccinationForm, vaccine_name: e.target.value});
                        setVaccinationErrors(prev => ({ ...prev, vaccine_name: false }));
                        setShowVaccineSuggestions(true);
                      }}
                      placeholder="e.g., Rabies, DHPP, FVRCP"
                      className={cn(
                        matchedVaccine ? "pr-36" : "pr-10",
                        vaccinationErrors.vaccine_name ? "border-red-500 bg-red-50/10 focus-visible:ring-red-500" : ""
                      )}
                    />
                    {matchedVaccine ? (
                      <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center z-10 pointer-events-none">
                        {matchedVaccine.is_expired ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-red-100 text-red-700 border border-red-200 shadow-xs">
                            <AlertCircle className="w-3.5 h-3.5 text-red-600 flex-shrink-0" />
                            Expired
                          </span>
                        ) : (matchedVaccine.is_out_of_stock || matchedVaccine.quantity <= 0) ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-red-100 text-red-700 border border-red-200 shadow-xs">
                            <AlertTriangle className="w-3.5 h-3.5 text-red-600 flex-shrink-0" />
                            Out of stock (0)
                          </span>
                        ) : matchedVaccine.is_low_stock ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200 shadow-xs">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                            Low stock: {matchedVaccine.quantity}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200 shadow-xs">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                            In stock: {matchedVaccine.quantity}
                          </span>
                        )}
                      </div>
                    ) : vaccinationErrors.vaccine_name ? (
                      <AlertTriangle className="w-5 h-5 text-red-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    ) : null}

                    {/* Suggestions dropdown */}
                    {showVaccineSuggestions && vaccineSuggestions.length > 0 && (
                      <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto divide-y divide-gray-100">
                        <div className="px-3 py-1.5 bg-gray-50 text-[11px] font-semibold text-gray-500 uppercase tracking-wider flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            <Package className="w-3.5 h-3.5 text-teal-600" />
                            Inventory Suggestions ({vaccineSuggestions.length})
                          </span>
                          <span className="text-[10px] text-gray-400 font-normal">Click to autofill</span>
                        </div>
                        {vaccineSuggestions.map((item) => (
                          <button
                            type="button"
                            key={item.id}
                            onMouseDown={(e) => {
                              e.preventDefault();
                              setVaccinationForm(prev => ({
                                ...prev,
                                vaccine_name: item.name,
                                batch_number: item.batch_number || prev.batch_number,
                              }));
                              setVaccinationErrors(prev => ({ ...prev, vaccine_name: false }));
                              setShowVaccineSuggestions(false);
                            }}
                            className="w-full text-left px-3.5 py-2.5 hover:bg-teal-50/50 transition-colors flex items-center justify-between gap-3 text-sm cursor-pointer"
                          >
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-gray-900 truncate">{item.name}</p>
                              <p className="text-xs text-gray-500 truncate mt-0.5">
                                {item.batch_number ? `Batch: ${item.batch_number}` : ''}
                                {item.batch_number && item.manufacturer ? ' • ' : ''}
                                {item.manufacturer || ''}
                                {item.expiration_date ? ` • Exp: ${item.expiration_date}` : ''}
                              </p>
                            </div>
                            <div className="shrink-0">
                              {item.is_expired ? (
                                <span className="px-2 py-0.5 text-[11px] font-semibold rounded bg-red-100 text-red-700 border border-red-200">
                                  Expired
                                </span>
                              ) : (item.is_out_of_stock || item.quantity <= 0) ? (
                                <span className="px-2 py-0.5 text-[11px] font-semibold rounded bg-red-100 text-red-700 border border-red-200">
                                  0 in stock
                                </span>
                              ) : item.is_low_stock ? (
                                <span className="px-2 py-0.5 text-[11px] font-semibold rounded bg-amber-100 text-amber-800 border border-amber-200">
                                  Low stock: {item.quantity}
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 text-[11px] font-semibold rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                                  In stock: {item.quantity}
                                </span>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {matchedVaccine?.is_expired && (
                    <div className="flex items-center gap-2 mt-2 p-2.5 bg-red-50 border border-red-200 rounded-lg text-xs font-semibold text-red-700 animate-in fade-in">
                      <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                      <span>Warning: This vaccine expired on {matchedVaccine.expiration_date}. It cannot be administered or saved.</span>
                    </div>
                  )}
                  {matchedVaccine && !matchedVaccine.is_expired && (matchedVaccine.is_out_of_stock || matchedVaccine.quantity <= 0) && (
                    <div className="flex items-center gap-2 mt-2 p-2.5 bg-red-50 border border-red-200 rounded-lg text-xs font-semibold text-red-700 animate-in fade-in">
                      <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
                      <span>Warning: This vaccine is out of stock (0 left in inventory). Please restock inventory before recording.</span>
                    </div>
                  )}

                  {vaccinationErrors.vaccine_name && (
                    <p className="text-sm text-red-600 mt-1.5">Please enter a vaccine name.</p>
                  )}
                  <CharCount value={vaccinationForm.vaccine_name} max={200} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Date Administered</Label>
                    <Input
                      type="date"
                      min={minCurrentYear}
                      max={maxCurrentYear}
                      value={vaccinationForm.date_administered}
                      onChange={(e) => setVaccinationForm({...vaccinationForm, date_administered: e.target.value})}
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium">
                      Next Due Date <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative mt-1.5">
                      <Input
                        type="date"
                        min={minCurrentYear}
                        max={maxNextYear}
                        value={vaccinationForm.next_due_date}
                        onChange={(e) => {
                          setVaccinationForm({...vaccinationForm, next_due_date: e.target.value});
                          setVaccinationErrors(prev => ({ ...prev, next_due_date: false }));
                        }}
                        className={cn(vaccinationErrors.next_due_date ? "border-red-500 bg-red-50/10 focus-visible:ring-red-500 pr-16" : "")}
                      />
                      {vaccinationErrors.next_due_date && (
                        <AlertTriangle className="w-5 h-5 text-red-500 absolute right-10 top-1/2 -translate-y-1/2" />
                      )}
                    </div>
                    {vaccinationErrors.next_due_date && (
                      <p className="text-sm text-red-600 mt-1.5">Please select a next due date.</p>
                    )}
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium">Batch Number</Label>
                  <Input
                    maxLength={100}
                    value={vaccinationForm.batch_number}
                    onChange={(e) => setVaccinationForm({...vaccinationForm, batch_number: e.target.value})}
                    placeholder="Vaccine batch/lot number"
                    className="mt-1.5"
                  />
                  <CharCount value={vaccinationForm.batch_number} max={100} />
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

                <Button 
                  type="submit" 
                  disabled={createVaccinationMutation.isPending || isVaccineBlocked} 
                  className={cn(
                    "w-full h-12 font-medium shadow-sm transition-colors text-white",
                    isVaccineBlocked ? "bg-gray-400 hover:bg-gray-400 cursor-not-allowed opacity-80" : "bg-teal-600 hover:bg-teal-700"
                  )}
                >
                  {createVaccinationMutation.isPending ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : isVaccineBlocked ? (
                    matchedVaccine?.is_expired ? 'Cannot Save (Vaccine Expired)' : 'Cannot Save (Vaccine Out of Stock)'
                  ) : (
                    'Record Vaccination'
                  )}
                </Button>
              </form>
            </TabsContent>

            {/* Medication Form */}
            <TabsContent value="medication">
              <form onSubmit={handleMedicationSubmit} className="space-y-5">
                <div>
                  <Label className="text-sm font-medium">Patient *</Label>
                  <div className="relative mt-1.5">
                    <Select
                      value={medicationForm.pet_id}
                      onValueChange={(v) => {
                        setMedicationForm({...medicationForm, pet_id: v});
                        setMedicationErrors(prev => ({ ...prev, pet_id: false }));
                      }}
                    >
                      <SelectTrigger className={cn(medicationErrors.pet_id ? "border-red-500 bg-red-50/10 focus:ring-red-500 [&>span]:pr-8" : "")}>
                        <SelectValue placeholder="Select patient" />
                      </SelectTrigger>
                      {medicationErrors.pet_id && (
                        <AlertTriangle className="w-5 h-5 text-red-500 absolute right-9 top-1/2 -translate-y-1/2 pointer-events-none" />
                      )}
                      <SelectContent>
                        {availablePets.map(pet => (
                          <SelectItem key={pet.id} value={pet.id}>
                            {getPetDisplayLabel(pet)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {medicationErrors.pet_id && (
                    <p className="text-sm text-red-600 mt-1.5">Please select a patient.</p>
                  )}
                </div>

                <div>
                  <Label className="text-sm font-medium">Medication Name *</Label>
                  <div className="relative mt-1.5">
                    <Input
                      maxLength={200}
                      value={medicationForm.name}
                      onFocus={() => setShowMedicationSuggestions(true)}
                      onBlur={() => setTimeout(() => setShowMedicationSuggestions(false), 200)}
                      onChange={(e) => {
                        setMedicationForm({...medicationForm, name: e.target.value});
                        setMedicationErrors(prev => ({ ...prev, name: false }));
                        setShowMedicationSuggestions(true);
                      }}
                      placeholder="e.g., Clavamox, Metacam, NexGard"
                      className={cn(
                        matchedMedication ? "pr-36" : "pr-10",
                        medicationErrors.name ? "border-red-500 bg-red-50/10 focus-visible:ring-red-500" : ""
                      )}
                    />
                    {matchedMedication ? (
                      <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center z-10 pointer-events-none">
                        {matchedMedication.is_expired ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-red-100 text-red-700 border border-red-200 shadow-xs">
                            <AlertCircle className="w-3.5 h-3.5 text-red-600 flex-shrink-0" />
                            Expired
                          </span>
                        ) : (matchedMedication.is_out_of_stock || matchedMedication.quantity <= 0) ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-red-100 text-red-700 border border-red-200 shadow-xs">
                            <AlertTriangle className="w-3.5 h-3.5 text-red-600 flex-shrink-0" />
                            Out of stock (0)
                          </span>
                        ) : matchedMedication.is_low_stock ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200 shadow-xs">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                            Low stock: {matchedMedication.quantity}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200 shadow-xs">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                            In stock: {matchedMedication.quantity}
                          </span>
                        )}
                      </div>
                    ) : medicationErrors.name ? (
                      <AlertTriangle className="w-5 h-5 text-red-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    ) : null}

                    {/* Suggestions dropdown */}
                    {showMedicationSuggestions && medicationSuggestions.length > 0 && (
                      <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto divide-y divide-gray-100">
                        <div className="px-3 py-1.5 bg-gray-50 text-[11px] font-semibold text-gray-500 uppercase tracking-wider flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            <Package className="w-3.5 h-3.5 text-teal-600" />
                            Inventory Suggestions ({medicationSuggestions.length})
                          </span>
                          <span className="text-[10px] text-gray-400 font-normal">Click to autofill</span>
                        </div>
                        {medicationSuggestions.map((item) => (
                          <button
                            type="button"
                            key={item.id}
                            onMouseDown={(e) => {
                              e.preventDefault();
                              setMedicationForm(prev => ({
                                ...prev,
                                name: item.name,
                              }));
                              setMedicationErrors(prev => ({ ...prev, name: false }));
                              setShowMedicationSuggestions(false);
                            }}
                            className="w-full text-left px-3.5 py-2.5 hover:bg-teal-50/50 transition-colors flex items-center justify-between gap-3 text-sm cursor-pointer"
                          >
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-gray-900 truncate">{item.name}</p>
                              <p className="text-xs text-gray-500 truncate mt-0.5">
                                {item.category ? `${item.category}` : ''}
                                {item.category && item.manufacturer ? ' • ' : ''}
                                {item.manufacturer || ''}
                                {item.expiration_date ? ` • Exp: ${item.expiration_date}` : ''}
                              </p>
                            </div>
                            <div className="shrink-0">
                              {item.is_expired ? (
                                <span className="px-2 py-0.5 text-[11px] font-semibold rounded bg-red-100 text-red-700 border border-red-200">
                                  Expired
                                </span>
                              ) : (item.is_out_of_stock || item.quantity <= 0) ? (
                                <span className="px-2 py-0.5 text-[11px] font-semibold rounded bg-red-100 text-red-700 border border-red-200">
                                  0 in stock
                                </span>
                              ) : item.is_low_stock ? (
                                <span className="px-2 py-0.5 text-[11px] font-semibold rounded bg-amber-100 text-amber-800 border border-amber-200">
                                  Low stock: {item.quantity}
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 text-[11px] font-semibold rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                                  In stock: {item.quantity}
                                </span>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {matchedMedication?.is_expired && (
                    <div className="flex items-center gap-2 mt-2 p-2.5 bg-red-50 border border-red-200 rounded-lg text-xs font-semibold text-red-700 animate-in fade-in">
                      <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                      <span>Warning: This medication expired on {matchedMedication.expiration_date}. It cannot be prescribed or saved.</span>
                    </div>
                  )}
                  {matchedMedication && !matchedMedication.is_expired && (matchedMedication.is_out_of_stock || matchedMedication.quantity <= 0) && (
                    <div className="flex items-center gap-2 mt-2 p-2.5 bg-red-50 border border-red-200 rounded-lg text-xs font-semibold text-red-700 animate-in fade-in">
                      <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
                      <span>Warning: This medication is out of stock (0 left in inventory). Please restock inventory before prescribing.</span>
                    </div>
                  )}

                  {medicationErrors.name && (
                    <p className="text-sm text-red-600 mt-1.5">Please enter a medication name.</p>
                  )}
                  <CharCount value={medicationForm.name} max={200} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">
                      Dosage <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative mt-1.5">
                      <Input
                        maxLength={100}
                        value={medicationForm.dosage}
                        onChange={(e) => {
                          setMedicationForm({...medicationForm, dosage: e.target.value});
                          setMedicationErrors(prev => ({ ...prev, dosage: false }));
                        }}
                        placeholder="e.g., 250mg"
                        className={cn("pr-10", medicationErrors.dosage ? "border-red-500 bg-red-50/10 focus-visible:ring-red-500" : "")}
                      />
                      {medicationErrors.dosage && (
                        <AlertTriangle className="w-5 h-5 text-red-500 absolute right-3 top-1/2 -translate-y-1/2" />
                      )}
                    </div>
                    {medicationErrors.dosage && (
                      <p className="text-sm text-red-600 mt-1.5">Please enter a dosage.</p>
                    )}
                    <CharCount value={medicationForm.dosage} max={100} />
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Frequency</Label>
                    <Input
                      maxLength={100}
                      value={medicationForm.frequency}
                      onChange={(e) => setMedicationForm({...medicationForm, frequency: e.target.value})}
                      placeholder="e.g., Twice daily"
                      className="mt-1.5"
                    />
                    <CharCount value={medicationForm.frequency} max={100} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Start Date</Label>
                    <Input
                      type="date"
                      min={minCurrentYear}
                      max={maxCurrentYear}
                      value={medicationForm.start_date}
                      onChange={(e) => setMedicationForm({...medicationForm, start_date: e.target.value})}
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium">
                      End Date <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative mt-1.5">
                      <Input
                        type="date"
                        min={medicationForm.start_date || minCurrentYear}
                        max={maxNextYear}
                        value={medicationForm.end_date}
                        onChange={(e) => {
                          setMedicationForm({...medicationForm, end_date: e.target.value});
                          setMedicationErrors(prev => ({ ...prev, end_date: false }));
                        }}
                        className={cn(medicationErrors.end_date ? "border-red-500 bg-red-50/10 focus-visible:ring-red-500 pr-16" : "")}
                      />
                      {medicationErrors.end_date && (
                        <AlertTriangle className="w-5 h-5 text-red-500 absolute right-10 top-1/2 -translate-y-1/2" />
                      )}
                    </div>
                    {medicationErrors.end_date && (
                      <p className="text-sm text-red-600 mt-1.5">Please select an end date.</p>
                    )}
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

                <Button 
                  type="submit" 
                  disabled={createMedicationMutation.isPending || isMedicationBlocked} 
                  className={cn(
                    "w-full h-12 font-medium shadow-sm transition-colors text-white",
                    isMedicationBlocked ? "bg-gray-400 hover:bg-gray-400 cursor-not-allowed opacity-80" : "bg-teal-600 hover:bg-teal-700"
                  )}
                >
                  {createMedicationMutation.isPending ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : isMedicationBlocked ? (
                    matchedMedication?.is_expired ? 'Cannot Save (Medication Expired)' : 'Cannot Save (Medication Out of Stock)'
                  ) : (
                    'Prescribe Medication'
                  )}
                </Button>
              </form>
            </TabsContent>

            {/* Grooming Form */}
            <TabsContent value="grooming">
              <form onSubmit={handleGroomingSubmit} className="space-y-5">
                <div>
                  <Label className="text-sm font-medium">Patient *</Label>
                  <div className="relative mt-1.5">
                    <Select
                      value={groomingForm.pet_id}
                      onValueChange={(v) => {
                        setGroomingForm({...groomingForm, pet_id: v});
                        setGroomingErrors(prev => ({ ...prev, pet_id: false }));
                      }}
                    >
                      <SelectTrigger className={cn(groomingErrors.pet_id ? "border-red-500 bg-red-50/10 focus:ring-red-500 [&>span]:pr-8" : "")}>
                        <SelectValue placeholder="Select patient" />
                      </SelectTrigger>
                      {groomingErrors.pet_id && (
                        <AlertTriangle className="w-5 h-5 text-red-500 absolute right-9 top-1/2 -translate-y-1/2 pointer-events-none" />
                      )}
                      <SelectContent>
                        {availablePets.map(pet => (
                          <SelectItem key={pet.id} value={pet.id}>
                            {getPetDisplayLabel(pet)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {groomingErrors.pet_id && (
                    <p className="text-sm text-red-600 mt-1.5">Please select a patient.</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Date</Label>
                    <Input
                      type="date"
                      min={minCurrentYear}
                      max={maxCurrentYear}
                      value={groomingForm.date}
                      onChange={(e) => setGroomingForm({...groomingForm, date: e.target.value})}
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Groomer Name</Label>
                    <Input
                      maxLength={200}
                      value={groomingForm.groomer_name}
                      onChange={(e) => setGroomingForm({...groomingForm, groomer_name: e.target.value})}
                      placeholder="Who performed the grooming"
                      className="mt-1.5"
                    />
                    <CharCount value={groomingForm.groomer_name} max={200} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Grooming Type *</Label>
                    <div className="relative mt-1.5">
                      <Select
                        value={groomingForm.grooming_type}
                        onValueChange={(v) => {
                          setGroomingForm({...groomingForm, grooming_type: v});
                          setGroomingErrors(prev => ({ ...prev, grooming_type: false }));
                        }}
                      >
                        <SelectTrigger className={cn(groomingErrors.grooming_type ? "border-red-500 bg-red-50/10 focus:ring-red-500 [&>span]:pr-8" : "")}>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        {groomingErrors.grooming_type && (
                          <AlertTriangle className="w-5 h-5 text-red-500 absolute right-9 top-1/2 -translate-y-1/2 pointer-events-none" />
                        )}
                        <SelectContent>
                          <SelectItem value="full_groom">Full Groom</SelectItem>
                          <SelectItem value="bath_and_dry">Bath & Dry</SelectItem>
                          <SelectItem value="haircut_only">Haircut Only</SelectItem>
                          <SelectItem value="nail_trim">Nail Trim</SelectItem>
                          <SelectItem value="ear_cleaning">Ear Cleaning</SelectItem>
                          <SelectItem value="teeth_brushing">Teeth Brushing</SelectItem>
                          <SelectItem value="deshedding">De-shedding</SelectItem>
                          <SelectItem value="flea_treatment">Flea Treatment</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {groomingErrors.grooming_type && (
                      <p className="text-sm text-red-600 mt-1.5">Please select a grooming type.</p>
                    )}
                  </div>
                  <div>
                    <Label className="text-sm font-medium">
                      Coat Condition (Before) <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative mt-1.5">
                      <Select
                        value={groomingForm.coat_condition_before}
                        onValueChange={(v) => {
                          setGroomingForm({...groomingForm, coat_condition_before: v});
                          setGroomingErrors(prev => ({ ...prev, coat_condition_before: false }));
                        }}
                      >
                        <SelectTrigger className={cn(groomingErrors.coat_condition_before ? "border-red-500 bg-red-50/10 focus:ring-red-500 [&>span]:pr-8" : "")}>
                          <SelectValue placeholder="Select condition" />
                        </SelectTrigger>
                        {groomingErrors.coat_condition_before && (
                          <AlertTriangle className="w-5 h-5 text-red-500 absolute right-9 top-1/2 -translate-y-1/2 pointer-events-none" />
                        )}
                        <SelectContent>
                          <SelectItem value="good">Good</SelectItem>
                          <SelectItem value="matted">Matted</SelectItem>
                          <SelectItem value="dirty">Dirty</SelectItem>
                          <SelectItem value="flea_infested">Flea-infested</SelectItem>
                          <SelectItem value="dry_flaky">Dry/Flaky</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {groomingErrors.coat_condition_before && (
                      <p className="text-sm text-red-600 mt-1.5">Please select a coat condition.</p>
                    )}
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium">Coat Style / Cut Notes</Label>
                  <Input
                    maxLength={500}
                    value={groomingForm.coat_style_notes}
                    onChange={(e) => setGroomingForm({...groomingForm, coat_style_notes: e.target.value})}
                    placeholder="e.g., Teddy bear cut, trimmed around ears"
                    className="mt-1.5"
                  />
                  <CharCount value={groomingForm.coat_style_notes} max={500} />
                </div>

                <div>
                  <Label className="text-sm font-medium">Observations</Label>
                  <Textarea
                    value={groomingForm.observations}
                    onChange={(e) => setGroomingForm({...groomingForm, observations: e.target.value})}
                    placeholder="Any observations during grooming..."
                    className="mt-1.5 min-h-[120px]"
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div>
                    <p className="font-medium text-gray-900">Visible to Owner</p>
                    <p className="text-sm text-gray-500">Owner can view this record</p>
                  </div>
                  <Switch
                    checked={groomingForm.is_visible_to_owner}
                    onCheckedChange={(checked) => setGroomingForm({...groomingForm, is_visible_to_owner: checked})}
                  />
                </div>

                <Button type="submit" disabled={createGroomingMutation.isPending} className="w-full h-12 bg-teal-600 hover:bg-teal-700 text-white font-medium shadow-sm">
                  {createGroomingMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Save Grooming Record'}
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