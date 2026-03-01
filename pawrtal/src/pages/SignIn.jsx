import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom'; // ← React Router navigation
import backgroundImg from '../assets/background.png';
import {
  PawPrint,
  Stethoscope,
  ShieldCheck,
  ArrowRight,
  ChevronLeft,
  Mail,
  RefreshCw,
  CheckCircle2,
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
const STEP_EMAIL = 'email';
const STEP_OTP = 'otp';
const STEP_DONE = 'done';

export default function SignIn() {
  const [step, setStep] = useState(STEP_ROLE);
  const [selectedRole, setSelectedRole] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  const navigate = useNavigate(); // React Router hook for redirection
  const otpRefs = useRef([]);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(c => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleSendOtp = async () => {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    setError('');

    // Simulated delay (replace with real API call later)
    await new Promise(resolve => setTimeout(resolve, 1200));

    setLoading(false);
    setStep(STEP_OTP);
    setResendCooldown(60);
  };

  const handleVerifyOtp = async () => {
    const code = otp.join('');
    if (code.length !== 6) {
      setError('Please enter the full 6-digit code.');
      return;
    }

    setLoading(true);
    setError('');

    // Simulated delay (replace with real API call later)
    await new Promise(resolve => setTimeout(resolve, 1500));

    setLoading(false);
    setStep(STEP_DONE);

    // Role-based redirection using React Router
    setTimeout(() => {
      let dashboardPath = '/dashboard'; // fallback

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

      navigate(dashboardPath); // Redirect to the correct dashboard
    }, 1200);
  };

  const handleOtpChange = (value, index) => {
    if (!/^\d?$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (e, index) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(''));
      otpRefs.current[5]?.focus();
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
              <p className="text-amber-200 text-xs">Trusted partner since 2024</p>
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
            <a
              href="/"
              className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-amber-700 transition-colors mb-6 group"
            >
              <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
              Back to home
            </a>
          )}

          {(step === STEP_EMAIL || step === STEP_OTP) && (
            <button
              onClick={() => setStep(step === STEP_OTP ? STEP_EMAIL : STEP_ROLE)}
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

                <div className="space-y-4">
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
                          group relative w-full flex items-center gap-5 p-5 rounded-2xl 
                          border-2 transition-all duration-300 text-left bg-white
                          ${isSelected 
                            ? `${role.border} ring-2 ${role.ring} shadow-lg` 
                            : `${role.border} hover:shadow-md hover:-translate-y-0.5`}
                        `}
                      >
                        <div className={`w-12 h-12 rounded-xl ${role.iconBg} flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105`}>
                          <Icon className={`w-6 h-6 ${role.iconColor}`} />
                        </div>

                        <div className="flex-1 pr-14">
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
                  onClick={() => selectedRole && setStep(STEP_EMAIL)}
                  disabled={!selectedRole}
                  className={`w-full py-4 rounded-xl font-semibold text-base flex items-center justify-center gap-2 transition-all
                    ${selectedRole 
                      ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-200/50' 
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
                >
                  Continue <ArrowRight className="w-5 h-5" />
                </button>

                <p className="text-center text-sm text-gray-500 mt-6">
                  Don't have an account?{' '}
                  <a href="#" className="text-amber-600 font-medium hover:underline">
                    Contact your clinic to get access.
                  </a>
                </p>
              </motion.div>
            )}

            {/* Email + Password */}
            {step === STEP_EMAIL && (
              <motion.div key="email" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
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

                <h2 className="text-2xl font-bold text-gray-900 mb-1">Enter your email</h2>
                <p className="text-gray-500 mb-8">
                  We'll send a verification code to confirm your identity.
                </p>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email address</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={e => { setEmail(e.target.value); setError(''); }}
                      placeholder="you@example.com"
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
                  onClick={handleSendOtp}
                  disabled={loading}
                  className="w-full py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-white shadow-lg disabled:opacity-60"
                >
                  {loading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Mail className="w-4 h-4" /> Send Verification Code
                    </>
                  )}
                </button>
              </motion.div>
            )}

            {/* OTP */}
            {step === STEP_OTP && (
              <motion.div key="otp" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
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

                <h2 className="text-2xl font-bold text-gray-900 mb-1">Check your email</h2>
                <p className="text-gray-500 mb-2">We sent a 6-digit code to</p>
                <p className="font-semibold text-gray-800 mb-8">{email}</p>

                <div className="flex gap-2 mb-5 justify-center" onPaste={handleOtpPaste}>
                  {otp.map((digit, i) => (
                    <input
                      key={i}
                      ref={el => (otpRefs.current[i] = el)}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={e => handleOtpChange(e.target.value, i)}
                      onKeyDown={e => handleOtpKeyDown(e, i)}
                      className="w-12 h-14 text-center text-xl font-bold border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400"
                    />
                  ))}
                </div>

                {error && <p className="text-red-500 text-xs mb-4 text-center">{error}</p>}

                <button
                  onClick={handleVerifyOtp}
                  disabled={loading || otp.join('').length < 6}
                  className="w-full py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-white shadow-lg disabled:opacity-60 mb-4"
                >
                  {loading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      Verify & Sign In <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <p className="text-center text-sm text-gray-500">
                  Didn't receive it?{' '}
                  <button
                    onClick={handleSendOtp}
                    disabled={resendCooldown > 0}
                    className={`font-semibold ${resendCooldown > 0 ? 'text-gray-400 cursor-not-allowed' : 'text-amber-600 hover:underline'}`}
                  >
                    {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
                  </button>
                </p>
              </motion.div>
            )}

            {/* Success */}
            {step === STEP_DONE && (
              <motion.div
                key="done"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-8"
              >
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8 text-green-500" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Verified!</h2>
                <p className="text-gray-500">Redirecting you to your dashboard...</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}