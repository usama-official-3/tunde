import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Bell,
  Building2,
  Calendar,
  Check,
  PhoneCall,
  Shield,
  Sliders,
  Users,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/StatusBadge';

export function FeaturesPage() {
  const groups = [
    {
      title: '01. Automotive Call Intake & Voice AI',
      icon: <PhoneCall className="w-5 h-5 text-[#3978F6]" />,
      items: [
        'Answers overflow, busy, after-hours, or 24/7 calls in natural conversational voice',
        'Collects customer name, callback phone, vehicle Year / Make / Model / Trim, and symptom',
        'Supports live conditional call transfers to Service Managers or advisors',
        'Plays configurable one-party or two-party state recording consent notices',
      ],
    },
    {
      title: '02. Conflict-Free Bay Scheduling',
      icon: <Calendar className="w-5 h-5 text-[#3978F6]" />,
      items: [
        'Respects shop hours, holiday closures, bay capacity, and buffer rules',
        'Books, reschedules, and cancels across Oil, Brakes, CEL, Tires, Collision, and A/C',
        'Syncs with Internal Tunde Calendar, Google Calendar, and Microsoft Outlook',
        'Prevents duplicate customer appointments in overlapping slots',
      ],
    },
    {
      title: '03. Shop Knowledge Base & Policies',
      icon: <Sliders className="w-5 h-5 text-[#3978F6]" />,
      items: [
        'Answers warranty, diagnostic fee, shuttle/towing, and financing questions accurately',
        'Explicitly knows which services or vehicle classes your shop does not accept',
        'Custom business instructions without overriding platform safety rules',
      ],
    },
    {
      title: '04. Callbacks, Notifications & Multi-Location',
      icon: <Building2 className="w-5 h-5 text-[#3978F6]" />,
      items: [
        'Flags urgent stranded/tow-in requests for immediate front-desk callback',
        'Branded SMS and email confirmations plus 24-hour and same-day reminders',
        'Independent phone numbers, agents, hours, and consolidated analytics per shop location',
      ],
    },
  ];

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-14 space-y-12">
      <div className="max-w-2xl">
        <p className="text-xs font-semibold text-[#3978F6]">Platform Capabilities</p>
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-[#101827] dark:text-white mt-2">
          Purpose-built for automotive service operations
        </h1>
        <p className="mt-3 text-base text-slate-600 dark:text-slate-300">
          Every workflow—from check-engine triage to bay capacity verification—is designed around how independent repair shops, tire stores, and collision centers operate.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {groups.map((g) => (
          <div key={g.title} className="p-6 rounded-xl bg-white dark:bg-[#172337] border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3 mb-4">
              {g.icon}
              <h2 className="font-display text-lg font-bold text-[#101827] dark:text-white">{g.title}</h2>
            </div>
            <ul className="space-y-2.5 text-sm text-slate-600 dark:text-slate-300">
              {g.items.map((item) => (
                <li key={item} className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-[#16A36A] shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="p-6 rounded-xl bg-[#101827] text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-display text-lg font-bold">See these controls inside the Shop Owner Dashboard</h3>
          <p className="text-xs text-slate-300 mt-1">Explore calls, calendar, AI agent configuration, and multi-location switching.</p>
        </div>
        <div className="flex gap-3">
          <Link to="/demo"><Button variant="outline" className="bg-transparent border-slate-600 text-white hover:bg-slate-800">Interactive Demo</Button></Link>
          <Link to="/app/overview"><Button>Open Dashboard Prototype</Button></Link>
        </div>
      </div>
    </div>
  );
}

export function HowItWorksPage() {
  const steps = [
    {
      num: '01',
      title: 'Connect your shop phone number',
      desc: 'Keep your existing business landline, mobile, or VoIP line and set conditional call forwarding (when busy, unanswered after 3–4 rings, or after hours), or activate a dedicated Tunde AI number.',
      icon: <PhoneCall className="w-5 h-5 text-[#3978F6]" />,
    },
    {
      num: '02',
      title: 'Load your services, bay capacity & policies',
      desc: 'Enter your shop hours, holiday closures, supported vehicle makes, diagnostic fee policy, and service categories during the guided 17-step setup.',
      icon: <Sliders className="w-5 h-5 text-[#3978F6]" />,
    },
    {
      num: '03',
      title: 'Configure voice, greeting & transfer destinations',
      desc: 'Choose your AI receptionist identity, speaking style, and which advisor extensions receive warm call transfers or urgent callback alerts.',
      icon: <Users className="w-5 h-5 text-[#3978F6]" />,
    },
    {
      num: '04',
      title: 'Verify with a test call & go live',
      desc: 'Run a test call inside the dashboard, review the transcript and booked bay slot, then activate customer SMS/email notifications.',
      icon: <Bell className="w-5 h-5 text-[#3978F6]" />,
    },
  ];

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-14 space-y-10">
      <div className="max-w-2xl">
        <p className="text-xs font-semibold text-[#3978F6]">Implementation Workflow</p>
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-[#101827] dark:text-white mt-2">
          From existing shop line to live AI receptionist in four structured steps
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {steps.map((s) => (
          <div key={s.num} className="p-6 rounded-xl bg-white dark:bg-[#172337] border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <span className="font-mono text-xs font-semibold text-[#3978F6]">Step {s.num}</span>
              {s.icon}
            </div>
            <h2 className="font-display text-lg font-bold text-[#101827] dark:text-white">{s.title}</h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{s.desc}</p>
          </div>
        ))}
      </div>

      <div className="p-6 rounded-xl bg-white dark:bg-[#172337] border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-[#16A36A] mt-0.5 shrink-0" />
          <div>
            <h3 className="text-sm font-semibold text-[#101827] dark:text-white">Gated Operational Readiness</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
              Shops are never marked live until phone verification, hours, and test call verification are completed.
            </p>
          </div>
        </div>
        <Link to="/onboarding"><Button>Try 17-Step Onboarding Wizard</Button></Link>
      </div>
    </div>
  );
}

export function PricingPage() {
  const [annual, setAnnual] = useState(false);

  const plans = [
    {
      name: 'Starter Shop',
      audience: 'For single-bay or 1-location independent shops',
      monthly: 199,
      minutes: '500 AI call minutes / mo',
      locations: '1 shop location',
      features: [
        'Conditional forwarding or 1 dedicated AI number',
        'Internal Tunde Calendar + Google Calendar sync',
        'Call transcripts, AI summaries & recordings',
        'Email appointment confirmations',
      ],
    },
    {
      name: 'Growth Shop',
      audience: 'For busy multi-advisor repair & tire shops',
      monthly: 349,
      minutes: '1,500 AI call minutes / mo',
      locations: 'Up to 3 shop locations',
      recommended: true,
      features: [
        'Everything in Starter plus SMS confirmations & 24h reminders',
        'Live warm call transfers to multiple advisor extensions',
        'Urgent callback workflow & team role permissions',
        'Google + Outlook calendar synchronization',
      ],
    },
    {
      name: 'Multi-Shop Group',
      audience: 'For regional automotive service groups & franchises',
      monthly: 699,
      minutes: '4,000 AI call minutes / mo',
      locations: 'Up to 10 locations (customizable)',
      features: [
        'Consolidated cross-location analytics & CSV/PDF exports',
        'Independent AI agents, voices & knowledge bases per store',
        'Priority prompt tuning & onboarding support',
        'Extended audit logs for recording & transcript access',
      ],
    },
  ];

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-14 space-y-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold text-[#3978F6]">Prototype Pricing Schedule</p>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-[#101827] dark:text-white mt-2">
            Predictable pricing based on call minutes and locations
          </h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            Placeholder billing tiers shown for product evaluation. Payment processing is not active in prototype mode.
          </p>
        </div>

        <div className="inline-flex items-center gap-1 p-1 rounded-lg bg-slate-200/80 dark:bg-[#172337] border border-slate-300 dark:border-slate-700 self-start">
          <button
            type="button"
            onClick={() => setAnnual(false)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md cursor-pointer ${
              !annual ? 'bg-white dark:bg-[#101827] text-[#101827] dark:text-white shadow-xs' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Monthly
          </button>
          <button
            type="button"
            onClick={() => setAnnual(true)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md cursor-pointer ${
              annual ? 'bg-white dark:bg-[#101827] text-[#101827] dark:text-white shadow-xs' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Annual (Save 15%)
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {plans.map((p) => {
          const price = annual ? Math.round(p.monthly * 0.85) : p.monthly;
          return (
            <div
              key={p.name}
              className={`p-6 rounded-xl bg-white dark:bg-[#172337] border flex flex-col justify-between ${
                p.recommended ? 'border-[#3978F6]' : 'border-slate-200 dark:border-slate-800'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <h2 className="font-display text-lg font-bold text-[#101827] dark:text-white">{p.name}</h2>
                  {p.recommended && <StatusBadge label="Most Popular" tone="info" showIcon={false} />}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{p.audience}</p>
                <div className="mt-5 flex items-baseline gap-1">
                  <span className="font-display text-3xl font-bold font-mono tabular-nums text-[#101827] dark:text-white">
                    ${price}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">/ month{annual ? ' (billed annually)' : ''}</span>
                </div>
                <div className="mt-3 py-2.5 border-y border-slate-100 dark:border-slate-800 text-xs font-medium text-slate-700 dark:text-slate-200 space-y-1">
                  <p className="font-mono tabular-nums">{p.minutes}</p>
                  <p>{p.locations}</p>
                </div>
                <ul className="mt-4 space-y-2.5 text-sm text-slate-600 dark:text-slate-300">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-[#16A36A] shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-6 pt-4">
                <Link to="/signup">
                  <Button variant={p.recommended ? 'primary' : 'outline'} className="w-full">
                    Start Setup with {p.name}
                  </Button>
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
