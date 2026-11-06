import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import React, { useState } from 'react';
import { api } from '@/api/apiClient';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import AdminSidebar from '@/components/layout/AdminSidebar';
import BackButton from '@/components/ui/BackButton';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Stethoscope, Users, Mail, Phone, Briefcase, KeyRound, X, Eye, EyeOff, RefreshCw, CheckCircle2, AlertCircle, Award, ChevronLeft, UserPlus, Plus, Trash2 } from 'lucide-react';

// ΓöÇΓöÇΓöÇ Reset Password Modal ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
function ResetPasswordModal({ targetUser, onClose }) {
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  async function handleReset(e) {
    e.preventDefault();
    setError('');

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirm) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await api.auth.adminResetPassword({
        targetEmail: targetUser.email,
        newPassword,
      });
      setSuccess(true);
    } catch (err) {
      setError(err.message || 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-[calc(100%-2rem)] max-w-md p-4 sm:p-6 relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {success ? (
          <div className="text-center py-4">
            <CheckCircle2 className="w-14 h-14 text-green-500 mx-auto mb-3" />
            <h3 className="text-xl font-bold text-gray-900 mb-1">Password Reset!</h3>
            <p className="text-gray-500 text-sm mb-1">
              The password for
            </p>
            <p className="font-semibold text-gray-800 text-sm mb-4">{targetUser.email}</p>
            <p className="text-gray-500 text-sm mb-6">
              has been successfully reset. Please inform them of their new password.
            </p>
            <button
              onClick={onClose}
              className="w-full py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-semibold transition-colors"
            >
              Done
            </button>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center flex-shrink-0">
                <KeyRound className="w-5 h-5 text-violet-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Reset Password</h3>
                <p className="text-xs text-gray-500 truncate max-w-[260px]">{targetUser.full_name || targetUser.email}</p>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-5 text-sm text-amber-800">
              <strong>Note:</strong> After resetting, inform the user of their new password so they can log in.
            </div>

            <form onSubmit={handleReset} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">New Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full pl-4 pr-10 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-400 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm New Password</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Repeat password"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-400 text-sm"
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 border border-red-200 rounded-xl px-3 py-2.5">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-semibold transition-colors text-sm disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Reset Password'}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 transition-colors text-sm"
                >
                  Cancel
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

// ΓöÇΓöÇΓöÇ Main Page ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
// ─── Delete User Modal ────────────────────────────────────────────────────────
function DeleteUserModal({ targetUser, onClose, onDeleted }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const roleLabels = {
    veterinarian: 'Doctor / Veterinarian',
    admin: 'Staff / Clinic Administrator',
    pet_owner: 'Pet Owner'
  };

  async function handleDelete() {
    setLoading(true);
    setError('');
    try {
      await api.entities.User.delete(targetUser.id);
      onDeleted();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err) || 'Failed to delete user profile.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-[calc(100%-2rem)] max-w-md p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-red-100 flex items-center justify-center flex-shrink-0 text-red-600">
            <Trash2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Delete Profile</h3>
            <p className="text-xs text-gray-500">{roleLabels[targetUser.user_type] || 'User Profile'}</p>
          </div>
        </div>

        <div className="bg-red-50 border border-red-100 rounded-xl p-3.5 mb-4 text-sm text-red-900">
          <p className="font-semibold">{targetUser.full_name || targetUser.email}</p>
          <p className="text-xs text-red-700 mt-1">
            Are you sure you want to remove this profile? This will revoke their access to the clinic. Past appointments and medical records will be safely preserved.
          </p>
        </div>

        {error && (
          <p className="text-sm text-red-600 mb-4 bg-red-50 p-2.5 rounded-lg border border-red-200">
            {error}
          </p>
        )}

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={handleDelete}
            disabled={loading}
            className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold shadow-sm hover:shadow transition-all disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            Confirm Delete
          </button>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 text-sm font-medium transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminStaff() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [resetTarget, setResetTarget] = useState(null); // user to reset
  const [deleteTarget, setDeleteTarget] = useState(null); // user to delete

  const { data: user } = useQuery({ queryKey: ['me'], queryFn: () => api.auth.me() });
  const { data: allUsers = [] } = useQuery({ queryKey: ['allUsers'], queryFn: () => api.entities.User.list() });
  const { data: allAppointments = [] } = useQuery({ queryKey: ['allAppts'], queryFn: () => api.entities.Appointment.list() });

  const vets = allUsers.filter(u => u.user_type === 'veterinarian');
  const clinicStaff = allUsers.filter(u => u.user_type === 'admin');
  const owners = allUsers.filter(u => u.user_type === 'pet_owner');

  return (
    <AdminSidebar currentUser={user}>
      <div className="p-4 sm:p-6 max-w-6xl mx-auto">
        <BackButton to={createPageUrl('ClinicAdminDashboard')} />
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Staff &amp; Users</h1>
            <p className="text-gray-500 mt-1">Manage veterinarians and pet owners</p>
          </div>
          <button
            onClick={() => navigate('/staff/create-account')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white font-semibold text-sm shadow-sm hover:shadow transition-all w-fit"
          >
            <UserPlus className="w-4 h-4" />
            Create staff account
          </button>
        </div>

        {/* Vets Section */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Stethoscope className="w-5 h-5 text-teal-600" />
            <h2 className="text-lg font-semibold text-gray-900">Veterinarians</h2>
            <Badge className="bg-teal-100 text-teal-700">{vets.length}</Badge>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {vets.length === 0 ? (
              <p className="text-gray-400 text-sm col-span-3">No veterinarians registered yet.</p>
            ) : vets.map(vet => {
              const vetAppts = allAppointments.filter(a => a.vet_email === vet.email);
              const completed = vetAppts.filter(a => a.status === 'completed').length;
              return (
                <Card key={vet.id} className="border-0 shadow-sm p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-bold text-lg">
                      {vet.full_name?.[0] || 'V'}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 truncate">{vet.full_name}</p>
                      <Badge className="bg-teal-50 text-teal-600 text-xs mt-0.5">Veterinarian</Badge>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-gray-500">
                      <Mail className="w-4 h-4 text-gray-300" />
                      <span className="truncate">{vet.email}</span>
                    </div>
                    {vet.phone && (
                      <div className="flex items-center gap-2 text-gray-500">
                        <Phone className="w-4 h-4 text-gray-300" />
                        <span>{vet.phone}</span>
                      </div>
                    )}
                    {vet.specialization && (
                      <div className="flex items-center gap-2 text-gray-500">
                        <Briefcase className="w-4 h-4 text-gray-300" />
                        <span>{vet.specialization}</span>
                      </div>
                    )}
                    {vet.license_number && (
                      <div className="flex items-center gap-2 text-teal-700 bg-teal-50/70 px-2.5 py-1 rounded-lg text-xs font-medium">
                        <Award className="w-3.5 h-3.5 text-teal-600 flex-shrink-0" />
                        <span className="truncate">PRC Lic: {vet.license_number}</span>
                      </div>
                    )}
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-100 flex gap-4 text-sm text-center">
                    <div className="flex-1">
                      <p className="font-bold text-gray-900">{vetAppts.length}</p>
                      <p className="text-gray-500 text-xs">Total Appts</p>
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-green-600">{completed}</p>
                      <p className="text-gray-500 text-xs">Completed</p>
                    </div>
                  </div>
                  {/* Actions Row */}
                  <div className="mt-4 pt-2 flex items-center gap-2">
                    <button
                      onClick={() => setResetTarget(vet)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl border border-violet-200 text-violet-700 hover:bg-violet-50 transition-colors text-xs font-semibold"
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                      Reset Password
                    </button>
                    <button
                      onClick={() => setDeleteTarget(vet)}
                      className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 transition-colors text-xs font-semibold"
                      title="Delete Profile"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete
                    </button>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Clinic Staff & Admin Section */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-semibold text-gray-900">Clinic Staff &amp; Administrators</h2>
            <Badge className="bg-indigo-100 text-indigo-700">{clinicStaff.length}</Badge>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {clinicStaff.length === 0 ? (
              <p className="text-gray-400 text-sm col-span-3">No staff members found.</p>
            ) : clinicStaff.map(staff => {
              const isSelf = user?.email?.toLowerCase() === staff.email?.toLowerCase();
              return (
                <Card key={staff.id} className="border-0 shadow-sm p-5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-lg">
                        {staff.full_name?.[0] || 'S'}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="font-semibold text-gray-900 truncate">{staff.full_name}</p>
                          {isSelf && (
                            <Badge className="bg-slate-100 text-slate-600 text-[10px] px-1.5 py-0 font-normal">You</Badge>
                          )}
                        </div>
                        <Badge className="bg-indigo-50 text-indigo-600 text-xs mt-0.5">Clinic Staff</Badge>
                      </div>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-gray-500">
                        <Mail className="w-4 h-4 text-gray-300 flex-shrink-0" />
                        <span className="truncate">{staff.email}</span>
                      </div>
                      {staff.phone && (
                        <div className="flex items-center gap-2 text-gray-500">
                          <Phone className="w-4 h-4 text-gray-300 flex-shrink-0" />
                          <span>{staff.phone}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  {!isSelf ? (
                    <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-end">
                      <button
                        onClick={() => setDeleteTarget(staff)}
                        className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 transition-colors text-xs font-semibold"
                        title="Delete Profile"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete Profile
                      </button>
                    </div>
                  ) : (
                    <div className="mt-4 pt-4 border-t border-gray-100 text-center">
                      <span className="text-xs text-gray-400 italic">Current Active Session</span>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </div>

        {/* Owners Section */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-amber-600" />
            <h2 className="text-lg font-semibold text-gray-900">Pet Owners</h2>
            <Badge className="bg-amber-100 text-amber-700">{owners.length}</Badge>
          </div>
          <Card className="border-0 shadow-sm overflow-hidden">
            
          {/* Mobile Owner Cards (< md) */}
          <div className="md:hidden divide-y divide-gray-100">
            {owners.length === 0 ? (
              <div className="py-8 text-center text-gray-400 text-sm">No pet owners registered yet.</div>
            ) : (
              owners.map(owner => {
                const ownerAppts = allAppointments.filter(a => a.owner_email === owner.email);
                return (
                  <div key={owner.id} className="p-4 space-y-3 bg-white">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-bold text-sm shrink-0">
                          {owner.full_name?.[0] || '?'}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900 text-sm">{owner.full_name}</p>
                          <p className="text-xs text-gray-500 break-all">{owner.email}</p>
                        </div>
                      </div>
                      <Badge className="bg-amber-50 text-amber-800 border-amber-200 text-xs shrink-0">
                        {ownerAppts.length} appts
                      </Badge>
                    </div>

                    {owner.phone && (
                      <p className="text-xs text-gray-500 flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <span>{owner.phone}</span>
                      </p>
                    )}

                    <div className="pt-1 flex items-center gap-2">
                      <button
                        onClick={() => setResetTarget(owner)}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 rounded-xl border border-violet-200 text-violet-700 hover:bg-violet-50 transition-colors text-xs font-medium"
                      >
                        <KeyRound className="w-3.5 h-3.5" />
                        Reset Password
                      </button>
                      <button
                        onClick={() => setDeleteTarget(owner)}
                        className="inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 transition-colors text-xs font-medium"
                        title="Delete Profile"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Desktop Table (>= md) */}
          <div className="overflow-x-auto hidden md:block">
              <table className="w-full text-sm min-w-[650px]">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left px-5 py-3 font-medium text-gray-500 whitespace-nowrap">Name</th>
                    <th className="text-left px-5 py-3 font-medium text-gray-500 whitespace-nowrap">Email</th>
                    <th className="text-left px-5 py-3 font-medium text-gray-500 whitespace-nowrap">Phone</th>
                    <th className="text-left px-5 py-3 font-medium text-gray-500 whitespace-nowrap">Appointments</th>
                    <th className="text-left px-5 py-3 font-medium text-gray-500 whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {owners.length === 0 ? (
                    <tr><td colSpan={5} className="text-center py-10 text-gray-400 whitespace-nowrap">No pet owners registered yet.</td></tr>
                  ) : owners.map(owner => {
                    const ownerAppts = allAppointments.filter(a => a.owner_email === owner.email);
                    return (
                      <tr key={owner.id} className="hover:bg-gray-50/50">
                        <td className="px-5 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-bold text-sm flex-shrink-0">
                              {owner.full_name?.[0] || '?'}
                            </div>
                            <span className="font-medium text-gray-900">{owner.full_name}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3 text-gray-500 whitespace-nowrap">{owner.email}</td>
                        <td className="px-5 py-3 text-gray-500 whitespace-nowrap">{owner.phone || '—'}</td>
                        <td className="px-5 py-3 text-gray-700 font-medium whitespace-nowrap">{ownerAppts.length}</td>
                        <td className="px-5 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setResetTarget(owner)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-violet-200 text-violet-700 hover:bg-violet-50 transition-colors text-xs font-medium"
                            >
                              <KeyRound className="w-3.5 h-3.5" />
                              Reset Password
                            </button>
                            <button
                              onClick={() => setDeleteTarget(owner)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 transition-colors text-xs font-medium"
                              title="Delete Profile"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>

      {/* Reset Password Modal */}
      {resetTarget && (
        <ResetPasswordModal
          targetUser={resetTarget}
          onClose={() => setResetTarget(null)}
        />
      )}

      {/* Delete User Modal */}
      {deleteTarget && (
        <DeleteUserModal
          targetUser={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onDeleted={() => {
            queryClient.invalidateQueries({ queryKey: ['allUsers'] });
            queryClient.invalidateQueries({ queryKey: ['allAppts'] });
            queryClient.invalidateQueries({ queryKey: ['me'] });
          }}
        />
      )}
    </AdminSidebar>
  );
}
