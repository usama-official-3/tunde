import React, { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, Copy, Globe, PhoneCall, RefreshCw, ShieldCheck, Terminal } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Button } from '../../components/ui/Button';
import { Input, Select } from '../../components/ui/FormControls';
import { PrototypeBanner } from '../../components/ui/Feedback';
import { StatusBadge } from '../../components/ui/StatusBadge';

interface TwilioStatusResponse {
  configured: boolean;
  connected?: boolean;
  message?: string;
  accountFriendlyName?: string;
  accountStatus?: string;
  configuredCallerId?: string | null;
  numbers: { sid: string; phoneNumber: string; friendlyName: string; voiceUrl: string }[];
}

interface TwilioLiveEvent {
  id: string;
  timestamp: string;
  callSid: string;
  from: string;
  to: string;
  eventType: string;
  summary: string;
}

interface WebhookProbeResult {
  url: string;
  reachable: boolean;
  status: number;
  contentType: string;
  locationHeader: string | null;
  isPreviewAuthBlocked: boolean;
  reason: string;
  checkedAtIso: string;
}

interface TwilioAlertItem {
  sid: string;
  errorCode: string;
  logLevel: string;
  dateCreated: string;
  resourceSid: string;
  summary: string;
  details: Record<string, string>;
  rawText: string;
}

interface TwilioCallItem {
  sid: string;
  from: string;
  to: string;
  direction: string;
  status: string;
  duration: number;
  startTime: string;
  endTime: string;
  price: string | null;
}

interface HttpLogEntry {
  id: string;
  timestamp: string;
  method: string;
  path: string;
  statusCode: number;
  durationMs: number;
  callSid?: string;
  detail?: string;
}

interface TwilioDiagnosticsResponse {
  configured: boolean;
  activeVoiceUrl?: string;
  defaultVoiceUrl?: string;
  sharedAppVoiceUrl?: string | null;
  activeWebhookProbe?: WebhookProbeResult;
  sharedAppWebhookProbe?: WebhookProbeResult | null;
  alerts: TwilioAlertItem[];
  twilioCalls: TwilioCallItem[];
  httpLogs: HttpLogEntry[];
  events: TwilioLiveEvent[];
  error?: string;
}

