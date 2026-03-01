import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import EmptyState from "@/components/shared/EmptyState";
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  BookOpen, 
  Utensils, 
  Scissors, 
  Heart, 
  Activity, 
  AlertCircle,
  Weight,
  Smile,
  Meh,
  Frown,
  Loader2,
  Calendar,
  Dog,
  Cat,
  Bird,
  Rabbit,
  Fish,
  ChevronLeft
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const entryTypes = [
  { value: 'feeding', label: 'Feeding', icon: Utensils, color: 'bg-green-100 text-green-700' },
  { value: 'grooming', label: 'Grooming', icon: Scissors, color: 'bg-pink-100 text-pink-700' },
  { value: 'exercise', label: 'Exercise', icon: Activity, color: 'bg-blue-100 text-blue-700' },
  { value: 'behavior', label: 'Behavior', icon: Heart, color: 'bg-purple-100 text-purple-700' },
  { value: 'symptom', label: 'Symptom', icon: AlertCircle, color: 'bg-red-100 text-red-700' },
  { value: 'weight', label: 'Weight', icon: Weight, color: 'bg-teal-100 text-teal-700' },
  { value: 'general', label: 'General', icon: BookOpen, color: 'bg-gray-100 text-gray-700' },
];

const moodOptions = [
  { value: 'happy', label: 'Happy', icon: Smile, color: 'text-green-500' },
  { value: 'normal', label: 'Normal', icon: Meh, color: 'text-blue-500' },
  { value: 'tired', label: 'Tired', icon: Meh, color: 'text-amber-500' },
  { value: 'sick', label: 'Sick', icon: Frown, color: 'text-red-500' },
  { value: 'anxious', label: 'Anxious', icon: Frown, color: 'text-purple-500' },
];

const speciesIcons = {
  dog: Dog,
  cat: Cat,
  bird: Bird,
  rabbit: Rabbit,
  fish: Fish,
};

export default function Journal() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedPet, setSelectedPet] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [formData, setFormData] = useState({
    pet_id: '',
    entry_type: 'general',
    title: '',
    content: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    mood: '',
  });

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: pets = [] } = useQuery({
    queryKey: ['pets', user?.email],
    queryFn: () => base44.entities.Pet.filter({ owner_email: user?.email }),
    enabled: !!user?.email,
  });

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ['journalEntries', pets, selectedPet, selectedType],
    queryFn: async () => {
      let allEntries = [];
      if (selectedPet === 'all') {
        const entriesPromises = pets.map(pet => 
          base44.entities.JournalEntry.filter({ pet_id: pet.id })
        );
        const results = await Promise.all(entriesPromises);
        allEntries = results.flat();
      } else {
        allEntries = await base44.entities.JournalEntry.filter({ pet_id: selectedPet });
      }
      
      if (selectedType !== 'all') {
        allEntries = allEntries.filter(e => e.entry_type === selectedType);
      }
      
      return allEntries.sort((a, b) => new Date(b.date) - new Date(a.date));
    },
    enabled: pets.length > 0,
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.JournalEntry.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['journalEntries']);
      setIsDialogOpen(false);
      setFormData({
        pet_id: '',
        entry_type: 'general',
        title: '',
        content: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        mood: '',
      });
      toast.success('Journal entry added!');
    }
  });

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

  const getEntryTypeConfig = (type) => {
    return entryTypes.find(t => t.value === type) || entryTypes[6];
  };

  const getMoodConfig = (mood) => {
    return moodOptions.find(m => m.value === mood);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
      <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-amber-700 transition-colors mb-2">
        <ChevronLeft className="w-4 h-4" /> Back
      </button>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Pet Journal</h1>
          <p className="text-gray-500 mt-1">Track daily activities and observations</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 gap-2">
              <Plus className="w-5 h-5" />
              Add Entry
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>New Journal Entry</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-5 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Pet *</Label>
                  <Select value={formData.pet_id} onValueChange={(v) => setFormData({...formData, pet_id: v})}>
                    <SelectTrigger className="mt-1.5">
                      <SelectValue placeholder="Select pet" />
                    </SelectTrigger>
                    <SelectContent>
                      {pets.map(pet => (
                        <SelectItem key={pet.id} value={pet.id}>{pet.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm font-medium">Date *</Label>
                  <Input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                    className="mt-1.5"
                  />
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium mb-2 block">Entry Type</Label>
                <div className="flex flex-wrap gap-2">
                  {entryTypes.map((type) => (
                    <Badge
                      key={type.value}
                      onClick={() => setFormData({...formData, entry_type: type.value})}
                      className={cn(
                        "cursor-pointer transition-all",
                        formData.entry_type === type.value 
                          ? type.color 
                          : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                      )}
                    >
                      <type.icon className="w-3 h-3 mr-1" />
                      {type.label}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="title" className="text-sm font-medium">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  placeholder="e.g., Morning walk"
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label htmlFor="content" className="text-sm font-medium">Notes</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData({...formData, content: e.target.value})}
                  placeholder="Add details..."
                  className="mt-1.5 min-h-[80px]"
                />
              </div>

              <div>
                <Label className="text-sm font-medium mb-2 block">Pet's Mood</Label>
                <div className="flex gap-2">
                  {moodOptions.map((mood) => (
                    <Button
                      key={mood.value}
                      type="button"
                      variant={formData.mood === mood.value ? "default" : "outline"}
                      size="sm"
                      onClick={() => setFormData({...formData, mood: mood.value})}
                      className={cn(
                        "gap-1",
                        formData.mood === mood.value && "bg-teal-500"
                      )}
                    >
                      <mood.icon className={cn("w-4 h-4", formData.mood !== mood.value && mood.color)} />
                      {mood.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="flex-1">
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending} className="flex-1 bg-teal-600 hover:bg-teal-700">
                  {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Entry'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Select value={selectedPet} onValueChange={setSelectedPet}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All pets" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Pets</SelectItem>
            {pets.map(pet => (
              <SelectItem key={pet.id} value={pet.id}>{pet.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={selectedType} onValueChange={setSelectedType}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {entryTypes.map(type => (
              <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Entries */}
      {entries.length === 0 ? (
        <Card className="border-dashed border-2">
          <EmptyState
            icon={BookOpen}
            title="No journal entries yet"
            description="Start tracking your pet's daily activities and health observations"
            actionLabel="Add First Entry"
            onAction={() => setIsDialogOpen(true)}
          />
        </Card>
      ) : (
        <div className="space-y-4">
          {entries.map((entry) => {
            const typeConfig = getEntryTypeConfig(entry.entry_type);
            const moodConfig = getMoodConfig(entry.mood);
            const TypeIcon = typeConfig.icon;
            
            return (
              <Card key={entry.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", typeConfig.color.replace('text-', 'bg-').split(' ')[0])}>
                      <TypeIcon className={cn("w-6 h-6", typeConfig.color.split(' ')[1])} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h4 className="font-semibold text-gray-900">{entry.title}</h4>
                        <Badge className={typeConfig.color}>{typeConfig.label}</Badge>
                        {moodConfig && (
                          <Badge variant="outline" className="gap-1">
                            <moodConfig.icon className={cn("w-3 h-3", moodConfig.color)} />
                            {moodConfig.label}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 mb-2">
                        {getPetName(entry.pet_id)} • {format(new Date(entry.date), 'MMMM d, yyyy')}
                      </p>
                      {entry.content && (
                        <p className="text-gray-600">{entry.content}</p>
                      )}
                    </div>
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