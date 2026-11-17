import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, Plus } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Button } from '../../components/ui/Button';
import { Input, SearchField, Select } from '../../components/ui/FormControls';
import { Drawer, Modal } from '../../components/ui/Overlays';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { AdminBusiness } from '../../types/tunde';

export function AdminOverviewPage() {
  const { adminBusinesses, appointments, callbacks, calls, team, agentConfigs, locations, firestoreReady } = useApp();

  const totalBiz = adminBusinesses.length;
  const activeBiz = adminBusinesses.filter((b) => b.status === 'Active').length;
  const suspendedBiz = adminBusinesses.filter((b) => b.status === 'Suspended').length;
  const activeAgents = agentConfigs.filter((a) => a.isActive).length;
  const totalCalls = calls.length;
  const totalMinutes = Math.round(calls.reduce((sum, c) => sum + c.durationSeconds, 0) / 60);
  const planPrices: Record<AdminBusiness['plan'], number> = { Starter: 199, Growth: 349, 'Multi-Shop': 699 };
  const activeMrr = adminBusinesses
    .filter((b) => b.status === 'Active')
    .reduce((sum, b) => sum + (planPrices[b.plan] || 0), 0);

  const metrics = [
    { label: 'Total Businesses (Firestore)', value: totalBiz.toString() },
    { label: 'Active Businesses', value: activeBiz.toString() },
    { label: 'Suspended Businesses', value: suspendedBiz.toString() },
    { label: 'Team Users (Workspace)', value: team.length.toString() },
    { label: 'AI Receptionist Agents', value: agentConfigs.length.toString() },
    { label: 'Active Agents', value: activeAgents.toString() },
    { label: 'Recorded / Logged Calls', value: totalCalls.toLocaleString() },
    { label: 'Total Appointments', value: appointments.length.toLocaleString() },
    { label: 'Measured AI Call Minutes', value: `${totalMinutes.toLocaleString()} mins` },
    { label: 'Active Subscription MRR', value: `$${activeMrr.toLocaleString()}` },
    { label: 'Active Shop Locations', value: locations.length.toString() },
    { label: 'Cloud Firestore Status', value: firestoreReady ? 'Connected & Live' : 'Initializing' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-[#101827] dark:text-white">Platform Overview</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Internal Tunde AI Super Admin Console — Live metrics computed from Cloud Firestore
          </p>
        </div>
        <div className="flex gap-2">
          <Link to="/admin/businesses"><Button size="sm" variant="outline">Manage Businesses</Button></Link>
          <Link to="/admin/prompts"><Button size="sm">Prompt Editor</Button></Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m) => (
          <div key={m.label} className="p-4 rounded-xl bg-white dark:bg-[#172337] border border-slate-200 dark:border-slate-800">
            <p className="text-xs text-slate-500 dark:text-slate-400">{m.label}</p>
            <p className="font-display text-xl font-bold font-mono tabular-nums text-[#101827] dark:text-white mt-1.5">
              {m.value}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-5 rounded-xl bg-white dark:bg-[#172337] border border-slate-200 dark:border-slate-800 space-y-3">
          <h2 className="font-display text-base font-bold">Tenant Businesses Summary</h2>
          {adminBusinesses.length === 0 ? (
            <p className="text-xs text-slate-500 py-4">No tenant businesses registered yet.</p>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {adminBusinesses.map((b) => (
                <div key={b.id} className="py-2.5 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-[#101827] dark:text-white">{b.name}</p>
                    <p className="text-slate-500">{b.plan} · {b.locationCount} locations</p>
                  </div>
                  <StatusBadge
                    label={b.status}
                    tone={b.status === 'Active' ? 'success' : b.status === 'Onboarding' ? 'info' : 'error'}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-5 rounded-xl bg-white dark:bg-[#172337] border border-slate-200 dark:border-slate-800 space-y-3">
          <h2 className="font-display text-base font-bold">Open Platform Operational Items</h2>
          <p className="text-xs text-slate-500">
            Urgent tenant callbacks in queue: {callbacks.filter((c) => c.urgency === 'Urgent' && c.status !== 'Completed').length}
          </p>
          <div className="space-y-2 text-xs">
            <Link to="/admin/system-health" className="block p-3 rounded-lg bg-[#F5F7FB] dark:bg-[#101827] border border-slate-200 dark:border-slate-800 hover:border-[#3978F6]">
              <strong>System Health & Live Probes</strong> — Inspect Firestore, Express Runtime, Twilio Voice & Gemini states →
            </Link>
            <Link to="/admin/audit-logs" className="block p-3 rounded-lg bg-[#F5F7FB] dark:bg-[#101827] border border-slate-200 dark:border-slate-800 hover:border-[#3978F6]">
              <strong>Audit Logs</strong> — Review sensitive call recording access & prompt change history →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export function AdminBusinessesPage() {
  const { adminBusinesses, updateAdminBusiness, addAdminBusiness, locations, team, businessId } = useApp();
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | AdminBusiness['status']>('all');
  const [selected, setSelected] = useState<AdminBusiness | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ name: '', ownerName: '', ownerEmail: '', plan: 'Growth' as AdminBusiness['plan'] });

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return adminBusinesses.filter((b) => {
      if (statusFilter !== 'all' && b.status !== statusFilter) return false;
      if (!q) return true;
      return b.name.toLowerCase().includes(q) || b.ownerName.toLowerCase().includes(q) || b.ownerEmail.toLowerCase().includes(q);
    });
  }, [adminBusinesses, query, statusFilter]);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.ownerEmail.includes('@')) return;
    addAdminBusiness({
      name: form.name.trim(),
      ownerName: form.ownerName.trim() || 'Shop Owner',
      ownerEmail: form.ownerEmail.trim(),
      plan: form.plan,
      status: 'Onboarding',
      locationCount: 1,
      activeAgents: 0,
      monthlyCalls: 0,
      monthlyMinutes: 0,
    });
    setCreateOpen(false);
    setForm({ name: '', ownerName: '', ownerEmail: '', plan: 'Growth' });
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-[#101827] dark:text-white">Business Management</h1>
          <p className="text-xs text-slate-500 mt-1">Create, inspect, activate, suspend, and reactivate shop accounts</p>
        </div>
        <Button iconLeft={<Plus className="w-4 h-4" />} onClick={() => setCreateOpen(true)}>Create Business</Button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1 p-1 rounded-lg bg-white dark:bg-[#172337] border border-slate-200 dark:border-slate-800">
          {(['all', 'Active', 'Onboarding', 'Suspended'] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md cursor-pointer ${
                statusFilter === s ? 'bg-[#3978F6] text-white' : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              {s === 'all' ? 'All Businesses' : s}
            </button>
          ))}
        </div>
        <SearchField value={query} onChange={setQuery} placeholder="Search business or owner..." className="w-full sm:w-72" />
      </div>

      <div className="rounded-xl bg-white dark:bg-[#172337] border border-slate-200 dark:border-slate-800 overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 text-xs text-slate-500 bg-slate-50 dark:bg-[#101827]/60">
              <th className="py-3 px-4">Business & Owner</th>
              <th className="py-3 px-4">Plan</th>
              <th className="py-3 px-4">Locations / Agents</th>
              <th className="py-3 px-4">Monthly Usage</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Governance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
            {filtered.map((b) => (
              <tr key={b.id} className="hover:bg-slate-50 dark:hover:bg-[#101827]/40">
                <td className="py-3 px-4">
                  <button type="button" onClick={() => setSelected(b)} className="text-left cursor-pointer hover:text-[#3978F6]">
                    <p className="font-semibold text-sm text-[#101827] dark:text-white">{b.name}</p>
                    <p className="text-slate-500">{b.ownerName} · {b.ownerEmail}</p>
                  </button>
                </td>
                <td className="py-3 px-4 font-medium">{b.plan}</td>
                <td className="py-3 px-4 font-mono tabular-nums">{b.locationCount} loc · {b.activeAgents} agents</td>
                <td className="py-3 px-4 font-mono tabular-nums">{b.monthlyCalls} calls · {b.monthlyMinutes}m</td>
                <td className="py-3 px-4">
                  <StatusBadge label={b.status} tone={b.status === 'Active' ? 'success' : b.status === 'Onboarding' ? 'info' : 'error'} />
                </td>
                <td className="py-3 px-4 text-right space-x-2 whitespace-nowrap">
                  <Button size="sm" variant="outline" onClick={() => setSelected(b)}>Inspect</Button>
                  {b.status !== 'Suspended' ? (
                    <Button size="sm" variant="danger" onClick={() => updateAdminBusiness({ ...b, status: 'Suspended', activeAgents: 0 })}>
                      Suspend
                    </Button>
                  ) : (
                    <Button size="sm" variant="primary" onClick={() => updateAdminBusiness({ ...b, status: 'Active', activeAgents: b.locationCount })}>
                      Reactivate
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Drawer
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={selected?.name || ''}
        subtitle={selected ? `${selected.plan} Plan · Created ${selected.createdAt}` : undefined}
      >
        {selected && (
          <div className="space-y-5 text-xs">
            <div className="p-4 rounded-xl bg-[#F5F7FB] dark:bg-[#101827] border border-slate-200 dark:border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm flex items-center gap-2"><Building2 className="w-4 h-4 text-[#3978F6]" /> Account Summary</span>
                <StatusBadge label={selected.status} tone={selected.status === 'Active' ? 'success' : 'warning'} />
              </div>
              <p>Owner: <strong>{selected.ownerName}</strong> ({selected.ownerEmail})</p>
              <p className="font-mono">Monthly Usage: {selected.monthlyCalls} calls / {selected.monthlyMinutes} minutes</p>
            </div>
            <div>
              <h3 className="font-display text-sm font-bold mb-2">Locations & Team Preview</h3>
              <p className="text-slate-500 mb-2">Locations attached: {selected.locationCount}</p>
              {selected.id === businessId ? (
                <div className="space-y-2">
                  {locations.map((l) => (
                    <div key={l.id} className="p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                      <p className="font-semibold">{l.name}</p>
                      <p className="font-mono text-slate-500">{l.aiPhoneNumber || l.phone || 'Unassigned'} · {l.bayCount} bays</p>
                    </div>
                  ))}
                  <p className="text-slate-500 pt-1">Associated Users: {team.map((t) => t.name).join(', ') || 'None'}</p>
                </div>
              ) : (
                <p className="text-slate-500">Tenant workspace managed under {selected.ownerEmail}.</p>
              )}
            </div>
          </div>
        )}
      </Drawer>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Provision New Business">
        <form onSubmit={handleCreate} className="space-y-4">
          <Input label="Business Name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Buckeye Transmission & Auto" />
          <Input label="Owner Name" required value={form.ownerName} onChange={(e) => setForm({ ...form, ownerName: e.target.value })} />
          <Input label="Owner Email" type="email" required value={form.ownerEmail} onChange={(e) => setForm({ ...form, ownerEmail: e.target.value })} />
          <Select
            label="Subscription Plan"
            value={form.plan}
            onChange={(e) => setForm({ ...form, plan: e.target.value as AdminBusiness['plan'] })}
            options={[
              { value: 'Starter', label: 'Starter ($199/mo)' },
              { value: 'Growth', label: 'Growth ($349/mo)' },
              { value: 'Multi-Shop', label: 'Multi-Shop ($699/mo)' },
            ]}
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button type="submit">Create Tenant</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