export function PhoneConfigPage() {
  const { locations, selectedLocationId, team, syncTwilioCalls, addToast } = useApp();
  const loc = locations.find((l) => l.id === selectedLocationId) || locations[0];

  const [lineType, setLineType] = useState<'landline' | 'mobile' | 'voip' | 'dedicated'>('voip');
  const [existingNumber, setExistingNumber] = useState(loc?.phone || '');
  const [forwardingRule, setForwardingRule] = useState<'busy' | 'no_answer' | 'after_hours'>('no_answer');
  const [testToNumber, setTestToNumber] = useState('');
  const [callMode, setCallMode] = useState<'interactive' | 'announcement'>('interactive');
  const [testingCall, setTestingCall] = useState(false);

  const [twilioStatus, setTwilioStatus] = useState<TwilioStatusResponse | null>(null);
  const [diagnostics, setDiagnostics] = useState<TwilioDiagnosticsResponse | null>(null);
  const [checkingTwilio, setCheckingTwilio] = useState(false);
  const [configuringSid, setConfiguringSid] = useState<string | null>(null);
  const [customWebhookUrl, setCustomWebhookUrl] = useState('');
  const [enabledGeoCountries, setEnabledGeoCountries] = useState<string[]>([]);
  const [updatingGeoIso, setUpdatingGeoIso] = useState<string | null>(null);
  const [liveEvents, setLiveEvents] = useState<TwilioLiveEvent[]>([]);
  const [logTab, setLogTab] = useState<'alerts' | 'calls' | 'events'>('alerts');

  const webhookUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/api/twilio/voice`;

  const checkTwilio = async () => {
    setCheckingTwilio(true);
    try {
      const [statusRes, eventsRes, geoRes, diagRes] = await Promise.all([
        fetch('/api/twilio/status'),
        fetch('/api/twilio/live-events'),
        fetch('/api/twilio/geo-permissions'),
        fetch('/api/twilio/diagnostics'),
      ]);
      const statusData = (await statusRes.json()) as TwilioStatusResponse;
      const eventsData = (await eventsRes.json()) as { events: TwilioLiveEvent[] };
      setTwilioStatus(statusData);
      setLiveEvents(eventsData.events || []);
      if (geoRes.ok) {
        const geoData = (await geoRes.json()) as { enabledIsoCodes?: string[] };
        setEnabledGeoCountries(geoData.enabledIsoCodes || []);
      }
      if (diagRes.ok) {
        const diagData = (await diagRes.json()) as TwilioDiagnosticsResponse;
        setDiagnostics(diagData);
      }
      await syncTwilioCalls();
    } catch {
      addToast({ title: 'Unable to reach Twilio backend endpoints', variant: 'error' });
    } finally {
      setCheckingTwilio(false);
    }
  };

  useEffect(() => {
    void checkTwilio();
  }, []);

  const handleRealTestCall = async (e: React.FormEvent) => {
    e.preventDefault();
    setTestingCall(true);
    try {
      const res = await fetch('/api/twilio/test-call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toNumber: testToNumber.trim(), mode: callMode }),
      });
      const data = await res.json();
      if (!res.ok) {
        addToast({ title: 'Twilio Test Call Not Sent', description: data.error, variant: 'warning' });
      } else {
        addToast({
          title: 'Live Recorded Twilio Call Initiated',
          description: data.usedInlineFallback
            ? `Call SID: ${data.callSid} — Using inline TwiML greeting & recording because Dev Preview URL requires browser login.`
            : `Call SID: ${data.callSid} — Interactive AI & recording active.`,
          variant: 'success',
        });
        await checkTwilio();
      }
    } catch {
      addToast({ title: 'Error calling /api/twilio/test-call', variant: 'error' });
    } finally {
      setTestingCall(false);
    }
  };

  const copyWebhook = () => {
    navigator.clipboard?.writeText(webhookUrl);
    addToast({ title: 'Twilio Voice Webhook URL copied', variant: 'success' });
  };

  const handleConfigureWebhook = async (phoneSid: string, overrideUrl?: string) => {
    setConfiguringSid(phoneSid);
    try {
      const res = await fetch('/api/twilio/configure-webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneSid, customVoiceUrl: overrideUrl?.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        addToast({ title: 'Unable to Update Twilio Webhook', description: data.error, variant: 'error' });
      } else {
        const probeOk = data.probe?.reachable;
        addToast({
          title: probeOk ? 'Twilio Webhook Active & Verified (HTTP 200)' : 'Webhook Saved (Reachability Warning)',
          description: probeOk
            ? `${data.phoneNumber} now routes live calls to ${data.voiceUrl}`
            : data.probe?.reason || `Saved ${data.voiceUrl}`,
          variant: probeOk ? 'success' : 'warning',
        });
        await checkTwilio();
      }
    } catch {
      addToast({ title: 'Network error updating Twilio webhook', variant: 'error' });
    } finally {
      setConfiguringSid(null);
    }
  };

  const handleToggleGeoCountry = async (isoCode: string, enable: boolean) => {
    setUpdatingGeoIso(isoCode);
    try {
      const res = await fetch('/api/twilio/geo-permissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates: [{ isoCode, enabled: enable }] }),
      });
      const data = await res.json();
      if (!res.ok) {
        addToast({ title: 'Could not update Twilio Geo-Permissions', description: data.error, variant: 'warning' });
      } else {
        addToast({
          title: `Twilio Outbound Calling ${enable ? 'Enabled' : 'Disabled'} (${isoCode})`,
          variant: 'success',
        });
        await checkTwilio();
      }
    } catch {
      addToast({ title: 'Network error updating Twilio Geo-Permissions', variant: 'error' });
    } finally {
      setUpdatingGeoIso(null);
    }
  };

  const displayTarget = twilioStatus?.configuredCallerId || twilioStatus?.numbers?.[0]?.phoneNumber || loc?.aiPhoneNumber || 'Not configured';
  const activeProbe = diagnostics?.activeWebhookProbe;
  const sharedProbe = diagnostics?.sharedAppWebhookProbe;
  const primaryPhoneSid = twilioStatus?.numbers?.[0]?.sid;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-[#101827] dark:text-white">Phone & Twilio Configuration</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Connect your Twilio account, inspect live Twilio Debugger &amp; call logs, and verify webhook reachability for {loc?.name || 'your shop'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {activeProbe && (
            <StatusBadge
              label={activeProbe.reachable ? 'Webhook Publicly Reachable (200 XML)' : `Webhook Blocked (HTTP ${activeProbe.status})`}
              tone={activeProbe.reachable ? 'success' : 'error'}
            />
          )}
          <StatusBadge
            label={twilioStatus?.connected ? `Twilio Connected (${twilioStatus.accountFriendlyName})` : 'Twilio Secrets Not Connected'}
            tone={twilioStatus?.connected ? 'success' : 'warning'}
          />
        </div>
      </div>

      {/* Live Root-Cause Diagnosis Banner */}
      {activeProbe && !activeProbe.reachable && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 space-y-2 text-xs">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-5 h-5 text-[#DC4C4C] shrink-0 mt-0.5" />
            <div className="space-y-1.5 flex-1">
              <p className="font-display text-sm font-bold text-[#DC4C4C]">
                Inbound Call Problem Detected: Why Calling {displayTarget} Plays &ldquo;An application error has occurred&rdquo;
              </p>
              <p className="text-slate-700 dark:text-slate-200 leading-relaxed">
                {activeProbe.reason}
              </p>
              <div className="p-2.5 rounded-lg bg-white/80 dark:bg-[#101827] border border-red-200/70 dark:border-red-900/60 font-mono text-[11px] space-y-1">
                <p><strong>Tested URL:</strong> {activeProbe.url}</p>
                <p><strong>HTTP Status:</strong> {activeProbe.status || 'Network Error'} · <strong>Content-Type:</strong> {activeProbe.contentType || 'none'}</p>
                {activeProbe.locationHeader && <p><strong>Redirect Location:</strong> {activeProbe.locationHeader}</p>}
              </div>
              <div className="pt-1 text-slate-700 dark:text-slate-300 space-y-1">
                <p className="font-semibold">How to fix inbound calls on {displayTarget}:</p>
                <ol className="list-decimal list-inside space-y-0.5">
                  <li>
                    <strong>Publish / Share this app</strong> (or deploy to a public HTTPS endpoint without login proxy) so Twilio can POST to <span className="font-mono">/api/twilio/voice</span> without hitting <span className="font-mono">/__cookie_check.html</span>.
                  </li>
                  <li>
                    Paste the public <span className="font-mono">https://.../api/twilio/voice</span> URL into <strong>Public Webhook URL Override</strong> on the right and click <strong>Apply &amp; Probe</strong>.
                  </li>
                  <li>
                    Meanwhile, <strong>Outbound Recorded Test Calls</strong> below already bypass this preview proxy automatically using inline TwiML so you can verify real audio &amp; recordings immediately.
                  </li>
                </ol>
              </div>
              {sharedProbe?.reachable && primaryPhoneSid && diagnostics?.sharedAppVoiceUrl && (
                <div className="pt-1">
                  <Button
                    type="button"
                    size="sm"
                    loading={configuringSid === primaryPhoneSid}
                    onClick={() => handleConfigureWebhook(primaryPhoneSid, diagnostics.sharedAppVoiceUrl || undefined)}
                  >
                    Switch Webhook to Public Shared URL ({diagnostics.sharedAppVoiceUrl})
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <PrototypeBanner contextLabel="Security Architecture — Add TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER in AI Studio Settings > Secrets. All inbound & outbound calls record cleanly and sync to Firestore." />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 space-y-5">
          {/* 1. Shop Phone Setup */}
          <div className="p-5 rounded-xl bg-white dark:bg-[#172337] border border-slate-200 dark:border-slate-800 space-y-4">
            <h2 className="font-display text-base font-bold text-[#101827] dark:text-white">1. Choose Your Shop Phone Line Type</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {[
                { id: 'landline', title: 'Business Landline', desc: 'AT&T, Spectrum, Comcast, or copper POTS line' },
                { id: 'mobile', title: 'Business Mobile', desc: 'iPhone or Android shop line' },
                { id: 'voip', title: 'VoIP System', desc: 'RingCentral, Nextiva, Grasshopper, 8x8, Weave' },
                { id: 'dedicated', title: 'Dedicated Tunde AI Number', desc: 'Use a Twilio number exclusively for AI intake' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setLineType(opt.id as typeof lineType)}
                  className={`p-3 rounded-lg border text-left cursor-pointer ${
                    lineType === opt.id
                      ? 'border-[#3978F6] bg-blue-50/70 dark:bg-blue-950/30'
                      : 'border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <p className="text-xs font-semibold text-[#101827] dark:text-white">{opt.title}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">{opt.desc}</p>
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <Input label="Existing Published Shop Phone" value={existingNumber} onChange={(e) => setExistingNumber(e.target.value)} placeholder="(614) 555-0142" />
              <div>
                <label className="block text-sm font-medium text-[#101827] dark:text-slate-200 mb-1.5">
                  Twilio Target Number
                </label>
                <div className="min-h-[42px] px-3.5 py-2 rounded-lg bg-[#F5F7FB] dark:bg-[#101827] border border-slate-200 dark:border-slate-700 font-mono text-sm flex items-center justify-between">
                  <span className="truncate">{displayTarget}</span>
                  <span className="text-[11px] text-slate-500 ml-2 shrink-0">{twilioStatus?.connected ? 'Live Twilio' : 'Pending'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* 2. Conditional Forwarding Instructions */}
          <div className="p-5 rounded-xl bg-white dark:bg-[#172337] border border-slate-200 dark:border-slate-800 space-y-4">
            <h2 className="font-display text-base font-bold text-[#101827] dark:text-white">
              2. Conditional Call Forwarding Instructions
            </h2>
            <Select
              label="Forwarding Mode"
              value={forwardingRule}
              onChange={(e) => setForwardingRule(e.target.value as typeof forwardingRule)}
              options={[
                { value: 'no_answer', label: 'No-Answer Forwarding (After 3–4 Rings)' },
                { value: 'busy', label: 'Busy Forwarding (When All Lines Busy)' },
                { value: 'after_hours', label: 'After-Hours Schedule Routing' },
              ]}
            />
            <div className="p-4 rounded-lg bg-[#F5F7FB] dark:bg-[#101827] border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
              <p className="font-semibold text-[#101827] dark:text-white">
                Setup Steps ({lineType.toUpperCase()} · {forwardingRule.replace('_', ' ')}):
              </p>
              {lineType === 'voip' ? (
                <ol className="list-decimal list-inside space-y-1 text-slate-600 dark:text-slate-300">
                  <li>Open your VoIP portal under Call Handling / Ring Groups.</li>
                  <li>Set <strong>If Unanswered after 15 seconds</strong> or <strong>When Busy</strong> to forward to your Twilio number.</li>
                  <li>In Twilio Console, point your number’s Voice Webhook to a publicly reachable URL shown on the right.</li>
                </ol>
              ) : (
                <ol className="list-decimal list-inside space-y-1 text-slate-600 dark:text-slate-300">
                  <li>Dial <span className="font-mono font-semibold">{forwardingRule === 'busy' ? '*67*' : '*61*'}{displayTarget.replace(/\D/g, '') || 'TWILIONUMBER'}#</span> from your shop handset.</li>
                  <li>Listen for the carrier confirmation tone, then hang up.</li>
                  <li>Disable anytime with <span className="font-mono font-semibold">#61#</span> or <span className="font-mono font-semibold">#67#</span>.</li>
                </ol>
              )}
            </div>
          </div>

          {/* 3. Real Twilio Debugger Alerts, Call Logs & App HTTP Logs */}
          <div className="p-5 rounded-xl bg-white dark:bg-[#172337] border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-[#3978F6]" />
                <h2 className="font-display text-base font-bold text-[#101827] dark:text-white">
                  Live Twilio Debugger &amp; Application Logs
                </h2>
              </div>
              <Button size="sm" variant="ghost" loading={checkingTwilio} iconLeft={<RefreshCw className="w-3.5 h-3.5" />} onClick={checkTwilio}>
                Refresh &amp; Sync Logs
              </Button>
            </div>

            <div className="flex flex-wrap gap-2 border-b border-slate-200 dark:border-slate-800 pb-2.5">
              <Button
                type="button"
                size="sm"
                variant={logTab === 'alerts' ? 'primary' : 'outline'}
                onClick={() => setLogTab('alerts')}
              >
                Twilio Error Alerts ({diagnostics?.alerts?.length ?? 0})
              </Button>
              <Button
                type="button"
                size="sm"
                variant={logTab === 'calls' ? 'primary' : 'outline'}
                onClick={() => setLogTab('calls')}
              >
                Twilio Call Logs ({diagnostics?.twilioCalls?.length ?? 0})
              </Button>
              <Button
                type="button"
                size="sm"
                variant={logTab === 'events' ? 'primary' : 'outline'}
                onClick={() => setLogTab('events')}
              >
                App Events &amp; HTTP Trace ({liveEvents.length + (diagnostics?.httpLogs?.length ?? 0)})
              </Button>
            </div>

            {logTab === 'alerts' && (
              <div className="space-y-2 text-xs max-h-96 overflow-y-auto">
                {!diagnostics?.alerts || diagnostics.alerts.length === 0 ? (
                  <p className="text-slate-500 py-2">
                    No Twilio Monitor error alerts returned for this account yet.
                  </p>
                ) : (
                  diagnostics.alerts.map((a) => (
                    <div
                      key={a.sid}
                      className="p-3 rounded-lg bg-red-50/70 dark:bg-red-950/20 border border-red-200 dark:border-red-900/70 space-y-1"
                    >
                      <div className="flex items-center justify-between gap-2 font-semibold">
                        <span className="text-[#DC4C4C]">
                          Twilio Error {a.errorCode} ({a.logLevel})
                        </span>
                        <span className="font-mono text-[11px] text-slate-500">{a.dateCreated}</span>
                      </div>
                      <p className="text-[#101827] dark:text-slate-200 break-words">{a.summary}</p>
                      <p className="font-mono text-[10px] text-slate-500 break-all">
                        Resource: {a.resourceSid} · Alert: {a.sid}
                      </p>
                      {a.details?.ErrorCode && (
                        <p className="font-mono text-[10px] text-slate-600 dark:text-slate-400 break-all">
                          {Object.entries(a.details)
                            .map(([k, v]) => `${k}=${v}`)
                            .join(' | ')}
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}

            {logTab === 'calls' && (
              <div className="space-y-2 text-xs max-h-96 overflow-y-auto">
                {!diagnostics?.twilioCalls || diagnostics.twilioCalls.length === 0 ? (
                  <p className="text-slate-500 py-2">No calls found on your Twilio account yet.</p>
                ) : (
                  diagnostics.twilioCalls.map((c) => (
                    <div key={c.sid} className="p-3 rounded-lg bg-[#F5F7FB] dark:bg-[#101827] border border-slate-200 dark:border-slate-800 space-y-1">
                      <div className="flex items-center justify-between gap-2 font-semibold">
                        <span className="font-mono">{c.from} → {c.to}</span>
                        <StatusBadge
                          label={`${c.status} · ${c.duration}s`}
                          tone={c.status === 'completed' ? 'success' : c.status === 'failed' ? 'error' : 'info'}
                        />
                      </div>
                      <p className="font-mono text-[10px] text-slate-500">
                        {c.direction} · {c.sid} · Started {c.startTime || 'pending'}
                      </p>
                    </div>
                  ))
                )}
              </div>
            )}

            {logTab === 'events' && (
              <div className="space-y-3 text-xs max-h-96 overflow-y-auto">
                {diagnostics?.httpLogs && diagnostics.httpLogs.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="font-semibold text-slate-600 dark:text-slate-300">Server HTTP Requests (/api/twilio/*)</p>
                    {diagnostics.httpLogs.map((h) => (
                      <div key={h.id} className="p-2 rounded bg-[#F5F7FB] dark:bg-[#101827] border border-slate-200 dark:border-slate-800 font-mono text-[11px] flex items-center justify-between gap-2">
                        <span className="truncate">
                          <span className={h.statusCode >= 400 ? 'text-[#DC4C4C] font-bold' : 'text-[#16A36A] font-bold'}>
                            {h.statusCode}
                          </span>{' '}
                          {h.method} {h.path} {h.detail ? `(${h.detail})` : ''}
                        </span>
                        <span className="text-slate-500 shrink-0">{h.durationMs}ms · {h.timestamp.slice(11, 19)}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="space-y-1.5">
                  <p className="font-semibold text-slate-600 dark:text-slate-300">Webhook &amp; Recording Events</p>
                  {liveEvents.length === 0 ? (
                    <p className="text-slate-500">No app webhook events recorded yet.</p>
                  ) : (
                    liveEvents.map((ev) => (
                      <div key={ev.id} className="p-3 rounded-lg bg-[#F5F7FB] dark:bg-[#101827] border border-slate-200 dark:border-slate-800">
                        <div className="flex justify-between font-semibold">
                          <span className="text-[#3978F6]">{ev.eventType}</span>
                          <span className="font-mono text-slate-500">{ev.timestamp.slice(11, 19)}</span>
                        </div>
                        <p className="font-mono text-[11px] text-slate-500 mt-0.5">{ev.from} → {ev.to} ({ev.callSid})</p>
                        <p className="mt-1">{ev.summary}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Twilio Account & Webhook Integration */}
        <div className="lg:col-span-5 space-y-5">
          <div className="p-5 rounded-xl bg-white dark:bg-[#172337] border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-base font-bold text-[#101827] dark:text-white">3. Connect Your Twilio Account</h2>
              <Button size="sm" variant="ghost" loading={checkingTwilio} onClick={checkTwilio}>Verify</Button>
            </div>

            <div className="space-y-2 text-xs">
              <p className="text-slate-600 dark:text-slate-300">
                Current app webhook path (<span className="font-mono">POST</span>):
              </p>
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-[#F5F7FB] dark:bg-[#101827] border border-slate-200 dark:border-slate-700 font-mono text-[11px]">
                <span className="truncate flex-1">{webhookUrl}</span>
                <button type="button" onClick={copyWebhook} aria-label="Copy webhook URL" className="p-1 text-[#3978F6] hover:bg-slate-200 dark:hover:bg-slate-800 rounded cursor-pointer">
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {twilioStatus?.connected ? (
              <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-xs space-y-2">
                <div className="flex items-center gap-1.5 font-semibold text-[#16A36A]">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Connected: {twilioStatus.accountFriendlyName} ({twilioStatus.accountStatus})</span>
                </div>
                {twilioStatus.numbers.length > 0 && (
                  <div className="space-y-2 pt-1">
                    <p className="font-medium">Numbers on your Twilio account:</p>
                    {twilioStatus.numbers.map((n) => {
                      const matchesApp = n.voiceUrl === webhookUrl;
                      const probeIsHealthy = activeProbe?.url === n.voiceUrl ? activeProbe.reachable : matchesApp;
                      return (
                        <div key={n.sid} className="p-2.5 rounded-lg bg-white/80 dark:bg-[#101827] border border-emerald-200/80 dark:border-emerald-900 space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-mono text-[11px] font-semibold">{n.phoneNumber} ({n.friendlyName})</span>
                            <StatusBadge
                              label={probeIsHealthy ? 'Reachable 200 OK' : matchesApp ? 'Auth-Blocked Preview' : 'Webhook Mismatch'}
                              tone={probeIsHealthy ? 'success' : 'error'}
                            />
                          </div>
                          <p className="font-mono text-[10px] text-slate-500 break-all">
                            Current VoiceUrl: {n.voiceUrl || '(none)'}
                          </p>
                          {!matchesApp && (
                            <Button
                              type="button"
                              size="sm"
                              variant="secondary"
                              loading={configuringSid === n.sid}
                              onClick={() => handleConfigureWebhook(n.sid)}
                            >
                              Set Webhook to This App
                            </Button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {primaryPhoneSid && (
                  <div className="pt-2 border-t border-emerald-200/70 dark:border-emerald-900/60 space-y-2">
                    <Input
                      label="Public Webhook URL Override (after Deploy / Tunnel)"
                      value={customWebhookUrl}
                      onChange={(e) => setCustomWebhookUrl(e.target.value)}
                      placeholder="https://your-public-app.run.app/api/twilio/voice"
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      iconLeft={<Globe className="w-3.5 h-3.5" />}
                      loading={configuringSid === primaryPhoneSid}
                      disabled={!customWebhookUrl.trim().startsWith('https://')}
                      onClick={() => handleConfigureWebhook(primaryPhoneSid, customWebhookUrl)}
                    >
                      Apply &amp; Probe Custom Webhook URL
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 text-xs space-y-1">
                <p className="font-semibold text-amber-900 dark:text-amber-200">Twilio Secrets Setup Required for Live Calls</p>
                <p className="text-slate-600 dark:text-slate-300">
                  {twilioStatus?.message || 'Add TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER in AI Studio Settings > Secrets.'}
                </p>
              </div>
            )}

            <form onSubmit={handleRealTestCall} className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
              <Select
                label="Outbound Test Call Mode"
                value={callMode}
                onChange={(e) => setCallMode(e.target.value as 'interactive' | 'announcement')}
                options={[
                  { value: 'interactive', label: 'Interactive AI Receptionist + Call Recording' },
                  { value: 'announcement', label: 'Greeting Verification + Voicemail Recording' },
                ]}
              />
              <Input
                label="Your Mobile / Destination Phone (E.164)"
                value={testToNumber}
                onChange={(e) => setTestToNumber(e.target.value)}
                placeholder="+16145550142 (enter your personal phone, not +15075127758)"
              />
              {testToNumber.trim() === displayTarget && testToNumber.trim() !== '' && (
                <p className="text-[11px] text-[#DC4C4C]">
                  Enter your own mobile/shop phone number rather than the Twilio number itself ({displayTarget}).
                </p>
              )}
              <Button type="submit" className="w-full" loading={testingCall} iconLeft={<PhoneCall className="w-4 h-4" />}>
                Place Recorded Twilio Test Call
              </Button>
            </form>

            {twilioStatus?.connected && (
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[#101827] dark:text-white">Twilio Outbound Country Permissions</span>
                  <span className="text-[11px] text-slate-500 font-mono">{enabledGeoCountries.length} active</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Enable the country of the phone number you want to dial for outbound test calls &amp; live transfers:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { iso: 'US', label: 'United States (+1)' },
                    { iso: 'GB', label: 'United Kingdom (+44)' },
                    { iso: 'CA', label: 'Canada (+1)' },
                    { iso: 'PK', label: 'Pakistan (+92)' },
                    { iso: 'IN', label: 'India (+91)' },
                    { iso: 'AU', label: 'Australia (+61)' },
                  ].map((c) => {
                    const active = enabledGeoCountries.includes(c.iso);
                    return (
                      <Button
                        key={c.iso}
                        type="button"
                        size="sm"
                        variant={active ? 'secondary' : 'outline'}
                        loading={updatingGeoIso === c.iso}
                        onClick={() => handleToggleGeoCountry(c.iso, !active)}
                      >
                        {active ? `✓ ${c.label}` : `+ Enable ${c.label}`}
                      </Button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="p-5 rounded-xl bg-white dark:bg-[#172337] border border-slate-200 dark:border-slate-800 space-y-3">
            <h2 className="font-display text-base font-bold text-[#101827] dark:text-white">Call Transfer Destinations</h2>
            {team.filter((m) => m.isTransferDestination).length === 0 ? (
              <p className="text-xs text-slate-500">No transfer staff marked yet. Configure transfer destinations in Team Members.</p>
            ) : (
              <div className="space-y-2">
                {team.filter((m) => m.isTransferDestination).map((m) => (
                  <div key={m.id} className="p-2.5 rounded-lg bg-[#F5F7FB] dark:bg-[#101827] flex items-center justify-between text-xs">
                    <div>
                      <p className="font-semibold">{m.name}</p>
                      <p className="text-slate-500">{m.role} · Ext {m.extension}</p>
                    </div>
                    <span className="font-mono tabular-nums">{m.phone || 'No phone set'}</span>
                  </div>
                ))}
              </div>
            )}
            <div className="flex items-start gap-2 text-[11px] text-slate-500 pt-2">
              <ShieldCheck className="w-4 h-4 text-[#3978F6] shrink-0" />
              <span>Recordings use dual-channel Twilio capture and stream securely via /api/twilio/recording/:sid.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

