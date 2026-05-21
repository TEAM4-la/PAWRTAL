import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import backgroundImg from '../assets/background.png';
import { api, userTypeToRole } from '@/api/apiClient';
import {
  PawPrint,
  Stethoscope,
  ShieldCheck,
  ArrowRight,
  ChevronLeft,
  Mail,
  RefreshCw,
  Lock,
  Eye,
  EyeOff,
} from 'lucide-react';

const roles = [
  {
    id: 'owner',
    icon: PawPrint,
    title: 'Pet Owner',
    description: 'Manage your pets, track health records, and communicate with your vet.',
    border: 'border-amber-400',
    ring: 'ring-amber-400/60',
    bg: 'bg-amber-50',
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-600',
    dot: 'bg-amber-500',
    accent: 'text-amber-700',
  },
  {
    id: 'vet',
    icon: Stethoscope,
    title: 'Veterinarian',
    description: 'Access patient records, manage appointments, and provide expert care.',
    border: 'border-teal-400',
    ring: 'ring-teal-400/60',
    bg: 'bg-teal-50',
    iconBg: 'bg-teal-100',
    iconColor: 'text-teal-600',
    dot: 'bg-teal-500',
    accent: 'text-teal-700',
  },
  {
    id: 'admin',
    icon: ShieldCheck,
    title: 'Clinic Admin',
    description: 'Oversee clinic operations, manage staff, and access full system controls.',
    border: 'border-violet-400',
    ring: 'ring-violet-400/60',
    bg: 'bg-violet-50',
    iconBg: 'bg-violet-100',
    iconColor: 'text-violet-600',
    dot: 'bg-violet-500',
    accent: 'text-violet-700',
  },
];

const STEP_ROLE = 'role';
const STEP_CREDENTIALS = 'credentials';

