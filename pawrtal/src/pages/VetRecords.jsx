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
  ChevronLeft,
  AlertTriangle
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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

const recordTypeColors = {
  lab_result: 'bg-blue-100 text-blue-700',
  prescription: 'bg-green-100 text-green-700',
  diagnosis: 'bg-purple-100 text-purple-700',
  treatment: 'bg-teal-100 text-teal-700',
  surgery: 'bg-red-100 text-red-700',
  imaging: 'bg-indigo-100 text-indigo-700',
  dental: 'bg-pink-100 text-pink-700',
  other: 'bg-gray-100 text-gray-700',
};

const speciesIcons = {
  dog: Dog,
  cat: Cat,
  bird: Bird,
  rabbit: Rabbit,
  fish: Fish,
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
    queryKey: ['allPets'],
    queryFn: () => api.entities.Pet.list(),
    enabled: !!user,
  });

  const { data: records = [], isLoading } = useQuery({
    queryKey: ['allHealthRecords'],
    queryFn: () => api.entities.HealthRecord.list('-date', 100),
    enabled: !!user,
  });

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

  const filteredRecords = records.filter(record => {
    const pet = getPet(record.pet_id);
    const matchesSearch = 
      record.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pet?.name?.toLowerCase().includes(searchTerm.toLowerCase());
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
        <Card className="border-dashed border-2">
          <EmptyState
            icon={FileText}
            title="No records found"
            description={searchTerm ? "Try adjusting your search" : "Add your first health record"}
            actionLabel="Add Record"
            onAction={() => setIsDialogOpen(true)}
          />
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredRecords.map((record) => {
            const pet = getPet(record.pet_id);
            const Icon = pet ? speciesIcons[pet.species] || Dog : Dog;
            
            return (
              <Card key={record.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-teal-100 flex items-center justify-center">
                        <FileText className="w-6 h-6 text-teal-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-gray-900">{record.title}</h4>
                          <Badge className={recordTypeColors[record.record_type]}>
                            {record.record_type.replace('_', ' ')}
                          </Badge>
                          {!record.is_visible_to_owner && (
                            <Badge variant="outline" className="bg-gray-50">Hidden from owner</Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-500">
                          {pet?.name || 'Unknown pet'} • {format(new Date(record.date + 'T00:00:00'), 'MMMM d, yyyy')}
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