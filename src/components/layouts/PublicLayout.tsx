import React, { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { Button } from '../ui/Button';

export function PublicLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  const navItems = [
    { label: 'Features', to: '/features' },
    { label: 'How It Works', to: '/how-it-works' },
    { label: 'Pricing', to: '/pricing' },
    { label: 'Interactive Demo', to: '/demo' },
    { label: 'FAQ', to: '/faq' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#F5F7FB] dark:bg-[#0B111D] text-[#101827] dark:text-slate-100">
      {/* 3-Zone Top Bar Contract: Brand wordmark — 5 nav links — 1 primary CTA */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-[#101827]/95 backdrop-blur-sm border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
          <Link
            to="/"
            className="font-display text-lg font-bold tracking-tight text-[#101827] dark:text-white whitespace-nowrap shrink-0"
          >
            Tunde AI
          </Link>

          <nav aria-label="Primary navigation" className="hidden md:flex items-center gap-7 text-sm font-medium">
            {navItems.map((item) => {
              const active = location.pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`whitespace-nowrap shrink-0 transition-colors hover:text-[#3978F6] ${
                    active ? 'text-[#3978F6]' : 'text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-3 shrink-0">
            <Link to="/signup" className="hidden sm:inline-flex">
              <Button size="sm" variant="primary">
                Get Started
              </Button>
            </Link>
            <button
              type="button"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={mobileOpen}
              className="md:hidden p-2 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu Drawer */}
        {mobileOpen && (
          <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#101827] px-4 py-4 space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setMobileOpen(false)}
                className="block py-2.5 px-3 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                {item.label}
              </Link>
            ))}
            <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex flex-col gap-2">
              <Link to="/login" onClick={() => setMobileOpen(false)} className="py-2 px-3 text-sm font-medium text-slate-700 dark:text-slate-200">
                Sign In
              </Link>
              <Link to="/signup" onClick={() => setMobileOpen(false)}>
                <Button className="w-full">Get Started</Button>
              </Link>
            </div>
          </div>
        )}
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="bg-[#101827] text-slate-300 border-t border-slate-800">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
            <div className="col-span-2 md:col-span-1">
              <Link to="/" className="font-display text-lg font-bold text-white">
                Tunde AI
              </Link>
              <p className="mt-3 text-xs text-slate-400 leading-relaxed">
                AI service receptionist and bay scheduling platform built exclusively for automotive repair, tire, and collision shops.
              </p>
            </div>

            <div>
              <h3 className="text-xs font-semibold text-white mb-3">Product</h3>
              <ul className="space-y-2 text-xs text-slate-400">
                <li><Link to="/features" className="hover:text-white">Features</Link></li>
                <li><Link to="/how-it-works" className="hover:text-white">How It Works</Link></li>
                <li><Link to="/pricing" className="hover:text-white">Pricing</Link></li>
                <li><Link to="/demo" className="hover:text-white">Interactive AI Demo</Link></li>
                <li><Link to="/book-demo" className="hover:text-white">Book a Demo</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="text-xs font-semibold text-white mb-3">Company</h3>
              <ul className="space-y-2 text-xs text-slate-400">
                <li><Link to="/faq" className="hover:text-white">Frequently Asked Questions</Link></li>
                <li><Link to="/contact" className="hover:text-white">Contact Us</Link></li>
                <li><Link to="/terms" className="hover:text-white">Terms & Conditions</Link></li>
                <li><Link to="/privacy" className="hover:text-white">Privacy Policy</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="text-xs font-semibold text-white mb-3">Account</h3>
              <ul className="space-y-2 text-xs text-slate-400">
                <li><Link to="/login" className="hover:text-white">Login</Link></li>
                <li><Link to="/signup" className="hover:text-white">Sign Up</Link></li>
                <li><Link to="/forgot-password" className="hover:text-white">Forgot Password</Link></li>
                <li><Link to="/reset-password" className="hover:text-white">Password Reset</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="text-xs font-semibold text-white mb-3">Workspaces (Prototype)</h3>
              <ul className="space-y-2 text-xs text-slate-400">
                <li><Link to="/app/overview" className="text-[#36C5E8] hover:underline">Shop Owner Dashboard</Link></li>
                <li><Link to="/onboarding" className="hover:text-white">17-Step Shop Onboarding</Link></li>
                <li><Link to="/admin/overview" className="hover:text-white">Internal Super Admin</Link></li>
              </ul>
            </div>
          </div>

          <div className="mt-10 pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-slate-400">
            <span>© 2026 Tunde AI. Interactive product prototype — simulated telephony and placeholder metrics.</span>
            <span>Columbus, OH · Automotive Service Technology</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
