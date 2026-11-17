import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, HelpCircle, Plus, Save } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { DEFAULT_SHOP_HOURS } from '../../data/mockData';
import { Button } from '../../components/ui/Button';
import { Input, Select, Textarea } from '../../components/ui/FormControls';
import { Modal } from '../../components/ui/Overlays';
import { StatusBadge } from '../../components/ui/StatusBadge';

export function BusinessSettingsPage() {
  const { locations, addLocation, updateLocation, retentionDays, setRetentionDays, businessId, addToast } = useApp();
  const [recordingLaw, setRecordingLaw] = useState<'one_party' | 'two_party' | 'disabled'>('two_party');
  const [addModal, setAddModal] = useState(false);
  const [locForm, setLocForm] = useState({ name: '', address: '', city: '', state: '', zip: '', phone: '', bayCount: 4 });

  const handleAddLoc = (e: React.FormEvent) => {
    e.preventDefault();
    if (!locForm.name.trim() || !locForm.address.trim()) return;
    addLocation({
      id: `loc-${Date.now().toString().slice(-4)}`,
      businessId: businessId || 'loc_primary',
      name: locForm.name.trim(),
      address: locForm.address.trim(),
      city: locForm.city,
      state: locForm.state,
      zip: locForm.zip,
      phone: locForm.phone,
      aiPhoneNumber: '',
      timezone: 'America/New_York',
      bayCount: Number(locForm.bayCount),
      slotDurationMinutes: 60,
      hours: locations[0]?.hours || DEFAULT_SHOP_HOURS.map((h) => ({ ...h })),
      holidays: [],
      isActive: true,
    });
    setAddModal(false);
    setLocForm({ name: '', address: '', city: '', state: '', zip: '', phone: '', bayCount: 4 });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-[#101827] dark:text-white">Business & Multi-Location Settings</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Manage independent shop locations, bay capacities, and recording consent compliance
          </p>
        </div>
        <Button iconLeft={<Plus className="w-4 h-4" />} onClick={() => setAddModal(true)}>
          Add Shop Location
        </Button>
      </div>

      {/* Multi-Location Directory */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {locations.map((loc) => (
          <div key={loc.id} className="p-5 rounded-xl bg-white dark:bg-[#172337] border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[#3978F6]" />
                <h2 className="font-display text-base font-bold text-[#101827] dark:text-white">{loc.name}</h2>
              </div>
              <StatusBadge label={loc.isActive ? 'Active' : 'Paused'} tone={loc.isActive ? 'success' : 'neutral'} />
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-300 space-y-1">
              <p>{loc.address}, {loc.city}, {loc.state} {loc.zip}</p>
              <p className="font-mono tabular-nums">Shop Line: {loc.phone} · AI Line: {loc.aiPhoneNumber}</p>
              <p className="font-mono tabular-nums">{loc.bayCount} Bays · {loc.slotDurationMinutes}m default slots</p>
            </div>
            <div className="pt-2 flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => updateLocation({ ...loc, isActive: !loc.isActive })}
              >
                {loc.isActive ? 'Pause Location' : 'Activate Location'}
              </Button>
              <Link to="/app/appointments"><Button size="sm" variant="ghost">Hours & Bays</Button></Link>
            </div>
          </div>
        ))}
      </div>

      {/* Compliance & Recording Consent */}
      <div className="p-5 rounded-xl bg-white dark:bg-[#172337] border border-slate-200 dark:border-slate-800 space-y-4 max-w-2xl">
        <h2 className="font-display text-base font-bold text-[#101827] dark:text-white">Recording Consent, Retention & Compliance</h2>
        <Select
          label="Call Recording Jurisdiction Policy"
          value={recordingLaw}
          onChange={(e) => setRecordingLaw(e.target.value as typeof recordingLaw)}
          options={[
            { value: 'two_party', label: 'Two-Party / All-Party Consent (Mandatory verbal disclosure at call start)' },
            { value: 'one_party', label: 'One-Party Consent (Standard quality disclosure)' },
            { value: 'disabled', label: 'Disable Audio Recording (Transcript-only or summary mode)' },
          ]}
        />
        <Select
          label="Configurable Recording & Transcript Retention Window"
          value={String(retentionDays)}
          onChange={(e) => setRetentionDays(Number(e.target.value))}
          options={[
            { value: '30', label: '30 Days — Strict Privacy Auto-Purge' },
            { value: '90', label: '90 Days — Standard Shop Operations' },
            { value: '180', label: '180 Days — Extended Quality Assurance' },
            { value: '365', label: '365 Days — Annual Compliance Archive' },
          ]}
        />
        <p className="text-xs text-slate-500 -mt-2">
          Individual recordings and transcripts can also be purged on demand from any Call Detail page.
        </p>
        <Button
          iconLeft={<Save className="w-4 h-4" />}
          onClick={() => addToast({ title: 'Compliance & retention policy saved', description: `${retentionDays}-day retention window active.`, variant: 'success' })}
        >
          Save Compliance Policy
        </Button>
      </div>

      <Modal open={addModal} onClose={() => setAddModal(false)} title="Add New Shop Location">
        <form onSubmit={handleAddLoc} className="space-y-4">
          <Input label="Location Name" required value={locForm.name} onChange={(e) => setLocForm({ ...locForm, name: e.target.value })} placeholder="Apex Collision — Eastside" />
          <Input label="Street Address" required value={locForm.address} onChange={(e) => setLocForm({ ...locForm, address: e.target.value })} placeholder="1800 E Main St" />
          <div className="grid grid-cols-3 gap-3">
            <Input label="City" value={locForm.city} onChange={(e) => setLocForm({ ...locForm, city: e.target.value })} />
            <Input label="State" value={locForm.state} onChange={(e) => setLocForm({ ...locForm, state: e.target.value })} />
            <Input label="ZIP" value={locForm.zip} onChange={(e) => setLocForm({ ...locForm, zip: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Shop Phone" value={locForm.phone} onChange={(e) => setLocForm({ ...locForm, phone: e.target.value })} placeholder="(614) 555-0190" />
            <Input label="Service Bays" type="number" min={1} value={locForm.bayCount} onChange={(e) => setLocForm({ ...locForm, bayCount: Number(e.target.value) })} />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setAddModal(false)}>Cancel</Button>
            <Button type="submit">Create Location</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export function HelpSupportPage() {
  const { addToast, recordAuditEvent, authUser, businessProfile } = useApp();
  const [subject, setSubject] = useState('');
  const [details, setDetails] = useState('');

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="font-display text-2xl font-bold text-[#101827] dark:text-white">Help & Support</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Carrier forwarding guides, setup wizard access, and support ticket submission
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="p-5 rounded-xl bg-white dark:bg-[#172337] border border-slate-200 dark:border-slate-800 space-y-3">
          <HelpCircle className="w-5 h-5 text-[#3978F6]" />
          <h2 className="font-display text-base font-bold">Quick Resources</h2>
          <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
            <li><Link to="/onboarding" className="text-[#3978F6] hover:underline">Resume 17-Step Onboarding Wizard →</Link></li>
            <li><Link to="/app/phone-config" className="text-[#3978F6] hover:underline">Twilio Webhook & Carrier Forwarding Codes →</Link></li>
            <li><Link to="/faq" className="text-[#3978F6] hover:underline">Public Platform FAQ →</Link></li>
            <li><Link to="/admin/requirements-audit" className="text-[#3978F6] hover:underline">23-Section PRD Audit, Acceptance Tests & Proposal →</Link></li>
          </ul>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!subject.trim()) return;
            recordAuditEvent({
              actor: authUser?.displayName || authUser?.email || 'Shop Owner',
              actorRole: 'Shop Owner',
              action: 'Submitted Support Request',
              resource: subject.trim(),
              businessName: businessProfile?.name || 'Shop',
              accessReason: 'Owner support request',
              changesSummary: details.trim() || subject.trim(),
            });
            addToast({ title: 'Support request saved to Firestore', description: subject, variant: 'success' });
            setSubject('');
            setDetails('');
          }}
          className="p-5 rounded-xl bg-white dark:bg-[#172337] border border-slate-200 dark:border-slate-800 space-y-3"
        >
          <h2 className="font-display text-base font-bold">Submit Support Request</h2>
          <Input label="Subject" required value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="VoIP forwarding assistance" />
          <Textarea label="Details" rows={3} value={details} onChange={(e) => setDetails(e.target.value)} placeholder="Describe your phone provider or calendar sync question..." />
          <Button type="submit" size="sm">Submit Ticket</Button>
        </form>
      </div>
    </div>
  );
}
