import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from "@/utils";
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { PawPrint, User, Stethoscope, ArrowRight, ArrowLeft, Phone, MapPin, Building } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    user_type: 'pet_owner',
    phone: '',
    address: '',
    license_number: '',
    specialization: '',
    clinic_name: 'VM Veterinary Clinic'
  });

  const { data: user, isLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const updateMutation = useMutation({
    mutationFn: (data) => base44.auth.updateMe(data),
    onSuccess: () => {
      const redirectPage = formData.user_type === 'veterinarian' ? 'VetDashboard' : 'Dashboard';
      navigate(createPageUrl(redirectPage));
    }
  });

  useEffect(() => {
    if (user?.user_type && !isLoading) {
      const redirectPage = user.user_type === 'veterinarian' ? 'VetDashboard' : 'Dashboard';
      navigate(createPageUrl(redirectPage));
    }
  }, [user, isLoading, navigate]);

  const handleSubmit = () => {
    updateMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 to-orange-50">
        <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-orange-50 flex items-center justify-center p-6">
      <Card className="w-full max-w-xl p-8 shadow-xl border-0">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-teal-200">
            <PawPrint className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome to PAWRTAL</h1>
          <p className="text-gray-500 mt-2">Let's set up your account</p>
        </div>

        <div className="flex justify-center gap-2 mb-8">
          {[1, 2].map((s) => (
            <div
              key={s}
              className={`h-2 rounded-full transition-all ${
                s === step ? 'w-8 bg-teal-500' : s < step ? 'w-8 bg-teal-200' : 'w-8 bg-gray-200'
              }`}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div>
                <Label className="text-base font-medium mb-4 block">I am a...</Label>
                <RadioGroup
                  value={formData.user_type}
                  onValueChange={(value) => setFormData({ ...formData, user_type: value })}
                  className="grid grid-cols-2 gap-4"
                >
                  <Label
                    htmlFor="pet_owner"
                    className={`relative flex flex-col items-center gap-3 p-6 rounded-xl border-2 cursor-pointer transition-all ${
                      formData.user_type === 'pet_owner'
                        ? 'border-teal-500 bg-teal-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <RadioGroupItem value="pet_owner" id="pet_owner" className="sr-only" />
                    <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                      formData.user_type === 'pet_owner' ? 'bg-teal-500' : 'bg-gray-100'
                    }`}>
                      <User className={`w-7 h-7 ${formData.user_type === 'pet_owner' ? 'text-white' : 'text-gray-400'}`} />
                    </div>
                    <span className="font-medium text-gray-900">Pet Owner</span>
                    <span className="text-xs text-gray-500 text-center">Track your pet's health</span>
                  </Label>

                  <Label
                    htmlFor="veterinarian"
                    className={`relative flex flex-col items-center gap-3 p-6 rounded-xl border-2 cursor-pointer transition-all ${
                      formData.user_type === 'veterinarian'
                        ? 'border-teal-500 bg-teal-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <RadioGroupItem value="veterinarian" id="veterinarian" className="sr-only" />
                    <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                      formData.user_type === 'veterinarian' ? 'bg-teal-500' : 'bg-gray-100'
                    }`}>
                      <Stethoscope className={`w-7 h-7 ${formData.user_type === 'veterinarian' ? 'text-white' : 'text-gray-400'}`} />
                    </div>
                    <span className="font-medium text-gray-900">Veterinarian</span>
                    <span className="text-xs text-gray-500 text-center">Manage patient records</span>
                  </Label>
                </RadioGroup>
              </div>

              <Button
                onClick={() => setStep(2)}
                className="w-full h-12 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700"
              >
                Continue
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-5"
            >
              <div>
                <Label htmlFor="phone" className="flex items-center gap-2 mb-2">
                  <Phone className="w-4 h-4 text-gray-400" />
                  Phone Number
                </Label>
                <Input
                  id="phone"
                  placeholder="+1 (555) 000-0000"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="h-12"
                />
              </div>

              <div>
                <Label htmlFor="address" className="flex items-center gap-2 mb-2">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  Address
                </Label>
                <Input
                  id="address"
                  placeholder="123 Main St, City, State"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="h-12"
                />
              </div>

              {formData.user_type === 'veterinarian' && (
                <>
                  <div>
                    <Label htmlFor="license" className="flex items-center gap-2 mb-2">
                      License Number
                    </Label>
                    <Input
                      id="license"
                      placeholder="VET-12345"
                      value={formData.license_number}
                      onChange={(e) => setFormData({ ...formData, license_number: e.target.value })}
                      className="h-12"
                    />
                  </div>

                  <div>
                    <Label htmlFor="specialization" className="flex items-center gap-2 mb-2">
                      Specialization
                    </Label>
                    <Input
                      id="specialization"
                      placeholder="General Practice, Surgery, etc."
                      value={formData.specialization}
                      onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                      className="h-12"
                    />
                  </div>

                  <div>
                    <Label htmlFor="clinic" className="flex items-center gap-2 mb-2">
                      <Building className="w-4 h-4 text-gray-400" />
                      Clinic Name
                    </Label>
                    <Input
                      id="clinic"
                      value={formData.clinic_name}
                      onChange={(e) => setFormData({ ...formData, clinic_name: e.target.value })}
                      className="h-12"
                    />
                  </div>
                </>
              )}

              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="flex-1 h-12"
                >
                  <ArrowLeft className="w-5 h-5 mr-2" />
                  Back
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={updateMutation.isPending}
                  className="flex-1 h-12 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700"
                >
                  {updateMutation.isPending ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      Complete Setup
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </div>
  );
}