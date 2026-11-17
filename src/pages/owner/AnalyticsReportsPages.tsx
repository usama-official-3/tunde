import React, { useMemo, useState } from 'react';
import { Download, FileText } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { AreaTrendChart, HorizontalBarList, VerticalColumnChart } from '../../components/ui/Charts';
import { Button } from '../../components/ui/Button';
import { PrototypeBanner } from '../../components/ui/Feedback';
import { Modal } from '../../components/ui/Overlays';
import { Tabs } from '../../components/ui/Navigation';
import { StatusBadge } from '../../components/ui/StatusBadge';

export function AnalyticsPage() {
  const { selectedLocationId, locations, calls, appointments, aroValue, setAroValue } = useApp();
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'custom'>('weekly');

  const scopedCalls = useMemo(
    () => (selectedLocationId === 'all' ? calls : calls.filter((c) => c.locationId === selectedLocationId)),
    [calls, selectedLocationId]
  );

  const scopedApts = useMemo(
    () => (selectedLocationId === 'all' ? appointments : appointments.filter((a) => a.locationId === selectedLocationId)),
    [appointments, selectedLocationId]
  );

  const aiBooked = scopedApts.filter((a) => a.source === 'AI' && a.status !== 'Cancelled').length;
  const genuinelyRecovered = scopedCalls.filter((c) => c.recoveredMissedCall).length;
  const completedApts = scopedApts.filter((a) => a.status === 'Completed');
  const completedRepairs = completedApts.length;
  const verifiedActualRevenue = completedApts.reduce((sum, a) => sum + (a.estimatedValue || 0), 0);
  const estRevenueOpportunity = aiBooked * aroValue;

  // Group real calls across 4 weekly buckets in the last 28 days
  const trendData = useMemo(() => {
    const now = Date.now();
    return [3, 2, 1, 0].map((wIdx, i) => {
      const endMs = now - wIdx * 7 * 86400000;
      const startMs = endMs - 7 * 86400000;
      const weekCalls = scopedCalls.filter((c) => {
        const ms = new Date(`${c.date}T12:00:00`).getTime();
        return ms >= startMs && ms <= endMs;
      });
      return {
        label: `W${i + 1}`,
        primary: weekCalls.length,
        secondary: weekCalls.filter((c) => c.status === 'Answered' && c.outcome !== 'Callback Required').length,
      };
    });
  }, [scopedCalls]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-[#101827] dark:text-white">Analytics</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Scope: {selectedLocationId === 'all' ? `Consolidated (${locations.length} locations)` : locations.find((l) => l.id === selectedLocationId)?.name}
          </p>
        </div>
        <Tabs
          activeId={period}
          onChange={(id) => setPeriod(id as typeof period)}
          tabs={[
            { id: 'daily', label: 'Daily' },
            { id: 'weekly', label: 'Weekly' },
            { id: 'monthly', label: 'Monthly' },
            { id: 'custom', label: 'Custom Range' },
          ]}
        />
      </div>

      <PrototypeBanner contextLabel="Attribution Transparency — Verified Completed Repair Revenue is computed solely from appointments marked Completed in your schedule; Estimated Opportunity uses your shop ARO value." />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="p-4 rounded-xl bg-white dark:bg-[#172337] border border-slate-200 dark:border-slate-800">
          <p className="text-xs text-slate-500">AI-Booked Appointments</p>
          <p className="font-display text-2xl font-bold font-mono tabular-nums mt-1">{aiBooked}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Active AI reservations</p>
        </div>
        <div className="p-4 rounded-xl bg-white dark:bg-[#172337] border border-slate-200 dark:border-slate-800">
          <p className="text-xs text-slate-500">Genuinely Recovered Calls</p>
          <p className="font-display text-2xl font-bold font-mono tabular-nums mt-1">{genuinelyRecovered}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Overflow / after-hours saves</p>
        </div>
        <div className="p-4 rounded-xl bg-white dark:bg-[#172337] border border-slate-200 dark:border-slate-800">
          <p className="text-xs text-slate-500">Completed Repairs</p>
          <p className="font-display text-2xl font-bold font-mono tabular-nums mt-1">{completedRepairs}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Marked Completed in shop</p>
        </div>
        <div className="p-4 rounded-xl bg-white dark:bg-[#172337] border border-slate-200 dark:border-slate-800">
          <p className="text-xs text-slate-500">Verified Completed Value</p>
          <p className="font-display text-2xl font-bold font-mono tabular-nums text-[#16A36A] mt-1">
            ${verifiedActualRevenue.toLocaleString()}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">Completed ROs only</p>
        </div>
        <div className="p-4 rounded-xl bg-white dark:bg-[#172337] border border-slate-200 dark:border-slate-800">
          <p className="text-xs text-slate-500">Est. Revenue Opportunity</p>
          <p className="font-display text-2xl font-bold font-mono tabular-nums text-[#3978F6] mt-1">
            ${estRevenueOpportunity.toLocaleString()}
          </p>
          <div className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-500">
            <span>ARO $:</span>
            <input
              type="number"
              value={aroValue}
              onChange={(e) => setAroValue(Number(e.target.value) || 0)}
              aria-label="Average repair order"
              className="w-16 px-1.5 py-0.5 rounded border border-slate-300 dark:border-slate-700 bg-transparent font-mono"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 p-5 rounded-xl bg-white dark:bg-[#172337] border border-slate-200 dark:border-slate-800">
          <h2 className="font-display text-base font-bold mb-3">AI Performance & Call Resolution Trend</h2>
          <AreaTrendChart
            data={trendData}
            primaryLabel="Inbound Calls"
            secondaryLabel="AI Resolved Without Escalation"
          />
        </div>
        <div className="lg:col-span-5 p-5 rounded-xl bg-white dark:bg-[#172337] border border-slate-200 dark:border-slate-800">
          <h2 className="font-display text-base font-bold mb-3">AI Call Outcomes Breakdown</h2>
          <HorizontalBarList
            items={[
              { label: 'Booked Appointment', value: scopedCalls.filter((c) => c.outcome === 'Booked').length, colorClass: 'bg-[#16A36A]' },
              { label: 'Transferred to Advisor', value: scopedCalls.filter((c) => c.status === 'Transferred').length, colorClass: 'bg-[#3978F6]' },
              { label: 'Callback Queued', value: scopedCalls.filter((c) => c.outcome === 'Callback Required').length, colorClass: 'bg-[#E8A23A]' },
              { label: 'Inquiry Only', value: scopedCalls.filter((c) => c.outcome === 'Inquiry Only').length, colorClass: 'bg-slate-400' },
            ]}
          />
        </div>
      </div>
    </div>
  );
}

export function ReportsPage() {
  const { calls, appointments, addToast } = useApp();
  const [reportType, setReportType] = useState<'call' | 'appointment' | 'conversion' | 'revenue' | 'ai'>('call');
  const [pdfOpen, setPdfOpen] = useState(false);

  const downloadCsv = () => {
    const rows = [
      ['Report Type', reportType.toUpperCase()],
      ['Generated At', new Date().toISOString()],
      ['Caller / Customer', 'Date', 'Time', 'Service', 'Status', 'Source'],
      ...appointments.map((a) => [a.customerName, a.date, a.time, a.category, a.status, a.source]),
    ];
    const csv = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `tunde-ai-${reportType}-report.csv`;
    link.click();
    URL.revokeObjectURL(url);
    addToast({ title: 'CSV report exported', description: `tunde-ai-${reportType}-report.csv`, variant: 'success' });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-[#101827] dark:text-white">Reports & Exports</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Export real Firestore call, appointment, conversion, revenue opportunity, and AI performance reports
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" iconLeft={<Download className="w-4 h-4" />} onClick={downloadCsv}>
            Export CSV
          </Button>
          <Button size="sm" iconLeft={<FileText className="w-4 h-4" />} onClick={() => setPdfOpen(true)}>
            PDF Report Preview
          </Button>
        </div>
      </div>

      <Tabs
        activeId={reportType}
        onChange={(id) => setReportType(id as typeof reportType)}
        tabs={[
          { id: 'call', label: 'Call Reports' },
          { id: 'appointment', label: 'Appointment Reports' },
          { id: 'conversion', label: 'Conversion Reports' },
          { id: 'revenue', label: 'Revenue Opportunity' },
          { id: 'ai', label: 'AI Performance' },
        ]}
      />

      <div className="p-5 rounded-xl bg-white dark:bg-[#172337] border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-base font-bold capitalize">{reportType} Summary Report</h2>
          <StatusBadge label="Live Firestore Dataset" tone="success" />
        </div>
        {appointments.length === 0 ? (
          <p className="text-xs text-slate-500 py-6 text-center">No appointments stored yet. Book or log a call to populate this report.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-xs text-slate-500">
                  <th className="py-2.5 px-3">Record</th>
                  <th className="py-2.5 px-3">Date & Time</th>
                  <th className="py-2.5 px-3">Service / Outcome</th>
                  <th className="py-2.5 px-3">Attribution</th>
                  <th className="py-2.5 px-3 text-right">Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {appointments.map((a) => (
                  <tr key={a.id}>
                    <td className="py-2.5 px-3 font-semibold">{a.customerName} ({a.vehicleLabel})</td>
                    <td className="py-2.5 px-3 font-mono tabular-nums">{a.date} {a.time}</td>
                    <td className="py-2.5 px-3">{a.category} · {a.status}</td>
                    <td className="py-2.5 px-3">{a.source === 'AI' ? 'AI-Booked' : 'Manual'}</td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                      ${a.estimatedValue ?? 0} {a.status === 'Completed' ? '(Completed)' : '(Est.)'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="text-xs text-slate-500">
          Total calls stored: {calls.length} · Total appointments stored: {appointments.length}
        </p>
      </div>

      <Modal open={pdfOpen} onClose={() => setPdfOpen(false)} title="PDF Report Print Preview" maxWidth="max-w-2xl">
        <div className="space-y-4 text-xs">
          <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-[#F5F7FB] dark:bg-[#101827] space-y-2">
            <div className="flex justify-between font-bold text-sm">
              <span>Tunde AI — {reportType.toUpperCase()} REPORT</span>
              <span className="font-mono">{new Date().toISOString().slice(0, 10)}</span>
            </div>
            <p className="text-slate-500">Generated directly from live Cloud Firestore shop records.</p>
            <VerticalColumnChart
              data={[
                { label: 'Calls', value: calls.length },
                { label: 'Bookings', value: appointments.length },
                { label: 'AI Booked', value: appointments.filter((a) => a.source === 'AI').length },
              ]}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setPdfOpen(false)}>Close</Button>
            <Button onClick={() => window.print()}>Print / Save PDF</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
