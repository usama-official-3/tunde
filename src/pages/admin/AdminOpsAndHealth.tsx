import React, { useEffect, useState } from 'react';
import { Activity, AlertOctagon, Phone, RefreshCw, ShieldCheck } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Button } from '../../components/ui/Button';
import { Input, SearchField } from '../../components/ui/FormControls';
import { StatusBadge } from '../../components/ui/StatusBadge';

export function AdminPhoneCallsPage() {
  const { locations, calls } = useApp();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-[#101827] dark:text-white">Phone Numbers & Call Monitoring</h1>
        <p className="text-xs text-slate-500 mt-1">Provisioned telephone numbers, carrier configuration state, and call/transfer error monitoring</p>
      </div>

      <div className="rounded-xl bg-white dark:bg-[#172337] border border-slate-200 dark:border-slate-800 overflow-x-auto">
        <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
          <Phone className="w-4 h-4 text-[#3978F6]" />
          <h2 className="font-display text-sm font-bold">Telephone Number Directory</h2>
        </div>
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500">
              <th className="py-3 px-4">AI Number</th>
              <th className="py-3 px-4">Assigned Business / Location</th>
              <th className="py-3 px-4">Provider Status</th>
              <th className="py-3 px-4">Config Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {locations.map((l) => (
              <tr key={l.id}>
                <td className="py-3 px-4 font-mono font-semibold">{l.aiPhoneNumber || l.phone || 'Not Assigned'}</td>
                <td className="py-3 px-4">{l.name}</td>
                <td className="py-3 px-4"><StatusBadge label={l.aiPhoneNumber ? 'Twilio Ready' : 'Configure in Phone Settings'} tone={l.aiPhoneNumber ? 'info' : 'warning'} /></td>
                <td className="py-3 px-4"><StatusBadge label={l.isActive ? 'Forwarding Active' : 'Paused'} tone={l.isActive ? 'success' : 'neutral'} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="rounded-xl bg-white dark:bg-[#172337] border border-slate-200 dark:border-slate-800 overflow-x-auto">
        <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800">
          <h2 className="font-display text-sm font-bold">Platform Call & Transfer Monitoring</h2>
        </div>
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500">
              <th className="py-3 px-4">Call ID</th>
              <th className="py-3 px-4">Caller</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Outcome / Error</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {calls.map((c) => (
              <tr key={c.id}>
                <td className="py-3 px-4 font-mono">{c.id}</td>
                <td className="py-3 px-4">{c.callerName} ({c.phoneNumber})</td>
                <td className="py-3 px-4"><StatusBadge label={c.status} tone={c.status === 'Missed' ? 'warning' : 'success'} /></td>
                <td className="py-3 px-4">{c.outcome} · {c.serviceRequest}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

interface LiveHealthResponse {
  server: string;
  uptimeSeconds: number;
  timestamp: string;
  geminiConfigured: boolean;
  twilioConfigured: boolean;
  twilioPhoneConfigured: boolean;
  databaseMode: string;
  storedCallsCount?: number;
  recordedCallsCount?: number;
}

interface LiveEventEntry {
  id: string;
  timestamp: string;
  eventType: string;
  callSid?: string;
  from?: string;
  summary: string;
}

export function AdminSystemHealthPage() {
  const { firestoreReady, firestoreError } = useApp();
  const [health, setHealth] = useState<LiveHealthResponse | null>(null);
  const [events, setEvents] = useState<LiveEventEntry[]>([]);
  const [probeError, setProbeError] = useState('');
  const [probing, setProbing] = useState(false);

  const runHealthProbe = async () => {
    setProbing(true);
    setProbeError('');
    try {
      const [hRes, evRes] = await Promise.all([fetch('/api/health'), fetch('/api/twilio/live-events')]);
      const data = (await hRes.json()) as LiveHealthResponse;
      if (!hRes.ok) throw new Error('Health endpoint returned non-200');
      setHealth(data);
      if (evRes.ok) {
        const evData = (await evRes.json()) as { events: LiveEventEntry[] };
        setEvents(evData.events || []);
      }
    } catch (err: unknown) {
      setProbeError(err instanceof Error ? err.message : 'Unable to reach /api/health');
    } finally {
      setProbing(false);
    }
  };

  useEffect(() => {
    void runHealthProbe();
  }, []);

  const subsystems = [
    {
      name: 'Core Express / Webhook API',
      state: health ? `Online (Uptime ${health.uptimeSeconds}s)` : probeError ? 'Unreachable' : 'Checking...',
      tone: (health ? 'success' : probeError ? 'error' : 'info') as 'success' | 'error' | 'info',
      badge: health ? 'Live Probe OK' : probeError ? 'Probe Failed' : 'Probing',
      note: health ? `Last probed ${health.timestamp}` : probeError || 'Fetching /api/health...',
    },
    {
      name: 'AI Inference Provider (Gemini)',
      state: health?.geminiConfigured ? 'GEMINI_API_KEY Configured (Server)' : 'GEMINI_API_KEY Missing',
      tone: (health?.geminiConfigured ? 'success' : 'warning') as 'success' | 'warning',
      badge: health?.geminiConfigured ? 'Connected' : 'Secret Required',
      note: 'Server-side /api/ai/receptionist-turn and live Twilio voice gather proxy.',
    },
    {
      name: 'Voice Telephony & Call Recording (Twilio)',
      state: health?.twilioConfigured
        ? health.twilioPhoneConfigured
          ? `Credentials & Caller ID Present (${health.recordedCallsCount ?? 0} recorded calls)`
          : 'Credentials Present (Add TWILIO_PHONE_NUMBER)'
        : 'TWILIO_ACCOUNT_SID / AUTH_TOKEN Not Set in Secrets',
      tone: (health?.twilioConfigured ? 'success' : 'warning') as 'success' | 'warning',
      badge: health?.twilioConfigured ? 'Secrets Loaded' : 'Awaiting Secrets',
      note: 'Webhooks: /api/twilio/voice, /api/twilio/gather, /api/twilio/recording-status.',
    },
    {
      name: 'Primary Database (Cloud Firestore)',
      state: firestoreReady
        ? `Cloud Firestore Connected + Runtime (${health?.storedCallsCount ?? 0} server calls)`
        : firestoreError || 'Connecting to Cloud Firestore...',
      tone: (firestoreReady ? 'success' : 'warning') as 'success' | 'warning',
      badge: firestoreReady ? 'Firestore Live' : 'Pending',
      note: 'Multi-tenant isolation enforced via Firestore security rules (businesses/{businessId}).',
    },
    {
      name: 'Calendar Sync Workers',
      state: 'Internal Bay Calendar Live · External OAuth Optional',
      tone: 'info' as const,
      badge: 'Internal Live',
      note: 'Internal bay scheduler prevents double-bookings; Google/Outlook OAuth ready when configured.',
    },
    {
      name: 'Email & SMS Delivery',
      state: health?.twilioConfigured ? 'Twilio SMS Callback Channel Available' : 'Awaiting Twilio Secrets',
      tone: (health?.twilioConfigured ? 'success' : 'warning') as 'success' | 'warning',
      badge: health?.twilioConfigured ? 'Twilio SMS Ready' : 'Secret Pending',
      note: 'Configure TWILIO_PHONE_NUMBER for live SMS & voice callbacks.',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-[#101827] dark:text-white">System Health & Live Webhook Telemetry</h1>
          <p className="text-xs text-slate-500 mt-1">
            Real backend telemetry from /api/health, Cloud Firestore, and live Twilio webhook event log
          </p>
        </div>
        <Button size="sm" variant="outline" loading={probing} iconLeft={<RefreshCw className="w-3.5 h-3.5" />} onClick={runHealthProbe}>
          Refresh Live Probe
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {subsystems.map((s) => (
          <div key={s.name} className="p-5 rounded-xl bg-white dark:bg-[#172337] border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <Activity className="w-4 h-4 text-[#3978F6]" />
              <StatusBadge label={s.badge} tone={s.tone} />
            </div>
            <h2 className="font-display text-sm font-bold text-[#101827] dark:text-white">{s.name}</h2>
            <p className="text-xs font-medium text-slate-700 dark:text-slate-200">{s.state}</p>
            <p className="text-xs text-slate-500">{s.note}</p>
          </div>
        ))}
      </div>

      <div className="p-5 rounded-xl bg-white dark:bg-[#172337] border border-slate-200 dark:border-slate-800 space-y-3">
        <div className="flex items-center gap-2">
          <AlertOctagon className="w-4 h-4 text-[#3978F6]" />
          <h2 className="font-display text-base font-bold">Recent Server Webhook & Telephony Events</h2>
        </div>
        {events.length === 0 ? (
          <p className="text-xs text-slate-500">No server telephony webhook events logged yet.</p>
        ) : (
          <div className="space-y-2">
            {events.slice(0, 12).map((ev) => (
              <div key={ev.id} className="p-3 rounded-lg bg-[#F5F7FB] dark:bg-[#101827] text-xs space-y-0.5">
                <p className="font-mono text-slate-500">{(ev.eventType || 'EVENT').toUpperCase()} · {ev.timestamp} {ev.callSid ? `· ${ev.callSid}` : ''}</p>
                <p className="text-[#101827] dark:text-slate-200">{ev.summary}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function AdminAuditLogsPage() {
  const { auditLogs } = useApp();
  const [query, setQuery] = useState('');

  const filtered = auditLogs.filter((l) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      l.actor.toLowerCase().includes(q) ||
      l.action.toLowerCase().includes(q) ||
      l.businessName.toLowerCase().includes(q) ||
      l.resource.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-[#101827] dark:text-white">Audit Logs</h1>
          <p className="text-xs text-slate-500 mt-1">
            Immutable trail for prompt releases, account suspensions, and sensitive recording/transcript access
          </p>
        </div>
        <SearchField value={query} onChange={setQuery} placeholder="Search actor, action, business..." className="w-full sm:w-72" />
      </div>

      <div className="rounded-xl bg-white dark:bg-[#172337] border border-slate-200 dark:border-slate-800 overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 bg-slate-50 dark:bg-[#101827]/60">
              <th className="py-3 px-4">Timestamp</th>
              <th className="py-3 px-4">Administrator / Actor</th>
              <th className="py-3 px-4">Action & Resource</th>
              <th className="py-3 px-4">Business</th>
              <th className="py-3 px-4">Access Reason & Changes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {filtered.map((entry) => (
              <tr key={entry.id}>
                <td className="py-3 px-4 font-mono tabular-nums whitespace-nowrap">{entry.timestamp}</td>
                <td className="py-3 px-4">
                  <p className="font-semibold">{entry.actor}</p>
                  <p className="text-slate-500">{entry.actorRole}</p>
                </td>
                <td className="py-3 px-4">
                  <p className="font-semibold text-[#3978F6]">{entry.action}</p>
                  <p className="text-slate-500">{entry.resource}</p>
                </td>
                <td className="py-3 px-4">{entry.businessName}</td>
                <td className="py-3 px-4">
                  <p>{entry.accessReason}</p>
                  <p className="text-slate-500">{entry.changesSummary}</p>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function AdminUtilityPage({ title, description }: { title: string; description: string }) {
  const { adminBusinesses, locations, team, appointments, callbacks, recordAuditEvent, authUser, addToast } = useApp();
  const [note, setNote] = useState('');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-[#101827] dark:text-white">{title}</h1>
          <p className="text-xs text-slate-500 mt-1">{description}</p>
        </div>
        <StatusBadge label="Super Admin View" tone="info" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white dark:bg-[#172337] border border-slate-200 dark:border-slate-800">
          <p className="text-xs text-slate-500">Businesses</p>
          <p className="font-display text-xl font-bold font-mono tabular-nums mt-1">{adminBusinesses.length}</p>
        </div>
        <div className="p-4 rounded-xl bg-white dark:bg-[#172337] border border-slate-200 dark:border-slate-800">
          <p className="text-xs text-slate-500">Active Locations</p>
          <p className="font-display text-xl font-bold font-mono tabular-nums mt-1">{locations.length}</p>
        </div>
        <div className="p-4 rounded-xl bg-white dark:bg-[#172337] border border-slate-200 dark:border-slate-800">
          <p className="text-xs text-slate-500">Staff Users</p>
          <p className="font-display text-xl font-bold font-mono tabular-nums mt-1">{team.length}</p>
        </div>
        <div className="p-4 rounded-xl bg-white dark:bg-[#172337] border border-slate-200 dark:border-slate-800">
          <p className="text-xs text-slate-500">Scheduled / Callbacks</p>
          <p className="font-display text-xl font-bold font-mono tabular-nums mt-1">
            {appointments.length} / {callbacks.length}
          </p>
        </div>
      </div>

      <div className="p-5 rounded-xl bg-white dark:bg-[#172337] border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[#16A36A]" />
          <h2 className="font-display text-base font-bold">{title} Configuration & Controls</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {adminBusinesses.map((b) => (
            <div key={b.id} className="p-3.5 rounded-lg bg-[#F5F7FB] dark:bg-[#101827] border border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <p className="font-semibold text-sm text-[#101827] dark:text-white">{b.name}</p>
                <p className="text-slate-500">{b.plan} · {b.ownerEmail}</p>
              </div>
              <StatusBadge label={b.status} tone={b.status === 'Active' ? 'success' : 'warning'} />
            </div>
          ))}
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!note.trim()) return;
            recordAuditEvent({
              actor: authUser?.email || 'Super Admin',
              actorRole: 'Super Admin',
              action: `Updated ${title} Policy`,
              resource: title,
              businessName: 'Platform Wide',
              accessReason: 'Super Admin governance rule',
              changesSummary: note.trim(),
            });
            addToast({ title: `${title} policy saved to Firestore`, description: note, variant: 'success' });
            setNote('');
          }}
          className="flex flex-col sm:flex-row gap-2 pt-2"
        >
          <Input
            placeholder={`Add platform governance rule for ${title}...`}
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          <Button type="submit">Apply Rule</Button>
        </form>
      </div>
    </div>
  );
}
