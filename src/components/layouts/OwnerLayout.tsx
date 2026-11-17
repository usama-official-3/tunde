import React, { useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  BarChart3,
  Bell,
  BookOpen,
  Bot,
  Calendar,
  CalendarSync,
  Car,
  CreditCard,
  FileSpreadsheet,
  HelpCircle,
  LayoutDashboard,
  Lock,
  LogOut,
  MapPin,
  Menu,
  Moon,
  PhoneCall,
  PhoneIncoming,
  PhoneOutgoing,
  Settings,
  ShieldCheck,
  Sun,
  Users,
  X,
} from 'lucide-react';
import { ASSETS } from '../../data/mockData';
import { useApp } from '../../context/AppContext';
import { Breadcrumb } from '../ui/Navigation';
import { Button } from '../ui/Button';

const OWNER_NAV = [
  { label: 'Overview', to: '/app/overview', icon: LayoutDashboard },
  { label: 'Calls', to: '/app/calls', icon: PhoneIncoming },
  { label: 'Appointments', to: '/app/appointments', icon: Calendar },
  { label: 'Customers', to: '/app/customers', icon: Users },
  { label: 'Vehicles', to: '/app/vehicles', icon: Car },
  { label: 'Callbacks', to: '/app/callbacks', icon: PhoneOutgoing },
  { label: 'AI Receptionist', to: '/app/ai-receptionist', icon: Bot },
  { label: 'Knowledge Base', to: '/app/knowledge-base', icon: BookOpen },
  { label: 'Analytics', to: '/app/analytics', icon: BarChart3 },
  { label: 'Reports', to: '/app/reports', icon: FileSpreadsheet },
  { label: 'Phone Configuration', to: '/app/phone-config', icon: PhoneCall },
  { label: 'Calendar Integration', to: '/app/calendar-integration', icon: CalendarSync },
  { label: 'Team Members', to: '/app/team', icon: Users },
  { label: 'Notifications', to: '/app/notifications', icon: Bell },
  { label: 'Billing & Subscription', to: '/app/billing', icon: CreditCard },
  { label: 'Business Settings', to: '/app/settings', icon: Settings },
  { label: 'Help & Support', to: '/app/help', icon: HelpCircle },
];

