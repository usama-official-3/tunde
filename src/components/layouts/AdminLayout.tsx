import React, { useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  Activity,
  AlertOctagon,
  BarChart2,
  Bot,
  Building2,
  Calendar,
  ClipboardCheck,
  CreditCard,
  FileCode2,
  Headphones,
  LayoutGrid,
  Lock,
  LogOut,
  MapPin,
  Menu,
  Moon,
  Phone,
  PhoneForwarded,
  PhoneOutgoing,
  Plug,
  Receipt,
  Settings,
  ShieldAlert,
  ShieldCheck,
  Sliders,
  Sun,
  Users,
  Volume2,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Breadcrumb } from '../ui/Navigation';
import { StatusBadge } from '../ui/StatusBadge';
import { Button } from '../ui/Button';

export const ADMIN_NAV = [
  { label: 'Platform Overview', to: '/admin/overview', icon: LayoutGrid },
  { label: 'Businesses', to: '/admin/businesses', icon: Building2 },
  { label: 'Users', to: '/admin/users', icon: Users },
  { label: 'Locations', to: '/admin/locations', icon: MapPin },
  { label: 'AI Agents', to: '/admin/ai-agents', icon: Bot },
  { label: 'Prompt Management', to: '/admin/prompts', icon: FileCode2 },
  { label: 'Voice Configuration', to: '/admin/voices', icon: Volume2 },
  { label: 'Phone Numbers', to: '/admin/phone-numbers', icon: Phone },
  { label: 'Call Monitoring', to: '/admin/call-monitoring', icon: PhoneForwarded },
  { label: 'Appointments', to: '/admin/appointments', icon: Calendar },
  { label: 'Callbacks', to: '/admin/callbacks', icon: PhoneOutgoing },
  { label: 'Subscriptions', to: '/admin/subscriptions', icon: CreditCard },
  { label: 'Plans & Pricing', to: '/admin/plans', icon: Sliders },
  { label: 'Usage & Billing', to: '/admin/usage-billing', icon: Receipt },
  { label: 'Integrations', to: '/admin/integrations', icon: Plug },
  { label: 'Platform Analytics', to: '/admin/analytics', icon: BarChart2 },
  { label: 'System Health', to: '/admin/system-health', icon: Activity },
  { label: 'Error Monitoring', to: '/admin/errors', icon: AlertOctagon },
  { label: 'Support', to: '/admin/support', icon: Headphones },
  { label: 'Audit Logs', to: '/admin/audit-logs', icon: ShieldCheck },
  { label: 'PRD Audit & Proposal', to: '/admin/requirements-audit', icon: ClipboardCheck },
  { label: 'Admin Settings', to: '/admin/settings', icon: Settings },
];

export function AdminLayout() {
  const { authUser, authLoading, isAdmin, signIn, signOut, theme, toggleTheme } = useApp();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [signingIn, setSigningIn] = useState(false);
  const location = useLocation();
  const current = ADMIN_NAV.find((n) => location.pathname.startsWith(n.to)) || ADMIN_NAV[0];

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0B111D] text-slate-300 text-xs">
        Verifying Super Admin credentials...
      </div>
    );
  }

  if (!authUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F7FB] dark:bg-[#0B111D] p-6">
        <div className="max-w-md w-full p-8 rounded-xl bg-white dark:bg-[#172337] border border-slate-200 dark:border-slate-800 space-y-5 text-center">
          <Lock className="w-8 h-8 text-[#3978F6] mx-auto" />
          <div>
            <h1 className="font-display text-xl font-bold">Internal Super Admin Sign-In</h1>
            <p className="text-xs text-slate-500 mt-1">Sign in with your authorized Super Admin Google account.</p>
          </div>
          <Button
            size="lg"
            className="w-full"
            loading={signingIn}
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
          <Link to="/" className="block text-xs text-slate-500 hover:text-[#3978F6]">← Return to Marketing Home</Link>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F7FB] dark:bg-[#0B111D] p-6">
        <div className="max-w-md w-full p-8 rounded-xl bg-white dark:bg-[#172337] border border-rose-200 dark:border-rose-800 space-y-4 text-center">
          <ShieldAlert className="w-8 h-8 text-[#DC4C4C] mx-auto" />
          <h1 className="font-display text-xl font-bold text-[#101827] dark:text-white">Super Admin Access Required</h1>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            You are signed in as <span className="font-mono font-semibold">{authUser.email}</span>, which has Shop Owner permissions. Cross-tenant admin controls are restricted by Firestore Security Rules.
          </p>
          <div className="flex flex-col gap-2 pt-2">
            <Link to="/app/overview">
              <Button className="w-full">Open Your Shop Owner Dashboard</Button>
            </Link>
            <Button variant="outline" onClick={() => void signOut()}>Sign Out & Switch Account</Button>
          </div>
        </div>
      </div>
    );
  }

  const sidebar = (
    <div className="flex flex-col h-full bg-[#0A0F1A] text-slate-300 border-r border-slate-800">
      <div className="px-4 h-16 flex items-center justify-between border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-2">
          <Lock className="w-4 h-4 text-[#36C5E8]" aria-hidden="true" />
          <span className="font-display text-sm font-bold text-white whitespace-nowrap">Tunde AI Admin</span>
        </div>
        <button
          type="button"
          onClick={() => setDrawerOpen(false)}
          aria-label="Close admin menu"
          className="lg:hidden p-1.5 rounded text-slate-400 hover:text-white"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <nav aria-label="Super admin navigation" className="flex-1 overflow-y-auto px-2.5 py-3 space-y-0.5">
        {ADMIN_NAV.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setDrawerOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-[#3978F6] text-white'
                    : 'text-slate-300 hover:bg-[#172337] hover:text-white'
                }`
              }
            >
              <Icon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span className="truncate">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="p-3 border-t border-slate-800 text-[11px] flex items-center justify-between text-slate-400">
        <Link to="/app/overview" className="hover:text-white">Shop Owner View</Link>
        <Link to="/" className="hover:text-[#36C5E8]">Marketing</Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-[#F5F7FB] dark:bg-[#0B111D] text-[#101827] dark:text-slate-100">
      <aside className="hidden lg:block w-[250px] shrink-0">
        <div className="sticky top-0 h-screen">{sidebar}</div>
      </aside>

      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div className="fixed inset-0 bg-black/60" onClick={() => setDrawerOpen(false)} aria-hidden="true" />
          <aside className="relative z-10 w-[260px] h-full">{sidebar}</aside>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 h-16 bg-[#101827] text-white border-b border-slate-800 px-4 sm:px-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              aria-label="Open admin menu"
              className="lg:hidden p-2 rounded-lg text-slate-300 hover:bg-slate-800"
            >
              <Menu className="w-5 h-5" />
            </button>
            <Breadcrumb items={[{ label: 'Internal Super Admin', to: '/admin/overview' }, { label: current.label }]} />
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <StatusBadge label={`Super Admin · ${authUser.email}`} tone="success" />
            <button
              type="button"
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="p-2 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 cursor-pointer"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={() => void signOut()}
              aria-label="Sign out"
              className="p-2 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 cursor-pointer"
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
