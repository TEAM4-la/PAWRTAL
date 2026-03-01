import React from 'react';
import { Link } from 'react-router-dom';  // ← added for navigation
import { motion } from 'framer-motion';
import backgroundImg from '../assets/background.png';  
import {
  PawPrint,
  Heart,
  Calendar,
  QrCode,
  Stethoscope,
  ArrowRight,
  Check,
} from 'lucide-react';

// Cute paw print SVG
const CutePaw = ({ className }) => (
  <svg viewBox="0 0 60 60" className={className} fill="currentColor">
    <ellipse cx="30" cy="38" rx="14" ry="12" />
    <circle cx="18" cy="22" r="7" />
    <circle cx="42" cy="22" r="7" />
    <circle cx="12" cy="32" r="6" />
    <circle cx="48" cy="32" r="6" />
  </svg>
);

// Cute cat face SVG
const CuteCat = ({ className }) => (
  <svg viewBox="0 0 60 60" className={className} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <ellipse cx="30" cy="35" rx="20" ry="16" />
    <path d="M10 35 L14 12 L22 28" />
    <path d="M50 35 L46 12 L38 28" />
    <circle cx="22" cy="32" r="2" fill="currentColor" />
    <circle cx="38" cy="32" r="2" fill="currentColor" />
    <ellipse cx="30" cy="38" rx="3" ry="2" fill="currentColor" />
    <path d="M27 42 Q30 46 33 42" />
  </svg>
);

// Cute dog face SVG
const CuteDog = ({ className }) => (
  <svg viewBox="0 0 60 60" className={className} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <ellipse cx="30" cy="32" rx="18" ry="16" />
    <ellipse cx="12" cy="28" rx="8" ry="12" />
    <ellipse cx="48" cy="28" rx="8" ry="12" />
    <circle cx="24" cy="28" r="2" fill="currentColor" />
    <circle cx="36" cy="28" r="2" fill="currentColor" />
    <ellipse cx="30" cy="36" rx="4" ry="3" fill="currentColor" />
    <path d="M26 42 Q30 46 34 42" />
  </svg>
);

