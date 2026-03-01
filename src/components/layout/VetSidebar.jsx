import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import {
  LayoutDashboard,
  Calendar,
  PawPrint,
  ClipboardList,
  FileText,
  Users,
  Settings,
  LogOut,
  Menu,
  Stethoscope,
  ChevronRight,
  Plus,
} from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, page: 'VetDashboard' },
  { label: 'Appointments', icon: Calendar, page: 'VetAppointments' },
  { label: 'Patients', icon: PawPrint, page: 'Patients' },
  { label: 'Health Records', icon: ClipboardList, page: 'VetRecords' },
  { label: 'Add Record', icon: FileText, page: 'VetAddRecord' },
];

const bottomItems = [
  { label: 'Settings', icon: Settings, page: 'Settings' },
];

export default function VetSidebar({ user, children }) {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  const path = location.pathname.split('?')[0];
  const isActive = (page) => {
    const pagePath = createPageUrl(page).split('?')[0];
    return path === pagePath || (pagePath !== '/' && path.startsWith(pagePath + '?'));
  };

  async function handleLogout() {
    await base44.auth.logout(createPageUrl('Welcome'));
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-teal-100/60">
        <img
          src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6978dd3b25d4410887cb4e17/be8bb8d23_pawrtal-logopng.png"
          alt="PAWRTAL"
          className="w-9 h-9 object-contain"
        />
        <span className="text-lg font-extrabold text-teal-900 tracking-widest">PAWRTAL</span>
      </div>

      {/* Vet badge */}
      <div className="px-4 py-4 mx-3 mt-4 rounded-2xl bg-gradient-to-br from-teal-50 to-emerald-50 border border-teal-100 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
          {user?.full_name?.[0] || 'V'}
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-teal-900 text-sm truncate">Dr. {user?.full_name?.split(' ').pop() || 'Veterinarian'}</p>
          <p className="text-teal-600 text-xs truncate flex items-center gap-1">
            <Stethoscope className="w-3 h-3" /> Veterinarian
          </p>
        </div>
      </div>

      {/* Quick action */}
      <div className="px-3 mt-4">
        <Link to={createPageUrl('VetAppointments')} onClick={() => setOpen(false)}>
          <button className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 text-white text-sm font-semibold shadow-md shadow-teal-200 hover:from-teal-600 hover:to-emerald-600 transition-all">
            <Calendar className="w-4 h-4" />
            View Schedule
          </button>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 mt-5 space-y-0.5 overflow-y-auto">
        <p className="text-xs font-semibold text-teal-400 uppercase tracking-wider px-3 mb-2">Menu</p>
        {navItems.map(({ label, icon: Icon, page }) => {
          const active = isActive(page);
          return (
            <Link key={label} to={createPageUrl(page)} onClick={() => setOpen(false)}>
              <div className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group cursor-pointer
                ${active
                  ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow-md shadow-teal-200'
                  : 'text-teal-800 hover:bg-teal-50 hover:text-teal-900'
                }`}>
                <Icon className={`flex-shrink-0 ${active ? 'text-white' : 'text-teal-500 group-hover:text-teal-700'}`} style={{width:'18px',height:'18px'}} />
                <span className="text-sm font-medium flex-1">{label}</span>
                {active && <ChevronRight className="w-3.5 h-3.5 text-white/70" />}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="px-3 pb-5 space-y-0.5 border-t border-teal-100 pt-4">
        {bottomItems.map(({ label, icon: Icon, page }) => (
          <Link key={label} to={createPageUrl(page)} onClick={() => setOpen(false)}>
            <div className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group cursor-pointer
              ${isActive(page) ? 'bg-teal-100 text-teal-800' : 'text-teal-700 hover:bg-teal-50'}`}>
              <Icon className="text-teal-500 group-hover:text-teal-700" style={{width:'18px',height:'18px'}} />
              <span className="text-sm font-medium">{label}</span>
            </div>
          </Link>
        ))}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-500 hover:bg-red-50 transition-all group cursor-pointer">
              <LogOut style={{width:'18px',height:'18px'}} />
              <span className="text-sm font-medium">Sign Out</span>
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Sign out of PAWRTAL?</AlertDialogTitle>
              <AlertDialogDescription>
                You will be logged out of your account. You can sign back in at any time.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleLogout} className="bg-red-600 hover:bg-red-700">
                Sign Out
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-teal-50/20">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-teal-100 fixed inset-y-0 left-0 z-30 shadow-sm">
        <SidebarContent />
      </aside>

      {/* Mobile Overlay */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-72 bg-white shadow-2xl z-50">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        {/* Mobile topbar */}
        <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-teal-100 sticky top-0 z-20">
          <button onClick={() => setOpen(true)} className="p-2 rounded-lg text-teal-700 hover:bg-teal-50">
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6978dd3b25d4410887cb4e17/be8bb8d23_pawrtal-logopng.png"
              alt="PAWRTAL" className="w-7 h-7 object-contain" />
            <span className="font-bold text-teal-900 tracking-wider text-sm">PAWRTAL</span>
          </div>
          <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-bold text-sm">
            {user?.full_name?.[0] || 'V'}
          </div>
        </header>

        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}