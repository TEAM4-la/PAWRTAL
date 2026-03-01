import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from "@/utils";
import { base44 } from '@/api/base44Client';
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
  ChevronLeft
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

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: pets = [] } = useQuery({
    queryKey: ['allPets'],
    queryFn: () => base44.entities.Pet.list(),
    enabled: !!user,
  });

  const { data: records = [], isLoading } = useQuery({
    queryKey: ['allHealthRecords'],
    queryFn: () => base44.entities.HealthRecord.list('-date', 100),
    enabled: !!user,
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.HealthRecord.create({
      ...data,
      vet_email: user?.email,
      vet_name: user?.full_name,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['allHealthRecords']);
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
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
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
    if (!formData.pet_id || !formData.title) {
      toast.error('Please fill in required fields');
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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-teal-700 transition-colors mb-2">
        <ChevronLeft className="w-4 h-4" /> Back
      </button>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Health Records</h1>
          <p className="text-gray-500 mt-1">Manage patient medical records</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 gap-2">
              <Plus className="w-5 h-5" />
              Add Record
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Add Health Record</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-5 pt-4">
              <div>
                <Label className="text-sm font-medium">Patient *</Label>
                <Select value={formData.pet_id} onValueChange={(v) => setFormData({...formData, pet_id: v})}>
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
                  <Select value={formData.record_type} onValueChange={(v) => setFormData({...formData, record_type: v})}>
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
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                    className="mt-1.5"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="title" className="text-sm font-medium">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  placeholder="e.g., Annual checkup results"
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label htmlFor="description" className="text-sm font-medium">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Enter detailed notes..."
                  className="mt-1.5 min-h-[100px]"
                />
              </div>

              <div>
                <Label className="text-sm font-medium">Attachment</Label>
                <div className="mt-1.5 flex items-center gap-3">
                  <label className="flex-1">
                    <div className="flex items-center justify-center px-4 py-3 border-2 border-dashed border-gray-200 rounded-lg cursor-pointer hover:border-teal-300 transition-colors">
                      {isUploading ? (
                        <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                      ) : formData.file_url ? (
                        <span className="text-sm text-teal-600">File attached ✓</span>
                      ) : (
                        <span className="text-sm text-gray-500 flex items-center gap-2">
                          <Upload className="w-4 h-4" />
                          Upload file
                        </span>
                      )}
                    </div>
                    <input
                      type="file"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900 text-sm">Visible to Owner</p>
                  <p className="text-xs text-gray-500">Owner can view this record</p>
                </div>
                <Switch
                  checked={formData.is_visible_to_owner}
                  onCheckedChange={(checked) => setFormData({...formData, is_visible_to_owner: checked})}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="flex-1">
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending} className="flex-1 bg-teal-600 hover:bg-teal-700">
                  {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Record'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
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
                          {pet?.name || 'Unknown pet'} • {format(new Date(record.date), 'MMMM d, yyyy')}
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
}