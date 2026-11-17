import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, ChevronDown, Mail, MapPin, Phone } from 'lucide-react';
import { InteractiveCallSimulator } from '../../components/shared/InteractiveCallSimulator';
import { Button } from '../../components/ui/Button';
import { Input, SearchField, Select, Textarea } from '../../components/ui/FormControls';
import { PrototypeBanner } from '../../components/ui/Feedback';
import { useApp } from '../../context/AppContext';

export function InteractiveDemoPage() {
  return (
    <div className="max-w-[1120px] mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <div>
        <p className="text-xs font-semibold text-[#3978F6]">Interactive AI Receptionist Simulator</p>
        <h1 className="font-display text-3xl font-bold text-[#101827] dark:text-white mt-2">
          Experience how Tunde AI handles real automotive calls
        </h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 max-w-2xl">
          Test standard call scenarios or type your own automotive service request. All responses below run in client-side prototype simulation mode so you can evaluate conversation flow before connecting a shop phone line.
        </p>
      </div>

      <PrototypeBanner contextLabel="Simulated AI Call Environment — No real phone calls or SMS messages are dispatched from this demo." />

      <InteractiveCallSimulator />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-white dark:bg-[#172337] border border-slate-200 dark:border-slate-800">
          <p className="text-xs font-semibold text-[#101827] dark:text-white">Try Custom Prompts</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Ask about diagnostic pricing, speaking to a human manager, or booking an oil change tomorrow.
          </p>
        </div>
        <div className="p-4 rounded-xl bg-white dark:bg-[#172337] border border-slate-200 dark:border-slate-800">
          <p className="text-xs font-semibold text-[#101827] dark:text-white">Configure Your Own Rules</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Customize agent voice, greeting, and transfer logic inside the Shop Owner Dashboard.
          </p>
        </div>
        <div className="p-4 rounded-xl bg-white dark:bg-[#172337] border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold text-[#101827] dark:text-white">Ready to try setup?</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Run the 17-step onboarding wizard.</p>
          </div>
          <Link to="/onboarding"><Button size="sm">Start Setup</Button></Link>
        </div>
      </div>
    </div>
  );
}

export function BookDemoPage() {
  const { addToast } = useApp();
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    name: '',
    shopName: '',
    email: '',
    phone: '',
    locations: '1',
    slot: 'Tomorrow · 10:00 AM EST',
    notes: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const nextErrors: Record<string, string> = {};
    if (!form.name.trim()) nextErrors.name = 'Full name is required.';
    if (!form.shopName.trim()) nextErrors.shopName = 'Shop name is required.';
    if (!form.email.includes('@')) nextErrors.email = 'Enter a valid business email.';
    if (form.phone.trim().length < 7) nextErrors.phone = 'Enter a valid phone number.';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind: 'demo',
          name: form.name.trim(),
          shopName: form.shopName.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          locations: form.locations,
          slot: form.slot,
          message: form.notes.trim(),
        }),
      });
      if (!res.ok) throw new Error('Unable to save demo request.');
      setSubmitted(true);
      addToast({ title: 'Demo request saved', description: form.slot, variant: 'success' });
    } catch (err) {
      addToast({ title: 'Submission error', description: err instanceof Error ? err.message : 'Please try again.', variant: 'error' });
    }
  };

  return (
    <div className="max-w-[1040px] mx-auto px-4 sm:px-6 lg:px-8 py-14">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-5 space-y-5">
          <p className="text-xs font-semibold text-[#3978F6]">Guided Walkthrough</p>
          <h1 className="font-display text-3xl font-bold text-[#101827] dark:text-white">Book a live shop walkthrough</h1>
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            Review how Tunde AI integrates with your existing phone carrier, calendar, bay count, and multi-location service policies.
          </p>
          <div className="p-4 rounded-xl bg-white dark:bg-[#172337] border border-slate-200 dark:border-slate-800 space-y-2 text-xs text-slate-600 dark:text-slate-300">
            <p className="font-semibold text-[#101827] dark:text-white">What we cover in 20 minutes:</p>
            <p>1. Conditional forwarding setup on landline, mobile, or VoIP</p>
            <p>2. Bay capacity & appointment category configuration</p>
            <p>3. Two-party recording consent & advisor transfer rules</p>
          </div>
        </div>

        <div className="lg:col-span-7 bg-white dark:bg-[#172337] rounded-xl border border-slate-200 dark:border-slate-800 p-6">
          {submitted ? (
            <div className="py-8 text-center space-y-3">
              <CheckCircle2 className="w-10 h-10 text-[#16A36A] mx-auto" />
              <h2 className="font-display text-xl font-bold text-[#101827] dark:text-white">Demo Request Saved</h2>
              <p className="text-sm text-slate-600 dark:text-slate-300 max-w-md mx-auto">
                Submitted for <strong>{form.shopName}</strong> ({form.slot}). Your walkthrough details have been logged.
              </p>
              <div className="pt-3 flex justify-center gap-3">
                <Button variant="outline" onClick={() => setSubmitted(false)}>Book Another Time</Button>
                <Link to="/demo"><Button>Try Interactive AI Simulator</Button></Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Your Name"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  error={errors.name}
                  placeholder="David Miller"
                />
                <Input
                  label="Shop / Business Name"
                  required
                  value={form.shopName}
                  onChange={(e) => setForm({ ...form, shopName: e.target.value })}
                  error={errors.shopName}
                  placeholder="Apex Auto Care"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Work Email"
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  error={errors.email}
                  placeholder="owner@yourshop.com"
                />
                <Input
                  label="Phone Number"
                  required
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  error={errors.phone}
                  placeholder="(614) 555-0142"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select
                  label="Number of Shop Locations"
                  value={form.locations}
                  onChange={(e) => setForm({ ...form, locations: e.target.value })}
                  options={[
                    { value: '1', label: '1 Location' },
                    { value: '2-3', label: '2–3 Locations' },
                    { value: '4+', label: '4+ Locations' },
                  ]}
                />
                <Select
                  label="Preferred Walkthrough Time"
                  value={form.slot}
                  onChange={(e) => setForm({ ...form, slot: e.target.value })}
                  options={[
                    { value: 'Tomorrow · 10:00 AM EST', label: 'Tomorrow · 10:00 AM EST' },
                    { value: 'Tomorrow · 02:00 PM EST', label: 'Tomorrow · 02:00 PM EST' },
                    { value: 'Thursday · 11:30 AM EST', label: 'Thursday · 11:30 AM EST' },
                  ]}
                />
              </div>
              <Textarea
                label="Current Phone & Scheduling Setup (Optional)"
                rows={3}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Tell us about your VoIP/landline provider, bay count, or shop management tools..."
              />
              <Button type="submit" className="w-full" size="lg">
                Confirm Demo Request
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export function FaqPage() {
  const [query, setQuery] = useState('');
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const items = [
    {
      cat: 'Telephony',
      q: 'Can I keep my shop’s existing phone number?',
      a: 'Yes. You can enable conditional forwarding (when busy, no answer, or after hours) from your landline, mobile, or VoIP provider directly to your Tunde AI endpoint, or provision a dedicated local number.',
    },
    {
      cat: 'Scheduling',
      q: 'How does Tunde AI prevent double-booked bays?',
      a: 'Every location defines its service bay count, slot duration, buffer time, business hours, and holiday closures. Tunde AI checks available capacity in real time before confirming any time.',
    },
    {
      cat: 'Compliance',
      q: 'How are call recording consent laws handled?',
      a: 'Tunde AI supports configurable greeting disclosures for one-party and two-party consent jurisdictions, plus per-location recording disable toggles and audited access logs.',
    },
    {
      cat: 'Transfers',
      q: 'Can callers still reach a live service advisor?',
      a: 'Yes. You configure transfer rules—for example warranty approvals, parts inquiries, or callers asking for a manager—to forward to specific team extensions.',
    },
    {
      cat: 'Multi-Location',
      q: 'Do multi-location owners need separate logins?',
      a: 'No. One shop owner account can manage multiple locations, each with its own phone number, AI agent, knowledge base, hours, and calendar, plus consolidated reporting.',
    },
  ];

  const filtered = items.filter(
    (i) =>
      i.q.toLowerCase().includes(query.toLowerCase()) ||
      i.a.toLowerCase().includes(query.toLowerCase()) ||
      i.cat.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="max-w-[860px] mx-auto px-4 sm:px-6 lg:px-8 py-14 space-y-8">
      <div>
        <p className="text-xs font-semibold text-[#3978F6]">Help & Answers</p>
        <h1 className="font-display text-3xl font-bold text-[#101827] dark:text-white mt-2">Frequently Asked Questions</h1>
      </div>

      <SearchField value={query} onChange={setQuery} placeholder="Search questions on telephony, bays, recording consent..." />

      <div className="divide-y divide-slate-200 dark:divide-slate-800 rounded-xl bg-white dark:bg-[#172337] border border-slate-200 dark:border-slate-800">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500">No matching questions found for “{query}”.</div>
        ) : (
          filtered.map((item, idx) => (
            <div key={item.q} className="p-5">
              <button
                type="button"
                onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
                className="w-full flex items-center justify-between gap-4 text-left cursor-pointer"
              >
                <div>
                  <span className="text-xs text-slate-500 dark:text-slate-400">{item.cat}</span>
                  <h2 className="text-sm font-semibold text-[#101827] dark:text-white mt-0.5">{item.q}</h2>
                </div>
                <ChevronDown className={`w-4 h-4 shrink-0 transition-transform ${openIndex === idx ? 'rotate-180' : ''}`} />
              </button>
              {openIndex === idx && <p className="mt-3 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{item.a}</p>}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export function ContactPage() {
  const { addToast } = useApp();
  const [sent, setSent] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.includes('@') || !message.trim()) {
      addToast({ title: 'Please fill out all required fields', variant: 'error' });
      return;
    }
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind: 'contact',
          name: name.trim(),
          email: email.trim(),
          message: message.trim(),
        }),
      });
      if (!res.ok) throw new Error('Unable to submit inquiry.');
      setSent(true);
      addToast({ title: 'Message saved', variant: 'success' });
    } catch (err) {
      addToast({ title: 'Submission error', description: err instanceof Error ? err.message : 'Please try again.', variant: 'error' });
    }
  };

  return (
    <div className="max-w-[1040px] mx-auto px-4 sm:px-6 lg:px-8 py-14 grid grid-cols-1 lg:grid-cols-12 gap-10">
      <div className="lg:col-span-5 space-y-5">
        <p className="text-xs font-semibold text-[#3978F6]">Contact Tunde AI</p>
        <h1 className="font-display text-3xl font-bold text-[#101827] dark:text-white">Speak with our automotive team</h1>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Questions about multi-shop deployments, carrier compatibility, or custom shop integrations? Send us a message.
        </p>
        <div className="space-y-3 pt-2 text-sm text-slate-700 dark:text-slate-300">
          <div className="flex items-center gap-2.5"><Mail className="w-4 h-4 text-[#3978F6]" /><span>support@tunde.example</span></div>
          <div className="flex items-center gap-2.5"><Phone className="w-4 h-4 text-[#3978F6]" /><span>(614) 555-0195</span></div>
          <div className="flex items-center gap-2.5"><MapPin className="w-4 h-4 text-[#3978F6]" /><span>Columbus, Ohio</span></div>
        </div>
      </div>

      <div className="lg:col-span-7 bg-white dark:bg-[#172337] rounded-xl border border-slate-200 dark:border-slate-800 p-6">
        {sent ? (
          <div className="py-8 text-center space-y-3">
            <CheckCircle2 className="w-10 h-10 text-[#16A36A] mx-auto" />
            <h2 className="font-display text-lg font-bold text-[#101827] dark:text-white">Inquiry Received</h2>
            <p className="text-sm text-slate-600 dark:text-slate-300">Thank you, {name}. Your message has been saved.</p>
            <Button variant="outline" onClick={() => setSent(false)}>Send Another Message</Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="Full Name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
            <Input label="Email Address" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@shop.com" />
            <Textarea label="Message" rows={4} required value={message} onChange={(e) => setMessage(e.target.value)} placeholder="How can we help?" />
            <Button type="submit" size="lg" className="w-full">Send Message</Button>
          </form>
        )}
      </div>
    </div>
  );
}
