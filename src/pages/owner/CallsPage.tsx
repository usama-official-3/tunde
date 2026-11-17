import React, { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowUpDown,
  Lock,
  PhoneIncoming,
  RefreshCw,
  ShieldCheck,
  Trash2,
  Volume2,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Button } from '../../components/ui/Button';
import { SearchField } from '../../components/ui/FormControls';
import { Modal } from '../../components/ui/Overlays';
import { Pagination, Tabs } from '../../components/ui/Navigation';
import { EmptyState, PrototypeBanner, TableSkeleton } from '../../components/ui/Feedback';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { CallRecord } from '../../types/tunde';

type CallFilterId =
  | 'all'
  | 'Answered'
  | 'Missed'
  | 'Transferred'
  | 'Failed'
  | 'booked'
  | 'callback';

export function CallsPage() {
  const { calls, selectedLocationId, syncTwilioCalls } = useApp();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<CallFilterId>('all');
  const [query, setQuery] = useState('');
  const [sortAsc, setSortAsc] = useState(false);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const locationCalls = useMemo(
    () => (selectedLocationId === 'all' ? calls : calls.filter((c) => c.locationId === selectedLocationId)),
    [calls, selectedLocationId]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = locationCalls.filter((c) => {
      if (filter === 'Answered' || filter === 'Missed' || filter === 'Transferred' || filter === 'Failed') {
        if (c.status !== filter) return false;
      } else if (filter === 'booked') {
        if (c.outcome !== 'Booked') return false;
      } else if (filter === 'callback') {
        if (c.outcome !== 'Callback Required' && c.callbackStatus === 'None') return false;
      }
      if (!q) return true;
      return (
        c.callerName.toLowerCase().includes(q) ||
        c.phoneNumber.toLowerCase().includes(q) ||
        c.serviceRequest.toLowerCase().includes(q) ||
        (c.vehicleSummary || '').toLowerCase().includes(q)
      );
    });
    return [...list].sort((a, b) => {
      const cmp = `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`);
      return sortAsc ? cmp : -cmp;
    });
  }, [locationCalls, filter, query, sortAsc]);

  const pageSize = 10;
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  const handleFilterChange = (next: string) => {
    setLoading(true);
    setFilter(next as CallFilterId);
    setPage(1);
    setTimeout(() => setLoading(false), 120);
  };

  const statusTone = (status: CallRecord['status']) => {
    if (status === 'Answered') return 'success';
    if (status === 'Transferred') return 'info';
    if (status === 'Missed') return 'warning';
    return 'error';
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-[#101827] dark:text-white">Calls & Recordings</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real inbound & outbound call logs, AI summaries, transcripts, and audio playback
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            loading={syncing}
            iconLeft={<RefreshCw className="w-4 h-4" />}
            onClick={async () => {
              setSyncing(true);
              await syncTwilioCalls();
              setSyncing(false);
            }}
          >
            Sync Twilio Calls
          </Button>
          <SearchField
            value={query}
            onChange={(v) => {
              setQuery(v);
              setPage(1);
            }}
            placeholder="Search caller, phone, vehicle, service..."
            className="w-full sm:w-72"
          />
        </div>
      </div>

      <Tabs
        activeId={filter}
        onChange={handleFilterChange}
        tabs={[
          { id: 'all', label: 'All Calls', count: locationCalls.length },
          { id: 'Answered', label: 'Answered', count: locationCalls.filter((c) => c.status === 'Answered').length },
          { id: 'Missed', label: 'Missed', count: locationCalls.filter((c) => c.status === 'Missed').length },
          { id: 'Transferred', label: 'Transferred', count: locationCalls.filter((c) => c.status === 'Transferred').length },
          { id: 'Failed', label: 'Failed', count: locationCalls.filter((c) => c.status === 'Failed').length },
          { id: 'booked', label: 'Appointment Booked', count: locationCalls.filter((c) => c.outcome === 'Booked').length },
          { id: 'callback', label: 'Callback Required', count: locationCalls.filter((c) => c.outcome === 'Callback Required').length },
        ]}
      />

      <div className="rounded-xl bg-white dark:bg-[#172337] border border-slate-200 dark:border-slate-800 overflow-hidden">
        {loading ? (
          <TableSkeleton rows={4} />
        ) : paginated.length === 0 ? (
          <div className="p-6">
            <EmptyState
              icon={<PhoneIncoming className="w-8 h-8" />}
              title={calls.length === 0 ? 'No calls recorded yet' : 'No matching calls found'}
              description={
                calls.length === 0
                  ? 'Place a call to your connected Twilio number or run a recorded session in the AI Demo to save real calls and audio recordings here.'
                  : 'Adjust your search term or status filter to inspect other recorded shop calls.'
              }
              actionLabel={calls.length === 0 ? 'Configure Phone & Twilio' : 'Reset Filters'}
              onAction={() => {
                if (calls.length === 0) {
                  navigate('/app/phone-config');
                } else {
                  setFilter('all');
                  setQuery('');
                }
              }}
            />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-[#101827]/60">
                    <th className="py-3 px-4">Caller & Vehicle</th>
                    <th className="py-3 px-4">
                      <button
                        type="button"
                        onClick={() => setSortAsc((s) => !s)}
                        className="inline-flex items-center gap-1 hover:text-[#101827] dark:hover:text-white cursor-pointer"
                      >
                        Date & Time <ArrowUpDown className="w-3 h-3" />
                      </button>
                    </th>
                    <th className="py-3 px-4">Duration</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">AI Agent</th>
                    <th className="py-3 px-4">Outcome</th>
                    <th className="py-3 px-4">Callback</th>
                    <th className="py-3 px-4 text-right">Recording</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                  {paginated.map((call) => (
                    <tr
                      key={call.id}
                      onClick={() => navigate(`/app/calls/${call.id}`)}
                      className="hover:bg-slate-50 dark:hover:bg-[#101827]/50 cursor-pointer transition-colors"
                    >
                      <td className="py-3 px-4">
                        <p className="font-semibold text-[#101827] dark:text-white">{call.callerName}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums">
                          {call.phoneNumber} {call.vehicleSummary ? `· ${call.vehicleSummary}` : ''}
                        </p>
                      </td>
                      <td className="py-3 px-4 font-mono text-xs tabular-nums text-slate-700 dark:text-slate-300 whitespace-nowrap">
                        {call.date} · {call.time}
                      </td>
                      <td className="py-3 px-4 font-mono text-xs tabular-nums text-slate-700 dark:text-slate-300 whitespace-nowrap">
                        {Math.floor(call.durationSeconds / 60)}m {String(call.durationSeconds % 60).padStart(2, '0')}s
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge label={call.status} tone={statusTone(call.status)} />
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-600 dark:text-slate-300">{call.aiReceptionistName}</td>
                      <td className="py-3 px-4 text-xs font-medium text-[#101827] dark:text-slate-200">{call.outcome}</td>
                      <td className="py-3 px-4 text-xs text-slate-600 dark:text-slate-300">{call.callbackStatus}</td>
                      <td className="py-3 px-4 text-right">
                        <span className={`text-xs font-medium ${call.recordingAvailable ? 'text-[#16A36A]' : 'text-slate-400'}`}>
                          {call.recordingAvailable && call.recordingUrl ? 'Audio Ready' : call.recordingAvailable ? 'Stored' : 'None'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-4 pb-4">
              <Pagination page={page} totalPages={totalPages} totalItems={filtered.length} onPageChange={setPage} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export function CallDetailPage() {
  const { callId } = useParams();
  const {
    calls,
    appointments,
    callbacks,
    recordAuditEvent,
    deleteCallRecordData,
    retentionDays,
    businessProfile,
    authUser,
    addToast,
  } = useApp();
  const call = calls.find((c) => c.id === callId);
  const [auditLogged, setAuditLogged] = useState(false);
  const [purgeConfirmOpen, setPurgeConfirmOpen] = useState(false);

  if (!call) {
    return (
      <div className="space-y-4">
        <Link to="/app/calls">
          <Button variant="outline" size="sm" iconLeft={<ArrowLeft className="w-4 h-4" />}>
            Back to Calls
          </Button>
        </Link>
        <EmptyState
          icon={<PhoneIncoming className="w-8 h-8" />}
          title="Call record not found"
          description="Select a recorded call from Calls Management or sync new Twilio calls."
        />
      </div>
    );
  }

  const relatedAppointment = appointments.find((a) => a.id === call.appointmentId);
  const relatedCallback = callbacks.find((c) => c.id === call.callbackId);

  const handleAudioPlay = () => {
    if (!auditLogged) {
      recordAuditEvent({
        actor: authUser?.displayName || authUser?.email || 'Shop Owner',
        actorRole: 'Shop Owner',
        action: 'Played Call Recording & Inspected Transcript',
        resource: `${call.id} (${call.callerName})`,
        businessName: businessProfile?.name || 'Automotive Shop',
        accessReason: 'Service quality & intake verification',
        changesSummary: 'Real audio playback started.',
      });
      setAuditLogged(true);
      addToast({ title: 'Recording playback logged to Audit Trail', variant: 'info' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link to="/app/calls">
            <Button variant="outline" size="sm" iconLeft={<ArrowLeft className="w-4 h-4" />}>
              Back to Calls
            </Button>
          </Link>
          <div>
            <h1 className="font-display text-xl font-bold text-[#101827] dark:text-white">
              Call Record · {call.callerName}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums">
              {call.id} · {call.date} at {call.time} · {call.phoneNumber}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge label={call.recordingConsent} tone={call.recordingAvailable ? 'success' : 'neutral'} />
          <StatusBadge label="Audit Tracked" tone="info" />
        </div>
      </div>

      <PrototypeBanner contextLabel="Sensitive Recording & Transcript Access — Every playback or export writes an immutable record to Firestore Audit Logs." />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-6">
          {/* Real Audio Player */}
          <div className="p-5 rounded-xl bg-white dark:bg-[#172337] border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-[#3978F6]" />
                <h2 className="font-display text-sm font-bold text-[#101827] dark:text-white">
                  Call Audio Recording
                </h2>
              </div>
              <span className="text-xs font-mono tabular-nums text-slate-500">
                {Math.floor(call.durationSeconds / 60)}m {String(call.durationSeconds % 60).padStart(2, '0')}s
              </span>
            </div>

            {call.recordingAvailable && call.recordingUrl ? (
              <div className="space-y-2">
                <audio
                  controls
                  preload="metadata"
                  src={call.recordingUrl}
                  onPlay={handleAudioPlay}
                  className="w-full"
                />
                {call.recordingSid && (
                  <p className="text-[11px] font-mono text-slate-500">
                    Twilio Recording SID: {call.recordingSid}
                  </p>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2 text-xs text-slate-500 p-3 rounded-lg bg-slate-50 dark:bg-[#101827]">
                <Lock className="w-4 h-4 shrink-0" />
                <span>
                  {call.recordingConsent === 'Recording Disabled'
                    ? 'Recording was purged or disabled for this call.'
                    : 'No audio recording attached yet (enable mic recording in web test or connect Twilio voice webhook for live phone recordings).'}
                </span>
              </div>
            )}
          </div>

          {/* AI Summary */}
          <div className="p-5 rounded-xl bg-white dark:bg-[#172337] border border-slate-200 dark:border-slate-800">
            <h2 className="font-display text-sm font-bold text-[#101827] dark:text-white mb-2">AI-Generated Call Summary</h2>
            <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed">{call.aiSummary}</p>
          </div>

          {/* Full Transcript */}
          <div className="p-5 rounded-xl bg-white dark:bg-[#172337] border border-slate-200 dark:border-slate-800 space-y-4">
            <h2 className="font-display text-sm font-bold text-[#101827] dark:text-white">Full Call Transcript</h2>
            {call.transcript.length === 0 ? (
              <p className="text-xs text-slate-500">No transcript lines captured for this call.</p>
            ) : (
              <div className="space-y-3">
                {call.transcript.map((line, i) => (
                  <div key={i} className="p-3 rounded-lg bg-[#F5F7FB] dark:bg-[#101827] border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className={`font-semibold ${line.speaker === 'AI' ? 'text-[#3978F6]' : 'text-[#101827] dark:text-white'}`}>
                        {line.speaker === 'AI' ? call.aiReceptionistName : call.callerName}
                      </span>
                      <span className="font-mono tabular-nums text-slate-400">{line.timestamp}</span>
                    </div>
                    <p className="text-sm text-slate-700 dark:text-slate-300">{line.text}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Side Context Column */}
        <div className="lg:col-span-4 space-y-4">
          <div className="p-5 rounded-xl bg-white dark:bg-[#172337] border border-slate-200 dark:border-slate-800 space-y-3 text-sm">
            <h3 className="font-display font-bold text-[#101827] dark:text-white">Customer & Vehicle</h3>
            <div className="space-y-1.5 text-xs">
              <p><span className="text-slate-500">Caller:</span> <strong className="text-[#101827] dark:text-white">{call.callerName}</strong></p>
              <p><span className="text-slate-500">Phone:</span> <span className="font-mono tabular-nums">{call.phoneNumber}</span></p>
              <p><span className="text-slate-500">Vehicle:</span> {call.vehicleSummary || 'Not captured'}</p>
              <p><span className="text-slate-500">Service Request:</span> {call.serviceRequest}</p>
              <p><span className="text-slate-500">Outcome:</span> {call.outcome}</p>
            </div>
          </div>

          <div className="p-5 rounded-xl bg-white dark:bg-[#172337] border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
            <h3 className="font-display text-sm font-bold text-[#101827] dark:text-white">Associated Appointment</h3>
            {relatedAppointment ? (
              <div className="space-y-1">
                <p className="font-semibold text-[#3978F6]">{relatedAppointment.category}</p>
                <p className="font-mono tabular-nums">{relatedAppointment.date} at {relatedAppointment.time}</p>
                <p>Assigned: {relatedAppointment.assignedEmployeeName}</p>
                <Link to="/app/appointments" className="inline-block mt-2 text-[#3978F6] hover:underline">
                  Open in Schedule →
                </Link>
              </div>
            ) : (
              <p className="text-slate-500">No appointment linked to this call.</p>
            )}
          </div>

          <div className="p-5 rounded-xl bg-white dark:bg-[#172337] border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
            <h3 className="font-display text-sm font-bold text-[#101827] dark:text-white">Callback & Compliance</h3>
            {relatedCallback ? (
              <p>Linked callback task: <strong>{relatedCallback.status}</strong> ({relatedCallback.urgency})</p>
            ) : (
              <p className="text-slate-500">No callback task created.</p>
            )}
            <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-start gap-2 text-slate-500">
              <ShieldCheck className="w-4 h-4 text-[#16A36A] shrink-0 mt-0.5" />
              <span>
                Retention policy: <strong className="font-mono">{retentionDays} days</strong>.
              </span>
            </div>
            <div className="pt-2">
              <Button
                size="sm"
                variant="outline"
                iconLeft={<Trash2 className="w-3.5 h-3.5" />}
                onClick={() => setPurgeConfirmOpen(true)}
              >
                Purge Recording & Transcript
              </Button>
            </div>
          </div>
        </div>
      </div>

      <Modal
        open={purgeConfirmOpen}
        onClose={() => setPurgeConfirmOpen(false)}
        title="Purge Call Recording & Transcript?"
        description="This immediately removes audio playback (including Twilio recording deletion if present) and transcript text, and records a permanent entry in the Audit Log."
      >
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setPurgeConfirmOpen(false)}>Cancel</Button>
          <Button
            variant="danger"
            onClick={() => {
              deleteCallRecordData(call.id);
              setPurgeConfirmOpen(false);
            }}
          >
            Confirm Purge
          </Button>
        </div>
      </Modal>
    </div>
  );
}
