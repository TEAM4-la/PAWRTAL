import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import backgroundImg from '../assets/background.png';
import logo2 from '../assets/logo2.png';
import { api, userTypeToRole } from '@/api/apiClient';
import {
  ArrowRight,
  Mail,
  RefreshCw,
  Lock,
  Eye,
  EyeOff,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import BackButton from '@/components/ui/BackButton';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();
  const location = useLocation();

  const searchParams = new URLSearchParams(location.search);
  const redirectAfterLogin = searchParams.get('redirect');

  useEffect(() => {
    const reg = location.state?.registeredEmail;
    if (typeof reg === 'string' && reg) setEmail(reg);

    if (location.state?.registeredSuccess) {
      toast.success('Account created successfully! Please sign in with your credentials.', { id: 'account-created' });
      try {
        window.history.replaceState({}, document.title);
      } catch {
        // ignore
      }
    }
  }, [location.state]);

  const handleSignIn = async (e) => {
    if (e) e.preventDefault();

    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Please enter a valid email address.');
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
      const detectedRole = userTypeToRole(profile.user_type) || 'owner';

      if (typeof window !== 'undefined') {
        window.sessionStorage.setItem('pawrtal_role', detectedRole);
        window.sessionStorage.setItem('pawrtal_email', profile.email || email.trim());
      }

      toast.success(`Welcome back, ${profile.first_name || profile.display_name || 'User'}!`);

      // If we came from a QR scan or link redirect, go straight there; otherwise route by role.
      if (redirectAfterLogin) {
        navigate(redirectAfterLogin);
      } else {
        let dashboardPath = '/petowner-dashboard';
        switch (detectedRole) {
          case 'admin':
            dashboardPath = '/clinic-admin-dashboard';
            break;
          case 'vet':
            dashboardPath = '/vet-dashboard';
            break;
          case 'owner':
          default:
            dashboardPath = '/petowner-dashboard';
            break;
        }
        navigate(dashboardPath);
      }
    } catch (e) {
      setError(e.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

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
      <div className="hidden lg:flex lg:w-5/12 xl:w-2/5 flex-col justify-between p-8 xl:p-12 relative z-20 overflow-hidden bg-gradient-to-br from-amber-800 via-amber-600 to-amber-500 text-white">
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="absolute"
              style={{
                top: `${(i * 19 + 7) % 90}%`,
                left: `${(i * 29 + 13) % 90}%`,
                fontSize: `${24 + (i % 4) * 8}px`,
                transform: `rotate(${((i * 15) % 40) - 20}deg)`,
                opacity: 0.4,
              }}
            >
              🐾
            </div>
          ))}
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4 xl:mb-6">
            <img
              src={logo2}
              alt="PAWRTAL"
              className="w-32 h-32 xl:w-40 xl:h-40 object-contain drop-shadow"
            />
          </div>

          <h1 className="text-3xl xl:text-4xl font-extrabold leading-tight mb-4 xl:mb-6">
            Your pet's health,<br />always within reach.
          </h1>

          <p className="text-amber-100 text-base xl:text-lg leading-relaxed">
            A unified platform connecting pet owners and veterinary professionals for seamless, compassionate care.
          </p>
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 p-3.5 xl:p-4 bg-white/10 rounded-2xl border border-white/20 backdrop-blur-sm">
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
      <div className="flex-1 flex flex-col justify-center items-center px-6 py-6 lg:py-8 relative z-20 bg-transparent backdrop-blur-[2px]">
        {/* Mobile logo */}
        <div className="flex lg:hidden items-center gap-2 mb-6">
          <img
            src={logo2}
            alt="PAWRTAL"
            className="w-14 h-14 object-contain"
          />
        </div>

        {/* Form card */}
        <div className="w-full max-w-md bg-white/90 backdrop-blur-md rounded-2xl p-6 sm:p-8 shadow-xl border border-white/40">
          <BackButton to="/" label="Back to home" className="mb-5" />

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-1">Sign in to PAWRTAL</h2>
              <p className="text-gray-500 text-sm">
                Enter your credentials to access your account.
              </p>
            </div>

            <form onSubmit={handleSignIn} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Email address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError('');
                    }}
                    placeholder="name@example.com"
                    autoComplete="email"
                    className="w-full pl-10 pr-4 py-2.5 sm:py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 text-sm bg-white"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-medium text-gray-700">
                    Password
                  </label>
                  <Link
                    to="/forgot-password"
                    className="text-xs text-amber-600 hover:text-amber-700 font-medium hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError('');
                    }}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    className="w-full pl-10 pr-10 py-2.5 sm:py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 text-sm bg-white"
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

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-200/50 transition-colors disabled:opacity-60"
                >
                  {loading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      Sign in <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>

            <div className="mt-6 pt-5 border-t border-gray-100 text-center">
              <p className="text-sm text-gray-600">
                New pet owner?{' '}
                <Link to="/create-account" className="text-amber-600 font-semibold hover:underline">
                  Create an account
                </Link>
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
