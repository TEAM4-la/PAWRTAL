import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import backgroundImg from '../assets/background.png';
import logo2 from '../assets/logo2.png';
import { api } from '@/api/apiClient';
import {
  ArrowRight,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  RefreshCw,
  CheckCircle2,
  KeyRound,
  ShieldCheck,
} from 'lucide-react';
import { toast } from 'sonner';
import BackButton from '@/components/ui/BackButton';

const STEP_EMAIL = 'email';
const STEP_OTP = 'otp';
const STEP_NEW_PASSWORD = 'new_password';
const STEP_SUCCESS = 'success';

export default function ForgotPassword() {
  const [step, setStep] = useState(STEP_EMAIL);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [phoneMask, setPhoneMask] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();

  // Step 1: Send OTP
  const handleSendOtp = async () => {
    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }
    if (!/@pawrtal\.com$/i.test(email.trim())) {
      setError('Only @pawrtal.com email addresses are allowed.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await api.auth.forgotPassword(email.trim());
      if (res.phoneMask) {
        setPhoneMask(res.phoneMask);
        setStep(STEP_OTP);
        toast.success(`OTP sent to ${res.phoneMask}`);
      } else {
        setError('No phone number is linked to this account. Please contact the clinic admin to reset your password.');
      }
    } catch (e) {
      setError(e.message || 'Failed to send OTP.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async () => {
    if (!otp.trim() || otp.trim().length !== 6) {
      setError('Please enter the 6-digit OTP.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await api.auth.verifyOtp({ email: email.trim(), otp: otp.trim() });
      setResetToken(res.token);
      setStep(STEP_NEW_PASSWORD);
      toast.success('OTP verified! Set your new password.');
    } catch (e) {
      setError(e.message || 'OTP verification failed.');
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    setLoading(true);
    setError('');
    setOtp('');

    try {
      const res = await api.auth.forgotPassword(email.trim());
      if (res.phoneMask) {
        setPhoneMask(res.phoneMask);
        toast.success(`New OTP sent to ${res.phoneMask}`);
      }
    } catch (e) {
      setError(e.message || 'Failed to resend OTP.');
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Reset Password
  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await api.auth.resetPassword({ email: email.trim(), token: resetToken, newPassword });
      setStep(STEP_SUCCESS);
      toast.success('Password reset successfully!');
    } catch (e) {
      setError(e.message || 'Password reset failed.');
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
          <div className="flex items-center gap-3 mb-4 xl:mb-6">
            <img
              src={logo2}
              alt="PAWRTAL"
              className="w-32 h-32 xl:w-40 xl:h-40 object-contain drop-shadow"
            />
          </div>

          <h1 className="text-3xl xl:text-4xl font-extrabold leading-tight mb-4 xl:mb-6">
            Reset your<br />password securely.
          </h1>

          <p className="text-amber-100 text-base xl:text-lg leading-relaxed">
            We'll send a verification code to your registered mobile number to confirm your identity.
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
      <div className="flex-1 flex flex-col justify-center items-center px-6 py-4 lg:py-6 relative z-20 bg-transparent backdrop-blur-[2px]">
        {/* Mobile logo */}
        <div className="flex lg:hidden items-center gap-2 mb-6">
          <img src={logo2} alt="PAWRTAL" className="w-12 h-12 object-contain" />
        </div>

        {/* Form card */}
        <div className="w-full max-w-md bg-white/85 backdrop-blur-md rounded-2xl p-6 sm:p-7 shadow-xl border border-white/30 lg:-translate-y-2">
          <BackButton to="/sign-in" label="Back to sign in" className="mb-4" />

          <AnimatePresence mode="wait">
            {/* Step 1: Enter Email */}
            {step === STEP_EMAIL && (
              <motion.div
                key="email"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-11 h-11 rounded-xl bg-amber-100 flex items-center justify-center">
                    <KeyRound className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Forgot password?</h2>
                    <p className="text-gray-500 text-sm">Enter your email to receive an OTP via SMS</p>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Email address</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={e => { setEmail(e.target.value); setError(''); }}
                      placeholder="name@pawrtal.com"
                      className="w-full pl-10 pr-4 py-2.5 sm:py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 text-sm"
                      onKeyDown={e => e.key === 'Enter' && handleSendOtp()}
                    />
                  </div>
                  {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
                </div>

                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={loading}
                  className="w-full py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-white shadow-lg disabled:opacity-60"
                >
                  {loading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      Send OTP <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <p className="text-center text-sm text-gray-500 mt-3.5">
                  Remember your password?{' '}
                  <Link to="/sign-in" className="text-amber-600 font-medium hover:underline">
                    Sign in
                  </Link>
                </p>
              </motion.div>
            )}

            {/* Step 2: Enter OTP */}
            {step === STEP_OTP && (
              <motion.div
                key="otp"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-11 h-11 rounded-xl bg-teal-100 flex items-center justify-center">
                    <Phone className="w-5 h-5 text-teal-600" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Verify OTP</h2>
                    <p className="text-gray-500 text-sm">Enter the 6-digit code sent to {phoneMask}</p>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">OTP Code</label>
                  <div className="relative">
                    <ShieldCheck className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={otp}
                      onChange={e => {
                        const digits = e.target.value.replace(/\D/g, '').slice(0, 6);
                        setOtp(digits);
                        setError('');
                      }}
                      placeholder="000000"
                      maxLength={6}
                      className="w-full pl-10 pr-4 py-2.5 sm:py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 text-sm tracking-[0.5em] text-center font-mono text-lg"
                      onKeyDown={e => e.key === 'Enter' && handleVerifyOtp()}
                    />
                  </div>
                  {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
                </div>

                <button
                  type="button"
                  onClick={handleVerifyOtp}
                  disabled={loading || otp.length !== 6}
                  className="w-full py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-white shadow-lg disabled:opacity-60"
                >
                  {loading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      Verify Code <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <p className="text-center text-sm text-gray-500 mt-3.5">
                  Didn't receive the code?{' '}
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={loading}
                    className="text-amber-600 font-medium hover:underline disabled:opacity-50"
                  >
                    Resend OTP
                  </button>
                </p>
              </motion.div>
            )}

            {/* Step 3: New Password */}
            {step === STEP_NEW_PASSWORD && (
              <motion.div
                key="new_password"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-11 h-11 rounded-xl bg-violet-100 flex items-center justify-center">
                    <Lock className="w-5 h-5 text-violet-600" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">New password</h2>
                    <p className="text-gray-500 text-sm">Create a strong password for your account</p>
                  </div>
                </div>

                <div className="mb-3.5">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">New Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={e => { setNewPassword(e.target.value); setError(''); }}
                      placeholder="At least 6 characters"
                      className="w-full pl-10 pr-10 py-2.5 sm:py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 text-sm"
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

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={e => { setConfirmPassword(e.target.value); setError(''); }}
                      placeholder="Repeat password"
                      className="w-full pl-10 pr-10 py-2.5 sm:py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 text-sm"
                      onKeyDown={e => e.key === 'Enter' && handleResetPassword()}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
                </div>

                <button
                  type="button"
                  onClick={handleResetPassword}
                  disabled={loading}
                  className="w-full py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-white shadow-lg disabled:opacity-60"
                >
                  {loading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      Reset Password <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </motion.div>
            )}

            {/* Step 4: Success */}
            {step === STEP_SUCCESS && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-4"
              >
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Password Reset!</h2>
                <p className="text-gray-500 text-sm mb-6">
                  Your password has been changed successfully. You can now sign in with your new password.
                </p>

                <button
                  type="button"
                  onClick={() => navigate('/sign-in')}
                  className="w-full py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-white shadow-lg"
                >
                  Sign in <ArrowRight className="w-4 h-4" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
