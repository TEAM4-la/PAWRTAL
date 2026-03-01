import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from "@/utils";
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Upload, Dog, Cat, Bird, Rabbit, Fish, Loader2, X, Plus } from 'lucide-react';
import { toast } from "sonner";

const speciesOptions = [
  { value: 'dog', label: 'Dog', icon: Dog },
  { value: 'cat', label: 'Cat', icon: Cat },
  { value: 'bird', label: 'Bird', icon: Bird },
  { value: 'rabbit', label: 'Rabbit', icon: Rabbit },
  { value: 'hamster', label: 'Hamster', icon: null },
  { value: 'fish', label: 'Fish', icon: Fish },
  { value: 'reptile', label: 'Reptile', icon: null },
  { value: 'other', label: 'Other', icon: null },
];

export default function EditPet() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const petId = urlParams.get('id');
  
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState(null);
  const [newAllergy, setNewAllergy] = useState('');
  const [newCondition, setNewCondition] = useState('');

  const { data: pet, isLoading } = useQuery({
    queryKey: ['pet', petId],
    queryFn: () => base44.entities.Pet.filter({ id: petId }),
    enabled: !!petId,
    select: (data) => data[0],
  });

  useEffect(() => {
    if (pet && !formData) {
      setFormData({
        name: pet.name || '',
        species: pet.species || '',
        breed: pet.breed || '',
        date_of_birth: pet.date_of_birth || '',
        gender: pet.gender || '',
        weight: pet.weight || '',
        color: pet.color || '',
        microchip_id: pet.microchip_id || '',
        photo_url: pet.photo_url || '',
        allergies: pet.allergies || [],
        medical_conditions: pet.medical_conditions || [],
        is_neutered: pet.is_neutered || false,
      });
    }
  }, [pet, formData]);

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.Pet.update(petId, {
      ...data,
      weight: data.weight ? parseFloat(data.weight) : null,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['pet', petId]);
      toast.success('Pet updated successfully!');
      navigate(createPageUrl(`PetProfile?id=${petId}`));
    },
    onError: () => {
      toast.error('Failed to update pet');
    }
  });

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData(prev => ({ ...prev, photo_url: file_url }));
      toast.success('Photo uploaded!');
    } catch (error) {
      toast.error('Failed to upload photo');
    } finally {
      setIsUploading(false);
    }
  };

  const addAllergy = () => {
    if (newAllergy.trim()) {
      setFormData(prev => ({
        ...prev,
        allergies: [...prev.allergies, newAllergy.trim()]
      }));
      setNewAllergy('');
    }
  };

  const removeAllergy = (index) => {
    setFormData(prev => ({
      ...prev,
      allergies: prev.allergies.filter((_, i) => i !== index)
    }));
  };

  const addCondition = () => {
    if (newCondition.trim()) {
      setFormData(prev => ({
        ...prev,
        medical_conditions: [...prev.medical_conditions, newCondition.trim()]
      }));
      setNewCondition('');
    }
  };

  const removeCondition = (index) => {
    setFormData(prev => ({
      ...prev,
      medical_conditions: prev.medical_conditions.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.species) {
      toast.error('Please fill in required fields');
      return;
    }
    updateMutation.mutate(formData);
  };

  if (isLoading || !formData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto">
      <Button
        variant="ghost"
        onClick={() => navigate(-1)}
        className="mb-6 gap-2 text-gray-600"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </Button>

      <Card className="border-0 shadow-lg">
        <CardHeader className="border-b bg-gradient-to-r from-teal-50 to-orange-50">
          <CardTitle className="text-2xl">Edit {pet?.name}</CardTitle>
          <p className="text-gray-500">Update your pet's information</p>
        </CardHeader>

        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Photo Upload */}
            <div className="flex flex-col items-center">
              <div className="relative">
                <div className="w-32 h-32 rounded-full overflow-hidden bg-gradient-to-br from-teal-100 to-orange-100 flex items-center justify-center border-4 border-white shadow-lg">
                  {formData.photo_url ? (
                    <img src={formData.photo_url} alt="Pet" className="w-full h-full object-cover" />
                  ) : (
                    <Dog className="w-12 h-12 text-teal-300" />
                  )}
                </div>
                <label className="absolute bottom-0 right-0 w-10 h-10 rounded-full bg-teal-500 flex items-center justify-center cursor-pointer hover:bg-teal-600 transition-colors shadow-md">
                  {isUploading ? (
                    <Loader2 className="w-5 h-5 text-white animate-spin" />
                  ) : (
                    <Upload className="w-5 h-5 text-white" />
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </label>
              </div>
              <p className="text-sm text-gray-500 mt-3">Click to change photo</p>
            </div>

            {/* Basic Info */}
            <div className="grid sm:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="name" className="text-sm font-medium">
                  Pet Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-1.5 h-11"
                />
              </div>

              <div>
                <Label className="text-sm font-medium">
                  Species <span className="text-red-500">*</span>
                </Label>
                <Select value={formData.species} onValueChange={(v) => setFormData({ ...formData, species: v })}>
                  <SelectTrigger className="mt-1.5 h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {speciesOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="breed" className="text-sm font-medium">Breed</Label>
                <Input
                  id="breed"
                  value={formData.breed}
                  onChange={(e) => setFormData({ ...formData, breed: e.target.value })}
                  className="mt-1.5 h-11"
                />
              </div>

              <div>
                <Label htmlFor="dob" className="text-sm font-medium">Date of Birth</Label>
                <Input
                  id="dob"
                  type="date"
                  value={formData.date_of_birth}
                  onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                  className="mt-1.5 h-11"
                />
              </div>

              <div>
                <Label className="text-sm font-medium">Gender</Label>
                <Select value={formData.gender} onValueChange={(v) => setFormData({ ...formData, gender: v })}>
                  <SelectTrigger className="mt-1.5 h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="weight" className="text-sm font-medium">Weight (kg)</Label>
                <Input
                  id="weight"
                  type="number"
                  step="0.1"
                  value={formData.weight}
                  onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                  className="mt-1.5 h-11"
                />
              </div>

              <div>
                <Label htmlFor="color" className="text-sm font-medium">Color/Markings</Label>
                <Input
                  id="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="mt-1.5 h-11"
                />
              </div>

              <div>
                <Label htmlFor="microchip" className="text-sm font-medium">Microchip ID</Label>
                <Input
                  id="microchip"
                  value={formData.microchip_id}
                  onChange={(e) => setFormData({ ...formData, microchip_id: e.target.value })}
                  className="mt-1.5 h-11"
                />
              </div>
            </div>

            {/* Neutered Switch */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div>
                <Label className="text-sm font-medium">Spayed/Neutered</Label>
                <p className="text-sm text-gray-500">Is your pet spayed or neutered?</p>
              </div>
              <Switch
                checked={formData.is_neutered}
                onCheckedChange={(checked) => setFormData({ ...formData, is_neutered: checked })}
              />
            </div>

            {/* Allergies */}
            <div>
              <Label className="text-sm font-medium">Known Allergies</Label>
              <div className="flex gap-2 mt-1.5">
                <Input
                  value={newAllergy}
                  onChange={(e) => setNewAllergy(e.target.value)}
                  placeholder="Add allergy"
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addAllergy())}
                  className="h-11"
                />
                <Button type="button" onClick={addAllergy} variant="outline" className="h-11">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              {formData.allergies.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {formData.allergies.map((allergy, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm"
                    >
                      {allergy}
                      <button type="button" onClick={() => removeAllergy(index)}>
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Medical Conditions */}
            <div>
              <Label className="text-sm font-medium">Medical Conditions</Label>
              <div className="flex gap-2 mt-1.5">
                <Input
                  value={newCondition}
                  onChange={(e) => setNewCondition(e.target.value)}
                  placeholder="Add condition"
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCondition())}
                  className="h-11"
                />
                <Button type="button" onClick={addCondition} variant="outline" className="h-11">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              {formData.medical_conditions.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {formData.medical_conditions.map((condition, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm"
                    >
                      {condition}
                      <button type="button" onClick={() => removeCondition(index)}>
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Submit */}
            <div className="flex gap-4 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(-1)}
                className="flex-1 h-12"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={updateMutation.isPending}
                className="flex-1 h-12 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700"
              >
                {updateMutation.isPending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  'Save Changes'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}