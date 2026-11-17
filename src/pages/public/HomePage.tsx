import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BarChart3,
  CalendarCheck,
  CheckCircle2,
  ChevronDown,
  PhoneForwarded,
  PhoneIncoming,
  ShieldCheck,
  Wrench,
} from 'lucide-react';
import { ASSETS } from '../../data/mockData';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { InteractiveCallSimulator } from '../../components/shared/InteractiveCallSimulator';

export function HomePage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [bookingSlot, setBookingSlot] = useState('09:00 AM');
  const [bookingConfirmed, setBookingConfirmed] = useState(false);

  const faqs = [
    {
      q: 'Does Tunde AI replace our existing shop phone number?',
      a: 'No. You keep your published shop number and configure conditional forwarding (busy, no-answer, or after-hours), or provision a dedicated Tunde AI line.',
    },
    {
      q: 'How does the AI avoid double-booking service bays?',
      a: 'Tunde AI checks real bay capacity, business hours, holiday closures, and slot buffers before offering any appointment time to the caller.',
    },
    {
      q: 'What happens if a caller has a complex warranty or live repair question?',
      a: 'You configure transfer triggers so Tunde AI transfers directly to your Service Manager or logs an urgent callback task with full vehicle context.',
    },
  ];

  return (
    <div>
      {/* 1. Hero Section */}
      <section className="bg-white dark:bg-[#101827] border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
            <div className="lg:col-span-6 flex flex-col justify-center">
              <p className="text-xs font-semibold tracking-wide text-[#3978F6] mb-3">
                Automotive AI Receptionist & Bay Scheduling
              </p>
              <h1
                className="font-display font-bold text-[#101827] dark:text-white tracking-tight leading-[1.08]"
                style={{ fontSize: 'clamp(2.25rem, 4vw, 3.5rem)', textWrap: 'balance' }}
              >
                Never miss another customer call when your bays are busy.
              </h1>
              <p className="mt-5 text-base text-slate-600 dark:text-slate-300 leading-relaxed max-w-xl">
                Tunde AI answers incoming calls for auto repair shops, tire centers, and collision facilities 24/7—capturing vehicle year, make, model, checking actual bay availability, and booking service appointments automatically.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link to="/signup">
                  <Button size="lg" variant="primary" iconRight={<ArrowRight className="w-4 h-4" />}>
                    Get Started
                  </Button>
                </Link>
                <Link to="/demo">
                  <Button size="lg" variant="outline">
                    Experience AI Demo
                  </Button>
                </Link>
              </div>

              <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-slate-500 dark:text-slate-400">
                <span>Works with existing landline, mobile, or VoIP</span>
                <span aria-hidden="true">·</span>
                <Link to="/app/overview" className="text-[#3978F6] font-medium hover:underline">
                  Explore Shop Owner Dashboard
                </Link>
                <span aria-hidden="true">·</span>
                <Link to="/admin/overview" className="text-slate-600 dark:text-slate-300 font-medium hover:underline">
                  Internal Admin Console
                </Link>
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className="relative h-full min-h-[300px] rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-900">
                <img
                  src={ASSETS.heroShop}
                  alt="Modern automotive repair facility with hydraulic service bays and glass reception office"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#101827]/85 via-[#101827]/20 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 bg-white/95 dark:bg-[#172337]/95 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="font-semibold text-[#101827] dark:text-white">Live Intake Example (Simulated)</span>
                    <StatusBadge label="Bay Available · 08:30 AM" tone="success" />
                  </div>
                  <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-300">
                    Caller: 2019 Honda CR-V · Solid Check Engine Light · Diagnostic fee ($149) disclosed and slot reserved.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 4-Column Product Preview Strip */}
          <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Call Handling Coverage', value: '24/7', note: 'Overflow, busy, or after-hours' },
              { label: 'Vehicle Intake Fields', value: 'Year · Make · Model', note: 'VIN & mileage when needed' },
              { label: 'Scheduling Verification', value: 'Real Bay Capacity', note: 'Conflict & holiday aware' },
              { label: 'Advisor Escalation', value: 'Live Transfer', note: 'Plus urgent callback queue' },
            ].map((item) => (
              <div
                key={item.label}
                className="p-4 rounded-xl bg-[#F5F7FB] dark:bg-[#172337] border border-slate-200 dark:border-slate-800"
              >
                <p className="text-xs text-slate-500 dark:text-slate-400">{item.label}</p>
                <p className="mt-1 text-base font-bold font-display text-[#101827] dark:text-white tabular-nums">{item.value}</p>
                <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-300">{item.note}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 2. Missed-Call Problem Explanation */}
      <section className="py-16 lg:py-20">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-5">
              <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 aspect-[4/3] bg-slate-200">
                <img
                  src={ASSETS.serviceAdvisor}
                  alt="Automotive service advisor working at front desk reception"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            <div className="lg:col-span-7">
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#101827] dark:text-white tracking-tight">
                When your service desk is writing up a repair order, unanswered rings go to the shop down the street.
              </h2>
              <p className="mt-4 text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                Most automotive customers call while stranded, on a lunch break, or after work. For high-volume shops, missed calls can potentially represent tens of thousands of dollars in lost monthly opportunity—up to $50,000/month in potential high-volume scenarios, not a verified industry average. Tunde AI acts as a calm service receptionist who answers immediately and captures the job before the caller dials a competitor.
              </p>
              <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-white dark:bg-[#172337] border border-slate-200 dark:border-slate-800">
                  <p className="text-sm font-semibold text-[#101827] dark:text-white">Peak Morning Rush</p>
                  <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                    Answers overflow calls between 7:30 AM and 10:00 AM while advisors check in drop-offs.
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-white dark:bg-[#172337] border border-slate-200 dark:border-slate-800">
                  <p className="text-sm font-semibold text-[#101827] dark:text-white">After-Hours Breakdowns</p>
                  <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                    Explains towing & night key-drop rules and secures first-thing morning bay slots.
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-white dark:bg-[#172337] border border-slate-200 dark:border-slate-800">
                  <p className="text-sm font-semibold text-[#101827] dark:text-white">Zero Voicemail Tag</p>
                  <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                    Logs structured vehicle specs, symptom summaries, and callback urgency automatically.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. AI Receptionist Workflow (Editorial Numbered Steps) */}
      <section className="py-16 bg-white dark:bg-[#101827] border-y border-slate-200 dark:border-slate-800">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#101827] dark:text-white tracking-tight">
              How Tunde AI handles every inbound service call
            </h2>
            <p className="mt-3 text-sm sm:text-base text-slate-600 dark:text-slate-300">
              Built around real automotive intake discipline—not generic scripted chat.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                step: '01. Answer & Consent',
                icon: <PhoneIncoming className="w-5 h-5 text-[#3978F6]" />,
                desc: 'Picks up on missed, busy, or after-hours rings with your shop greeting and recording disclosure.',
              },
              {
                step: '02. Vehicle & Symptom Intake',
                icon: <Wrench className="w-5 h-5 text-[#3978F6]" />,
                desc: 'Collects customer name, callback phone, vehicle year/make/model, and repair concern.',
              },
              {
                step: '03. Bay Availability & Booking',
                icon: <CalendarCheck className="w-5 h-5 text-[#3978F6]" />,
                desc: 'Checks live bay capacity and shop hours, books or reschedules slots, and prevents conflicts.',
              },
              {
                step: '04. Transfer or Callback Queue',
                icon: <PhoneForwarded className="w-5 h-5 text-[#3978F6]" />,
                desc: 'Transfers urgent warranty or live-vehicle calls to advisors, or logs a prioritized callback task.',
              },
            ].map((item) => (
              <div
                key={item.step}
                className="p-6 rounded-xl bg-[#F5F7FB] dark:bg-[#172337] border border-slate-200 dark:border-slate-800"
              >
                <div className="mb-4">{item.icon}</div>
                <h3 className="font-display text-base font-semibold text-[#101827] dark:text-white">{item.step}</h3>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Asymmetric Feature Highlights + Interactive Booking Demo */}
      <section className="py-16 lg:py-20">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Interactive Booking Demonstration */}
            <div className="lg:col-span-7 bg-white dark:bg-[#172337] rounded-xl border border-slate-200 dark:border-slate-800 p-6">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                <div>
                  <h3 className="font-display text-lg font-bold text-[#101827] dark:text-white">
                    Live Appointment Verification Preview
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Try selecting an open bay slot below to see how Tunde AI prevents double-bookings.
                  </p>
                </div>
                <StatusBadge label="Prototype Bay Rules" tone="info" />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 my-5">
                {[
                  { time: '08:00 AM', bays: 'Full (4/4)', disabled: true },
                  { time: '09:00 AM', bays: '2 bays open', disabled: false },
                  { time: '11:00 AM', bays: '3 bays open', disabled: false },
                  { time: '02:30 PM', bays: '1 bay open', disabled: false },
                ].map((slot) => (
                  <button
                    key={slot.time}
                    type="button"
                    disabled={slot.disabled}
                    onClick={() => {
                      setBookingSlot(slot.time);
                      setBookingConfirmed(false);
                    }}
                    className={`p-3 rounded-lg border text-left transition-colors cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed ${
                      bookingSlot === slot.time
                        ? 'border-[#3978F6] bg-blue-50/70 dark:bg-blue-950/30'
                        : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <p className="text-sm font-semibold font-mono tabular-nums text-[#101827] dark:text-white">{slot.time}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{slot.bays}</p>
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                <div className="text-xs text-slate-600 dark:text-slate-300">
                  Selected: <strong className="text-[#101827] dark:text-white">Brake Inspection · {bookingSlot}</strong> · 60 min bay block
                </div>
                <Button
                  size="sm"
                  onClick={() => setBookingConfirmed(true)}
                  iconLeft={<CheckCircle2 className="w-4 h-4" />}
                >
                  Simulate AI Reservation
                </Button>
              </div>
              {bookingConfirmed && (
                <div className="mt-3 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-900 dark:text-emerald-200">
                  Simulated reservation confirmed for {bookingSlot}. Bay capacity decremented and SMS reminder queued (prototype preview).
                </div>
              )}
            </div>

            {/* Analytics Preview (clearly labeled demo data) */}
            <div className="lg:col-span-5 bg-white dark:bg-[#172337] rounded-xl border border-slate-200 dark:border-slate-800 p-6">
              <div className="flex items-center justify-between gap-2 mb-4">
                <h3 className="font-display text-lg font-bold text-[#101827] dark:text-white">
                  Recovery Analytics Preview
                </h3>
                <BarChart3 className="w-5 h-5 text-[#3978F6]" aria-hidden="true" />
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                Illustrative sample shop dashboard metrics (clearly separated from verified actual repair revenue):
              </p>
              <div className="space-y-3">
                {[
                  { k: 'AI Answered Overflow Calls (Sample)', v: '148 calls' },
                  { k: 'Missed Calls Recovered (Sample)', v: '42 opportunities' },
                  { k: 'AI-Booked Appointments (Sample)', v: '61 bookings' },
                  { k: 'Est. Opportunity @ $420 Avg RO', v: '$25,620 (Estimated)' },
                ].map((row) => (
                  <div
                    key={row.k}
                    className="flex items-center justify-between py-2.5 border-b border-slate-100 dark:border-slate-800 last:border-0 text-sm"
                  >
                    <span className="text-slate-600 dark:text-slate-300">{row.k}</span>
                    <span className="font-mono font-semibold tabular-nums text-[#101827] dark:text-white">{row.v}</span>
                  </div>
                ))}
              </div>
              <div className="mt-5">
                <Link to="/app/overview">
                  <Button variant="outline" size="sm" className="w-full">
                    Open Full Analytics Prototype
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* Interactive Call Simulator Embedded */}
          <div>
            <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
              <div>
                <h2 className="font-display text-2xl font-bold text-[#101827] dark:text-white">
                  Test the Automotive AI Receptionist
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                  Run a simulated customer call right here or open the full interactive demo workspace.
                </p>
              </div>
              <Link to="/demo" className="text-sm font-medium text-[#3978F6] hover:underline">
                Open full-screen simulator
              </Link>
            </div>
            <InteractiveCallSimulator compact />
          </div>
        </div>
      </section>

      {/* 5. Placeholder Testimonials (Explicitly labeled as illustrative) */}
      <section className="py-16 bg-white dark:bg-[#101827] border-y border-slate-200 dark:border-slate-800">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
            <div>
              <h2 className="font-display text-2xl font-bold text-[#101827] dark:text-white">
                Built for independent shops and multi-bay groups
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Note: The scenarios below are clearly labeled illustrative placeholder examples for product design review, not live customer endorsements.
              </p>
            </div>
            <StatusBadge label="Illustrative Placeholder Examples" tone="neutral" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                quote:
                  'Before using an automated overflow receptionist, morning drop-offs kept our front desk tied up while phones rang out. Now callers book oil and brake slots without waiting on hold.',
                author: 'Placeholder Shop Profile — 6-Bay Euro & Domestic Garage',
                meta: 'Illustrative Scenario · General Mechanical',
              },
              {
                quote:
                  'After-hours callers with warning lights get immediate instructions on our diagnostic fee and secure key drop-off, instead of calling three competitors.',
                author: 'Placeholder Shop Profile — 2-Location Tire & Alignment Group',
                meta: 'Illustrative Scenario · Multi-Location',
              },
              {
                quote:
                  'Having separate advisor transfer rules for warranty claims means Tunde AI handles routine scheduling while our Service Manager gets warm context on complex calls.',
                author: 'Placeholder Shop Profile — Collision & Frame Center',
                meta: 'Illustrative Scenario · Collision Estimates',
              },
            ].map((item, i) => (
              <div
                key={i}
                className="p-6 rounded-xl bg-[#F5F7FB] dark:bg-[#172337] border border-slate-200 dark:border-slate-800 flex flex-col justify-between"
              >
                <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed">“{item.quote}”</p>
                <div className="mt-5 pt-4 border-t border-slate-200 dark:border-slate-700">
                  <p className="text-xs font-semibold text-[#101827] dark:text-white">{item.author}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{item.meta}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. Pricing Preview & FAQ */}
      <section className="py-16 lg:py-20">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-6">
            <h2 className="font-display text-2xl font-bold text-[#101827] dark:text-white">
              Transparent plans by shop volume
            </h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              All pricing tiers below are prototype plan structures with clear minute and location limits.
            </p>
            <div className="mt-6 space-y-3">
              {[
                { name: 'Starter Shop — 1 Location', price: '$199/mo', detail: '500 AI call minutes · Conditional forwarding · Calendar sync' },
                { name: 'Growth Shop — Up to 3 Locations', price: '$349/mo', detail: '1,500 AI call minutes · Live transfers · SMS & Email reminders' },
                { name: 'Multi-Shop Enterprise', price: '$699/mo', detail: '4,000+ AI minutes · Unlimited locations · Consolidated analytics' },
              ].map((tier) => (
                <div
                  key={tier.name}
                  className="p-4 rounded-xl bg-white dark:bg-[#172337] border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4"
                >
                  <div>
                    <p className="text-sm font-semibold text-[#101827] dark:text-white">{tier.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{tier.detail}</p>
                  </div>
                  <span className="font-mono font-bold text-base tabular-nums text-[#3978F6] shrink-0">{tier.price}</span>
                </div>
              ))}
            </div>
            <div className="mt-5">
              <Link to="/pricing">
                <Button variant="outline">Compare Full Plans & Limits</Button>
              </Link>
            </div>
          </div>

          <div className="lg:col-span-6">
            <h2 className="font-display text-2xl font-bold text-[#101827] dark:text-white">Common questions</h2>
            <div className="mt-6 divide-y divide-slate-200 dark:divide-slate-800 rounded-xl bg-white dark:bg-[#172337] border border-slate-200 dark:border-slate-800">
              {faqs.map((f, idx) => (
                <div key={f.q} className="p-4">
                  <button
                    type="button"
                    onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                    aria-expanded={openFaq === idx}
                    className="w-full flex items-center justify-between gap-4 text-left text-sm font-semibold text-[#101827] dark:text-white cursor-pointer"
                  >
                    <span>{f.q}</span>
                    <ChevronDown className={`w-4 h-4 shrink-0 transition-transform ${openFaq === idx ? 'rotate-180' : ''}`} />
                  </button>
                  {openFaq === idx && <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{f.a}</p>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 7. Final CTA */}
      <section className="py-14 bg-[#101827] text-white">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-xs text-[#36C5E8] font-medium mb-2">
              <ShieldCheck className="w-4 h-4" />
              <span>Recording consent safeguards & configurable shop rules built in</span>
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight">
              Ready to see Tunde AI configured for your bays?
            </h2>
          </div>
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Link to="/signup">
              <Button size="lg" variant="primary">
                Get Started
              </Button>
            </Link>
            <Link to="/book-demo">
              <Button size="lg" variant="outline" className="bg-transparent border-slate-600 text-white hover:bg-slate-800">
                Book a Demo
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
