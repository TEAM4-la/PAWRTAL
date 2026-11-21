import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import backgroundImg from '../assets/background.png';
import logo from '../assets/LOGO.png';
import BackButton from '@/components/ui/BackButton';
import {
  PawPrint,
  Heart,
  Calendar,
  QrCode,
  Stethoscope,
  ShieldCheck,
  Clock,
  MapPin,
  Phone,
  Mail,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Users,
} from 'lucide-react';

export default function AboutUs() {
  const coreValues = [
    {
      icon: Heart,
      title: 'Compassionate Care',
      color: 'text-rose-600',
      bg: 'bg-rose-50',
      border: 'border-rose-100',
      desc: 'We treat every pet like family, ensuring gentle, stress-free clinical attention and genuine empathy for pet parents.',
    },
    {
      icon: Stethoscope,
      title: 'Clinical Precision',
      color: 'text-teal-600',
      bg: 'bg-teal-50',
      border: 'border-teal-100',
      desc: 'Accurate diagnoses, strict dosage verification, and comprehensive medical record keeping for every patient.',
    },
    {
      icon: ShieldCheck,
      title: 'Trust & Transparency',
      color: 'text-violet-600',
      bg: 'bg-violet-50',
      border: 'border-violet-100',
      desc: 'Pet owners receive clear medical explanations, visible treatment histories, and complete visibility into their pets health.',
    },
    {
      icon: Users,
      title: 'Seamless Collaboration',
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      border: 'border-amber-100',
      desc: 'Unifying front-desk triage, attending veterinarians, and pet owners in one synchronized digital ecosystem.',
    },
  ];

  const clinicServices = [
    { name: 'Comprehensive Consultations', desc: 'Routine examinations, pediatric pet care, senior checkups, and diagnostic assessments.' },
    { name: 'Vaccination & Preventative Care', desc: 'Core rabies, 5-in-1, deworming, and parasite prevention schedules with timely reminders.' },
    { name: 'Surgical & Minor Procedures', desc: 'Spay/neuter, soft-tissue surgeries, and wound management with sterile clinical protocols.' },
    { name: 'Professional Pet Grooming', desc: 'Hygienic baths, dematting, sanitary trims, and flea treatments by experienced groomers.' },
    { name: 'Digital Medical History & QR', desc: 'Instant access to medical certificates, past prescriptions, and scan-enabled lost pet collar tags.' },
    { name: 'Pharmacy & Medical Supplies', desc: 'Certified veterinary medications, supplements, and clinic-monitored inventories.' },
  ];

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#fefaf5] text-gray-800">
      {/* Repeating background */}
      <div
        className="absolute inset-0 z-0 opacity-40 pointer-events-none"
        style={{
          backgroundImage: `url(${backgroundImg})`,
          backgroundRepeat: 'repeat',
          backgroundSize: '600px auto',
          backgroundPosition: 'center',
        }}
      />

      {/* Navigation Bar */}
      <header className="relative z-20 border-b border-amber-200/70 bg-white/70 backdrop-blur-md sticky top-0">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img src={logo} alt="PAWRTAL" className="w-36 h-12 object-contain object-left" />
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/sign-in">
              <button className="px-5 py-2.5 rounded-full border-2 border-amber-300 text-amber-900 font-medium hover:bg-amber-50 text-sm transition-colors">
                Sign In
              </button>
            </Link>
            <Link to="/create-account">
              <button className="px-5 py-2.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-400 text-white font-medium hover:from-amber-600 hover:to-orange-500 text-sm shadow-md transition-all">
                Get Started
              </button>
            </Link>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-6 py-10 space-y-16">
        <div>
          <BackButton to="/" label="Back to Home" />
        </div>

        {/* Hero Section */}
        <section className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-100 text-amber-800 text-xs font-semibold uppercase tracking-wider border border-amber-200">
            <Sparkles className="w-4 h-4 text-amber-600" />
            About PAWRTAL & VM Veterinary Clinic
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-amber-950 tracking-tight leading-tight">
            Caring for Pets with{' '}
            <span className="bg-gradient-to-r from-amber-600 to-orange-500 bg-clip-text text-transparent">
              Heart and Innovation
            </span>
          </h1>
          <p className="text-base sm:text-lg text-amber-900/75 leading-relaxed">
            PAWRTAL is a dedicated veterinary management and pet healthcare platform designed to bridge the gap between pet owners and clinical care teams. Built for VM Veterinary Clinic, our mission is to make pet wellness seamless, transparent, and accessible.
          </p>
        </section>

        {/* Mission & Vision Section */}
        <section className="grid md:grid-cols-2 gap-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 shadow-sm border-2 border-amber-200/80 space-y-4"
          >
            <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-300/40">
              <PawPrint className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-bold text-amber-950">Our Mission</h2>
            <p className="text-amber-900/80 leading-relaxed text-sm sm:text-base">
              To deliver compassionate, accessible, and high-standard veterinary healthcare by bridging communication between pet owners and clinical professionals through modern digital health records, intelligent scheduling, and coordinated clinical care.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 shadow-sm border-2 border-amber-200/80 space-y-4"
          >
            <div className="w-12 h-12 rounded-2xl bg-orange-500 text-white flex items-center justify-center shadow-md shadow-orange-300/40">
              <Stethoscope className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-bold text-amber-950">Our Vision</h2>
            <p className="text-amber-900/80 leading-relaxed text-sm sm:text-base">
              To be the benchmark veterinary healthcare platform where technology elevates patient safety, clinical precision, and client trust—fostering healthier companions, happier pet parents, and an empowered veterinary team.
            </p>
          </motion.div>
        </section>

        {/* Core Values */}
        <section className="space-y-8">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold text-amber-950">Our Core Values</h2>
            <p className="text-amber-800/70 text-sm mt-2">
              The fundamental principles that guide every checkup, surgery, record, and client interaction.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {coreValues.map((val) => {
              const Icon = val.icon;
              return (
                <div
                  key={val.title}
                  className={`bg-white rounded-2xl p-6 border ${val.border} shadow-sm hover:shadow-md transition-shadow space-y-3`}
                >
                  <div className={`w-12 h-12 rounded-xl ${val.bg} flex items-center justify-center`}>
                    <Icon className={`w-6 h-6 ${val.color}`} />
                  </div>
                  <h3 className="font-bold text-gray-900 text-base">{val.title}</h3>
                  <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">{val.desc}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Clinical Services */}
        <section className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 sm:p-10 border border-amber-200/70 space-y-8">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold text-amber-950">What We Offer</h2>
            <p className="text-amber-800/70 text-sm mt-2">
              Integrated clinical services powered by veterinary expertise and digital recordkeeping.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {clinicServices.map((service) => (
              <div key={service.name} className="flex gap-3.5 p-4 rounded-xl bg-amber-50/50 border border-amber-100">
                <CheckCircle2 className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-gray-900 text-sm">{service.name}</h4>
                  <p className="text-xs text-gray-600 mt-1 leading-relaxed">{service.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Clinic Info & Contact */}
        <section className="grid lg:grid-cols-3 gap-8">
          <div className="bg-gradient-to-br from-amber-600 to-orange-500 rounded-3xl p-8 text-white space-y-6 lg:col-span-1 shadow-lg shadow-amber-300/30">
            <div>
              <span className="text-xs uppercase font-semibold text-amber-200 tracking-wider">Partner Clinic</span>
              <h3 className="text-2xl font-bold mt-1">VM Veterinary Clinic</h3>
              <p className="text-amber-100 text-xs sm:text-sm mt-2 leading-relaxed">
                Dedicated to comprehensive animal wellness, surgical excellence, and preventive care for pets of all sizes.
              </p>
            </div>

            <div className="space-y-4 text-xs sm:text-sm border-t border-amber-400/40 pt-6">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-amber-200 flex-shrink-0" />
                <span>VM Veterinary Clinic, Central Operations, Philippines</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-amber-200 flex-shrink-0" />
                <span>0912-345-6789 / (02) 8123-4567</span>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-amber-200 flex-shrink-0" />
                <span>Monday – Saturday: 8:00 AM – 6:00 PM</span>
              </div>
            </div>
          </div>

          <div className="bg-white/90 rounded-3xl p-8 border border-amber-200/80 lg:col-span-2 flex flex-col justify-between space-y-6">
            <div>
              <span className="text-xs uppercase font-semibold text-amber-600 tracking-wider">The Technology</span>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">Why PAWRTAL?</h3>
              <p className="text-gray-600 text-sm mt-3 leading-relaxed">
                Traditional veterinary clinics often face misplaced vaccination cards, phone-tag appointment scheduling, and slow emergency record retrieval. PAWRTAL solves these everyday obstacles by providing:
              </p>
              <ul className="grid sm:grid-cols-2 gap-3 mt-4 text-xs sm:text-sm text-gray-700">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  Permanent cloud-backed medical records
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  Instant QR collar scanning for emergencies
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  Automated reminders for booster shots
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  Strict medical & medication audit trail
                </li>
              </ul>
            </div>

            <div className="pt-6 border-t border-gray-100 flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="font-bold text-gray-900 text-sm">Have questions or want to get started?</p>
                <p className="text-xs text-gray-500">Sign in to your account or create one in under 2 minutes.</p>
              </div>
              <div className="flex items-center gap-3">
                <Link to="/sign-in">
                  <button className="px-5 py-2.5 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 text-xs font-semibold">
                    Sign In
                  </button>
                </Link>
                <Link to="/create-account">
                  <button className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold shadow-md flex items-center gap-1.5">
                    Create Account <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="mt-16 py-8 border-t border-amber-200/80 bg-white/70 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-amber-800">
          <p>© {new Date().getFullYear()} PAWRTAL. In partnership with VM Veterinary Clinic.</p>
          <div className="flex gap-4">
            <Link to="/" className="hover:underline">Home</Link>
            <Link to="/about" className="hover:underline font-semibold">About Us</Link>
            <Link to="/sign-in" className="hover:underline">Sign In</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
