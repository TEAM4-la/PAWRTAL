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
  Package,
  Plus,
  Minus,
  Trash2,
  Camera,
  X
} from 'lucide-react';
import { format, addMonths, addYears } from 'date-fns';
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import VetSidebar from '@/components/layout/VetSidebar';
import LiveCameraCaptureModal from '@/components/shared/LiveCameraCaptureModal';

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
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  const [recordForm, setRecordForm] = useState({
    pet_id: preselectedPetId || '',
    record_type: 'diagnosis',
    title: '',
    description: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    file_url: '',
    file_urls: [],
    is_visible_to_owner: true,
  });

  const createEmptyVaccineItem = () => ({
    id: 'vax-' + Math.random().toString(36).substring(2, 9),
    vaccine_name: '',
    date_administered: format(new Date(), 'yyyy-MM-dd'),
    next_due_date: '',
    quantity: 1,
    batch_number: '',
    notes: '',
  });

  const createEmptyMedicationItem = () => ({
    id: 'med-' + Math.random().toString(36).substring(2, 9),
    name: '',
    dosage: '',
    frequency: '',
    quantity: 1,
    start_date: format(new Date(), 'yyyy-MM-dd'),
    end_date: '',
    notes: '',
  });

  const [vaccinationPatientId, setVaccinationPatientId] = useState(preselectedPetId || '');
  const [vaccinationItems, setVaccinationItems] = useState([createEmptyVaccineItem()]);

  const [medicationPatientId, setMedicationPatientId] = useState(preselectedPetId || '');
  const [medicationItems, setMedicationItems] = useState([createEmptyMedicationItem()]);

  const [activeVaccineSuggestionIdx, setActiveVaccineSuggestionIdx] = useState(null);
  const [activeMedicationSuggestionIdx, setActiveMedicationSuggestionIdx] = useState(null);

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

  // Inventory helpers
  const getMatchedVaccine = (name) => {
    const raw = (name || '').trim().toLowerCase();
    if (!raw) return null;
    return vaccineInventory.find(i => i.name.toLowerCase() === raw) ||
           vaccineInventory.find(i => i.name.toLowerCase().startsWith(raw)) || null;
  };

  const getMatchedMedication = (name) => {
    const raw = (name || '').trim().toLowerCase();
    if (!raw) return null;
    return medicationInventory.find(i => i.name.toLowerCase() === raw) ||
           medicationInventory.find(i => i.name.toLowerCase().startsWith(raw)) || null;
  };

  const getVaccineSuggestions = (query) => {
    const q = (query || '').trim().toLowerCase();
    if (!q) return [];
    return vaccineInventory.filter(i => 
      i.name.toLowerCase().includes(q) ||
      (i.category && i.category.toLowerCase().includes(q)) ||
      (i.sku && i.sku.toLowerCase().includes(q))
    );
  };

  const getMedicationSuggestions = (query) => {
    const q = (query || '').trim().toLowerCase();
    if (!q) return [];
    return medicationInventory.filter(i => 
      i.name.toLowerCase().includes(q) ||
      (i.category && i.category.toLowerCase().includes(q)) ||
      (i.sku && i.sku.toLowerCase().includes(q))
    );
  };

  const isVaccineItemBlocked = (item) => {
    const matched = getMatchedVaccine(item.vaccine_name);
    if (!matched) return false;
    const qty = parseInt(item.quantity, 10) || 1;
    return matched.is_expired || matched.is_out_of_stock || matched.quantity <= 0 || qty > matched.quantity;
  };
  const isAnyVaccineBlocked = vaccinationItems.some(isVaccineItemBlocked);

  const isMedicationItemBlocked = (item) => {
    const matched = getMatchedMedication(item.name);
    if (!matched) return false;
    const qty = parseInt(item.quantity, 10) || 1;
    return matched.is_expired || matched.is_out_of_stock || matched.quantity <= 0 || qty > matched.quantity;
  };
  const isAnyMedicationBlocked = medicationItems.some(isMedicationItemBlocked);

  // Repeater mutators for vaccinations
  const addVaccineItem = () => {
    setVaccinationItems(prev => [...prev, createEmptyVaccineItem()]);
  };

  const removeVaccineItem = (id) => {
    if (vaccinationItems.length <= 1) return;
    setVaccinationItems(prev => prev.filter(item => item.id !== id));
    setVaccinationErrors(prev => {
      const updated = { ...prev, items: { ...(prev.items || {}) } };
      delete updated.items[id];
      return updated;
    });
  };

  const updateVaccineItem = (id, field, value) => {
    setVaccinationItems(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
    setVaccinationErrors(prev => {
      if (!prev.items?.[id]?.[field]) return prev;
      const itemErrors = { ...prev.items[id] };
      delete itemErrors[field];
      delete itemErrors.expired;
      delete itemErrors.outOfStock;
      delete itemErrors.quantityExceeded;
      return {
        ...prev,
        items: {
          ...prev.items,
          [id]: itemErrors
        }
      };
    });
  };

  // Repeater mutators for medications
  const addMedicationItem = () => {
    setMedicationItems(prev => [...prev, createEmptyMedicationItem()]);
  };

  const removeMedicationItem = (id) => {
    if (medicationItems.length <= 1) return;
    setMedicationItems(prev => prev.filter(item => item.id !== id));
    setMedicationErrors(prev => {
      const updated = { ...prev, items: { ...(prev.items || {}) } };
      delete updated.items[id];
      return updated;
    });
  };

  const updateMedicationItem = (id, field, value) => {
    setMedicationItems(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
    setMedicationErrors(prev => {
      if (!prev.items?.[id]?.[field]) return prev;
      const itemErrors = { ...prev.items[id] };
      delete itemErrors[field];
      delete itemErrors.expired;
      delete itemErrors.outOfStock;
      delete itemErrors.quantityExceeded;
      return {
        ...prev,
        items: {
          ...prev.items,
          [id]: itemErrors
        }
      };
    });
  };

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
    mutationFn: async (items) => {
      const results = [];
      let totalDeducted = 0;
      for (const item of items) {
        const presQty = Math.max(1, parseInt(item.quantity, 10) || 1);
        const res = await api.entities.Vaccination.create({
          pet_id: vaccinationPatientId,
          vaccine_name: item.vaccine_name.trim(),
          date_administered: item.date_administered,
          next_due_date: item.next_due_date,
          batch_number: item.batch_number?.trim() || null,
          notes: item.notes?.trim() || null,
          administered_by: user?.full_name,
        });

        const matched = getMatchedVaccine(item.vaccine_name);
        if (matched && matched.quantity > 0) {
          try {
            await api.entities.InventoryItem.adjustStock(matched.id, {
              mode: 'subtract',
              amount: presQty,
            });
            totalDeducted += presQty;
          } catch (err) {
            console.error('Vaccine stock adjustment error:', err);
          }
        }
        results.push(res);
      }
      return { count: results.length, totalDeducted };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['vaccinations'] });
      queryClient.invalidateQueries({ queryKey: ['clinicalInventory'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      toast.success(
        data.count === 1
          ? 'Vaccination recorded and inventory updated!'
          : `Recorded all ${data.count} vaccinations and updated inventory!`
      );
      navigate(createPageUrl('VetRecords'));
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to save vaccination');
    }
  });

  const createMedicationMutation = useMutation({
    mutationFn: async (items) => {
      const results = [];
      let totalDeducted = 0;
      for (const item of items) {
        const presQty = Math.max(1, parseInt(item.quantity, 10) || 1);
        const res = await api.entities.Medication.create({
          pet_id: medicationPatientId,
          name: item.name.trim(),
          dosage: item.dosage.trim(),
          frequency: item.frequency?.trim() || null,
          quantity: presQty,
          start_date: item.start_date,
          end_date: item.end_date,
          notes: item.notes?.trim() || null,
          prescribed_by: user?.full_name,
        });

        const matched = getMatchedMedication(item.name);
        if (matched && matched.quantity > 0) {
          try {
            await api.entities.InventoryItem.adjustStock(matched.id, { 
              mode: 'subtract', 
              amount: presQty 
            });
            totalDeducted += presQty;
          } catch (err) {
            console.error('Inventory auto-deduction error:', err);
          }
        }
        results.push(res);
      }
      return { count: results.length, totalDeducted };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['medications'] });
      queryClient.invalidateQueries({ queryKey: ['clinicalInventory'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      toast.success(
        data.count === 1
          ? 'Medication prescribed and inventory updated!'
          : `Prescribed all ${data.count} medications and updated inventory!`
      );
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
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setIsUploading(true);
    const uploadedUrls = [];
    try {
      for (const file of files) {
        try {
          const res = await api.integrations.Core.UploadFile({ file });
          if (res?.file_url) {
            uploadedUrls.push(res.file_url);
          }
        } catch (err) {
          console.error("Failed uploading file:", file.name, err);
        }
      }

      if (uploadedUrls.length > 0) {
        setRecordForm(prev => {
          const nextUrls = [...(prev.file_urls || []), ...uploadedUrls];
          return {
            ...prev,
            file_urls: nextUrls,
            file_url: nextUrls[0] || ''
          };
        });
        toast.success(uploadedUrls.length === 1 ? 'Attachment uploaded!' : `${uploadedUrls.length} attachments uploaded!`);
      } else {
        toast.error('Failed to upload attachment(s)');
      }
    } catch {
      toast.error('Failed to upload file');
    } finally {
      setIsUploading(false);
      e.target.value = '';
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
    const finalUrls = (recordForm.file_urls || []).filter(Boolean);
    createRecordMutation.mutate({
      ...recordForm,
      file_url: finalUrls[0] || recordForm.file_url || '',
      file_urls: finalUrls
    });
  };

  const handleVaccinationSubmit = (e) => {
    e.preventDefault();
    const newErrors = { items: {} };
    if (!vaccinationPatientId) newErrors.patient = true;

    vaccinationItems.forEach((item) => {
      const itemErrors = {};
      if (!item.vaccine_name || !item.vaccine_name.trim()) itemErrors.vaccine_name = true;
      if (!item.next_due_date) itemErrors.next_due_date = true;

      const qty = parseInt(item.quantity, 10);
      if (!qty || qty < 1) itemErrors.quantity = true;

      const matched = getMatchedVaccine(item.vaccine_name);
      if (matched) {
        if (matched.is_expired) itemErrors.expired = true;
        if (matched.is_out_of_stock || matched.quantity <= 0) itemErrors.outOfStock = true;
        if (qty > matched.quantity) itemErrors.quantityExceeded = true;
      }

      if (Object.keys(itemErrors).length > 0) {
        newErrors.items[item.id] = itemErrors;
      }
    });

    setVaccinationErrors(newErrors);

    if (newErrors.patient || Object.keys(newErrors.items).length > 0) {
      if (newErrors.patient) toast.error('Please select a patient.');
      else toast.error('Please complete all required fields and resolve inventory alerts.');
      return;
    }

    createVaccinationMutation.mutate(vaccinationItems);
  };

  const handleMedicationSubmit = (e) => {
    e.preventDefault();
    const newErrors = { items: {} };
    if (!medicationPatientId) newErrors.patient = true;

    medicationItems.forEach((item) => {
      const itemErrors = {};
      if (!item.name || !item.name.trim()) itemErrors.name = true;
      if (!item.dosage || !item.dosage.trim()) itemErrors.dosage = true;
      if (!item.end_date) itemErrors.end_date = true;

      const qty = parseInt(item.quantity, 10);
      if (!qty || qty < 1) itemErrors.quantity = true;

      const matched = getMatchedMedication(item.name);
      if (matched) {
        if (matched.is_expired) itemErrors.expired = true;
        if (matched.is_out_of_stock || matched.quantity <= 0) itemErrors.outOfStock = true;
        if (qty > matched.quantity) itemErrors.quantityExceeded = true;
      }

      if (Object.keys(itemErrors).length > 0) {
        newErrors.items[item.id] = itemErrors;
      }
    });

    setMedicationErrors(newErrors);

    if (newErrors.patient || Object.keys(newErrors.items).length > 0) {
      if (newErrors.patient) toast.error('Please select a patient.');
      else toast.error('Please complete all required fields and resolve inventory alerts.');
      return;
    }

    createMedicationMutation.mutate(medicationItems);
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

  const selectedPet = availablePets.find(p => p.id === (recordForm.pet_id || vaccinationPatientId || medicationPatientId || groomingForm.pet_id));

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
                  <Label className="text-sm font-medium">Attachment & Medical Results</Label>
                  <p className="text-xs text-gray-500 mt-0.5">Attach documents, lab reports, or take a live photo of physical results/tests.</p>

                  {(recordForm.file_urls && recordForm.file_urls.length > 0) ? (
                    <div className="mt-2 space-y-2">
                      <div className="flex items-center justify-between text-xs text-gray-600 px-1">
                        <span className="font-semibold text-teal-800">
                          Attached Results & Files ({recordForm.file_urls.length})
                        </span>
                        <span className="text-gray-400">Click preview to open in full tab</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {recordForm.file_urls.map((url, idx) => {
                          const isImg = url.match(/\.(jpg|jpeg|png|webp|gif)($|\?)/i);
                          const filename = url.split('/').pop()?.split('?')[0] || `Attachment ${idx + 1}`;
                          return (
                            <div
                              key={idx}
                              className="p-2.5 bg-teal-50/50 border border-teal-200 rounded-xl flex items-center justify-between gap-2.5"
                            >
                              <a
                                href={url}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center gap-2.5 min-w-0 flex-1 group"
                                title="Click to view file"
                              >
                                {isImg ? (
                                  <img
                                    src={url}
                                    alt={`Attachment ${idx + 1}`}
                                    className="w-12 h-12 object-cover rounded-lg border border-teal-200 shrink-0 bg-white group-hover:opacity-90 transition-opacity"
                                  />
                                ) : (
                                  <div className="w-12 h-12 bg-teal-100 text-teal-700 rounded-lg flex items-center justify-center shrink-0 border border-teal-200">
                                    <FileText className="w-6 h-6" />
                                  </div>
                                )}
                                <div className="min-w-0 flex-1">
                                  <p className="text-xs font-semibold text-gray-900 truncate group-hover:text-teal-700 transition-colors">
                                    {isImg ? `Photo ${idx + 1}` : filename}
                                  </p>
                                  <span className="text-[11px] text-teal-600 group-hover:underline block truncate">
                                    View file ↗
                                  </span>
                                </div>
                              </a>

                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setRecordForm(prev => {
                                    const nextUrls = (prev.file_urls || []).filter((_, i) => i !== idx);
                                    return {
                                      ...prev,
                                      file_urls: nextUrls,
                                      file_url: nextUrls[0] || ''
                                    };
                                  });
                                }}
                                className="h-8 w-8 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg shrink-0"
                                title="Remove this attachment"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          );
                        })}
                      </div>

                      {/* Add more buttons */}
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setIsCameraOpen(true)}
                          className="h-9 text-xs gap-1.5 border-teal-300 text-teal-800 hover:bg-teal-50"
                        >
                          <Camera className="w-3.5 h-3.5" />
                          Take Another Photo
                        </Button>

                        <label className="inline-flex">
                          <span className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md text-xs font-medium border border-dashed border-gray-300 bg-white hover:bg-gray-50 hover:border-gray-400 text-gray-700 cursor-pointer transition-colors shadow-2xs">
                            {isUploading ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin text-teal-600" />
                            ) : (
                              <Plus className="w-3.5 h-3.5" />
                            )}
                            Upload More Files
                          </span>
                          <input
                            type="file"
                            multiple
                            onChange={handleFileUpload}
                            className="hidden"
                            accept="image/*,.pdf,.doc,.docx"
                          />
                        </label>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                      {/* Live Camera Option */}
                      <button
                        type="button"
                        onClick={() => setIsCameraOpen(true)}
                        className="flex items-center gap-3.5 p-4 rounded-xl border-2 border-teal-200 bg-teal-50/70 hover:bg-teal-100 text-left transition-all group shadow-2xs hover:shadow-xs cursor-pointer"
                      >
                        <div className="w-11 h-11 rounded-xl bg-teal-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-teal-200 group-hover:scale-105 transition-transform">
                          <Camera className="w-5 h-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-gray-900 text-sm flex items-center justify-between">
                            <span>Take Live Photo</span>
                            <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-full bg-teal-200 text-teal-900">Live</span>
                          </div>
                          <p className="text-xs text-gray-600 mt-0.5">Use camera for test strips, lab results, or injuries</p>
                        </div>
                      </button>

                      {/* File Upload Option */}
                      <label className="flex items-center gap-3.5 p-4 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50/80 hover:bg-gray-100 hover:border-gray-400 text-left transition-all cursor-pointer group">
                        <div className="w-11 h-11 rounded-xl bg-gray-200 text-gray-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                          {isUploading ? (
                            <Loader2 className="w-5 h-5 animate-spin text-teal-600" />
                          ) : (
                            <Upload className="w-5 h-5" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-gray-900 text-sm">Upload Files / Images</div>
                          <p className="text-xs text-gray-500 mt-0.5">PDF, PNG, JPG (select one or multiple)</p>
                        </div>
                        <input
                          type="file"
                          multiple
                          onChange={handleFileUpload}
                          className="hidden"
                          accept="image/*,.pdf,.doc,.docx"
                        />
                      </label>
                    </div>
                  )}
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
              <form onSubmit={handleVaccinationSubmit} className="space-y-6">
                <div>
                  <Label className="text-sm font-medium">Patient *</Label>
                  <div className="relative mt-1.5">
                    <Select
                      value={vaccinationPatientId}
                      onValueChange={(v) => {
                        setVaccinationPatientId(v);
                        setVaccinationErrors(prev => ({ ...prev, patient: false }));
                      }}
                    >
                      <SelectTrigger className={cn(vaccinationErrors.patient ? "border-red-500 bg-red-50/10 focus:ring-red-500 [&>span]:pr-8" : "")}>
                        <SelectValue placeholder="Select patient" />
                      </SelectTrigger>
                      {vaccinationErrors.patient && (
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
                  {vaccinationErrors.patient && (
                    <p className="text-sm text-red-600 mt-1.5">Please select a patient.</p>
                  )}
                </div>

                {/* Repeater List of Vaccinations */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-semibold text-gray-800">
                      Vaccines Administered ({vaccinationItems.length})
                    </Label>
                    <span className="text-xs text-gray-500">Record all vaccines in one go</span>
                  </div>

                  {vaccinationItems.map((item, idx) => {
                    const itemErrors = vaccinationErrors.items?.[item.id] || {};
                    const matched = getMatchedVaccine(item.vaccine_name);
                    const suggestions = getVaccineSuggestions(item.vaccine_name);
                    const isQtyExceeded = matched && matched.quantity > 0 && (parseInt(item.quantity, 10) || 1) > matched.quantity;

                    return (
                      <div key={item.id} className="p-4 rounded-xl border border-gray-200 bg-white/70 shadow-xs space-y-4">
                        <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                          <span className="font-semibold text-sm text-teal-800 flex items-center gap-2">
                            <Syringe className="w-4 h-4 text-teal-600" />
                            Vaccine #{idx + 1} {item.vaccine_name ? `— ${item.vaccine_name}` : ''}
                          </span>
                          {vaccinationItems.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeVaccineItem(item.id)}
                              className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 px-2 gap-1 text-xs"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Remove
                            </Button>
                          )}
                        </div>

                        {/* Vaccine Name */}
                        <div>
                          <Label className="text-xs font-medium text-gray-700">Vaccine Name *</Label>
                          <div className="relative mt-1">
                            <Input
                              maxLength={200}
                              value={item.vaccine_name}
                              onFocus={() => setActiveVaccineSuggestionIdx(idx)}
                              onBlur={() => setTimeout(() => setActiveVaccineSuggestionIdx(null), 200)}
                              onChange={(e) => {
                                updateVaccineItem(item.id, 'vaccine_name', e.target.value);
                                setActiveVaccineSuggestionIdx(idx);
                              }}
                              placeholder="e.g., Rabies, DHPP, FVRCP"
                              className={cn(
                                matched ? "pr-36" : "pr-10",
                                itemErrors.vaccine_name ? "border-red-500 bg-red-50/10 focus-visible:ring-red-500" : ""
                              )}
                            />
                            {matched ? (
                              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center z-10 pointer-events-none">
                                {matched.is_expired ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-red-100 text-red-700 border border-red-200 shadow-xs">
                                    <AlertCircle className="w-3.5 h-3.5 text-red-600 flex-shrink-0" />
                                    Expired
                                  </span>
                                ) : (matched.is_out_of_stock || matched.quantity <= 0) ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-red-100 text-red-700 border border-red-200 shadow-xs">
                                    <AlertTriangle className="w-3.5 h-3.5 text-red-600 flex-shrink-0" />
                                    Out of stock (0)
                                  </span>
                                ) : matched.is_low_stock ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200 shadow-xs">
                                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                                    Low stock: {matched.quantity}
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200 shadow-xs">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                                    In stock: {matched.quantity}
                                  </span>
                                )}
                              </div>
                            ) : itemErrors.vaccine_name ? (
                              <AlertTriangle className="w-5 h-5 text-red-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                            ) : null}

                            {/* Suggestions */}
                            {activeVaccineSuggestionIdx === idx && suggestions.length > 0 && (
                              <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto divide-y divide-gray-100">
                                <div className="px-3 py-1.5 bg-gray-50 text-[11px] font-semibold text-gray-500 uppercase tracking-wider flex items-center justify-between">
                                  <span className="flex items-center gap-1.5">
                                    <Package className="w-3.5 h-3.5 text-teal-600" />
                                    Inventory Suggestions ({suggestions.length})
                                  </span>
                                  <span className="text-[10px] text-gray-400 font-normal">Click to autofill</span>
                                </div>
                                {suggestions.map((inv) => (
                                  <button
                                    type="button"
                                    key={inv.id}
                                    onMouseDown={(e) => {
                                      e.preventDefault();
                                      updateVaccineItem(item.id, 'vaccine_name', inv.name);
                                      if (inv.batch_number) {
                                        updateVaccineItem(item.id, 'batch_number', inv.batch_number);
                                      }
                                      setActiveVaccineSuggestionIdx(null);
                                    }}
                                    className="w-full text-left px-3.5 py-2.5 hover:bg-teal-50/50 transition-colors flex items-center justify-between gap-3 text-sm cursor-pointer"
                                  >
                                    <div className="min-w-0 flex-1">
                                      <p className="font-medium text-gray-900 truncate">{inv.name}</p>
                                      <p className="text-xs text-gray-500 truncate mt-0.5">
                                        {inv.batch_number ? `Batch: ${inv.batch_number}` : ''}
                                        {inv.batch_number && inv.manufacturer ? ' • ' : ''}
                                        {inv.manufacturer || ''}
                                        {inv.expiration_date ? ` • Exp: ${inv.expiration_date}` : ''}
                                      </p>
                                    </div>
                                    <div className="shrink-0">
                                      {inv.is_expired ? (
                                        <span className="px-2 py-0.5 text-[11px] font-semibold rounded bg-red-100 text-red-700 border border-red-200">
                                          Expired
                                        </span>
                                      ) : (inv.is_out_of_stock || inv.quantity <= 0) ? (
                                        <span className="px-2 py-0.5 text-[11px] font-semibold rounded bg-red-100 text-red-700 border border-red-200">
                                          0 in stock
                                        </span>
                                      ) : (
                                        <span className="px-2 py-0.5 text-[11px] font-semibold rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                                          In stock: {inv.quantity} {inv.unit || 'units'}
                                        </span>
                                      )}
                                    </div>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                          {itemErrors.vaccine_name && (
                            <p className="text-xs text-red-600 mt-1">Please enter a vaccine name.</p>
                          )}
                          {matched?.is_expired && (
                            <p className="text-xs text-red-600 mt-1 font-medium">Warning: This vaccine expired on {matched.expiration_date}.</p>
                          )}
                          {matched && !matched.is_expired && (matched.is_out_of_stock || matched.quantity <= 0) && (
                            <p className="text-xs text-red-600 mt-1 font-medium">Warning: This vaccine is out of stock (0 left in inventory).</p>
                          )}
                        </div>

                        {/* Dates & Quantity Stepper */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div>
                            <Label className="text-xs font-medium text-gray-700">Date Administered</Label>
                            <Input
                              type="date"
                              min={minCurrentYear}
                              max={maxCurrentYear}
                              value={item.date_administered}
                              onChange={(e) => updateVaccineItem(item.id, 'date_administered', e.target.value)}
                              className="mt-1 h-10"
                            />
                          </div>

                          <div>
                            <Label className="text-xs font-medium text-gray-700">
                              Next Due Date <span className="text-red-500">*</span>
                            </Label>
                            <div className="relative mt-1">
                              <Input
                                type="date"
                                min={minCurrentYear}
                                max={maxNextYear}
                                value={item.next_due_date}
                                onChange={(e) => updateVaccineItem(item.id, 'next_due_date', e.target.value)}
                                className={cn(
                                  "h-10",
                                  itemErrors.next_due_date ? "border-red-500 bg-red-50/10 focus-visible:ring-red-500 pr-10" : ""
                                )}
                              />
                              {itemErrors.next_due_date && (
                                <AlertTriangle className="w-4 h-4 text-red-500 absolute right-3 top-1/2 -translate-y-1/2" />
                              )}
                            </div>
                            {itemErrors.next_due_date && (
                              <p className="text-xs text-red-600 mt-1">Please select next due date.</p>
                            )}
                          </div>

                          <div>
                            <Label className="text-xs font-medium text-gray-700">
                              Administered Dose / Qty <span className="text-red-500">*</span>
                            </Label>
                            <div className="flex items-center gap-1.5 mt-1">
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                className="h-10 w-10 shrink-0 rounded-lg border-gray-300 hover:bg-gray-100 hover:text-gray-900 transition-colors"
                                onClick={() => {
                                  updateVaccineItem(item.id, 'quantity', Math.max(1, (parseInt(item.quantity, 10) || 1) - 1));
                                }}
                                disabled={item.quantity <= 1}
                                title="Decrease quantity"
                              >
                                <Minus className="w-4 h-4" />
                              </Button>

                              <div className={cn(
                                "relative flex-1 flex items-center justify-center gap-1.5 h-10 px-2 rounded-md border shadow-xs transition-colors bg-white focus-within:ring-2 focus-within:ring-teal-500 focus-within:border-teal-500",
                                isQtyExceeded || itemErrors.quantity ? "border-red-500 text-red-600 bg-red-50/10 focus-within:ring-red-500" : "border-gray-200"
                              )}>
                                <input
                                  type="number"
                                  min={1}
                                  max={matched ? matched.quantity : 9999}
                                  value={item.quantity}
                                  onChange={(e) => {
                                    const val = e.target.value === '' ? '' : Math.max(1, parseInt(e.target.value, 10) || 1);
                                    updateVaccineItem(item.id, 'quantity', val);
                                  }}
                                  style={{ width: `${Math.max(2, String(item.quantity || '').length) + 1}ch` }}
                                  className="text-right font-semibold text-base bg-transparent border-0 p-0 focus:outline-none focus:ring-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none text-gray-900 mr-1"
                                />
                                {matched?.unit && (
                                  <span className="text-xs text-gray-500 font-normal pointer-events-none select-none pl-0.5">
                                    {matched.unit}
                                  </span>
                                )}
                              </div>

                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                className="h-10 w-10 shrink-0 rounded-lg border-gray-300 hover:bg-teal-50 hover:text-teal-700 hover:border-teal-300 transition-colors"
                                onClick={() => {
                                  const current = parseInt(item.quantity, 10) || 1;
                                  const max = matched ? matched.quantity : 9999;
                                  updateVaccineItem(item.id, 'quantity', Math.min(max, current + 1));
                                }}
                                disabled={matched && item.quantity >= matched.quantity}
                                title="Increase quantity"
                              >
                                <Plus className="w-4 h-4" />
                              </Button>
                            </div>
                            {isQtyExceeded && (
                              <p className="text-xs text-red-600 mt-1 font-medium">
                                Exceeds stock ({matched.quantity} {matched.unit || 'in stock'}).
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Batch & Notes */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <Label className="text-xs font-medium text-gray-700">Batch / Lot Number</Label>
                            <Input
                              maxLength={100}
                              value={item.batch_number}
                              onKeyDown={(e) => {
                                if (e.key === ' ') e.preventDefault();
                              }}
                              onChange={(e) => updateVaccineItem(item.id, 'batch_number', e.target.value.replace(/\s+/g, '').toUpperCase())}
                              placeholder="e.g., RB-2026-09A"
                              className="mt-1 font-mono uppercase h-10"
                            />
                          </div>

                          <div>
                            <Label className="text-xs font-medium text-gray-700">Notes / Reaction</Label>
                            <Input
                              value={item.notes}
                              onChange={(e) => updateVaccineItem(item.id, 'notes', e.target.value)}
                              placeholder="Any reaction or booster notes..."
                              className="mt-1 h-10"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  <Button
                    type="button"
                    variant="outline"
                    onClick={addVaccineItem}
                    className="w-full border-dashed border-2 border-teal-300 text-teal-700 hover:bg-teal-50/60 hover:border-teal-400 h-11 font-medium flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add Another Vaccine
                  </Button>
                </div>

                <Button 
                  type="submit" 
                  disabled={createVaccinationMutation.isPending || isAnyVaccineBlocked} 
                  className={cn(
                    "w-full h-12 font-medium shadow-sm transition-colors text-white",
                    isAnyVaccineBlocked ? "bg-gray-400 hover:bg-gray-400 cursor-not-allowed opacity-80" : "bg-teal-600 hover:bg-teal-700"
                  )}
                >
                  {createVaccinationMutation.isPending ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : isAnyVaccineBlocked ? (
                    'Cannot Save (Check Out of Stock / Expired / Quantity in Vaccines)'
                  ) : (
                    `Record ${vaccinationItems.length === 1 ? 'Vaccination' : `All ${vaccinationItems.length} Vaccinations`} (Auto-deduct from Inventory)`
                  )}
                </Button>
              </form>
            </TabsContent>

            {/* Medication Form */}
            <TabsContent value="medication">
              <form onSubmit={handleMedicationSubmit} className="space-y-6">
                <div>
                  <Label className="text-sm font-medium">Patient *</Label>
                  <div className="relative mt-1.5">
                    <Select
                      value={medicationPatientId}
                      onValueChange={(v) => {
                        setMedicationPatientId(v);
                        setMedicationErrors(prev => ({ ...prev, patient: false }));
                      }}
                    >
                      <SelectTrigger className={cn(medicationErrors.patient ? "border-red-500 bg-red-50/10 focus:ring-red-500 [&>span]:pr-8" : "")}>
                        <SelectValue placeholder="Select patient" />
                      </SelectTrigger>
                      {medicationErrors.patient && (
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
                  {medicationErrors.patient && (
                    <p className="text-sm text-red-600 mt-1.5">Please select a patient.</p>
                  )}
                </div>

                {/* Repeater List of Medications */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-semibold text-gray-800">
                      Prescribed Medications ({medicationItems.length})
                    </Label>
                    <span className="text-xs text-gray-500">Prescribe multiple medications in one go</span>
                  </div>

                  {medicationItems.map((item, idx) => {
                    const itemErrors = medicationErrors.items?.[item.id] || {};
                    const matched = getMatchedMedication(item.name);
                    const suggestions = getMedicationSuggestions(item.name);
                    const isQtyExceeded = matched && matched.quantity > 0 && (parseInt(item.quantity, 10) || 1) > matched.quantity;

                    return (
                      <div key={item.id} className="p-4 rounded-xl border border-gray-200 bg-white/70 shadow-xs space-y-4">
                        <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                          <span className="font-semibold text-sm text-teal-800 flex items-center gap-2">
                            <Pill className="w-4 h-4 text-teal-600" />
                            Medication #{idx + 1} {item.name ? `— ${item.name}` : ''}
                          </span>
                          {medicationItems.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeMedicationItem(item.id)}
                              className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 px-2 gap-1 text-xs"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Remove
                            </Button>
                          )}
                        </div>

                        {/* Medication Name */}
                        <div>
                          <Label className="text-xs font-medium text-gray-700">Medication Name *</Label>
                          <div className="relative mt-1">
                            <Input
                              maxLength={200}
                              value={item.name}
                              onFocus={() => setActiveMedicationSuggestionIdx(idx)}
                              onBlur={() => setTimeout(() => setActiveMedicationSuggestionIdx(null), 200)}
                              onChange={(e) => {
                                updateMedicationItem(item.id, 'name', e.target.value);
                                setActiveMedicationSuggestionIdx(idx);
                              }}
                              placeholder="e.g., Clavamox, Metacam, NexGard"
                              className={cn(
                                matched ? "pr-36" : "pr-10",
                                itemErrors.name ? "border-red-500 bg-red-50/10 focus-visible:ring-red-500" : ""
                              )}
                            />
                            {matched ? (
                              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center z-10 pointer-events-none">
                                {matched.is_expired ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-red-100 text-red-700 border border-red-200 shadow-xs">
                                    <AlertCircle className="w-3.5 h-3.5 text-red-600 flex-shrink-0" />
                                    Expired
                                  </span>
                                ) : (matched.is_out_of_stock || matched.quantity <= 0) ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-red-100 text-red-700 border border-red-200 shadow-xs">
                                    <AlertTriangle className="w-3.5 h-3.5 text-red-600 flex-shrink-0" />
                                    Out of stock (0)
                                  </span>
                                ) : matched.is_low_stock ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200 shadow-xs">
                                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                                    Low stock: {matched.quantity}
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200 shadow-xs">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                                    In stock: {matched.quantity}
                                  </span>
                                )}
                              </div>
                            ) : itemErrors.name ? (
                              <AlertTriangle className="w-5 h-5 text-red-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                            ) : null}

                            {/* Suggestions */}
                            {activeMedicationSuggestionIdx === idx && suggestions.length > 0 && (
                              <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto divide-y divide-gray-100">
                                <div className="px-3 py-1.5 bg-gray-50 text-[11px] font-semibold text-gray-500 uppercase tracking-wider flex items-center justify-between">
                                  <span className="flex items-center gap-1.5">
                                    <Package className="w-3.5 h-3.5 text-teal-600" />
                                    Inventory Suggestions ({suggestions.length})
                                  </span>
                                  <span className="text-[10px] text-gray-400 font-normal">Click to autofill</span>
                                </div>
                                {suggestions.map((inv) => (
                                  <button
                                    type="button"
                                    key={inv.id}
                                    onMouseDown={(e) => {
                                      e.preventDefault();
                                      updateMedicationItem(item.id, 'name', inv.name);
                                      setActiveMedicationSuggestionIdx(null);
                                    }}
                                    className="w-full text-left px-3.5 py-2.5 hover:bg-teal-50/50 transition-colors flex items-center justify-between gap-3 text-sm cursor-pointer"
                                  >
                                    <div className="min-w-0 flex-1">
                                      <p className="font-medium text-gray-900 truncate">{inv.name}</p>
                                      <p className="text-xs text-gray-500 truncate mt-0.5">
                                        {inv.category ? `${inv.category}` : ''}
                                        {inv.category && inv.manufacturer ? ' • ' : ''}
                                        {inv.manufacturer || ''}
                                        {inv.expiration_date ? ` • Exp: ${inv.expiration_date}` : ''}
                                      </p>
                                    </div>
                                    <div className="shrink-0">
                                      {inv.is_expired ? (
                                        <span className="px-2 py-0.5 text-[11px] font-semibold rounded bg-red-100 text-red-700 border border-red-200">
                                          Expired
                                        </span>
                                      ) : (inv.is_out_of_stock || inv.quantity <= 0) ? (
                                        <span className="px-2 py-0.5 text-[11px] font-semibold rounded bg-red-100 text-red-700 border border-red-200">
                                          0 in stock
                                        </span>
                                      ) : (
                                        <span className="px-2 py-0.5 text-[11px] font-semibold rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                                          In stock: {inv.quantity} {inv.unit || 'units'}
                                        </span>
                                      )}
                                    </div>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                          {itemErrors.name && (
                            <p className="text-xs text-red-600 mt-1">Please enter a medication name.</p>
                          )}
                          {matched?.is_expired && (
                            <p className="text-xs text-red-600 mt-1 font-medium">Warning: This medication expired on {matched.expiration_date}.</p>
                          )}
                          {matched && !matched.is_expired && (matched.is_out_of_stock || matched.quantity <= 0) && (
                            <p className="text-xs text-red-600 mt-1 font-medium">Warning: This medication is out of stock (0 left in inventory).</p>
                          )}
                        </div>

                        {/* Dosage, Frequency & Quantity */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <Label className="text-xs font-medium text-gray-700">
                              Dosage <span className="text-red-500">*</span>
                            </Label>
                            <div className="relative mt-1">
                              <Input
                                maxLength={100}
                                value={item.dosage}
                                onChange={(e) => updateMedicationItem(item.id, 'dosage', e.target.value)}
                                placeholder="e.g., 250mg"
                                className={cn(
                                  "h-10",
                                  itemErrors.dosage ? "border-red-500 bg-red-50/10 focus-visible:ring-red-500 pr-10" : ""
                                )}
                              />
                              {itemErrors.dosage && (
                                <AlertTriangle className="w-4 h-4 text-red-500 absolute right-3 top-1/2 -translate-y-1/2" />
                              )}
                            </div>
                            {itemErrors.dosage && (
                              <p className="text-xs text-red-600 mt-1">Please enter a dosage.</p>
                            )}
                          </div>

                          <div>
                            <Label className="text-xs font-medium text-gray-700">Frequency</Label>
                            <Input
                              maxLength={100}
                              value={item.frequency}
                              onChange={(e) => updateMedicationItem(item.id, 'frequency', e.target.value)}
                              placeholder="e.g., Twice daily"
                              className="mt-1 h-10"
                            />
                          </div>

                          <div>
                            <Label className="text-xs font-medium text-gray-700">
                              Prescribed Quantity <span className="text-red-500">*</span>
                            </Label>
                            <div className="flex items-center gap-1.5 mt-1">
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                className="h-10 w-10 shrink-0 rounded-lg border-gray-300 hover:bg-gray-100 hover:text-gray-900 transition-colors"
                                onClick={() => {
                                  updateMedicationItem(item.id, 'quantity', Math.max(1, (parseInt(item.quantity, 10) || 1) - 1));
                                }}
                                disabled={item.quantity <= 1}
                                title="Decrease quantity"
                              >
                                <Minus className="w-4 h-4" />
                              </Button>

                              <div className={cn(
                                "relative flex-1 flex items-center justify-center gap-1.5 h-10 px-2 rounded-md border shadow-xs transition-colors bg-white focus-within:ring-2 focus-within:ring-teal-500 focus-within:border-teal-500",
                                isQtyExceeded || itemErrors.quantity ? "border-red-500 text-red-600 bg-red-50/10 focus-within:ring-red-500" : "border-gray-200"
                              )}>
                                <input
                                  type="number"
                                  min={1}
                                  max={matched ? matched.quantity : 9999}
                                  value={item.quantity}
                                  onChange={(e) => {
                                    const val = e.target.value === '' ? '' : Math.max(1, parseInt(e.target.value, 10) || 1);
                                    updateMedicationItem(item.id, 'quantity', val);
                                  }}
                                  style={{ width: `${Math.max(2, String(item.quantity || '').length) + 1}ch` }}
                                  className="text-right font-semibold text-base bg-transparent border-0 p-0 focus:outline-none focus:ring-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none text-gray-900 mr-1"
                                />
                                {matched?.unit && (
                                  <span className="text-xs text-gray-500 font-normal pointer-events-none select-none pl-0.5">
                                    {matched.unit}
                                  </span>
                                )}
                              </div>

                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                className="h-10 w-10 shrink-0 rounded-lg border-gray-300 hover:bg-teal-50 hover:text-teal-700 hover:border-teal-300 transition-colors"
                                onClick={() => {
                                  const current = parseInt(item.quantity, 10) || 1;
                                  const max = matched ? matched.quantity : 9999;
                                  updateMedicationItem(item.id, 'quantity', Math.min(max, current + 1));
                                }}
                                disabled={matched && item.quantity >= matched.quantity}
                                title="Increase quantity"
                              >
                                <Plus className="w-4 h-4" />
                              </Button>
                            </div>
                            {isQtyExceeded && (
                              <p className="text-xs text-red-600 mt-1 font-medium">
                                Prescribed quantity exceeds available inventory ({matched.quantity} {matched.unit || 'in stock'}).
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Dates & Instructions */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <Label className="text-xs font-medium text-gray-700">Start Date</Label>
                            <Input
                              type="date"
                              min={minCurrentYear}
                              max={maxCurrentYear}
                              value={item.start_date}
                              onChange={(e) => updateMedicationItem(item.id, 'start_date', e.target.value)}
                              className="mt-1 h-10"
                            />
                          </div>

                          <div>
                            <Label className="text-xs font-medium text-gray-700">
                              End Date <span className="text-red-500">*</span>
                            </Label>
                            <div className="relative mt-1">
                              <Input
                                type="date"
                                min={item.start_date || minCurrentYear}
                                max={maxNextYear}
                                value={item.end_date}
                                onChange={(e) => updateMedicationItem(item.id, 'end_date', e.target.value)}
                                className={cn(
                                  "h-10",
                                  itemErrors.end_date ? "border-red-500 bg-red-50/10 focus-visible:ring-red-500 pr-10" : ""
                                )}
                              />
                              {itemErrors.end_date && (
                                <AlertTriangle className="w-4 h-4 text-red-500 absolute right-3 top-1/2 -translate-y-1/2" />
                              )}
                            </div>
                            {itemErrors.end_date && (
                              <p className="text-xs text-red-600 mt-1">Please select an end date.</p>
                            )}
                          </div>
                        </div>

                        <div>
                          <Label className="text-xs font-medium text-gray-700">Instructions / Notes</Label>
                          <Input
                            value={item.notes}
                            onChange={(e) => updateMedicationItem(item.id, 'notes', e.target.value)}
                            placeholder="Special instructions (e.g., Take after food)..."
                            className="mt-1 h-10"
                          />
                        </div>
                      </div>
                    );
                  })}

                  <Button
                    type="button"
                    variant="outline"
                    onClick={addMedicationItem}
                    className="w-full border-dashed border-2 border-teal-300 text-teal-700 hover:bg-teal-50/60 hover:border-teal-400 h-11 font-medium flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add Another Medication
                  </Button>
                </div>

                <Button 
                  type="submit" 
                  disabled={createMedicationMutation.isPending || isAnyMedicationBlocked} 
                  className={cn(
                    "w-full h-12 font-medium shadow-sm transition-colors text-white",
                    isAnyMedicationBlocked ? "bg-gray-400 hover:bg-gray-400 cursor-not-allowed opacity-80" : "bg-teal-600 hover:bg-teal-700"
                  )}
                >
                  {createMedicationMutation.isPending ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : isAnyMedicationBlocked ? (
                    'Cannot Save (Check Out of Stock / Expired / Quantity in Medications)'
                  ) : (
                    `Prescribe ${medicationItems.length === 1 ? 'Medication' : `All ${medicationItems.length} Medications`} (Auto-deduct from Inventory)`
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

    {/* Live Camera Modal */}
    <LiveCameraCaptureModal
      isOpen={isCameraOpen}
      onClose={() => setIsCameraOpen(false)}
      onPhotoCaptured={(url) => {
        setRecordForm(prev => {
          const nextUrls = [...(prev.file_urls || []), url];
          return {
            ...prev,
            file_urls: nextUrls,
            file_url: nextUrls[0] || url
          };
        });
        toast.success("Photo captured and attached!");
      }}
      title="Capture Medical Result Photo"
    />
    </VetSidebar>
  );
}