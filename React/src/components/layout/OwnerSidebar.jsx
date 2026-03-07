import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { api } from '@/api/apiClient';
import {
  LayoutDashboard,
  PawPrint,
  Calendar,
  Syringe,
  Pill,
  BookOpen,
  Settings,
  LogOut,
  Menu,
  Bell,
  Heart,
  Plus,
  ChevronRight,
} from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, page: 'Dashboard' },
  { label: 'My Pets', icon: PawPrint, page: 'MyPets' },
  { label: 'Appointments', icon: Calendar, page: 'Appointments' },
  { label: 'Health Records', icon: Syringe, page: 'HealthRecords' },
  { label: 'Pet Journal', icon: BookOpen, page: 'Journal' },
];

const bottomItems = [
  { label: 'Settings', icon: Settings, page: 'Settings' },
];

export default function OwnerSidebar({ user, children }) {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  const path = location.pathname.split('?')[0];
  const isActive = (page) => {
    const pagePath = createPageUrl(page).split('?')[0];
    return path === pagePath || (pagePath !== '/' && path.startsWith(pagePath + '?'));
  };

  async function handleLogout() {
    await api.auth.logout(createPageUrl('Welcome'));
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-amber-100/60">
        <img
          src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6978dd3b25d4410887cb4e17/be8bb8d23_pawrtal-logopng.png"
          alt="PAWRTAL"
          className="w-9 h-9 object-contain"
        />
        <span className="text-lg font-extrabold text-amber-900 tracking-widest">PAWRTAL</span>
      </div>

      {/* User info */}
      <div className="px-4 py-4 mx-3 mt-4 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-400 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
          {user?.full_name?.[0] || '?'}
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-amber-900 text-sm truncate">{user?.full_name || 'Pet Parent'}</p>
          <p className="text-amber-600 text-xs truncate">Pet Owner</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 mt-5 space-y-0.5 overflow-y-auto">
        <p className="text-xs font-semibold text-amber-400 uppercase tracking-wider px-3 mb-2">Menu</p>
        {navItems.map(({ label, icon: Icon, page }) => {
          const active = isActive(page);
          return (
            <Link key={label} to={createPageUrl(page)} onClick={() => setOpen(false)}>
              <div
                className={`relative ml-2 flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group cursor-pointer
                  before:absolute before:-left-2 before:top-1/2 before:-translate-y-1/2 before:h-8 before:rounded-r-full before:transition-all before:duration-300
                  ${active
                    ? 'bg-gradient-to-r from-amber-500 to-orange-400 text-white shadow-md shadow-amber-200 before:w-1 before:bg-amber-500'
                    : 'text-amber-800 hover:bg-amber-50 hover:text-amber-900 before:w-0 before:bg-transparent'
                  }`}
              >
                <Icon
                  className={`w-4.5 h-4.5 flex-shrink-0 ${active ? 'text-white' : 'text-amber-500 group-hover:text-amber-700'}`}
                  style={{ width: '18px', height: '18px' }}
                />
                <span className="text-sm font-medium flex-1">{label}</span>
                {active && <ChevronRight className="w-3.5 h-3.5 text-white/70" />}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="px-3 pb-5 space-y-0.5 border-t border-amber-100 pt-4">
        {bottomItems.map(({ label, icon: Icon, page }) => (
          <Link key={label} to={createPageUrl(page)} onClick={() => setOpen(false)}>
            <div className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group cursor-pointer
              ${isActive(page) ? 'bg-amber-100 text-amber-800' : 'text-amber-700 hover:bg-amber-50'}`}>
              <Icon className="w-4.5 h-4.5 text-amber-500 group-hover:text-amber-700" style={{width:'18px',height:'18px'}} />
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
    <div className="flex min-h-screen bg-amber-50/30">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-amber-100 fixed inset-y-0 left-0 z-30 shadow-sm">
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
        <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-amber-100 sticky top-0 z-20">
          <button onClick={() => setOpen(true)} className="p-2 rounded-lg text-amber-700 hover:bg-amber-50">
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6978dd3b25d4410887cb4e17/be8bb8d23_pawrtal-logopng.png"
              alt="PAWRTAL" className="w-7 h-7 object-contain" />
            <span className="font-bold text-amber-900 tracking-wider text-sm">PAWRTAL</span>
          </div>
          <Link to={createPageUrl('Settings')}>
            <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-bold text-sm">
              {user?.full_name?.[0] || '?'}
            </div>
          </Link>
        </header>

        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}