export default function Welcome() {
  const features = [
    { icon: PawPrint,    title: "Complete Pet Profiles",      description: "Keep all your pet's information in one secure place" },
    { icon: Calendar,    title: "Smart Scheduling",           description: "Never miss a vaccination or check-up appointment" },
    { icon: Stethoscope, title: "Vet Communication",          description: "Direct connection with your veterinary clinic" },
    { icon: QrCode,      title: "Digital QR Collar",          description: "Instant access to pet records with a simple scan" },
  ];

  const benefits = [
    "Track vaccinations and medications",
    "Receive smart health reminders",
    "Access records from anywhere",
    "Communicate with your vet directly",
    "Share pet info instantly via QR",
    "Monitor health trends over time",
  ];

  return (
    <>
      {/* Basic global + button styles */}
      <style>{`
        body {
          margin: 0;
          font-family: system-ui, -apple-system, sans-serif;
          background: #fefaf5;
        }
        .btn-primary {
          background: linear-gradient(to right, #f59e0b, #fb923c);
          color: white;
          padding: 0.75rem 1.5rem;
          border-radius: 9999px;
          font-weight: 500;
          box-shadow: 0 4px 6px -1px rgba(245, 158, 11, 0.3);
          transition: background 0.2s;
        }
        .btn-primary:hover {
          background: linear-gradient(to right, #d97706, #ea580c);
        }
        .btn-outline {
          border: 2px solid #fcd34d;
          color: #92400e;
          padding: 0.75rem 1.5rem;
          border-radius: 9999px;
          font-weight: 500;
          transition: background 0.2s;
        }
        .btn-outline:hover {
          background: #fffbeb;
        }
      `}</style>

      <div
        className="min-h-screen relative overflow-hidden"
        style={{
          backgroundImage: `url(${backgroundImg})`,
          backgroundRepeat: 'repeat',
          backgroundSize: '600px auto',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed', // optional: parallax feel
        }}
      >
        {/* Light overlay */}
        <div className="fixed inset-0 pointer-events-none bg-white/35" />

        {/* Header */}
        <header className="fixed top-0 left-0 right-0 z-50 border-b border-amber-100/40 bg-white/70 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6978dd3b25d4410887cb4e17/be8bb8d23_pawrtal-logopng.png"
                alt="PAWRTAL"
                className="w-10 h-10 object-contain"
              />
              <span className="text-xl font-bold text-amber-900 tracking-wide">PAWRTAL</span>
            </div>

            {/* Sign In button with routing */}
            <Link to="/sign-in">
              <button className="btn-primary px-6 py-2.5 rounded-full font-medium shadow-md shadow-amber-200/50">
                Sign In
              </button>
            </Link>
          </div>
        </header>

        {/* Hero Section */}
        <section className="pt-32 pb-20 px-6 relative z-10">
          <div className="max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-100 text-amber-700 text-sm font-medium mb-6 border border-amber-200">
                  <Heart className="w-4 h-4 fill-amber-400" />
                  Trusted by VM Veterinary Clinic
                </div>
                <h1 className="text-5xl lg:text-6xl font-bold text-amber-900 leading-tight mb-6">
                  Your Pet's Health,{' '}
                  <span className="bg-gradient-to-r from-amber-500 to-orange-400 bg-clip-text text-transparent">
                    Simplified
                  </span>
                </h1>
                <p className="text-xl text-amber-800/70 mb-8 leading-relaxed">
                  PAWRTAL connects pet owners with veterinarians through an integrated digital platform. 
                  Track health records, manage appointments, and access your pet's information anytime, anywhere.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  {/* Get Started button with routing */}
                  <Link to="/sign-in">
                    <button className="btn-primary px-8 h-14 text-lg gap-2 rounded-full shadow-lg shadow-amber-300/50 flex items-center">
                      Get Started
                      <ArrowRight className="w-5 h-5" />
                    </button>
                  </Link>
                  <button className="btn-outline px-8 h-14 text-lg rounded-full">
                    Learn More
                  </button>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="relative"
              >
                <div className="relative aspect-square max-w-lg mx-auto">
                  <div className="absolute inset-0 bg-gradient-to-br from-amber-200 to-orange-200 rounded-[2rem] blur-3xl opacity-50" />
                  <div className="relative bg-white rounded-[2rem] shadow-2xl p-8 border-2 border-amber-100">
                    <img
                      src="https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=500&h=500&fit=crop"
                      alt="Happy dog"
                      className="w-full h-80 object-cover rounded-2xl mb-6"
                    />
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center border-2 border-amber-200">
                        <PawPrint className="w-7 h-7 text-amber-600" />
                      </div>
                      <div>
                        <h3 className="font-bold text-amber-900">Max</h3>
                        <p className="text-amber-600 text-sm">Golden Retriever • 3 years</p>
                      </div>
                      <div className="ml-auto px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium border border-green-200">
                        Healthy
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 px-6 relative z-10">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl lg:text-4xl font-bold text-amber-900 mb-4">
                Everything Your Pet Needs
              </h2>
              <p className="text-lg text-amber-700/70 max-w-2xl mx-auto">
                A comprehensive platform designed to make pet healthcare management effortless
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="bg-white rounded-[1.5rem] p-6 shadow-sm border-2 border-amber-100 hover:shadow-lg hover:border-amber-300 transition-all duration-300"
                >
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-100 flex items-center justify-center mb-4 border border-amber-200">
                    <feature.icon className="w-7 h-7 text-amber-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-amber-900 mb-2">{feature.title}</h3>
                  <p className="text-amber-700/70">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-20 px-6 relative z-10">
          <div className="max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div>
                <img
                  src="https://images.unsplash.com/photo-1628009368231-7bb7cfcb0def?w=600&h=500&fit=crop"
                  alt="Vet with pet"
                  className="rounded-[2rem] shadow-xl border-4 border-white"
                />
              </div>
              <div>
                <h2 className="text-3xl lg:text-4xl font-bold text-amber-900 mb-6">
                  Why Choose PAWRTAL?
                </h2>
                <p className="text-lg text-amber-700/70 mb-8">
                  PAWRTAL bridges the gap between pet owners and veterinarians, creating a seamless healthcare experience.
                </p>
                <div className="grid sm:grid-cols-2 gap-4">
                  {benefits.map((benefit, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.4, delay: index * 0.1 }}
                      viewport={{ once: true }}
                      className="flex items-center gap-3"
                    >
                      <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0 border border-amber-200">
                        <Check className="w-4 h-4 text-amber-600" />
                      </div>
                      <span className="text-amber-800">{benefit}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-6 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="bg-gradient-to-br from-amber-400 to-orange-400 rounded-[2rem] p-12 shadow-xl shadow-amber-300/50 relative overflow-hidden">
              <div className="absolute inset-0 opacity-10 pointer-events-none">
                <CutePaw className="absolute top-4 left-8 w-20 h-20 text-white rotate-12" />
                <CuteCat className="absolute bottom-4 right-8 w-24 h-24 text-white -rotate-12" />
                <CutePaw className="absolute top-8 right-20 w-16 h-16 text-white" />
              </div>
              <div className="relative">
                <div className="flex justify-center mb-4">
                  <img
                    src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6978dd3b25d4410887cb4e17/be8bb8d23_pawrtal-logopng.png"
                    alt="PAWRTAL"
                    className="w-24 h-24 object-contain drop-shadow-lg"
                  />
                </div>
                <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
                  Ready to Get Started?
                </h2>
                <p className="text-xl text-amber-100 mb-8 max-w-xl mx-auto">
                  Join PAWRTAL today and give your pet the care they deserve.
                </p>
                {/* Create Free Account button with routing */}
                <Link to="/sign-in">
                  <button className="bg-white text-amber-600 hover:bg-amber-50 px-8 py-4 text-lg rounded-full shadow-lg font-semibold transition-colors">
                    Create Free Account
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-12 px-6 border-t border-amber-200 relative z-10 bg-white/60 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <img
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6978dd3b25d4410887cb4e17/be8bb8d23_pawrtal-logopng.png"
                alt="PAWRTAL"
                className="w-9 h-9 object-contain"
              />
              <span className="text-lg font-bold text-amber-900 tracking-wide">PAWRTAL</span>
            </div>
            <p className="text-amber-600 text-sm">
              © {new Date().getFullYear()} PAWRTAL by VM Veterinary Clinic. All rights reserved.
            </p>
          </div>
        </footer>
      </div>
    </>
  );
}