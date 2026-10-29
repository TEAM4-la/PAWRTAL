import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import backgroundImg from '../assets/background.png';
import logo2 from '../assets/logo2.png';
import { PawPrint, ChevronLeft, Mail, Lock, Eye, EyeOff, User, Phone, RefreshCw, AlertTriangle } from 'lucide-react';
import { api } from '@/api/apiClient';

export default function CreateAccount() {
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

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
      const cleanPhone = phone.replace(/\D/g, '').slice(0, 11);
      await api.auth.register({
        email: email.trim(),
        password,
        full_name: displayName.trim() || fullLegal,
        phone: cleanPhone,
        display_name: displayName.trim() || undefined,
        first_name: firstName.trim(),
        middle_name: middleName.trim() || undefined,
        last_name: lastName.trim(),
      });
      navigate('/sign-in', { state: { registeredEmail: email.trim() } });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex relative overflow-hidden">
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `url(${backgroundImg})`,
          backgroundRepeat: 'repeat',
          backgroundSize: '600px auto',
          backgroundPosition: 'center',
        }}
      />
      <div className="absolute inset-0 z-10 pointer-events-none bg-white/35" />

      <div className="hidden lg:flex lg:w-5/12 xl:w-2/5 flex-col justify-between p-12 relative z-20 overflow-hidden bg-gradient-to-br from-amber-800 via-amber-600 to-amber-500 text-white">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <img
              src={logo2}
              alt="PAWRTAL"
              className="w-40 h-40 object-contain"
            />
          </div>
          <h1 className="text-4xl font-extrabold leading-tight mb-6">
            Create your pet owner account
          </h1>
          <p className="text-amber-100 text-lg leading-relaxed">
            Book visits, track health records, and stay connected with your clinic—all in one place.
          </p>
        </div>
        <div className="relative z-10 flex items-center gap-3 p-4 bg-white/10 rounded-2xl border border-white/20 backdrop-blur-sm">
          <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
            <PawPrint className="w-6 h-6 text-amber-700" />
          </div>
          <p className="text-sm text-amber-100">For pet owners only. Staff accounts are created inside the clinic portal.</p>
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center items-center px-4 sm:px-6 py-8 relative z-20 bg-transparent backdrop-blur-[2px]">
        <div className="flex lg:hidden items-center gap-2 mb-6">
          <img
            src={logo2}
            alt="PAWRTAL"
            className="w-12 h-12 object-contain"
          />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-lg bg-white/90 backdrop-blur-md rounded-2xl p-6 sm:p-8 shadow-xl border border-white/40"
        >
          <Link
            to="/sign-in"
            className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-amber-700 transition-colors mb-5 group"
          >
            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            Back to sign in
          </Link>

          <h2 className="text-2xl font-bold text-gray-900 mb-1">Create account</h2>
          <p className="text-gray-500 text-sm mb-6">Pet owners can register here. Veterinarians and admins use the staff invite flow.</p>

          <form onSubmit={handleSubmit} noValidate className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Display Name <span className="text-gray-400 font-normal">(Optional)</span>
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. JaneD"
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => {
                    setFirstName(e.target.value);
                    setErrors((prev) => ({ ...prev, firstName: undefined }));
                  }}
                  placeholder="Jane"
                  className={`w-full px-3.5 py-2.5 border rounded-xl focus:outline-none focus:ring-2 text-sm transition-colors ${
                    errors.firstName
                      ? 'border-red-500 bg-red-50/20 focus:ring-red-400 focus:border-red-500'
                      : 'border-gray-200 focus:ring-amber-400'
                  }`}
                />
                {errors.firstName && (
                  <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                    {errors.firstName}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Middle Name <span className="text-gray-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={middleName}
                  onChange={(e) => setMiddleName(e.target.value)}
                  placeholder="Marie"
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => {
                    setLastName(e.target.value);
                    setErrors((prev) => ({ ...prev, lastName: undefined }));
                  }}
                  placeholder="Doe"
                  className={`w-full px-3.5 py-2.5 border rounded-xl focus:outline-none focus:ring-2 text-sm transition-colors ${
                    errors.lastName
                      ? 'border-red-500 bg-red-50/20 focus:ring-red-400 focus:border-red-500'
                      : 'border-gray-200 focus:ring-amber-400'
                  }`}
                />
                {errors.lastName && (
                  <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                    {errors.lastName}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
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
                    placeholder="0912 345 6789"
                    className={`w-full pl-10 pr-3.5 py-2.5 border rounded-xl focus:outline-none focus:ring-2 text-sm transition-colors ${
                      errors.phone
                        ? 'border-red-500 bg-red-50/20 focus:ring-red-400 focus:border-red-500'
                        : 'border-gray-200 focus:ring-amber-400'
                    }`}
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
              <label className="block text-xs font-semibold text-gray-700 mb-1">
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
                  placeholder="name@pawrtal.com"
                  autoComplete="email"
                  className={`w-full pl-10 pr-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 text-sm transition-colors ${
                    errors.email
                      ? 'border-red-500 bg-red-50/20 focus:ring-red-400 focus:border-red-500'
                      : 'border-gray-200 focus:ring-amber-400'
                  }`}
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
                <label className="block text-xs font-semibold text-gray-700 mb-1">
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
                    placeholder="At least 6 characters"
                    autoComplete="new-password"
                    className={`w-full pl-10 pr-9 py-2.5 border rounded-xl focus:outline-none focus:ring-2 text-sm transition-colors ${
                      errors.password
                        ? 'border-red-500 bg-red-50/20 focus:ring-red-400 focus:border-red-500'
                        : 'border-gray-200 focus:ring-amber-400'
                    }`}
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
                <label className="block text-xs font-semibold text-gray-700 mb-1">
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
                    placeholder="Repeat password"
                    autoComplete="new-password"
                    className={`w-full pl-10 pr-9 py-2.5 border rounded-xl focus:outline-none focus:ring-2 text-sm transition-colors ${
                      errors.confirm
                        ? 'border-red-500 bg-red-50/20 focus:ring-red-400 focus:border-red-500'
                        : 'border-gray-200 focus:ring-amber-400'
                    }`}
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

            {error && <p className="text-red-500 text-xs font-medium">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-white shadow-lg disabled:opacity-60 transition-all mt-2"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Create account'}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
