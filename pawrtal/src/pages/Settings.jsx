import React, { useState } from 'react';
import { api } from '@/api/apiClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { User, Bell, Upload, Loader2, Check, ChevronLeft, Lock, Building2, Mail } from 'lucide-react';
import { toast } from "sonner";

const notificationSwitchClassName =
  'data-[state=unchecked]:bg-red-500 data-[state=checked]:bg-teal-600 data-[state=unchecked]:border-red-600 data-[state=checked]:border-teal-700 border-2 shadow-sm [&>span]:bg-white';

function roleLabel(userType) {
  const t = String(userType || '').toLowerCase();
  if (t === 'pet_owner') return 'Pet owner';
  if (t === 'veterinarian') return 'Veterinarian';
  if (t === 'admin') return 'Clinic admin';
  return userType || '—';
}

/** Match SignIn / sidebar: vets and admins have their own home routes (not /dashboard). */
function homePathForUserType(userType) {
  const t = String(userType || '').toLowerCase();
  if (t === 'veterinarian') return createPageUrl('VetDashboard');
  if (t === 'admin') return createPageUrl('ClinicAdminDashboard');
  return createPageUrl('PetownerDashboard');
}

export default function Settings() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isUploading, setIsUploading] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    current: '',
    next: '',
    confirm: '',
  });

  const { data: user, isLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => api.auth.me(),
  });

  const isStaff = user?.user_type === 'veterinarian' || user?.user_type === 'admin';
  const isVet = user?.user_type === 'veterinarian';

  const defaultPrefs = {
    email: true,
    appointments: true,
    vaccinations: true,
    medications: true,
  };

  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    address: '',
    license_number: '',
    specialization: '',
    clinic_name: '',
    notification_preferences: defaultPrefs,
  });

  React.useEffect(() => {
    if (!user) return;
    setFormData({
      full_name: user.full_name || '',
      phone: user.phone || '',
      address: user.address || '',
      license_number: user.license_number || '',
      specialization: user.specialization || '',
      clinic_name: user.clinic_name || '',
      notification_preferences: user.notification_preferences || defaultPrefs,
    });
  }, [user]);

  const updateMutation = useMutation({
    mutationFn: (data) => api.auth.updateMe(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['currentUser']);
      toast.success('Settings saved!');
    },
    onError: () => {
      toast.error('Failed to save settings');
    },
  });

  const passwordMutation = useMutation({
    mutationFn: () =>
      api.auth.changePassword({
        current_password: passwordForm.current,
        new_password: passwordForm.next,
      }),
    onSuccess: () => {
      setPasswordForm({ current: '', next: '', confirm: '' });
      toast.success('Password updated');
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Failed to change password');
    },
  });

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const { file_url } = await api.integrations.Core.UploadFile({ file });
      await api.auth.updateMe({ avatar_url: file_url });
      queryClient.invalidateQueries(['currentUser']);
      toast.success('Avatar updated!');
    } catch {
      toast.error('Failed to upload avatar');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = () => {
    const payload = {
      full_name: formData.full_name.trim() || null,
      phone: formData.phone,
      address: formData.address,
      notification_preferences: formData.notification_preferences,
    };
    if (isStaff) {
      payload.license_number = formData.license_number.trim() || null;
      payload.specialization = formData.specialization.trim() || null;
      payload.clinic_name = formData.clinic_name.trim() || null;
    }
    updateMutation.mutate(payload);
  };

  const handleNotificationToggle = (key, value) => {
    setFormData({
      ...formData,
      notification_preferences: {
        ...formData.notification_preferences,
        [key]: value,
      },
    });
  };

  const handleChangePassword = (e) => {
    e.preventDefault();
    if (!passwordForm.current || !passwordForm.next) {
      toast.error('Fill in current and new password');
      return;
    }
    if (passwordForm.next.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }
    if (passwordForm.next !== passwordForm.confirm) {
      toast.error('New passwords do not match');
      return;
    }
    passwordMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto space-y-6">
      <Button
        type="button"
        variant="ghost"
        onClick={() => navigate(homePathForUserType(user?.user_type))}
        className="-ml-2 mb-2 gap-1 text-gray-600 hover:text-amber-800 hover:bg-amber-50"
      >
        <ChevronLeft className="w-4 h-4" />
        Back
      </Button>
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 mt-1">Manage your account preferences</p>
      </div>

      {/* Account — editable name, read-only email */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-teal-600" />
            <CardTitle>Account</CardTitle>
          </div>
          <CardDescription>Your sign-in identity and display name</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-start gap-6">
            <div className="relative shrink-0">
              <Avatar className="w-20 h-20">
                <AvatarImage src={user?.avatar_url} />
                <AvatarFallback className="bg-gradient-to-br from-teal-400 to-teal-500 text-white text-2xl">
                  {(formData.full_name || user?.full_name)?.[0] || user?.email?.[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <label className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-teal-500 flex items-center justify-center cursor-pointer hover:bg-teal-600 transition-colors shadow-md">
                {isUploading ? (
                  <Loader2 className="w-4 h-4 text-white animate-spin" />
                ) : (
                  <Upload className="w-4 h-4 text-white" />
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
              </label>
            </div>
            <div className="flex-1 space-y-4 w-full">
              <div>
                <Label htmlFor="full_name">Full name</Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  placeholder="Your name"
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-400" />
                  Email
                </Label>
                <Input
                  id="email"
                  value={user?.email || ''}
                  readOnly
                  className="mt-1.5 bg-gray-50 text-gray-700 cursor-not-allowed"
                />
                <p className="text-xs text-gray-500 mt-1.5">
                  Email is tied to your account and cannot be changed here. Contact support if you need to update it.
                </p>
              </div>
              <p className="text-sm text-teal-700 font-medium">
                Role: <span className="font-normal capitalize">{roleLabel(user?.user_type)}</span>
              </p>
            </div>
          </div>

          <Separator />

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+1 (555) 000-0000"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="123 Main St, City"
                className="mt-1.5"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Clinic & professional (vets / admins) */}
      {isStaff && (
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-teal-600" />
              <CardTitle>Clinic &amp; professional</CardTitle>
            </div>
            <CardDescription>Information shown on records and referrals</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="clinic_name">Clinic name</Label>
              <Input
                id="clinic_name"
                value={formData.clinic_name}
                onChange={(e) => setFormData({ ...formData, clinic_name: e.target.value })}
                placeholder="e.g., VM Veterinary Clinic"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="specialization">Specialization</Label>
              <Input
                id="specialization"
                value={formData.specialization}
                onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                placeholder="e.g., Small animal surgery"
                className="mt-1.5"
              />
            </div>
            {isVet && (
              <div>
                <Label htmlFor="license_number">License number</Label>
                <Input
                  id="license_number"
                  value={formData.license_number}
                  onChange={(e) => setFormData({ ...formData, license_number: e.target.value })}
                  placeholder="Professional license ID"
                  className="mt-1.5"
                />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Security — change password */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-teal-600" />
            <CardTitle>Security</CardTitle>
          </div>
          <CardDescription>Update the password you use to sign in</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
            <div>
              <Label htmlFor="current-password">Current password</Label>
              <Input
                id="current-password"
                type="password"
                autoComplete="current-password"
                value={passwordForm.current}
                onChange={(e) => setPasswordForm({ ...passwordForm, current: e.target.value })}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="new-password">New password</Label>
              <Input
                id="new-password"
                type="password"
                autoComplete="new-password"
                value={passwordForm.next}
                onChange={(e) => setPasswordForm({ ...passwordForm, next: e.target.value })}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="confirm-password">Confirm new password</Label>
              <Input
                id="confirm-password"
                type="password"
                autoComplete="new-password"
                value={passwordForm.confirm}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
                className="mt-1.5"
              />
            </div>
            <Button
              type="submit"
              disabled={passwordMutation.isPending}
              variant="outline"
              className="border-teal-600 text-teal-700 hover:bg-teal-50"
            >
              {passwordMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Update password'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-teal-600" />
            <CardTitle>Notification Preferences</CardTitle>
          </div>
          <CardDescription>Choose what notifications you want to receive</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
            <div>
              <p className="font-medium text-gray-900">Email Notifications</p>
              <p className="text-sm text-gray-500">Receive updates via email</p>
            </div>
            <Switch
              className={notificationSwitchClassName}
              checked={!!formData.notification_preferences.email}
              onCheckedChange={(checked) => handleNotificationToggle('email', checked)}
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
            <div>
              <p className="font-medium text-gray-900">Appointment Reminders</p>
              <p className="text-sm text-gray-500">Get notified about upcoming appointments</p>
            </div>
            <Switch
              className={notificationSwitchClassName}
              checked={!!formData.notification_preferences.appointments}
              onCheckedChange={(checked) => handleNotificationToggle('appointments', checked)}
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
            <div>
              <p className="font-medium text-gray-900">Vaccination Reminders</p>
              <p className="text-sm text-gray-500">Reminders for due vaccinations</p>
            </div>
            <Switch
              className={notificationSwitchClassName}
              checked={!!formData.notification_preferences.vaccinations}
              onCheckedChange={(checked) => handleNotificationToggle('vaccinations', checked)}
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
            <div>
              <p className="font-medium text-gray-900">Medication Reminders</p>
              <p className="text-sm text-gray-500">Reminders for pet medications</p>
            </div>
            <Switch
              className={notificationSwitchClassName}
              checked={!!formData.notification_preferences.medications}
              onCheckedChange={(checked) => handleNotificationToggle('medications', checked)}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button
          type="button"
          onClick={handleSave}
          disabled={updateMutation.isPending}
          className="bg-teal-600 hover:bg-teal-700 gap-2"
        >
          {updateMutation.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Check className="w-4 h-4" />
          )}
          Save Changes
        </Button>
      </div>
    </div>
  );
}
