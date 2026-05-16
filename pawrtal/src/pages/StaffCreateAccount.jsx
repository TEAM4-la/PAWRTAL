import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/apiClient';
import VetSidebar from '@/components/layout/VetSidebar';
import AdminSidebar from '@/components/layout/AdminSidebar';
import { ShieldAlert, RefreshCw, Mail, Lock, User, Stethoscope, Building2 } from 'lucide-react';

function StaffForm({ isAdminOnly }) {
  const qc = useQueryClient();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [userType, setUserType] = useState('veterinarian');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [clinicName, setClinicName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setDone('');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await api.auth.registerStaff({
        email: email.trim(),
        password,
        full_name: fullName.trim() || undefined,
        user_type: userType,
        license_number: licenseNumber.trim() || undefined,
        specialization: specialization.trim() || undefined,
        clinic_name: clinicName.trim() || undefined,
      });
      setDone(`Account created for ${email.trim()}. They can sign in from the staff sign-in flow.`);
      setEmail('');
      setPassword('');
      setConfirm('');
      setFullName('');
      setLicenseNumber('');
      setSpecialization('');
      setClinicName('');
      qc.invalidateQueries({ queryKey: ['currentUser'] });
      qc.invalidateQueries({ queryKey: ['me'] });
    } catch (err) {
      setError(err.message || 'Could not create account.');
    } finally {
      setLoading(false);
    }
  }

  const accent = isAdminOnly ? 'violet' : 'teal';
  const ring = accent === 'violet' ? 'focus:ring-violet-400' : 'focus:ring-teal-400';
  const btn =
    accent === 'violet'
      ? 'bg-violet-600 hover:bg-violet-700 shadow-violet-200/50'
      : 'bg-teal-600 hover:bg-teal-700 shadow-teal-200/50';

  return (
    <div className="p-6 lg:p-10 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Create staff account</h1>
      <p className="text-gray-500 text-sm mb-8">
        Add a veterinarian or clinic admin. They will use this email and password to sign in.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
          <select
            value={userType}
            onChange={(e) => setUserType(e.target.value)}
            className={`w-full py-3 px-3 border border-gray-200 rounded-xl ${ring} focus:outline-none focus:ring-2`}
          >
            <option value="veterinarian">Veterinarian</option>
            {isAdminOnly && <option value="admin">Clinic admin</option>}
          </select>
          {!isAdminOnly && (
            <p className="text-xs text-gray-500 mt-1">Only clinic admins can create admin accounts.</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Full name</label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className={`w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl ${ring} focus:outline-none focus:ring-2`}
              placeholder="Dr. Sam Rivera"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl ${ring} focus:outline-none focus:ring-2`}
              placeholder="staff@clinic.com"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl ${ring} focus:outline-none focus:ring-2`}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Confirm password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className={`w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl ${ring} focus:outline-none focus:ring-2`}
            />
          </div>
        </div>

        {userType === 'veterinarian' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">License number (optional)</label>
              <div className="relative">
                <Stethoscope className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  value={licenseNumber}
                  onChange={(e) => setLicenseNumber(e.target.value)}
                  className={`w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl ${ring} focus:outline-none focus:ring-2`}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Specialization (optional)</label>
              <input
                value={specialization}
                onChange={(e) => setSpecialization(e.target.value)}
                className={`w-full px-3 py-3 border border-gray-200 rounded-xl ${ring} focus:outline-none focus:ring-2`}
              />
            </div>
          </>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Clinic name (optional)</label>
          <div className="relative">
            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={clinicName}
              onChange={(e) => setClinicName(e.target.value)}
              className={`w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl ${ring} focus:outline-none focus:ring-2`}
            />
          </div>
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}
        {done && <p className="text-green-700 text-sm">{done}</p>}

        <button
          type="submit"
          disabled={loading}
          className={`w-full py-3 rounded-xl font-semibold text-white shadow-lg disabled:opacity-60 ${btn}`}
        >
          {loading ? <RefreshCw className="w-5 h-5 animate-spin mx-auto" /> : 'Create staff account'}
        </button>
      </form>
    </div>
  );
}

export default function StaffCreateAccount() {
  const { data: user, isLoading } = useQuery({
    queryKey: ['staffCreateUser'],
    queryFn: () => api.auth.me(),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-teal-50/30">
        <RefreshCw className="w-8 h-8 animate-spin text-teal-600" />
      </div>
    );
  }

  const ut = (user?.user_type || '').toLowerCase();
  const allowed = ut === 'veterinarian' || ut === 'admin';

  if (!allowed) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-gray-50 to-teal-50/40">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg border border-gray-100 p-8 text-center">
          <ShieldAlert className="w-14 h-14 text-amber-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">Staff only</h1>
          <p className="text-gray-600 text-sm mb-6">
            Only signed-in veterinarians and clinic admins can create staff accounts.
          </p>
          <Link
            to="/sign-in"
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-teal-600 text-white font-medium hover:bg-teal-700"
          >
            Go to sign in
          </Link>
        </div>
      </div>
    );
  }

  const isAdminUser = ut === 'admin';
  const Shell = isAdminUser ? AdminSidebar : VetSidebar;
  const shellProps = isAdminUser ? { currentUser: user } : { user };

  return (
    <Shell {...shellProps}>
      <StaffForm isAdminOnly={isAdminUser} />
    </Shell>
  );
}
