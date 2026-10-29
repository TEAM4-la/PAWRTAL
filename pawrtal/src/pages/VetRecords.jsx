import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import EmptyState from "@/components/shared/EmptyState";
import VetSidebar from '@/components/layout/VetSidebar';
import { 
  Plus, 
  FileText, 
  Upload, 
  Loader2, 
  Search,
  Filter,
  Dog,
  Cat,
  Bird,
  Rabbit,
  Fish,
  ExternalLink,
  Syringe,
  Pill,
  Scissors,
  ChevronLeft,
  AlertTriangle
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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

const recordTypeColors = {
  diagnosis: 'bg-purple-100 text-purple-700',
  treatment: 'bg-teal-100 text-teal-700',
  prescription: 'bg-green-100 text-green-700',
  vaccination: 'bg-indigo-100 text-indigo-700',
  medication: 'bg-emerald-100 text-emerald-700',
  grooming: 'bg-amber-100 text-amber-700',
  lab_result: 'bg-blue-100 text-blue-700',
  surgery: 'bg-red-100 text-red-700',
  other: 'bg-gray-100 text-gray-700',
};

const speciesIcons = {
  dog: Dog,
  cat: Cat,
  bird: Bird,
  rabbit: Rabbit,
  fish: Fish,
};

const getTypeIcon = (type) => {
  switch (type) {
    case 'medication':
      return Pill;
    case 'vaccination':
      return Syringe;
    case 'grooming':
      return Scissors;
    default:
      return FileText;
  }
};

const formatDateSafe = (dateStr) => {
  if (!dateStr) return '';
  try {
    const raw = String(dateStr).includes('T') ? String(dateStr).split('T')[0] : String(dateStr);
    const d = new Date(raw + 'T00:00:00');
    return isNaN(d.getTime()) ? dateStr : format(d, 'MMMM d, yyyy');
  } catch {
    return dateStr;
  }
};

export default function VetRecords() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [formData, setFormData] = useState({
    pet_id: '',
    record_type: 'diagnosis',
    title: '',
    description: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    file_url: '',
    is_visible_to_owner: true,
  });
  const [errors, setErrors] = useState({});

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => api.auth.me(),
  });

  const { data: pets = [] } = useQuery({
    queryKey: ['vetConnectedPets', user?.email],
    queryFn: () => api.entities.Pet.list(),
    enabled: !!user,
  });

  const { data: records = [], isLoading: recordsLoading } = useQuery({
    queryKey: ['allHealthRecords'],
    queryFn: () => api.entities.HealthRecord.list('-date', 100),
    enabled: !!user,
  });

  const { data: medications = [], isLoading: medsLoading } = useQuery({
    queryKey: ['allMedications'],
    queryFn: () => api.entities.Medication.filter({}, '-start_date', 100),
    enabled: !!user,
  });

  const { data: vaccinations = [], isLoading: vaxLoading } = useQuery({
    queryKey: ['allVaccinations'],
    queryFn: () => api.entities.Vaccination.filter({}, '-date_administered', 100),
    enabled: !!user,
  });

  const { data: groomingRecords = [], isLoading: groomLoading } = useQuery({
    queryKey: ['allGroomingRecords'],
    queryFn: () => api.entities.GroomingRecord.list('-date', 100),
    enabled: !!user,
  });

  const isLoading = recordsLoading || medsLoading || vaxLoading || groomLoading;

  const createMutation = useMutation({
    mutationFn: (data) => api.entities.HealthRecord.create({
      ...data,
      vet_email: user?.email,
      vet_name: user?.full_name,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allHealthRecords'] });
      queryClient.invalidateQueries({ queryKey: ['healthRecords'] });
      setIsDialogOpen(false);
      resetForm();
      toast.success('Record added successfully!');
    }
  });

  const resetForm = () => {
    setFormData({
      pet_id: '',
      record_type: 'diagnosis',
      title: '',
      description: '',
      date: format(new Date(), 'yyyy-MM-dd'),
      file_url: '',
      is_visible_to_owner: true,
    });
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const { file_url } = await api.integrations.Core.UploadFile({ file });
      setFormData(prev => ({ ...prev, file_url }));
      toast.success('File uploaded!');
    } catch (error) {
      toast.error('Failed to upload file');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!formData.pet_id) newErrors.pet_id = true;
    if (!formData.title) newErrors.title = true;

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      return;
    }
    createMutation.mutate(formData);
  };

  const getPetName = (petId) => {
    const pet = pets.find(p => p.id === petId);
    return pet?.name || 'Unknown';
  };

  const getPet = (petId) => {
    return pets.find(p => p.id === petId);
  };

  const allCombinedRecords = React.useMemo(() => {
    const list = [...records];

    medications.forEach(m => {
      list.push({
        id: `med-${m.id}`,
        pet_id: m.pet_id,
        record_type: 'medication',
        title: m.dosage ? `${m.name} (${m.dosage})` : m.name,
        description: [m.frequency, m.notes].filter(Boolean).join(' • '),
        date: m.start_date,
        vet_name: m.prescribed_by,
        is_visible_to_owner: true,
      });
    });

    vaccinations.forEach(v => {
      list.push({
        id: `vax-${v.id}`,
        pet_id: v.pet_id,
        record_type: 'vaccination',
        title: v.vaccine_name,
        description: [v.batch_number ? `Batch: ${v.batch_number}` : null, v.notes].filter(Boolean).join(' • '),
        date: v.date_administered,
        vet_name: v.administered_by,
        is_visible_to_owner: true,
      });
    });

    groomingRecords.forEach(g => {
      list.push({
        id: `groom-${g.id}`,
        pet_id: g.pet_id,
        record_type: 'grooming',
        title: g.grooming_type || 'Grooming',
        description: [g.coat_style_notes, g.observations].filter(Boolean).join(' • '),
        date: g.date,
        vet_name: g.groomer_name,
        is_visible_to_owner: g.is_visible_to_owner ?? true,
      });
    });

    return list.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
  }, [records, medications, vaccinations, groomingRecords]);

  const connectedPetIdSet = React.useMemo(() => new Set(pets.map(p => p.id)), [pets]);

  const filteredRecords = allCombinedRecords.filter(record => {
    // Only show records for pets connected to this vet, or records authored by this vet
    const isMyPet = connectedPetIdSet.has(record.pet_id);
    const isMyRecord = (record.vet_name && user?.full_name && record.vet_name.toLowerCase() === user.full_name.toLowerCase()) ||
                       (record.vet_email && user?.email && record.vet_email.toLowerCase() === user.email.toLowerCase());
    if (!isMyPet && !isMyRecord) return false;

    const pet = getPet(record.pet_id);
    const matchesSearch = 
      record.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pet?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || record.record_type === typeFilter;
    return matchesSearch && matchesType;
  });

  const content = (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      <button onClick={() => navigate(createPageUrl('VetDashboard'))} className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-teal-700 transition-colors mb-2">
        <ChevronLeft className="w-4 h-4" /> Back
      </button>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Health Records</h1>
          <p className="text-gray-500 mt-1">Manage patient medical records</p>
        </div>
        <Button onClick={() => navigate(createPageUrl('VetAddRecord'))} className="bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white gap-2">
          <Plus className="w-5 h-5" />
          Add Record
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search records..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {recordTypes.map(type => (
              <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Records List */}
      {filteredRecords.length === 0 ? (
        <Card className="border-dashed border-2 border-gray-300 bg-white">
          <EmptyState
            icon={FileText}
            title="No records found"
            colorScheme="teal"
            description={searchTerm ? "Try adjusting your search" : "Add your first health record"}
            actionLabel="Add Record"
            onAction={() => navigate(createPageUrl('VetAddRecord'))}
          />
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredRecords.map((record) => {
            const pet = getPet(record.pet_id);
            const Icon = pet ? speciesIcons[pet.species] || Dog : Dog;
            
            const RecordIcon = getTypeIcon(record.record_type);
            const iconColorClass = 
              record.record_type === 'medication' ? 'bg-emerald-100 text-emerald-600' :
              record.record_type === 'vaccination' ? 'bg-indigo-100 text-indigo-600' :
              record.record_type === 'grooming' ? 'bg-amber-100 text-amber-600' :
              record.record_type === 'surgery' ? 'bg-red-100 text-red-600' :
              record.record_type === 'lab_result' ? 'bg-blue-100 text-blue-600' :
              'bg-teal-100 text-teal-600';

            return (
              <Card key={record.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center shrink-0", iconColorClass)}>
                        <RecordIcon className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h4 className="font-semibold text-gray-900">{record.title}</h4>
                          <Badge className={recordTypeColors[record.record_type] || 'bg-gray-100 text-gray-700'}>
                            {record.record_type.replace('_', ' ')}
                          </Badge>
                          {!record.is_visible_to_owner && (
                            <Badge variant="outline" className="bg-gray-50 text-xs">Hidden from owner</Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-500">
                          {pet?.name || 'Unknown pet'} • {formatDateSafe(record.date)}
                          {record.vet_name && (
                            <span className="text-gray-400"> • {record.vet_name}</span>
                          )}
                        </p>
                        {record.description && (
                          <p className="text-sm text-gray-600 mt-2 line-clamp-2">{record.description}</p>
                        )}
                      </div>
                    </div>
                    {record.file_url && (
                      <a href={record.file_url} target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" size="sm" className="gap-2">
                          <ExternalLink className="w-4 h-4" />
                          View
                        </Button>
                      </a>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );

  if (isLoading) {
    return (
      <VetSidebar user={user}>
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </VetSidebar>
    );
  }

  return (
    <VetSidebar user={user}>
      {content}
    </VetSidebar>
  );
}