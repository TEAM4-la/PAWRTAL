import React, { useState } from 'react';
import { api } from '@/api/apiClient';
import { useQuery } from '@tanstack/react-query';
import AdminSidebar from '@/components/layout/AdminSidebar';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Stethoscope, Users, Mail, Phone, Briefcase, KeyRound, X, Eye, EyeOff, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';

// ─── Reset Password Modal ──────────────────────────────────────────────────────
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
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 relative">
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
                  placeholder="••••••••"
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
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 transition-colors text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-semibold transition-colors text-sm disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Reset Password'}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function AdminStaff() {
  const [resetTarget, setResetTarget] = useState(null); // user to reset

  const { data: user } = useQuery({ queryKey: ['me'], queryFn: () => api.auth.me() });
  const { data: allUsers = [] } = useQuery({ queryKey: ['allUsers'], queryFn: () => api.entities.User.list() });
  const { data: allAppointments = [] } = useQuery({ queryKey: ['allAppts'], queryFn: () => api.entities.Appointment.list() });

  const vets = allUsers.filter(u => u.user_type === 'veterinarian');
  const owners = allUsers.filter(u => u.user_type === 'pet_owner');

  return (
    <AdminSidebar currentUser={user}>
      <div className="p-6 max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Staff &amp; Users</h1>
          <p className="text-gray-500 mt-1">Manage veterinarians and pet owners</p>
        </div>

        {/* Vets Section */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Stethoscope className="w-5 h-5 text-teal-600" />
            <h2 className="text-lg font-semibold text-gray-900">Veterinarians</h2>
            <Badge className="bg-teal-100 text-teal-700">{vets.length}</Badge>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
                  {/* Reset Password Button */}
                  <button
                    onClick={() => setResetTarget(vet)}
                    className="mt-4 w-full flex items-center justify-center gap-2 py-2 rounded-xl border border-violet-200 text-violet-700 hover:bg-violet-50 transition-colors text-sm font-medium"
                  >
                    <KeyRound className="w-4 h-4" />
                    Reset Password
                  </button>
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
            <div className="overflow-x-auto">
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
                          <button
                            onClick={() => setResetTarget(owner)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-violet-200 text-violet-700 hover:bg-violet-50 transition-colors text-xs font-medium"
                          >
                            <KeyRound className="w-3.5 h-3.5" />
                            Reset Password
                          </button>
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
    </AdminSidebar>
  );
}