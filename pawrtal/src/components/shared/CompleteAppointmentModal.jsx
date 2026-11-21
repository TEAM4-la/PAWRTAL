import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
import { Switch } from '@/components/ui/switch';
import {
  Stethoscope,
  CheckCircle2,
  AlertTriangle,
  FileText,
  ExternalLink,
  Loader2,
  Syringe,
  Pill,
  Sparkles,
  ShieldCheck,
  Calendar,
  Clock,
  User,
} from 'lucide-react';
import { toast } from 'sonner';

export default function CompleteAppointmentModal({
  appointment,
  pet,
  currentUser,
  isOpen,
  onClose,
  onSuccess,
}) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [diagnosis, setDiagnosis] = useState('');
  const [treatment, setTreatment] = useState('');
  const [weight, setWeight] = useState('');
  const [temperature, setTemperature] = useState('');
  const [isVisibleToOwner, setIsVisibleToOwner] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showQuickFormOverride, setShowQuickFormOverride] = useState(false);

  // Check if clinical records already exist for this pet on the appointment date
  const { data: existingRecords = [], isLoading: isLoadingRecords } = useQuery({
    queryKey: ['existingClinicalRecords', appointment?.pet_id, appointment?.date],
    queryFn: async () => {
      if (!appointment?.pet_id || !appointment?.date) return [];
      const [healthRecords, vaccinations, medications] = await Promise.all([
        api.entities.HealthRecord.filter({ pet_id: appointment.pet_id }),
        api.entities.Vaccination.filter({ pet_id: appointment.pet_id }),
        api.entities.Medication.filter({ pet_id: appointment.pet_id }),
      ]);

      const aptDate = appointment.date;
      const matched = [
        ...healthRecords.filter(r => r.date === aptDate).map(r => ({ ...r, _kind: 'Health Record' })),
        ...vaccinations.filter(v => v.date_administered === aptDate).map(v => ({ ...v, title: v.vaccine_name, _kind: 'Vaccination' })),
        ...medications.filter(m => m.start_date === aptDate).map(m => ({ ...m, title: m.name, _kind: 'Medication' })),
      ];
      return matched;
    },
    enabled: !!isOpen && !!appointment?.id,
  });

  const hasExistingRecords = existingRecords.length > 0;

  // Complete directly when existing record was verified
  const handleCompleteWithExisting = async () => {
    setIsSubmitting(true);
    try {
      await api.entities.Appointment.update(appointment.id, {
        status: 'completed',
        vet_email: appointment.vet_email || currentUser?.email,
      });
      queryClient.invalidateQueries({ queryKey: ['vetAppointments'] });
      queryClient.invalidateQueries({ queryKey: ['allAppts'] });
      toast.success('Appointment verified and marked as completed!');
      onClose();
      if (onSuccess) onSuccess();
    } catch (err) {
      toast.error(err?.message || 'Failed to complete appointment');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit quick consultation note + complete appointment in one action
  const handleSaveAndComplete = async (e) => {
    e.preventDefault();

    if (!diagnosis.trim()) {
      toast.error('Please enter a clinical diagnosis or examination finding.');
      return;
    }
    if (!treatment.trim()) {
      toast.error('Please enter the treatment or recommendations provided.');
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Build clinical description
      let detailedNotes = `Clinical Assessment / Diagnosis:\n${diagnosis.trim()}\n\nTreatment & Recommendations:\n${treatment.trim()}`;
      if (weight.trim()) {
        detailedNotes += `\n\nPatient Weight: ${weight.trim()} kg`;
      }
      if (temperature.trim()) {
        detailedNotes += `\nBody Temperature: ${temperature.trim()} °C`;
      }

      const vetDisplayName = currentUser?.display_name || currentUser?.full_name || 'Attending Veterinarian';

      // 2. Create the health record
      await api.entities.HealthRecord.create({
        pet_id: appointment.pet_id,
        record_type: 'diagnosis',
        title: `Consultation: ${appointment.reason || 'General Examination'}`,
        description: detailedNotes,
        date: appointment.date,
        is_visible_to_owner: isVisibleToOwner,
        vet_email: currentUser?.email,
        vet_name: vetDisplayName,
      });

      // 3. Complete the appointment
      await api.entities.Appointment.update(appointment.id, {
        status: 'completed',
        vet_email: appointment.vet_email || currentUser?.email,
      });

      queryClient.invalidateQueries({ queryKey: ['vetAppointments'] });
      queryClient.invalidateQueries({ queryKey: ['allAppts'] });
      queryClient.invalidateQueries({ queryKey: ['allHealthRecords'] });
      queryClient.invalidateQueries({ queryKey: ['healthRecords'] });

      toast.success('Clinical record saved and appointment completed successfully!');
      onClose();
      if (onSuccess) onSuccess();
    } catch (err) {
      toast.error(err?.message || 'Failed to save record and complete visit');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Navigate to full record creation page
  const handleOpenFullForm = () => {
    onClose();
    navigate(`/vet-add-record?petId=${appointment.pet_id}&appointmentId=${appointment.id}`);
  };

  if (!appointment) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !isSubmitting && !open && onClose()}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto p-6 sm:p-7">
        <DialogHeader className="space-y-2">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-gray-900">
                Complete Visit for {pet?.name || appointment.pet_name || 'Patient'}
              </DialogTitle>
              <DialogDescription className="text-xs text-gray-500">
                Clinical documentation trigger & audit verification
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Appointment Context Card */}
        <div className="bg-gray-50 rounded-xl p-3.5 border border-gray-200/80 space-y-1.5 text-xs text-gray-600">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-semibold text-gray-900">
              {pet?.species ? `${pet.species.toUpperCase()} • ` : ''}
              {pet?.name || appointment.pet_name}
            </span>
            <span className="inline-flex items-center gap-1 text-teal-700 bg-teal-100/60 px-2 py-0.5 rounded-md font-medium">
              <Calendar className="w-3 h-3" /> {appointment.date} at {appointment.time}
            </span>
          </div>
          <p>
            <span className="font-medium text-gray-700">Reason for visit:</span>{' '}
            {appointment.reason || 'General Checkup'}
          </p>
          <p>
            <span className="font-medium text-gray-700">Owner:</span>{' '}
            {appointment.owner_name || appointment.owner_email || 'Registered Client'}
          </p>
        </div>

        {/* Existing Record State */}
        {isLoadingRecords ? (
          <div className="py-8 flex flex-col items-center justify-center text-gray-400 text-xs">
            <Loader2 className="w-6 h-6 animate-spin text-teal-600 mb-2" />
            Verifying patient records for today...
          </div>
        ) : hasExistingRecords && !showQuickFormOverride ? (
          <div className="space-y-4 py-2">
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                <span className="font-bold text-sm">Clinical Documentation Verified</span>
              </div>
              <p className="text-xs text-emerald-800 leading-relaxed">
                We found {existingRecords.length} clinical record(s) already logged for{' '}
                <strong>{pet?.name || 'this patient'}</strong> on {appointment.date}. You can complete this appointment now.
              </p>
              <div className="mt-2 space-y-1.5 pt-2 border-t border-emerald-200/60">
                {existingRecords.map((rec, i) => (
                  <div key={i} className="flex items-center justify-between text-xs bg-white/70 p-2 rounded-lg border border-emerald-100">
                    <span className="font-medium truncate max-w-[280px]">
                      {rec.title || rec.vaccine_name || rec.name || 'Clinical Entry'}
                    </span>
                    <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                      {rec._kind}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <Button
                type="button"
                onClick={handleCompleteWithExisting}
                disabled={isSubmitting}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold text-xs h-10 shadow-sm"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-1" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 mr-1.5" />
                )}
                Confirm & Complete Appointment
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowQuickFormOverride(true)}
                className="text-xs h-10 text-gray-700"
              >
                Add Extra Consultation Note
              </Button>
            </div>
          </div>
        ) : (
          /* Need Clinical Documentation Form */
          <form onSubmit={handleSaveAndComplete} className="space-y-4 py-2">
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Clinical Documentation Required:</span>
                <p className="text-amber-800/90 mt-0.5">
                  Record what care was provided to {pet?.name || 'the patient'} before closing this appointment.
                </p>
              </div>
            </div>

            {/* Quick Consultation Fields */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Diagnosis / Examination Findings <span className="text-red-500">*</span>
                </label>
                <Input
                  required
                  placeholder="e.g., Clear lungs, normal temperature, healthy coat & vitals"
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                  className="text-xs h-9"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Treatment / Clinical Recommendations <span className="text-red-500">*</span>
                </label>
                <Textarea
                  required
                  rows={2}
                  placeholder="e.g., Prescribed hypoallergenic food, advised owner on ear hygiene, scheduled booster next month"
                  value={treatment}
                  onChange={(e) => setTreatment(e.target.value)}
                  className="text-xs resize-none"
                />
              </div>

              {/* Vitals row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Weight (kg) <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="e.g., 5.4"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    className="text-xs h-9"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Temperature (°C) <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="e.g., 38.5"
                    value={temperature}
                    onChange={(e) => setTemperature(e.target.value)}
                    className="text-xs h-9"
                  />
                </div>
              </div>

              {/* Visible to owner switch */}
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-gray-50 border border-gray-200">
                <div>
                  <p className="text-xs font-medium text-gray-800">Visible to Pet Owner</p>
                  <p className="text-[11px] text-gray-500">Allow pet parent to see this consultation in their app</p>
                </div>
                <Switch
                  checked={isVisibleToOwner}
                  onCheckedChange={setIsVisibleToOwner}
                />
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2 pt-2">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs h-10 shadow-sm flex items-center justify-center gap-1.5"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Save Record & Complete Visit
                  </>
                )}
              </Button>

              <div className="relative py-1">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-[10px] uppercase font-semibold text-gray-400">
                  <span className="bg-white px-2">Or for surgical / multi-item visits</span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={handleOpenFullForm}
                disabled={isSubmitting}
                className="w-full text-xs h-9 text-gray-700 border-gray-300 hover:bg-gray-50 flex items-center justify-center gap-1.5"
              >
                <ExternalLink className="w-3.5 h-3.5 text-teal-600" />
                Open Full Record Form (Vaccines, Rx, Surgery)
              </Button>
            </div>
          </form>
        )}

        <DialogFooter className="border-t border-gray-100 pt-3">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={isSubmitting}
            className="text-xs text-gray-500 h-8"
          >
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
