import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import {
  LayoutDashboard, Calendar, Users, Stethoscope, BarChart2,
  Settings, LogOut, Menu, ShieldCheck, ChevronRight,
} from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, page: 'ClinicAdminDashboard' },
  { label: 'Appointments', icon: Calendar, page: 'AdminAppointments' },
  { label: 'Staff', icon: Stethoscope, page: 'AdminStaff' },
  { label: 'Patients', icon: Users, page: 'AdminPatients' },
  { label: 'Reports', icon: BarChart2, page: 'AdminReports' },
];

const bottomItems = [
  { label: 'Settings', icon: Settings, page: 'Settings' },
];

export default function AdminSidebar({ children, currentUser }) {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  const path = location.pathname.split('?')[0];
  const isActive = (page) => {
    const pagePath = createPageUrl(page).split('?')[0];
    return path === pagePath || (pagePath !== '/' && path.startsWith(pagePath + '?'));
  };

  const handleLogout = () => base44.auth.logout(createPageUrl('Welcome'));

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-violet-100/60">
        <img
          src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6978dd3b25d4410887cb4e17/be8bb8d23_pawrtal-logopng.png"
          alt="PAWRTAL"
          className="w-9 h-9 object-contain"
        />
        <span className="text-lg font-extrabold text-violet-900 tracking-widest">PAWRTAL</span>
      </div>

      {/* Admin badge */}
      <div className="px-4 py-4 mx-3 mt-4 rounded-2xl bg-gradient-to-br from-violet-50 to-purple-50 border border-violet-100 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
          {currentUser?.full_name?.[0] || 'A'}
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-violet-900 text-sm truncate">{currentUser?.full_name || 'Admin'}</p>
          <p className="text-violet-500 text-xs flex items-center gap-1">
            <ShieldCheck className="w-3 h-3" /> Clinic Admin
          </p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 mt-5 space-y-0.5 overflow-y-auto">
        <p className="text-xs font-semibold text-violet-400 uppercase tracking-wider px-3 mb-2">Menu</p>
        {navItems.map(({ label, icon: Icon, page }) => {
          const active = isActive(page);
          return (
            <Link key={label} to={createPageUrl(page)} onClick={() => setOpen(false)}>
              <div className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group cursor-pointer
                ${active
                  ? 'bg-gradient-to-r from-violet-500 to-purple-500 text-white shadow-md shadow-violet-200'
                  : 'text-violet-800 hover:bg-violet-50 hover:text-violet-900'
                }`}>
                <Icon className={`flex-shrink-0 ${active ? 'text-white' : 'text-violet-400 group-hover:text-violet-600'}`} style={{ width: '18px', height: '18px' }} />
                <span className="text-sm font-medium flex-1">{label}</span>
                {active && <ChevronRight className="w-3.5 h-3.5 text-white/70" />}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="px-3 pb-5 space-y-0.5 border-t border-violet-100 pt-4">
        {bottomItems.map(({ label, icon: Icon, page }) => (
          <Link key={label} to={createPageUrl(page)} onClick={() => setOpen(false)}>
            <div className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group cursor-pointer
              ${isActive(page) ? 'bg-violet-100 text-violet-800' : 'text-violet-700 hover:bg-violet-50'}`}>
              <Icon className="text-violet-400 group-hover:text-violet-600" style={{ width: '18px', height: '18px' }} />
              <span className="text-sm font-medium">{label}</span>
            </div>
          </Link>
        ))}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-500 hover:bg-red-50 transition-all group cursor-pointer">
              <LogOut style={{ width: '18px', height: '18px' }} />
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
              <AlertDialogAction onClick={handleLogout} className="bg-red-600 hover:bg-red-700">Sign Out</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-violet-50/20">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-violet-100 fixed inset-y-0 left-0 z-30 shadow-sm">
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
        <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-violet-100 sticky top-0 z-20">
          <button onClick={() => setOpen(true)} className="p-2 rounded-lg text-violet-700 hover:bg-violet-50">
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6978dd3b25d4410887cb4e17/be8bb8d23_pawrtal-logopng.png"
              alt="PAWRTAL" className="w-7 h-7 object-contain" />
            <span className="font-bold text-violet-900 tracking-wider text-sm">PAWRTAL</span>
          </div>
          <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center text-violet-700 font-bold text-sm">
            {currentUser?.full_name?.[0] || 'A'}
          </div>
        </header>

        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}