import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
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
  ChevronRight,
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

// Navigation items (update paths as needed)
const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
  { label: 'My Pets', icon: PawPrint, path: '/my-pets' },
  { label: 'Appointments', icon: Calendar, path: '/appointments' },
  { label: 'Health Records', icon: Syringe, path: '/health-records' },
  { label: 'Medications', icon: Pill, path: '/medications' },
  { label: 'Pet Journal', icon: BookOpen, path: '/journal' },
];

const bottomItems = [
  { label: 'Settings', icon: Settings, path: '/settings' },
];

export default function PetOwnerSidebar({ user, children }) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path);

  // Simple logout – redirect to sign-in (add real auth logout later if needed)
  const handleLogout = () => {
    // Optional: clear localStorage/session if you store tokens
    // localStorage.removeItem('token');
    navigate('/sign-in');
    setIsMobileOpen(false);
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-white">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-amber-100/60">
        <img
          src="/path/to/your/local/pawrtal-logo.png" // ← replace with local asset or public URL
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
          <p className="font-semibold text-amber-900 text-sm truncate">
            {user?.full_name || 'Pet Parent'}
          </p>
          <p className="text-amber-600 text-xs truncate">Pet Owner</p>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-3 mt-5 space-y-0.5 overflow-y-auto">
        <p className="text-xs font-semibold text-amber-400 uppercase tracking-wider px-3 mb-2">Menu</p>
        {navItems.map(({ label, icon: Icon, path }) => {
          const active = isActive(path);
          return (
            <Link key={label} to={path} onClick={() => setIsMobileOpen(false)}>
              <div
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group cursor-pointer
                  ${active
                    ? 'bg-gradient-to-r from-amber-500 to-orange-400 text-white shadow-md shadow-amber-200'
                    : 'text-amber-800 hover:bg-amber-50 hover:text-amber-900'
                  }`}
              >
                <Icon
                  className={`w-5 h-5 flex-shrink-0 ${active ? 'text-white' : 'text-amber-500 group-hover:text-amber-700'}`}
                />
                <span className="text-sm font-medium flex-1">{label}</span>
                {active && <ChevronRight className="w-4 h-4 text-white/70" />}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Bottom Section */}
      <div className="px-3 pb-5 space-y-0.5 border-t border-amber-100 pt-4">
        {bottomItems.map(({ label, icon: Icon, path }) => (
          <Link key={label} to={path} onClick={() => setIsMobileOpen(false)}>
            <div
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group cursor-pointer
                ${isActive(path) ? 'bg-amber-100 text-amber-800' : 'text-amber-700 hover:bg-amber-50'}`}
            >
              <Icon className="w-5 h-5 text-amber-500 group-hover:text-amber-700" />
              <span className="text-sm font-medium">{label}</span>
            </div>
          </Link>
        ))}

        {/* Logout Dialog */}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-500 hover:bg-red-50 transition-all group cursor-pointer">
              <LogOut className="w-5 h-5" />
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
              <AlertDialogAction
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
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

      {/* Mobile Sidebar Overlay */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setIsMobileOpen(false)}
          />
          <aside className="absolute left-0 top-0 bottom-0 w-72 bg-white shadow-2xl z-50">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        {/* Mobile Top Bar */}
        <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-amber-100 sticky top-0 z-20">
          <button
            onClick={() => setIsMobileOpen(true)}
            className="p-2 rounded-lg text-amber-700 hover:bg-amber-50"
          >
            <Menu className="w-6 h-6" />
          </button>

          <div className="flex items-center gap-2">
            <img
              src="/path/to/your/local/pawrtal-logo.png" // ← replace with your asset
              alt="PAWRTAL"
              className="w-7 h-7 object-contain"
            />
            <span className="font-bold text-amber-900 tracking-wider text-sm">PAWRTAL</span>
          </div>

          <Link to="/settings">
            <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-bold text-sm">
              {user?.full_name?.[0] || '?'}
            </div>
          </Link>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}