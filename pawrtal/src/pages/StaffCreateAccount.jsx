import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/apiClient';
import VetSidebar from '@/components/layout/VetSidebar';
import AdminSidebar from '@/components/layout/AdminSidebar';
import { ShieldAlert, RefreshCw, Mail, Lock, User, Phone, Eye, EyeOff, Stethoscope, Building2, ChevronLeft, ChevronDown, AlertTriangle } from 'lucide-react';

function StaffForm({ isAdminOnly }) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [displayName, setDisplayName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [userType, setUserType] = useState('veterinarian');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState({});
  const [done, setDone] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setDone('');

    const newErrors = {};
    if (!firstName.trim()) {
      newErrors.firstName = 'First name is required.';
    }
    if (!lastName.trim()) {
      newErrors.lastName = 'Last name is required.';
    }
    if (!phone.trim()) {
      newErrors.phone = 'Phone number is required.';
    }
    if (!email.trim()) {
      newErrors.email = 'Email address is required.';
    } else if (!/@pawrtal\.com$/i.test(email.trim())) {
      newErrors.email = 'Only @pawrtal.com email addresses are allowed.';
    }
    if (!password) {
      newErrors.password = 'Password is required.';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters.';
    }
    if (!confirm) {
      newErrors.confirm = 'Please confirm your password.';
    } else if (password !== confirm) {
      newErrors.confirm = 'Passwords do not match.';
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      return;
    }

    setLoading(true);
    try {
      const fullLegal = [firstName.trim(), middleName.trim(), lastName.trim()].filter(Boolean).join(' ');
      const computedDisplayName = displayName.trim() || fullLegal;
      const cleanPhone = phone.replace(/\D/g, '').slice(0, 11);
      await api.auth.registerStaff({
        email: email.trim(),
        password,
        full_name: computedDisplayName,
        user_type: userType,
        license_number: licenseNumber.trim() || undefined,
        specialization: specialization.trim() || undefined,
        phone: cleanPhone,
        display_name: displayName.trim() || undefined,
        first_name: firstName.trim(),
        middle_name: middleName.trim() || undefined,
        last_name: lastName.trim(),
      });
      setDone(`Account created for ${email.trim()}. They can sign in from the staff sign-in flow.`);
      setEmail('');
      setPassword('');
      setConfirm('');
      setDisplayName('');
      setFirstName('');
      setMiddleName('');
      setLastName('');
      setPhone('');
      setLicenseNumber('');
      setSpecialization('');
      setErrors({});
      qc.invalidateQueries({ queryKey: ['currentUser'] });
      qc.invalidateQueries({ queryKey: ['me'] });
      qc.invalidateQueries({ queryKey: ['allUsers'] });
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
    <div className="p-6 lg:p-10 max-w-2xl mx-auto">
      <button 
        type="button"
        onClick={() => navigate(isAdminOnly ? createPageUrl('AdminStaff') : createPageUrl('VetDashboard'))} 
        className={`inline-flex items-center gap-1 text-sm text-gray-500 ${isAdminOnly ? 'hover:text-violet-700' : 'hover:text-teal-700'} transition-colors mb-4`}
      >
        <ChevronLeft className="w-4 h-4" /> Back
      </button>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Create staff account</h1>
      <p className="text-gray-500 text-sm mb-8">
        Add a veterinarian or clinic admin. They will use this email and password to sign in.
      </p>

      <form onSubmit={handleSubmit} noValidate className="space-y-4 bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
          <div className="relative">
            <select
              value={userType}
              onChange={(e) => setUserType(e.target.value)}
              className={`w-full py-2.5 pl-3 pr-10 border border-gray-200 rounded-xl ${ring} focus:outline-none focus:ring-2 bg-white appearance-none cursor-pointer text-sm`}
            >
              <option value="veterinarian">Veterinarian</option>
              {isAdminOnly && <option value="admin">Clinic admin</option>}
            </select>
            <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
          </div>
          {!isAdminOnly && (
            <p className="text-xs text-gray-500 mt-1">Only clinic admins can create admin accounts.</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Display Name <span className="text-gray-400 font-normal text-xs">(Optional)</span>
          </label>
          <div className="relative">
            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className={`w-full pl-10 pr-3.5 py-2.5 border border-gray-200 rounded-xl ${ring} focus:outline-none focus:ring-2 text-sm`}
              placeholder={userType === 'veterinarian' ? "e.g. Dr. Rivera" : "e.g. Admin Sam"}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              First Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => {
                setFirstName(e.target.value);
                setErrors((prev) => ({ ...prev, firstName: undefined }));
              }}
              className={`w-full px-3.5 py-2.5 border rounded-xl focus:outline-none focus:ring-2 text-sm transition-colors ${
                errors.firstName
                  ? 'border-red-500 bg-red-50/20 focus:ring-red-400 focus:border-red-500'
                  : `border-gray-200 ${ring}`
              }`}
              placeholder="Sam"
            />
            {errors.firstName && (
              <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                {errors.firstName}
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Middle Name <span className="text-gray-400 font-normal text-xs">(Optional)</span>
            </label>
            <input
              type="text"
              value={middleName}
              onChange={(e) => setMiddleName(e.target.value)}
              className={`w-full px-3.5 py-2.5 border border-gray-200 rounded-xl ${ring} focus:outline-none focus:ring-2 text-sm`}
              placeholder="Lee"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Last Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => {
                setLastName(e.target.value);
                setErrors((prev) => ({ ...prev, lastName: undefined }));
              }}
              className={`w-full px-3.5 py-2.5 border rounded-xl focus:outline-none focus:ring-2 text-sm transition-colors ${
                errors.lastName
                  ? 'border-red-500 bg-red-50/20 focus:ring-red-400 focus:border-red-500'
                  : `border-gray-200 ${ring}`
              }`}
              placeholder="Rivera"
            />
            {errors.lastName && (
              <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                {errors.lastName}
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  setErrors((prev) => ({ ...prev, phone: undefined }));
                }}
                className={`w-full pl-10 pr-3.5 py-2.5 border rounded-xl focus:outline-none focus:ring-2 text-sm transition-colors ${
                  errors.phone
                    ? 'border-red-500 bg-red-50/20 focus:ring-red-400 focus:border-red-500'
                    : `border-gray-200 ${ring}`
                }`}
                placeholder="0912 345 6789"
              />
            </div>
            {errors.phone && (
              <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                {errors.phone}
              </p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setErrors((prev) => ({ ...prev, email: undefined }));
              }}
              className={`w-full pl-10 pr-3.5 py-2.5 border rounded-xl focus:outline-none focus:ring-2 text-sm transition-colors ${
                errors.email
                  ? 'border-red-500 bg-red-50/20 focus:ring-red-400 focus:border-red-500'
                  : `border-gray-200 ${ring}`
              }`}
              placeholder="name@pawrtal.com"
            />
          </div>
          {errors.email && (
            <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
              {errors.email}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setErrors((prev) => ({ ...prev, password: undefined }));
                }}
                className={`w-full pl-10 pr-9 py-2.5 border rounded-xl focus:outline-none focus:ring-2 text-sm transition-colors ${
                  errors.password
                    ? 'border-red-500 bg-red-50/20 focus:ring-red-400 focus:border-red-500'
                    : `border-gray-200 ${ring}`
                }`}
                placeholder="Min. 6 chars"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                {errors.password}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirm Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type={showConfirm ? 'text' : 'password'}
                value={confirm}
                onChange={(e) => {
                  setConfirm(e.target.value);
                  setErrors((prev) => ({ ...prev, confirm: undefined }));
                }}
                className={`w-full pl-10 pr-9 py-2.5 border rounded-xl focus:outline-none focus:ring-2 text-sm transition-colors ${
                  errors.confirm
                    ? 'border-red-500 bg-red-50/20 focus:ring-red-400 focus:border-red-500'
                    : `border-gray-200 ${ring}`
                }`}
                placeholder="Repeat password"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.confirm && (
              <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                {errors.confirm}
              </p>
            )}
          </div>
        </div>

        {userType === 'veterinarian' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                PRC License / Registration No. (optional)
              </label>
              <div className="relative">
                <Stethoscope className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  value={licenseNumber}
                  onChange={(e) => setLicenseNumber(e.target.value)}
                  placeholder="e.g., 0012345 or PRC-0012345"
                  className={`w-full pl-10 pr-3.5 py-2.5 border border-gray-200 rounded-xl ${ring} focus:outline-none focus:ring-2 text-sm`}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">Official 5–7 digit PRC veterinary board registration number</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Specialization (optional)</label>
              <input
                value={specialization}
                onChange={(e) => setSpecialization(e.target.value)}
                placeholder="e.g. Small Animal Surgery, Dermatology"
                className={`w-full px-3.5 py-2.5 border border-gray-200 rounded-xl ${ring} focus:outline-none focus:ring-2 text-sm`}
              />
            </div>
          </>
        )}

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
