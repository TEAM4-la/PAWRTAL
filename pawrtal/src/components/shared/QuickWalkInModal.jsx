import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/apiClient';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  UserPlus,
  PawPrint,
  Ticket,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Stethoscope,
  Phone,
  User,
} from 'lucide-react';
import { toast } from 'sonner';

export default function QuickWalkInModal({ isOpen, onClose, defaultVetEmail }) {
  const queryClient = useQueryClient();

  const [ownerName, setOwnerName] = useState('');
  const [ownerPhone, setOwnerPhone] = useState('');
  const [petName, setPetName] = useState('');
  const [species, setSpecies] = useState('dog');
  const [breed, setBreed] = useState('');
  const [type, setType] = useState('general_checkup');
  const [reason, setReason] = useState('');
  const [assignedVet, setAssignedVet] = useState(defaultVetEmail || 'any');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch available veterinarians for assignment
  const { data: staff = [] } = useQuery({
    queryKey: ['vetStaffList'],
    queryFn: async () => {
      const users = await api.entities.User.list();
      return users.filter(u => u.user_type === 'veterinarian' && !u.is_deleted);
    },
    enabled: !!isOpen,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!ownerName.trim()) {
      toast.error('Owner full name is required');
      return;
    }

    const cleanPhone = ownerPhone.replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length !== 11 || !cleanPhone.startsWith('09')) {
      toast.error('Please enter a valid 11-digit mobile number (e.g., 09123456789)');
      return;
    }

    if (!petName.trim()) {
      toast.error('Pet name is required');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.entities.Appointment.createWalkIn({
        owner_name: ownerName.trim(),
        owner_phone: cleanPhone,
        pet_name: petName.trim(),
        species,
        breed: breed.trim() || undefined,
        type,
        reason: reason.trim() || 'Walk-In Patient Intake',
        vet_email: assignedVet === 'any' ? null : assignedVet,
      });

      queryClient.invalidateQueries({ queryKey: ['vetAppointments'] });
      queryClient.invalidateQueries({ queryKey: ['allAppts'] });
      queryClient.invalidateQueries({ queryKey: ['allPets'] });

      toast.success(
        `Walk-In Intake Complete! Ticket #${res.queue_number || 'W-01'} issued for ${petName.trim()}.`,
        { duration: 5000 }
      );

      // Reset form
      setOwnerName('');
      setOwnerPhone('');
      setPetName('');
      setBreed('');
      setReason('');
      onClose();
    } catch (err) {
      toast.error(err?.message || 'Failed to register walk-in patient');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !isSubmitting && !open && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto p-6 sm:p-7">
        <DialogHeader className="space-y-1.5">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-gray-900">
                New Walk-In Patient Intake
              </DialogTitle>
              <DialogDescription className="text-xs text-gray-500">
                Quickly register a non-account walk-in pet owner & generate a queue ticket
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* Owner Details */}
          <div className="bg-gray-50/80 p-3.5 rounded-xl border border-gray-200/80 space-y-3">
            <span className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-blue-600" /> Owner Information (No account needed)
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Owner Full Name <span className="text-red-500">*</span>
                </label>
                <Input
                  required
                  placeholder="e.g. Maria Santos"
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  className="text-xs h-9 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Mobile Number <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                  <Input
                    required
                    type="tel"
                    inputMode="numeric"
                    maxLength={11}
                    placeholder="09123456789"
                    value={ownerPhone}
                    onChange={(e) => setOwnerPhone(e.target.value.replace(/\D/g, '').slice(0, 11))}
                    className="text-xs h-9 pl-8 bg-white"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Pet Details */}
          <div className="bg-gray-50/80 p-3.5 rounded-xl border border-gray-200/80 space-y-3">
            <span className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
              <PawPrint className="w-3.5 h-3.5 text-amber-600" /> Patient Information
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-1">
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Pet Name <span className="text-red-500">*</span>
                </label>
                <Input
                  required
                  placeholder="e.g. Brownie"
                  value={petName}
                  onChange={(e) => setPetName(e.target.value)}
                  className="text-xs h-9 bg-white"
                />
              </div>

              <div className="sm:col-span-1">
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Species <span className="text-red-500">*</span>
                </label>
                <Select value={species} onValueChange={setSpecies}>
                  <SelectTrigger className="text-xs h-9 bg-white">
                    <SelectValue placeholder="Species" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dog">Dog</SelectItem>
                    <SelectItem value="cat">Cat</SelectItem>
                    <SelectItem value="bird">Bird</SelectItem>
                    <SelectItem value="rabbit">Rabbit</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="sm:col-span-1">
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Breed <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <Input
                  placeholder="e.g. Shih Tzu"
                  value={breed}
                  onChange={(e) => setBreed(e.target.value)}
                  className="text-xs h-9 bg-white"
                />
              </div>
            </div>
          </div>

          {/* Visit & Assignment */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Service Type
              </label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger className="text-xs h-9 bg-white">
                  <SelectValue placeholder="Service Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general_checkup">General Consultation</SelectItem>
                  <SelectItem value="emergency">Emergency / Urgent</SelectItem>
                  <SelectItem value="vaccination">Vaccination</SelectItem>
                  <SelectItem value="grooming">Grooming</SelectItem>
                  <SelectItem value="surgery">Surgery Consultation</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Assigned Veterinarian
              </label>
              <Select value={assignedVet} onValueChange={setAssignedVet}>
                <SelectTrigger className="text-xs h-9 bg-white">
                  <SelectValue placeholder="Select Doctor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any Available Doctor</SelectItem>
                  {staff.map((vet) => (
                    <SelectItem key={vet.email} value={vet.email}>
                      {vet.full_name || vet.display_name || vet.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Chief Complaint / Reason for Visit
            </label>
            <Textarea
              rows={2}
              placeholder="e.g. Vomiting since yesterday, lethargic, needs physical exam"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="text-xs resize-none bg-white"
            />
          </div>

          <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs flex items-center gap-2">
            <Ticket className="w-4 h-4 text-blue-600 shrink-0" />
            <span>
              Submitting will automatically issue a sequential <strong>W-XX</strong> walk-in ticket and place this patient in the live waiting queue.
            </span>
          </div>

          <DialogFooter className="border-t border-gray-100 pt-3 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="text-xs h-9"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs h-9 shadow-sm flex items-center gap-1.5"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Ticket className="w-4 h-4" /> Issue Ticket & Check In
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
