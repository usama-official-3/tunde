import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarPlus, PhoneIncoming, RefreshCw } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { AreaTrendChart, HorizontalBarList, VerticalColumnChart } from '../../components/ui/Charts';
import { Button } from '../../components/ui/Button';
import { EmptyState, PrototypeBanner } from '../../components/ui/Feedback';
import { StatusBadge } from '../../components/ui/StatusBadge';

type DateRangeKey = 'today' | 'yesterday' | '7d' | '30d' | 'custom';

function getDayOffsetIso(offsetDays: number): string {
  const d = new Date(Date.now() + offsetDays * 86400000);
  return d.toISOString().slice(0, 10);
}

export function OverviewPage() {
  const { calls, appointments, callbacks, customers, selectedLocationId, locations, aroValue, setAroValue, syncTwilioCalls } = useApp();
  const [range, setRange] = useState<DateRangeKey>('30d');
  const [customStart, setCustomStart] = useState(() => getDayOffsetIso(-30));
  const [customEnd, setCustomEnd] = useState(() => getDayOffsetIso(0));
  const [syncing, setSyncing] = useState(false);

  const dateBounds = useMemo(() => {
    const today = getDayOffsetIso(0);
    if (range === 'today') return { start: today, end: today };
    if (range === 'yesterday') {
      const y = getDayOffsetIso(-1);
      return { start: y, end: y };
    }
    if (range === '7d') return { start: getDayOffsetIso(-6), end: today };
    if (range === '30d') return { start: getDayOffsetIso(-29), end: today };
    return { start: customStart, end: customEnd };
  }, [range, customStart, customEnd]);

  const inRange = (dateStr: string) => {
    if (!dateStr) return true;
    const d = dateStr.slice(0, 10);
    return d >= dateBounds.start && d <= dateBounds.end;
  };

  const filteredCalls = useMemo(
    () =>
      calls.filter(
        (c) => (selectedLocationId === 'all' || c.locationId === selectedLocationId) && inRange(c.date)
      ),
    [calls, selectedLocationId, dateBounds]
  );

  const filteredApts = useMemo(
    () =>
      appointments.filter(
        (a) => (selectedLocationId === 'all' || a.locationId === selectedLocationId) && inRange(a.date)
      ),
    [appointments, selectedLocationId, dateBounds]
  );

  const filteredCallbacks = useMemo(
    () =>
      callbacks.filter(
        (c) => (selectedLocationId === 'all' || c.locationId === selectedLocationId) && inRange(c.createdAt || c.dueDate)
      ),
    [callbacks, selectedLocationId, dateBounds]
  );

  const filteredCustomers = useMemo(
    () => customers.filter((c) => selectedLocationId === 'all' || c.locationId === selectedLocationId),
    [customers, selectedLocationId]
  );

  const totalCalls = filteredCalls.length;
  const aiAnswered = filteredCalls.filter((c) => c.status === 'Answered').length;
  const missedRecovered = filteredCalls.filter((c) => c.recoveredMissedCall).length;
  const bookedCount = filteredApts.filter((a) => a.status !== 'Cancelled' && a.status !== 'Rescheduled').length;
  const cancelledCount = filteredApts.filter((a) => a.status === 'Cancelled').length;
  const rescheduledCount = filteredApts.filter((a) => a.status === 'Rescheduled').length;
  const callbackCount = filteredCallbacks.length;
  const transferredCount = filteredCalls.filter((c) => c.status === 'Transferred').length;
  const newCustomers = filteredCustomers.filter((c) => c.status === 'New').length;
  const returningCustomers = filteredCustomers.filter((c) => c.status === 'Returning').length;
  const avgDurationSec =
    totalCalls > 0
      ? Math.round(filteredCalls.reduce((sum, c) => sum + (c.durationSeconds || 0), 0) / totalCalls)
      : 0;
  const aiBookedCalls = filteredCalls.filter((c) => c.outcome === 'Booked').length;
  const conversionRate = totalCalls > 0 ? Math.round((aiBookedCalls / totalCalls) * 100) : 0;
  const estimatedOpportunity = filteredApts.filter((a) => a.source === 'AI' && a.status !== 'Cancelled').length * aroValue;

  const kpis = [
    { label: 'Total Incoming Calls', value: totalCalls.toLocaleString(), sub: 'Recorded in Firestore' },
    { label: 'AI Answered Calls', value: aiAnswered.toLocaleString(), sub: totalCalls > 0 ? `${Math.round((aiAnswered / totalCalls) * 100)}% of calls` : 'No calls in range' },
    { label: 'Missed Calls Recovered', value: missedRecovered.toLocaleString(), sub: 'Overflow & after-hours' },
    { label: 'Appointments Booked', value: bookedCount.toLocaleString(), sub: 'Confirmed bay slots' },
    { label: 'Appointments Cancelled', value: cancelledCount.toLocaleString(), sub: 'Shop schedule updates' },
    { label: 'Appointments Rescheduled', value: rescheduledCount.toLocaleString(), sub: 'Moved without conflict' },
    { label: 'Callback Requests', value: callbackCount.toLocaleString(), sub: `${filteredCallbacks.filter((c) => c.status !== 'Completed').length} open in queue` },
    { label: 'Calls Transferred', value: transferredCount.toLocaleString(), sub: 'Warm transfer to staff' },
    { label: 'New Customers', value: newCustomers.toLocaleString(), sub: 'In shop directory' },
    { label: 'Returning Customers', value: returningCustomers.toLocaleString(), sub: 'Repeat callers' },
    { label: 'Average Call Duration', value: `${Math.floor(avgDurationSec / 60)}m ${avgDurationSec % 60}s`, sub: 'Real call duration average' },
    { label: 'Appointment Conversion Rate', value: `${conversionRate}%`, sub: 'AI booked / total calls' },
  ];

  // Real 7-day trend computed from actual stored calls
  const trendData = useMemo(() => {
    const pts: { label: string; primary: number; secondary: number }[] = [];
    for (let i = -6; i <= 0; i += 1) {
      const iso = getDayOffsetIso(i);
      const dayCalls = calls.filter(
        (c) => c.date === iso && (selectedLocationId === 'all' || c.locationId === selectedLocationId)
      );
      pts.push({
        label: iso.slice(5),
        primary: dayCalls.length,
        secondary: dayCalls.filter((c) => c.status === 'Answered').length,
      });
    }
    return pts;
  }, [calls, selectedLocationId]);

  // Real peak calling hours from actual stored calls
  const peakHours = useMemo(() => {
    const buckets = [
      { label: '8a', hour: 8 },
      { label: '9a', hour: 9 },
      { label: '10a', hour: 10 },
      { label: '11a', hour: 11 },
      { label: '12p', hour: 12 },
      { label: '1p', hour: 13 },
      { label: '2p', hour: 14 },
      { label: '3p', hour: 15 },
      { label: '4p', hour: 16 },
      { label: 'After', hour: -1 },
    ];
    return buckets.map((b) => ({
      label: b.label,
      value: filteredCalls.filter((c) => {
        const hr = Number((c.time || '').split(':')[0]);
        if (Number.isNaN(hr)) return false;
        if (b.hour === -1) return hr < 8 || hr >= 17;
        return hr === b.hour;
      }).length,
    }));
  }, [filteredCalls]);

  // Real popular requested services
  const popularServices = useMemo(() => {
    const counts = new Map<string, number>();
    filteredApts.forEach((a) => counts.set(a.category, (counts.get(a.category) || 0) + 1));
    if (counts.size === 0) {
      filteredCalls.forEach((c) => counts.set(c.serviceRequest || 'General Service', (counts.get(c.serviceRequest || 'General Service') || 0) + 1));
    }
    const colors = ['bg-[#3978F6]', 'bg-[#36C5E8]', 'bg-[#16A36A]', 'bg-[#E8A23A]', 'bg-slate-500'];
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([label, value], i) => ({ label, value, colorClass: colors[i % colors.length] }));
  }, [filteredApts, filteredCalls]);

  // Real weekday AI vs Manual appointment trends
  const weekdayTrends = useMemo(() => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const mapIdx: Record<number, string> = { 1: 'Mon', 2: 'Tue', 3: 'Wed', 4: 'Thu', 5: 'Fri', 6: 'Sat' };
    return days.map((d) => {
      const matching = filteredApts.filter((a) => {
        const dt = new Date(`${a.date}T12:00:00`);
        return mapIdx[dt.getDay()] === d;
      });
      return {
        label: d,
        value: matching.filter((a) => a.source === 'AI').length,
        secondary: matching.filter((a) => a.source === 'Manual').length,
      };
    });
  }, [filteredApts]);

  const activeLocationLabel =
    selectedLocationId === 'all'
      ? `All Locations (${locations.length} shop${locations.length === 1 ? '' : 's'})`
      : locations.find((l) => l.id === selectedLocationId)?.name || 'Shop';

  return (
    <div className="space-y-6">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-[#101827] dark:text-white">Shop Overview</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Scope: {activeLocationLabel} · Live metrics computed strictly from your Firestore database
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 p-1 rounded-lg bg-white dark:bg-[#172337] border border-slate-200 dark:border-slate-800">
            {(
              [
                { id: 'today', label: 'Today' },
                { id: 'yesterday', label: 'Yesterday' },
                { id: '7d', label: 'Last 7 Days' },
                { id: '30d', label: 'Last 30 Days' },
                { id: 'custom', label: 'Custom' },
              ] as { id: DateRangeKey; label: string }[]
            ).map((btn) => (
              <button
                key={btn.id}
                type="button"
                onClick={() => setRange(btn.id)}
                className={`px-2.5 py-1.5 text-xs font-medium rounded-md cursor-pointer transition-colors ${
                  range === btn.id
                    ? 'bg-[#3978F6] text-white'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>

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
            Sync Calls
          </Button>

          <Link to="/app/appointments">
            <Button size="sm" iconLeft={<CalendarPlus className="w-4 h-4" />}>
              New Appointment
            </Button>
          </Link>
        </div>
      </div>

      {range === 'custom' && (
        <div className="flex flex-wrap items-center gap-3 p-3 rounded-xl bg-white dark:bg-[#172337] border border-slate-200 dark:border-slate-800 text-xs">
          <span className="font-medium">Custom Range:</span>
          <input
            type="date"
            value={customStart}
            onChange={(e) => setCustomStart(e.target.value)}
            aria-label="Start date"
            className="px-2.5 py-1.5 rounded-md border border-slate-300 dark:border-slate-700 bg-transparent"
          />
          <span>to</span>
          <input
            type="date"
            value={customEnd}
            onChange={(e) => setCustomEnd(e.target.value)}
            aria-label="End date"
            className="px-2.5 py-1.5 rounded-md border border-slate-300 dark:border-slate-700 bg-transparent"
          />
        </div>
      )}

      {calls.length === 0 && appointments.length === 0 && (
        <div className="p-5 rounded-xl bg-white dark:bg-[#172337] border border-slate-200 dark:border-slate-800">
          <EmptyState
            icon={<PhoneIncoming className="w-8 h-8" />}
            title="No shop calls or appointments recorded yet"
            description="Your workspace contains zero fake data. Place a real Twilio call from Phone Configuration or test the AI Receptionist on the AI Demo page to capture real recordings and appointments."
            actionLabel="Open Phone & Twilio Setup"
            onAction={() => {
              window.location.href = '/app/phone-config';
            }}
          />
        </div>
      )}

      <PrototypeBanner contextLabel="Live Firestore Workspace — Metrics reflect 100% real stored calls, customers, and appointments. Revenue opportunity uses your shop ARO multiplier on AI-booked appointments." />

      {/* 12 Real KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            className="p-4 rounded-xl bg-white dark:bg-[#172337] border border-slate-200 dark:border-slate-800"
          >
            <p className="text-xs text-slate-500 dark:text-slate-400">{kpi.label}</p>
            <p className="mt-1.5 font-display text-2xl font-bold font-mono tabular-nums text-[#101827] dark:text-white">
              {kpi.value}
            </p>
            <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">{kpi.sub}</p>
          </div>
        ))}
      </div>

      {/* Estimated Revenue Opportunity Calculator Card */}
      <div className="p-5 rounded-xl bg-white dark:bg-[#172337] border border-slate-200 dark:border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-1 max-w-xl">
          <div className="flex items-center gap-2">
            <h2 className="font-display text-base font-bold text-[#101827] dark:text-white">
              Estimated Revenue Opportunity
            </h2>
            <StatusBadge label="Estimate Model" tone="warning" />
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300">
            Calculated strictly as real AI-booked active appointments ({filteredApts.filter((a) => a.source === 'AI' && a.status !== 'Cancelled').length}) × your saved Average Repair Order value (${aroValue}). Verified Completed RO revenue is tracked separately in Analytics.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-5 shrink-0">
          <div>
            <label htmlFor="aro-input" className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
              Avg Repair Order ($)
            </label>
            <input
              id="aro-input"
              type="number"
              min={0}
              max={10000}
              step={10}
              value={aroValue}
              onChange={(e) => setAroValue(Math.max(0, Number(e.target.value) || 0))}
              className="w-28 px-3 py-1.5 text-sm font-mono tabular-nums rounded-lg border border-slate-300 dark:border-slate-700 bg-[#F5F7FB] dark:bg-[#101827]"
            />
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-500 dark:text-slate-400">Est. Opportunity</p>
            <p className="font-display text-2xl font-bold font-mono tabular-nums text-[#3978F6]">
              ${estimatedOpportunity.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Visualizations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 p-5 rounded-xl bg-white dark:bg-[#172337] border border-slate-200 dark:border-slate-800">
          <h2 className="font-display text-base font-bold text-[#101827] dark:text-white mb-1">
            Incoming Calls Over Last 7 Days
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Real inbound calls vs. AI-answered calls</p>
          <AreaTrendChart data={trendData} primaryLabel="Total Inbound" secondaryLabel="AI Answered" />
        </div>

        <div className="lg:col-span-5 p-5 rounded-xl bg-white dark:bg-[#172337] border border-slate-200 dark:border-slate-800">
          <h2 className="font-display text-base font-bold text-[#101827] dark:text-white mb-1">
            Appointment Conversion Funnel
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Real call-to-booking progression</p>
          <HorizontalBarList
            items={[
              { label: '1. Total Inbound Calls', value: totalCalls, colorClass: 'bg-[#101827] dark:bg-slate-300' },
              { label: '2. AI Answered Calls', value: aiAnswered, colorClass: 'bg-[#3978F6]' },
              { label: '3. AI Booked Appointments', value: aiBookedCalls, colorClass: 'bg-[#16A36A]' },
              { label: '4. Callbacks Queued', value: callbackCount, colorClass: 'bg-[#E8A23A]' },
            ]}
          />
        </div>

        <div className="lg:col-span-4 p-5 rounded-xl bg-white dark:bg-[#172337] border border-slate-200 dark:border-slate-800">
          <h2 className="font-display text-base font-bold text-[#101827] dark:text-white mb-1">Call Outcome Split</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Real answered vs transferred calls</p>
          <HorizontalBarList
            items={[
              { label: 'AI Handled End-to-End', value: aiAnswered, colorClass: 'bg-[#3978F6]' },
              { label: 'Live Transferred to Staff', value: transferredCount, colorClass: 'bg-[#E8A23A]' },
              { label: 'Missed / Incomplete', value: filteredCalls.filter((c) => c.status === 'Missed' || c.status === 'Failed').length, colorClass: 'bg-[#DC4C4C]' },
            ]}
          />
        </div>

        <div className="lg:col-span-4 p-5 rounded-xl bg-white dark:bg-[#172337] border border-slate-200 dark:border-slate-800">
          <h2 className="font-display text-base font-bold text-[#101827] dark:text-white mb-1">Popular Services</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">From real bookings & calls</p>
          {popularServices.length > 0 ? (
            <HorizontalBarList items={popularServices} />
          ) : (
            <p className="text-xs text-slate-500 py-8 text-center">No service bookings recorded yet.</p>
          )}
        </div>

        <div className="lg:col-span-4 p-5 rounded-xl bg-white dark:bg-[#172337] border border-slate-200 dark:border-slate-800">
          <h2 className="font-display text-base font-bold text-[#101827] dark:text-white mb-1">Peak Calling Hours</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">Hourly call volume</p>
          <VerticalColumnChart data={peakHours} />
        </div>

        <div className="lg:col-span-6 p-5 rounded-xl bg-white dark:bg-[#172337] border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-display text-base font-bold text-[#101827] dark:text-white">Appointment Trends by Day</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">AI-booked vs manual advisor bookings</p>
            </div>
            <Link to="/app/appointments" className="text-xs font-medium text-[#3978F6] hover:underline">
              View Schedule
            </Link>
          </div>
          <VerticalColumnChart data={weekdayTrends} />
        </div>

        <div className="lg:col-span-6 p-5 rounded-xl bg-white dark:bg-[#172337] border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-display text-base font-bold text-[#101827] dark:text-white">Callback Queue Breakdown</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Live Firestore callback statuses</p>
            </div>
            <Link to="/app/callbacks" className="text-xs font-medium text-[#3978F6] hover:underline">
              Manage Queue
            </Link>
          </div>
          <HorizontalBarList
            items={[
              {
                label: 'Pending Callbacks',
                value: filteredCallbacks.filter((c) => c.status === 'Pending').length,
                colorClass: 'bg-[#E8A23A]',
              },
              {
                label: 'In Progress',
                value: filteredCallbacks.filter((c) => c.status === 'In Progress').length,
                colorClass: 'bg-[#3978F6]',
              },
              {
                label: 'Completed',
                value: filteredCallbacks.filter((c) => c.status === 'Completed').length,
                colorClass: 'bg-[#16A36A]',
              },
            ]}
          />
          <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-500">Urgent unresolved tasks:</span>
            <span className="font-mono font-semibold text-[#DC4C4C]">
              {filteredCallbacks.filter((c) => c.urgency === 'Urgent' && c.status !== 'Completed').length} Urgent
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