export function OwnerLayout() {
  const {
    authUser,
    authLoading,
    firestoreError,
    businessProfile,
    isAdmin,
    signIn,
    signOut,
    theme,
    toggleTheme,
    locations,
    selectedLocationId,
    setSelectedLocationId,
    onboarding,
    callbacks,
  } = useApp();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [signingIn, setSigningIn] = useState(false);
  const location = useLocation();

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F7FB] dark:bg-[#0B111D]">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-2 border-[#3978F6] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-500">Connecting to Firebase Authentication & Cloud Firestore...</p>
        </div>
      </div>
    );
  }

  if (!authUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F7FB] dark:bg-[#0B111D] p-6">
        <div className="max-w-md w-full p-8 rounded-xl bg-white dark:bg-[#172337] border border-slate-200 dark:border-slate-800 space-y-5 text-center">
          <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-[#3978F6] flex items-center justify-center mx-auto">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-display text-xl font-bold text-[#101827] dark:text-white">Sign in to Your Shop Portal</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
              Sign in with Google to access your private automotive service workspace stored in Cloud Firestore. Zero demo records — all calls, recordings, and appointments are real and saved to your account.
            </p>
          </div>
          {firestoreError && (
            <p className="text-xs text-[#DC4C4C] bg-rose-50 dark:bg-rose-950/30 p-2.5 rounded-lg">{firestoreError}</p>
          )}
          <Button
            size="lg"
            className="w-full"
            loading={signingIn}
            iconLeft={<ShieldCheck className="w-4 h-4" />}
            onClick={async () => {
              setSigningIn(true);
              try {
                await signIn();
              } finally {
                setSigningIn(false);
              }
            }}
          >
            Sign In with Google
          </Button>
          <div className="flex items-center justify-center gap-4 text-xs text-slate-500 pt-2">
            <Link to="/" className="hover:text-[#3978F6]">← Marketing Home</Link>
            <Link to="/demo" className="hover:text-[#3978F6]">Public AI Demo</Link>
          </div>
        </div>
      </div>
    );
  }

  const currentNav = OWNER_NAV.find((n) => location.pathname.startsWith(n.to)) || OWNER_NAV[0];
  const urgentCount = callbacks.filter((c) => c.urgency === 'Urgent' && c.status !== 'Completed').length;

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#101827] text-slate-200">
      <div className="px-4 h-16 flex items-center justify-between border-b border-slate-800 shrink-0">
        <Link to="/app/overview" className="font-display text-base font-bold text-white whitespace-nowrap">
          Tunde AI <span className="text-xs font-normal text-slate-400 ml-1">Shop Portal</span>
        </Link>
        <button
          type="button"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close sidebar"
          className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Location Switcher */}
      <div className="p-3 border-b border-slate-800">
        <label htmlFor="location-switcher" className="block text-[11px] font-medium text-slate-400 mb-1.5">
          Active Shop Location
        </label>
        <div className="relative">
          <MapPin className="w-3.5 h-3.5 text-[#36C5E8] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <select
            id="location-switcher"
            value={selectedLocationId}
            onChange={(e) => setSelectedLocationId(e.target.value)}
            className="w-full pl-8 pr-3 py-2 text-xs font-medium rounded-lg bg-[#172337] text-white border border-slate-700 focus:border-[#3978F6]"
          >
            <option value="all">All Locations ({locations.length})</option>
            {locations.map((loc) => (
              <option key={loc.id} value={loc.id}>
                {loc.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Navigation */}
      <nav aria-label="Shop owner navigation" className="flex-1 overflow-y-auto px-2.5 py-3 space-y-0.5">
        {OWNER_NAV.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center justify-between gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-[#3978F6] text-white'
                    : 'text-slate-300 hover:bg-[#172337] hover:text-white'
                }`
              }
            >
              <span className="flex items-center gap-2.5 truncate">
                <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span className="truncate">{item.label}</span>
              </span>
              {item.to === '/app/callbacks' && urgentCount > 0 && (
                <span className="font-mono tabular-nums text-[11px] px-1.5 py-0.5 rounded bg-[#DC4C4C] text-white shrink-0">
                  {urgentCount}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer shortcuts */}
      <div className="p-3 border-t border-slate-800 space-y-2 text-xs">
        <Link
          to="/onboarding"
          className="block w-full px-3 py-2 rounded-lg bg-[#172337] hover:bg-slate-800 text-slate-200 border border-slate-700/80 transition-colors"
        >
          <span className="font-medium block">Setup Wizard</span>
          <span className="text-[11px] text-slate-400">
            {businessProfile?.onboardingCompleted || onboarding.isOperational ? 'Shop setup active' : `Step ${onboarding.currentStep} of 17`}
          </span>
        </Link>
        <div className="flex items-center justify-between px-1 text-[11px] text-slate-400">
          <Link to="/" className="hover:text-white">Marketing Site</Link>
          {isAdmin && <Link to="/admin/overview" className="hover:text-[#36C5E8]">Super Admin</Link>}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-[#F5F7FB] dark:bg-[#0B111D] text-[#101827] dark:text-slate-100">
      <aside className="hidden lg:block w-[260px] shrink-0 border-r border-slate-200 dark:border-slate-800">
        <div className="sticky top-0 h-screen">{sidebarContent}</div>
      </aside>

      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div className="fixed inset-0 bg-[#101827]/60" onClick={() => setSidebarOpen(false)} aria-hidden="true" />
          <aside className="relative z-10 w-[270px] h-full">{sidebarContent}</aside>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 h-16 bg-white dark:bg-[#101827] border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open navigation menu"
              className="lg:hidden p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <Menu className="w-5 h-5" />
            </button>
            <Breadcrumb items={[{ label: businessProfile?.name || 'Shop Portal', to: '/app/overview' }, { label: currentNav.label }]} />
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <Link
              to="/app/settings"
              className="flex items-center gap-2.5 pl-2 pr-2 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <img
                src={authUser.photoURL || ASSETS.ownerAvatar}
                alt={authUser.displayName || 'Shop Owner'}
                referrerPolicy="no-referrer"
                className="w-8 h-8 rounded-full object-cover border border-slate-300 dark:border-slate-700"
              />
              <div className="hidden sm:block text-left">
                <p className="text-xs font-semibold text-[#101827] dark:text-white leading-none">
                  {authUser.displayName || authUser.email}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  {businessProfile?.name || 'Automotive Shop'}
                </p>
              </div>
            </Link>
            <button
              type="button"
              onClick={() => void signOut()}
              title="Sign out"
              aria-label="Sign out"
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-[#DC4C4C] hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1440px] w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