export default function SignIn() {
  const [step, setStep] = useState(STEP_ROLE);
  const [selectedRole, setSelectedRole] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();
  const location = useLocation();

  // If arriving from a QR-scanned public pet profile, the URL will contain
  // ?role=owner|vet&redirect=/pet-profile?id=xxx — auto-select role and skip to creds.
  const searchParams = new URLSearchParams(location.search);
  const redirectAfterLogin = searchParams.get('redirect');
  const preselectedRole = searchParams.get('role');

  useEffect(() => {
    const reg = location.state?.registeredEmail;
    if (typeof reg === 'string' && reg) setEmail(reg);
  }, [location.state]);

  useEffect(() => {
    if (redirectAfterLogin && preselectedRole) {
      setSelectedRole(preselectedRole);
      setStep(STEP_CREDENTIALS);
    }
  }, [redirectAfterLogin, preselectedRole]);

  const handleSignIn = async () => {
    if (!/@pawrtal\.com$/i.test(email.trim())) {
      setError('Only @pawrtal.com email addresses are allowed.');
      return;
    }
    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const profile = await api.auth.login({ email: email.trim(), password });
      const serverRole = userTypeToRole(profile.user_type);
      if (serverRole !== selectedRole) {
        const labels = { owner: 'a pet owner account', vet: 'a veterinarian account', admin: 'a clinic admin account' };
        setError(
          `This email is ${labels[serverRole] || 'registered with a different role'}. Go back and pick the role that matches, or use another email.`
        );
        setLoading(false);
        return;
      }

      if (typeof window !== 'undefined') {
        window.sessionStorage.setItem('pawrtal_role', selectedRole || 'owner');
        window.sessionStorage.setItem('pawrtal_email', profile.email || email.trim());
      }

      // If we came from a QR scan, go straight to the pet profile; otherwise default dashboard.
      if (redirectAfterLogin) {
        navigate(redirectAfterLogin);
      } else {
        let dashboardPath = '/dashboard';
        switch (selectedRole) {
          case 'owner':
            dashboardPath = '/petowner-dashboard';
            break;
          case 'vet':
            dashboardPath = '/vet-dashboard';
            break;
          case 'admin':
            dashboardPath = '/clinic-admin-dashboard';
            break;
          default:
            break;
        }
        navigate(dashboardPath);
      }
    } catch (e) {
      setError(e.message || 'Sign in failed.');
    } finally {
      setLoading(false);
    }
  };

  const currentRole = roles.find(r => r.id === selectedRole);

  return (
    <div className="min-h-screen flex relative overflow-hidden">
      {/* Repeating background */}
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `url(${backgroundImg})`,
          backgroundRepeat: 'repeat',
          backgroundSize: '600px auto',
          backgroundPosition: 'center',
        }}
      />

      {/* Light overlay */}
      <div className="absolute inset-0 z-10 pointer-events-none bg-white/35" />

      {/* Left branding panel */}
      <div className="hidden lg:flex lg:w-5/12 xl:w-2/5 flex-col justify-between p-12 relative z-20 overflow-hidden bg-gradient-to-br from-amber-800 via-amber-600 to-amber-500 text-white">
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="absolute"
              style={{
                top: `${Math.random() * 90}%`,
                left: `${Math.random() * 90}%`,
                fontSize: `${24 + Math.random() * 32}px`,
                transform: `rotate(${Math.random() * 40 - 20}deg)`,
                opacity: 0.4,
              }}
            >
              🐾
            </div>
          ))}
        </div>

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
            Your pet's health,<br />always within reach.
          </h1>

          <p className="text-amber-100 text-lg leading-relaxed">
            A unified platform connecting pet owners and veterinary professionals for seamless, compassionate care.
          </p>
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 p-4 bg-white/10 rounded-2xl border border-white/20 backdrop-blur-sm">
            <div className="w-10 h-10 rounded-full bg-amber-300 flex items-center justify-center text-amber-900 font-bold text-sm">
              VM
            </div>
            <div>
              <p className="font-semibold text-sm">VM Veterinary Clinic</p>
              <p className="text-amber-200 text-xs">Trusted partner since 2025</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex flex-col justify-center items-center px-6 py-12 relative z-20 bg-transparent backdrop-blur-[2px]">
        {/* Mobile logo */}
        <div className="flex lg:hidden items-center gap-2 mb-8">
          <img
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6978dd3b25d4410887cb4e17/be8bb8d23_pawrtal-logopng.png"
            alt="PAWRTAL"
            className="w-9 h-9 object-contain"
          />
          <span className="text-lg font-bold text-amber-900 tracking-wide">PAWRTAL</span>
        </div>

        {/* Form card */}
        <div className="w-full max-w-md bg-white/85 backdrop-blur-md rounded-2xl p-8 shadow-xl border border-white/30">
          {/* Back navigation */}
          {step === STEP_ROLE && (
            <Link
              to="/"
              className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-amber-700 transition-colors mb-6 group"
            >
              <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
              Back to home
            </Link>
          )}

          {step === STEP_CREDENTIALS && (
            <button
              type="button"
              onClick={() => { setStep(STEP_ROLE); setError(''); }}
              className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-amber-700 transition-colors mb-6 group"
            >
              <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
              Back
            </button>
          )}

          <AnimatePresence mode="wait">
            {/* Role Selection */}
            {step === STEP_ROLE && (
              <motion.div
                key="role"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-1">Sign in to PAWRTAL</h2>
                  <p className="text-gray-500">Select your role to get started</p>
                </div>

                <div className="space-y-5">
                  {roles.map((role) => {
                    const Icon = role.icon;
                    const isSelected = selectedRole === role.id;

                    return (
                      <motion.button
                        key={role.id}
                        onClick={() => setSelectedRole(role.id)}
                        whileTap={{ scale: 0.98 }}
                        animate={isSelected ? { scale: 1.02, y: -2 } : { scale: 1, y: 0 }}
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                        className={`
                          group relative w-full flex items-center gap-6 p-6 rounded-2xl 
                          border-2 transition-all duration-300 text-left bg-white
                          ${isSelected 
                            ? `${role.border} ring-2 ${role.ring} shadow-lg` 
                            : `border-gray-900/35 hover:shadow-md hover:-translate-y-0.5`}
                        `}
                      >
                        <div className={`w-12 h-12 rounded-xl ${role.iconBg} flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105`}>
                          <Icon className={`w-6 h-6 ${role.iconColor}`} />
                        </div>

                        <div className="flex-1 pr-10">
                          <p className="font-bold text-gray-900 text-base leading-tight">
                            {role.title}
                          </p>
                          <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                            {role.description}
                          </p>
                        </div>

                        {isSelected && (
                          <motion.div
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ type: "spring", stiffness: 400, damping: 25, delay: 0.1 }}
                            className={`absolute right-5 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full ${role.dot} ring-2 ring-white shadow-sm`}
                          />
                        )}
                      </motion.button>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={() => selectedRole && setStep(STEP_CREDENTIALS)}
                  disabled={!selectedRole}
                  className={`w-full py-4 rounded-xl font-semibold text-base flex items-center justify-center gap-2 transition-all
                    ${selectedRole 
                      ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-200/50' 
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
                >
                  Continue <ArrowRight className="w-5 h-5" />
                </button>

                <p className="text-center text-sm text-gray-500 mt-6">
                  New pet owner?{' '}
                  <Link to="/create-account" className="text-amber-600 font-medium hover:underline">
                    Create a Pet Owner account
                  </Link>
                </p>
              </motion.div>
            )}

            {/* Email + Password */}
            {step === STEP_CREDENTIALS && (
              <motion.div key="credentials" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                {currentRole && (
                  <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl ${currentRole.bg} border-2 ${currentRole.border} mb-6 shadow-sm`}>
                    <div className={`w-8 h-8 rounded-lg ${currentRole.iconBg} flex items-center justify-center`}>
                      <currentRole.icon className={`w-5 h-5 ${currentRole.iconColor}`} />
                    </div>
                    <span className={`font-medium text-sm ${currentRole.accent}`}>
                      {currentRole.title}
                    </span>
                  </div>
                )}

                <h2 className="text-2xl font-bold text-gray-900 mb-1">Sign in</h2>
                <p className="text-gray-500 mb-8">
                  Enter the email and password for your account.
                </p>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email address</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={e => { setEmail(e.target.value); setError(''); }}
                      placeholder="name@pawrtal.com"
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400"
                    />
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={e => { setPassword(e.target.value); setError(''); }}
                      placeholder="••••••••"
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
                  {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
                </div>

                <button
                  type="button"
                  onClick={handleSignIn}
                  disabled={loading}
                  className="w-full py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-white shadow-lg disabled:opacity-60"
                >
                  {loading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      Sign in <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <p className="text-center text-sm text-gray-500 mt-4">
                  Pet owners can{' '}
                  <Link to="/create-account" className="text-amber-600 font-medium hover:underline">
                    create an account here
                  </Link>
                  . Staff accounts are created in the clinic portal.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}