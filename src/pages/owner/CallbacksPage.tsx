import React, { useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, PhoneOutgoing } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Button } from '../../components/ui/Button';
import { Input, SearchField, Select, Textarea } from '../../components/ui/FormControls';
import { Modal } from '../../components/ui/Overlays';
import { Tabs } from '../../components/ui/Navigation';
import { EmptyState } from '../../components/ui/Feedback';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { CallbackStatus, CallbackTask, CallbackUrgency } from '../../types/tunde';

export function CallbacksPage() {
  const { callbacks, updateCallback, setCallbackStatus, team, selectedLocationId } = useApp();
  const [statusTab, setStatusTab] = useState<'all' | CallbackStatus>('all');
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState<CallbackTask | null>(null);

  const locationCallbacks = useMemo(
    () => (selectedLocationId === 'all' ? callbacks : callbacks.filter((c) => c.locationId === selectedLocationId)),
    [callbacks, selectedLocationId]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return locationCallbacks.filter((c) => {
      if (statusTab !== 'all' && c.status !== statusTab) return false;
      if (!q) return true;
      return (
        c.customerName.toLowerCase().includes(q) ||
        c.vehicleLabel.toLowerCase().includes(q) ||
        c.reason.toLowerCase().includes(q)
      );
    });
  }, [locationCallbacks, statusTab, query]);

  const urgencyBadge = (u: CallbackUrgency) => {
    if (u === 'Urgent') return <StatusBadge label="Urgent" tone="error" />;
    if (u === 'High') return <StatusBadge label="High Priority" tone="warning" />;
    return <StatusBadge label="Normal" tone="neutral" showIcon={false} />;
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-[#101827] dark:text-white">Callback Queue</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Follow-up tasks created from missed transfers, warranty questions, and urgent tow-in requests
          </p>
        </div>
        <SearchField value={query} onChange={setQuery} placeholder="Search customer, vehicle, reason..." className="w-full sm:w-72" />
      </div>

      <Tabs
        activeId={statusTab}
        onChange={(id) => setStatusTab(id as typeof statusTab)}
        tabs={[
          { id: 'all', label: 'All Callbacks', count: locationCallbacks.length },
          { id: 'Pending', label: 'Pending', count: locationCallbacks.filter((c) => c.status === 'Pending').length },
          { id: 'In Progress', label: 'In Progress', count: locationCallbacks.filter((c) => c.status === 'In Progress').length },
          { id: 'Completed', label: 'Completed', count: locationCallbacks.filter((c) => c.status === 'Completed').length },
        ]}
      />

      {filtered.length === 0 ? (
        <EmptyState
          icon={<PhoneOutgoing className="w-8 h-8" />}
          title="No callbacks in this view"
          description="All matching callback tasks are cleared."
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((cb) => {
            const isUrgent = cb.urgency === 'Urgent' && cb.status !== 'Completed';
            return (
              <div
                key={cb.id}
                className={`p-5 rounded-xl bg-white dark:bg-[#172337] border flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${
                  isUrgent
                    ? 'border-rose-300 dark:border-rose-800 bg-rose-50/30 dark:bg-rose-950/10'
                    : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {isUrgent && <AlertTriangle className="w-4 h-4 text-[#DC4C4C]" aria-hidden="true" />}
                    <h2 className="font-display text-base font-bold text-[#101827] dark:text-white">{cb.customerName}</h2>
                    {urgencyBadge(cb.urgency)}
                    <StatusBadge
                      label={cb.status}
                      tone={cb.status === 'Completed' ? 'success' : cb.status === 'In Progress' ? 'info' : 'warning'}
                    />
                  </div>
                  <p className="text-xs font-mono tabular-nums text-slate-600 dark:text-slate-300">
                    {cb.phone} · {cb.vehicleLabel} · Due {cb.dueDate}
                  </p>
                  <p className="text-sm font-medium text-[#101827] dark:text-slate-100">{cb.reason}</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">{cb.aiCallSummary}</p>
                  <p className="text-xs text-slate-500">Assigned to: <strong>{cb.assignedEmployeeName}</strong> · Created {cb.createdAt}</p>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <Button size="sm" variant="outline" onClick={() => setEditing(cb)}>
                    Assign / Edit
                  </Button>
                  {cb.status !== 'In Progress' && cb.status !== 'Completed' && (
                    <Button size="sm" variant="secondary" onClick={() => setCallbackStatus(cb.id, 'In Progress')}>
                      Start Follow-Up
                    </Button>
                  )}
                  {cb.status !== 'Completed' && (
                    <Button
                      size="sm"
                      variant="primary"
                      iconLeft={<CheckCircle2 className="w-3.5 h-3.5" />}
                      onClick={() => setCallbackStatus(cb.id, 'Completed')}
                    >
                      Mark Complete
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal open={Boolean(editing)} onClose={() => setEditing(null)} title="Edit Callback Task">
        {editing && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const emp = team.find((m) => m.id === editing.assignedEmployeeId);
              updateCallback({ ...editing, assignedEmployeeName: emp?.name || editing.assignedEmployeeName });
              setEditing(null);
            }}
            className="space-y-4"
          >
            <Select
              label="Assigned Employee"
              value={editing.assignedEmployeeId}
              onChange={(e) => setEditing({ ...editing, assignedEmployeeId: e.target.value })}
              options={team.map((m) => ({ value: m.id, label: `${m.name} (${m.role})` }))}
            />
            <div className="grid grid-cols-2 gap-3">
              <Select
                label="Urgency"
                value={editing.urgency}
                onChange={(e) => setEditing({ ...editing, urgency: e.target.value as CallbackUrgency })}
                options={[
                  { value: 'Normal', label: 'Normal' },
                  { value: 'High', label: 'High' },
                  { value: 'Urgent', label: 'Urgent' },
                ]}
              />
              <Select
                label="Status"
                value={editing.status}
                onChange={(e) => setEditing({ ...editing, status: e.target.value as CallbackStatus })}
                options={[
                  { value: 'Pending', label: 'Pending' },
                  { value: 'In Progress', label: 'In Progress' },
                  { value: 'Completed', label: 'Completed' },
                ]}
              />
            </div>
            <Input
              label="Due Date & Time"
              value={editing.dueDate}
              onChange={(e) => setEditing({ ...editing, dueDate: e.target.value })}
            />
            <Textarea
              label="Reason / Notes"
              rows={3}
              value={editing.reason}
              onChange={(e) => setEditing({ ...editing, reason: e.target.value })}
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
              <Button type="submit">Save Callback</Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
