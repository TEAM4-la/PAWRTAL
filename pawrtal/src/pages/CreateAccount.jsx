import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import backgroundImg from '../assets/background.png';
import { PawPrint, ChevronLeft, Mail, Lock, Eye, EyeOff, User, RefreshCw } from 'lucide-react';
import { api } from '@/api/apiClient';

export default function CreateAccount() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
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
      await api.auth.register({
        email: email.trim(),
        password,
        full_name: fullName.trim() || undefined,
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
          <div className="flex items-center gap-3 mb-16">
            <img
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6978dd3b25d4410887cb4e17/be8bb8d23_pawrtal-logopng.png"
              alt="PAWRTAL"
              className="w-10 h-10 object-contain"
            />
            <span className="text-xl font-bold tracking-widest">PAWRTAL</span>
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

      <div className="flex-1 flex flex-col justify-center items-center px-6 py-12 relative z-20 bg-transparent backdrop-blur-[2px]">
        <div className="flex lg:hidden items-center gap-2 mb-8">
          <img
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6978dd3b25d4410887cb4e17/be8bb8d23_pawrtal-logopng.png"
            alt="PAWRTAL"
            className="w-9 h-9 object-contain"
          />
          <span className="text-lg font-bold text-amber-900 tracking-wide">PAWRTAL</span>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-white/85 backdrop-blur-md rounded-2xl p-8 shadow-xl border border-white/30"
        >
          <Link
            to="/sign-in"
            className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-amber-700 transition-colors mb-6 group"
          >
            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            Back to sign in
          </Link>

          <h2 className="text-2xl font-bold text-gray-900 mb-1">Create account</h2>
          <p className="text-gray-500 mb-8">Pet owners can register here. Veterinarians and admins use the staff invite flow.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Full name</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Jane Doe"
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  autoComplete="new-password"
                  className="w-full pl-10 pr-10 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Confirm password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-white shadow-lg disabled:opacity-60"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Create account'}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
