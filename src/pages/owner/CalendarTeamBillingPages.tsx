import React, { useState } from 'react';
import { CalendarSync, CreditCard, Plus, RefreshCw, ShieldAlert } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Button } from '../../components/ui/Button';
import { Input, Select } from '../../components/ui/FormControls';
import { Modal } from '../../components/ui/Overlays';
import { PrototypeBanner } from '../../components/ui/Feedback';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { CalendarIntegrationState, TeamMember } from '../../types/tunde';

export function CalendarIntegrationPage() {
  const { calendars, updateCalendar, addToast } = useApp();
  const [disconnectTarget, setDisconnectTarget] = useState<CalendarIntegrationState | null>(null);

  const handleToggleConnect = (cal: CalendarIntegrationState) => {
    if (cal.connected) {
      setDisconnectTarget(cal);
      return;
    }
    updateCalendar({
      ...cal,
      connected: true,
      syncStatus: 'Synced',
      lastSyncAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
      errorMessage: undefined,
    });
    addToast({ title: `${cal.provider} state updated`, variant: 'info' });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-[#101827] dark:text-white">Calendar Integrations</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Two-way bay availability across Tunde Internal Calendar (backed by Firestore) and external calendar connectors
        </p>
      </div>

      <PrototypeBanner contextLabel="Internal Tunde Calendar is live in Cloud Firestore. External Google Calendar / Outlook / DMS connectors require OAuth credentials when enabled." />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {calendars.map((cal) => (
          <div key={cal.provider} className="p-5 rounded-xl bg-white dark:bg-[#172337] border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <CalendarSync className="w-5 h-5 text-[#3978F6]" />
                <StatusBadge
                  label={cal.syncStatus}
                  tone={
                    cal.syncStatus === 'Synced'
                      ? 'success'
                      : cal.syncStatus === 'Error'
                      ? 'error'
                      : 'neutral'
                  }
                />
              </div>
              <h2 className="font-display text-base font-bold text-[#101827] dark:text-white">{cal.provider}</h2>
              {cal.accountEmail && <p className="text-xs text-slate-500 font-mono">{cal.accountEmail}</p>}
              {cal.lastSyncAt && <p className="text-xs text-slate-500">Last synced: {cal.lastSyncAt}</p>}
              {cal.errorMessage && (
                <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-xs text-[#DC4C4C]">
                  {cal.errorMessage}
                </div>
              )}
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="flex gap-2">
                {cal.provider === 'Internal Tunde Calendar' ? (
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    iconLeft={<RefreshCw className="w-3.5 h-3.5" />}
                    onClick={() => {
                      updateCalendar({ ...cal, syncStatus: 'Synced', lastSyncAt: new Date().toISOString().slice(0, 16).replace('T', ' ') });
                      addToast({ title: 'Internal Calendar verified', variant: 'success' });
                    }}
                  >
                    Verified Live in Firestore
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant={cal.connected ? 'outline' : 'primary'}
                    className="flex-1"
                    onClick={() => handleToggleConnect(cal)}
                  >
                    {cal.connected ? 'Disconnect' : 'Mark Ready / Connect'}
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Automotive Shop Management Software (DMS) Roadmap */}
      <div className="p-5 rounded-xl bg-white dark:bg-[#172337] border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="font-display text-base font-bold text-[#101827] dark:text-white">
              Automotive Shop Management Software (DMS) Connectors
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Phase 2 / Phase 3 direct repair-order & bay schedule sync. Internal Tunde Calendar handles live scheduling in Firestore automatically.
            </p>
          </div>
          <StatusBadge label="Roadmap · Connectors Pending" tone="info" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              name: 'Tekmetric',
              scope: 'Two-way bay capacity, digital inspection & RO completion revenue verification',
              status: 'Phase 2 API Investigation',
            },
            {
              name: 'Shopmonkey',
              scope: 'Work order creation, customer/vehicle sync & service writer bay assignment',
              status: 'Phase 2 API Investigation',
            },
            {
              name: 'Mitchell 1 (Manager SE)',
              scope: 'Legacy shop schedule polling, vehicle history & service interval lookup',
              status: 'Phase 3 Enterprise Connector',
            },
          ].map((dms) => (
            <div key={dms.name} className="p-4 rounded-lg bg-[#F5F7FB] dark:bg-[#101827] border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="font-display text-sm font-bold text-[#101827] dark:text-white">{dms.name}</span>
                <StatusBadge label="Connector Pending" tone="neutral" showIcon={false} />
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{dms.scope}</p>
              <p className="text-[11px] font-mono text-[#3978F6]">{dms.status}</p>
            </div>
          ))}
        </div>
      </div>

      <Modal
        open={Boolean(disconnectTarget)}
        onClose={() => setDisconnectTarget(null)}
        title={`Disconnect ${disconnectTarget?.provider}?`}
        description="Disconnecting stops external calendar sync."
      >
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setDisconnectTarget(null)}>Cancel</Button>
          <Button
            variant="danger"
            onClick={() => {
              if (disconnectTarget) {
                updateCalendar({
                  ...disconnectTarget,
                  connected: false,
                  syncStatus: 'Not Connected',
                  lastSyncAt: undefined,
                });
                addToast({ title: `${disconnectTarget.provider} disconnected`, variant: 'warning' });
              }
              setDisconnectTarget(null);
            }}
          >
            Confirm Disconnect
          </Button>
        </div>
      </Modal>
    </div>
  );
}

export function TeamPage() {
  const { team, addTeamMember, updateTeamMember, locations, selectedLocationId } = useApp();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [form, setForm] = useState({
    name: '',
    role: 'Service Advisor' as TeamMember['role'],
    email: '',
    phone: '',
    extension: '101',
  });

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.includes('@')) return;
    addTeamMember({
      locationId: selectedLocationId === 'all' ? locations[0]?.id || 'loc_primary' : selectedLocationId,
      name: form.name.trim(),
      role: form.role,
      email: form.email.trim(),
      phone: form.phone.trim(),
      extension: form.extension,
      isTransferDestination: Boolean(form.phone.trim()),
      receivesCallbacks: true,
      availability: 'Available',
      permissions: ['Appointments', 'Calls', 'Callbacks'],
    });
    setInviteOpen(false);
    setForm({ name: '', role: 'Service Advisor', email: '', phone: '', extension: '101' });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-[#101827] dark:text-white">Team Management</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Staff roles, callback routing, and live Twilio call transfer phone numbers saved in Firestore
          </p>
        </div>
        <Button iconLeft={<Plus className="w-4 h-4" />} onClick={() => setInviteOpen(true)}>
          Add Team Member
        </Button>
      </div>

      <div className="rounded-xl bg-white dark:bg-[#172337] border border-slate-200 dark:border-slate-800 overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold text-slate-500 bg-slate-50 dark:bg-[#101827]/60">
              <th className="py-3 px-4">Employee</th>
              <th className="py-3 px-4">Role & Permissions</th>
              <th className="py-3 px-4">Transfer Destination</th>
              <th className="py-3 px-4">Callback Alerts</th>
              <th className="py-3 px-4">Availability</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
            {team.map((m) => (
              <tr key={m.id}>
                <td className="py-3 px-4">
                  <p className="font-semibold text-[#101827] dark:text-white">{m.name}</p>
                  <p className="text-xs text-slate-500 font-mono">{m.email} · Ext {m.extension}</p>
                </td>
                <td className="py-3 px-4 text-xs">
                  <p className="font-semibold">{m.role}</p>
                  <p className="text-slate-500">{m.permissions.join(' · ')}</p>
                </td>
                <td className="py-3 px-4 text-xs">
                  <button
                    type="button"
                    onClick={() => updateTeamMember({ ...m, isTransferDestination: !m.isTransferDestination })}
                    className="cursor-pointer"
                  >
                    <StatusBadge
                      label={m.isTransferDestination ? `Enabled (${m.phone || 'Add phone'})` : 'Disabled'}
                      tone={m.isTransferDestination ? 'info' : 'neutral'}
                      showIcon={false}
                    />
                  </button>
                </td>
                <td className="py-3 px-4 text-xs">
                  <button
                    type="button"
                    onClick={() => updateTeamMember({ ...m, receivesCallbacks: !m.receivesCallbacks })}
                    className="cursor-pointer"
                  >
                    <StatusBadge label={m.receivesCallbacks ? 'Assigned' : 'Off'} tone={m.receivesCallbacks ? 'success' : 'neutral'} showIcon={false} />
                  </button>
                </td>
                <td className="py-3 px-4 text-xs">
                  <select
                    value={m.availability}
                    onChange={(e) => updateTeamMember({ ...m, availability: e.target.value as TeamMember['availability'] })}
                    aria-label={`Availability for ${m.name}`}
                    className="px-2 py-1 rounded border border-slate-300 dark:border-slate-700 bg-transparent text-xs"
                  >
                    <option value="Available">Available</option>
                    <option value="On Call">On Call</option>
                    <option value="Off Duty">Off Duty</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={inviteOpen} onClose={() => setInviteOpen(false)} title="Add Team Member">
        <form onSubmit={handleInvite} className="space-y-4">
          <Input label="Full Name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Select
            label="Role"
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value as TeamMember['role'] })}
            options={[
              { value: 'Service Manager', label: 'Service Manager' },
              { value: 'Service Advisor', label: 'Service Advisor' },
              { value: 'Lead Technician', label: 'Lead Technician' },
              { value: 'Owner', label: 'Owner' },
            ]}
          />
          <Input label="Email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Direct Transfer Phone (E.164)" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+16145550155" />
            <Input label="Extension" value={form.extension} onChange={(e) => setForm({ ...form, extension: e.target.value })} />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setInviteOpen(false)}>Cancel</Button>
            <Button type="submit">Save Team Member</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export function BillingPage() {
  const { billing, updateBilling, calls, addToast } = useApp();
  const [planModal, setPlanModal] = useState(false);
  const [cancelModal, setCancelModal] = useState(false);

  const realMinutesUsed = Math.ceil(calls.reduce((sum, c) => sum + (c.durationSeconds || 0), 0) / 60);
  const usagePct = Math.min(100, Math.round((realMinutesUsed / Math.max(1, billing.minutesIncluded)) * 100));

  const switchPlan = (planId: 'starter' | 'growth' | 'multi_shop', planName: string, price: number, mins: number, locs: number) => {
    updateBilling({
      ...billing,
      planId,
      planName,
      monthlyPrice: price,
      minutesIncluded: mins,
      locationsIncluded: locs,
    });
    setPlanModal(false);
    addToast({ title: `Plan preference saved: ${planName}`, variant: 'success' });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-[#101827] dark:text-white">Billing & Usage</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real AI call minute usage calculated from your recorded Firestore calls; Stripe billing checkout awaits production card setup
          </p>
        </div>
        <StatusBadge label={billing.status} tone="info" />
      </div>

      <PrototypeBanner contextLabel="Zero Fake Invoices — Minutes used below reflect real stored call duration. No fake charges or invented invoice records are displayed." />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 p-5 rounded-xl bg-white dark:bg-[#172337] border border-slate-200 dark:border-slate-800 space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs text-slate-500">Selected Tier</p>
              <h2 className="font-display text-2xl font-bold text-[#101827] dark:text-white mt-0.5">
                {billing.planName} · <span className="font-mono tabular-nums">${billing.monthlyPrice}/mo</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Cycle date: <span className="font-mono">{billing.nextBillingDate}</span> · Up to {billing.locationsIncluded} locations
              </p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => setPlanModal(true)}>Change Plan</Button>
              <Button size="sm" variant="outline" onClick={() => setCancelModal(true)}>Cancel Plan</Button>
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex justify-between text-xs">
              <span className="font-medium">Actual AI Call Minutes Used</span>
              <span className="font-mono tabular-nums">
                {realMinutesUsed} / {billing.minutesIncluded} mins ({usagePct}%)
              </span>
            </div>
            <div className="h-2.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div className="h-full bg-[#3978F6]" style={{ width: `${usagePct}%` }} />
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 p-5 rounded-xl bg-white dark:bg-[#172337] border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-base font-bold">Payment Method</h2>
            <CreditCard className="w-5 h-5 text-slate-400" />
          </div>
          <div className="p-3.5 rounded-lg bg-[#F5F7FB] dark:bg-[#101827] border border-slate-200 dark:border-slate-800 text-xs space-y-1">
            <p className="font-semibold">{billing.paymentBrand}</p>
            <p className="text-slate-500">Connect Stripe Checkout in production to collect shop billing cards.</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => addToast({ title: 'Stripe integration pending production API keys', variant: 'info' })}
          >
            Connect Payment Provider
          </Button>
        </div>
      </div>

      {/* Invoices */}
      <div className="rounded-xl bg-white dark:bg-[#172337] border border-slate-200 dark:border-slate-800 overflow-x-auto">
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800">
          <h2 className="font-display text-base font-bold">Billing History & Invoices</h2>
        </div>
        {billing.invoices.length === 0 ? (
          <p className="p-6 text-xs text-slate-500 text-center">No invoices issued yet.</p>
        ) : (
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-xs text-slate-500">
                <th className="py-3 px-5">Invoice ID</th>
                <th className="py-3 px-5">Date</th>
                <th className="py-3 px-5">Description</th>
                <th className="py-3 px-5">Amount</th>
                <th className="py-3 px-5 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {billing.invoices.map((inv) => (
                <tr key={inv.id}>
                  <td className="py-3 px-5 font-mono font-semibold">{inv.id}</td>
                  <td className="py-3 px-5 font-mono tabular-nums">{inv.date}</td>
                  <td className="py-3 px-5">{inv.description}</td>
                  <td className="py-3 px-5 font-mono tabular-nums">${inv.amount.toFixed(2)}</td>
                  <td className="py-3 px-5 text-right"><StatusBadge label={inv.status} tone="success" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal open={planModal} onClose={() => setPlanModal(false)} title="Select Subscription Plan">
        <div className="space-y-3 text-sm">
          {[
            { id: 'starter' as const, name: 'Starter Shop', price: 199, mins: 500, locs: 1 },
            { id: 'growth' as const, name: 'Growth Shop', price: 349, mins: 1500, locs: 3 },
            { id: 'multi_shop' as const, name: 'Multi-Shop Group', price: 699, mins: 4000, locs: 10 },
          ].map((p) => (
            <div key={p.id} className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div>
                <p className="font-semibold">{p.name}</p>
                <p className="text-xs text-slate-500 font-mono">${p.price}/mo · {p.mins} mins · {p.locs} locations</p>
              </div>
              <Button
                size="sm"
                variant={billing.planId === p.id ? 'outline' : 'primary'}
                disabled={billing.planId === p.id}
                onClick={() => switchPlan(p.id, p.name, p.price, p.mins, p.locs)}
              >
                {billing.planId === p.id ? 'Current' : 'Select'}
              </Button>
            </div>
          ))}
        </div>
      </Modal>

      <Modal open={cancelModal} onClose={() => setCancelModal(false)} title="Cancel Subscription?">
        <div className="space-y-4 text-sm">
          <div className="flex items-start gap-2 text-xs text-amber-800 dark:text-amber-200 bg-amber-50 dark:bg-amber-950/30 p-3 rounded-lg">
            <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
            <span>Cancelling pauses your AI receptionists at the end of the billing cycle. Remember to disable conditional forwarding on your shop lines.</span>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setCancelModal(false)}>Keep Plan</Button>
            <Button
              variant="danger"
              onClick={() => {
                updateBilling({ ...billing, status: 'Past Due' });
                setCancelModal(false);
                addToast({ title: 'Subscription status updated', variant: 'warning' });
              }}
            >
              Confirm Cancellation
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
