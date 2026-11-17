import React, { useMemo, useState } from 'react';
import { Calendar as CalendarIcon, Plus, Sliders, Trash2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { SERVICE_CATEGORIES } from '../../data/mockData';
import { resolveRelativeDate } from '../../utils/dateParser';
import { Button } from '../../components/ui/Button';
import { Input, Select, Textarea } from '../../components/ui/FormControls';
import { Modal } from '../../components/ui/Overlays';
import { Tabs } from '../../components/ui/Navigation';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Appointment, AppointmentStatus, ServiceCategory } from '../../types/tunde';

export function AppointmentsPage() {
  const {
    appointments,
    addAppointment,
    updateAppointment,
    locations,
    updateLocation,
    selectedLocationId,
    customers,
    vehicles,
    team,
    customCategories,
    addCustomCategory,
    removeCustomCategory,
    addToast,
  } = useApp();

  const todayIso = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month' | 'list' | 'availability'>('list');
  const [selectedDate, setSelectedDate] = useState(todayIso);
  const [modalOpen, setModalOpen] = useState(false);
  const [catModalOpen, setCatModalOpen] = useState(false);
  const [newCatForm, setNewCatForm] = useState({ name: '', defaultDurationMinutes: 60, maxPerSlot: 1, notes: '' });
  const [relativePhrase, setRelativePhrase] = useState('next Friday');
  const [editingApt, setEditingApt] = useState<Appointment | null>(null);
  const [conflictError, setConflictError] = useState('');

  const allCategoryOptions = useMemo(() => {
    const names = [...SERVICE_CATEGORIES, ...customCategories.map((c) => c.name)];
    return Array.from(new Set(names)).map((c) => ({ value: c, label: c }));
  }, [customCategories]);

  const relativePreview = useMemo(() => resolveRelativeDate(relativePhrase, todayIso), [relativePhrase, todayIso]);

  const defaultLocId = selectedLocationId === 'all' ? locations[0]?.id || 'loc_primary' : selectedLocationId;

  const [form, setForm] = useState<{
    locationId: string;
    customerId: string;
    vehicleId: string;
    category: ServiceCategory;
    date: string;
    time: string;
    durationMinutes: number;
    assignedEmployeeId: string;
    status: AppointmentStatus;
    internalNotes: string;
  }>({
    locationId: defaultLocId,
    customerId: customers[0]?.id || '',
    vehicleId: vehicles[0]?.id || '',
    category: 'Oil Change',
    date: todayIso,
    time: '10:00',
    durationMinutes: 60,
    assignedEmployeeId: team[1]?.id || team[0]?.id || '',
    status: 'Scheduled',
    internalNotes: '',
  });

  const filteredApts = useMemo(
    () =>
      (selectedLocationId === 'all'
        ? appointments
        : appointments.filter((a) => a.locationId === selectedLocationId)
      ).sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`)),
    [appointments, selectedLocationId]
  );

  const openNewModal = () => {
    setEditingApt(null);
    setConflictError('');
    setForm({
      locationId: defaultLocId,
      customerId: customers[0]?.id || '',
      vehicleId: vehicles[0]?.id || '',
      category: 'Brake Inspection',
      date: selectedDate,
      time: '10:00',
      durationMinutes: 60,
      assignedEmployeeId: team[1]?.id || team[0]?.id || '',
      status: 'Scheduled',
      internalNotes: '',
    });
    setModalOpen(true);
  };

  const openEditModal = (apt: Appointment) => {
    setEditingApt(apt);
    setConflictError('');
    setForm({
      locationId: apt.locationId,
      customerId: apt.customerId,
      vehicleId: apt.vehicleId,
      category: apt.category,
      date: apt.date,
      time: apt.time,
      durationMinutes: apt.durationMinutes,
      assignedEmployeeId: apt.assignedEmployeeId,
      status: apt.status,
      internalNotes: apt.internalNotes,
    });
    setModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const cust = customers.find((c) => c.id === form.customerId);
    const veh = vehicles.find((v) => v.id === form.vehicleId);
    const emp = team.find((m) => m.id === form.assignedEmployeeId);

    const payload = {
      locationId: form.locationId,
      customerId: form.customerId,
      customerName: cust?.name || 'Walk-in Customer',
      customerPhone: cust?.phone || '(614) 555-0000',
      vehicleId: form.vehicleId,
      vehicleLabel: veh ? `${veh.year} ${veh.make} ${veh.model}` : 'Vehicle on file',
      category: form.category,
      date: form.date,
      time: form.time,
      durationMinutes: Number(form.durationMinutes),
      assignedEmployeeId: form.assignedEmployeeId,
      assignedEmployeeName: emp?.name || 'Unassigned',
      status: form.status,
      source: editingApt ? editingApt.source : ('Manual' as const),
      internalNotes: form.internalNotes,
    };

    const res = editingApt
      ? updateAppointment({ ...payload, id: editingApt.id })
      : addAppointment(payload);

    if (!res.ok) {
      setConflictError(res.error || 'Bay scheduling conflict detected.');
      return;
    }
    setModalOpen(false);
  };

  const quickStatusChange = (apt: Appointment, status: AppointmentStatus) => {
    updateAppointment({ ...apt, status });
  };

  const activeLocation = locations.find((l) => l.id === defaultLocId) || locations[0];
  const weekDates = useMemo(() => {
    const base = new Date(`${selectedDate}T12:00:00Z`);
    return Array.from({ length: 6 }).map((_, idx) => {
      const d = new Date(base.getTime() + idx * 86400000);
      return d.toISOString().slice(0, 10);
    });
  }, [selectedDate]);

  const statusTone = (s: AppointmentStatus) => {
    if (s === 'Confirmed' || s === 'Completed') return 'success';
    if (s === 'Scheduled' || s === 'In Bay') return 'info';
    if (s === 'Rescheduled') return 'warning';
    return 'error';
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-[#101827] dark:text-white">Appointments & Bay Schedule</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Conflict-checked automotive scheduling across AI and manual bookings
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" iconLeft={<Sliders className="w-4 h-4" />} onClick={() => setCatModalOpen(true)}>
            Custom Categories ({customCategories.length})
          </Button>
          <Button iconLeft={<Plus className="w-4 h-4" />} onClick={openNewModal}>
            New Appointment
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs
          activeId={viewMode}
          onChange={(id) => setViewMode(id as typeof viewMode)}
          tabs={[
            { id: 'list', label: 'Appointment List', count: filteredApts.length },
            { id: 'day', label: 'Day View' },
            { id: 'week', label: 'Week View' },
            { id: 'month', label: 'Month View' },
            { id: 'availability', label: 'Availability & Hours' },
          ]}
        />
        {viewMode === 'day' && (
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            aria-label="Filter day"
            className="px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#172337]"
          />
        )}
      </div>

      {/* LIST VIEW */}
      {viewMode === 'list' && (
        <div className="rounded-xl bg-white dark:bg-[#172337] border border-slate-200 dark:border-slate-800 overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold text-slate-500 bg-slate-50 dark:bg-[#101827]/60">
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-4">Customer & Vehicle</th>
                <th className="py-3 px-4">Service Category</th>
                <th className="py-3 px-4">Advisor / Tech</th>
                <th className="py-3 px-4">Source</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
              {filteredApts.map((apt) => (
                <tr key={apt.id} className="hover:bg-slate-50 dark:hover:bg-[#101827]/40">
                  <td className="py-3 px-4 font-mono text-xs tabular-nums whitespace-nowrap">
                    <div className="font-semibold text-[#101827] dark:text-white">{apt.date}</div>
                    <div className="text-slate-500">{apt.time} ({apt.durationMinutes}m)</div>
                  </td>
                  <td className="py-3 px-4">
                    <p className="font-semibold text-[#101827] dark:text-white">{apt.customerName}</p>
                    <p className="text-xs text-slate-500">{apt.vehicleLabel}</p>
                  </td>
                  <td className="py-3 px-4 text-xs font-medium">{apt.category}</td>
                  <td className="py-3 px-4 text-xs">{apt.assignedEmployeeName}</td>
                  <td className="py-3 px-4">
                    <StatusBadge label={apt.source === 'AI' ? 'AI Booked' : 'Manual'} tone={apt.source === 'AI' ? 'info' : 'neutral'} showIcon={false} />
                  </td>
                  <td className="py-3 px-4">
                    <StatusBadge label={apt.status} tone={statusTone(apt.status)} />
                  </td>
                  <td className="py-3 px-4 text-right whitespace-nowrap space-x-2">
                    <Button size="sm" variant="outline" onClick={() => openEditModal(apt)}>
                      Edit / Reschedule
                    </Button>
                    {apt.status !== 'Cancelled' && (
                      <Button size="sm" variant="ghost" onClick={() => quickStatusChange(apt, 'Cancelled')}>
                        Cancel
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* DAY VIEW */}
      {viewMode === 'day' && (
        <div className="rounded-xl bg-white dark:bg-[#172337] border border-slate-200 dark:border-slate-800 p-5 space-y-3">
          <h2 className="font-display text-base font-bold text-[#101827] dark:text-white">
            Schedule for {selectedDate}
          </h2>
          <div className="space-y-2">
            {['08:00', '08:30', '09:00', '10:00', '11:00', '13:30', '15:00'].map((slot) => {
              const matches = filteredApts.filter((a) => a.date === selectedDate && a.time === slot);
              return (
                <div key={slot} className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                  <span className="font-mono text-xs font-semibold tabular-nums w-20 text-slate-500">{slot}</span>
                  <div className="flex-1 flex flex-wrap gap-2">
                    {matches.length === 0 ? (
                      <span className="text-xs text-slate-400">Open bay capacity ({activeLocation?.bayCount || 4} bays available)</span>
                    ) : (
                      matches.map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => openEditModal(m)}
                          className="text-left px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-xs cursor-pointer"
                        >
                          <strong className="text-[#101827] dark:text-white">{m.customerName}</strong> · {m.category} ({m.vehicleLabel})
                        </button>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* WEEK VIEW */}
      {viewMode === 'week' && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {weekDates.map((d) => {
            const dayApts = filteredApts.filter((a) => a.date === d);
            return (
              <div key={d} className="p-3 rounded-xl bg-white dark:bg-[#172337] border border-slate-200 dark:border-slate-800 space-y-2.5">
                <div className="pb-2 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="font-mono text-xs font-semibold tabular-nums">{d}</span>
                  <span className="text-[11px] text-slate-400 tabular-nums">{dayApts.length}</span>
                </div>
                {dayApts.length === 0 ? (
                  <p className="text-xs text-slate-400 py-4 text-center">No bookings</p>
                ) : (
                  dayApts.map((a) => (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => openEditModal(a)}
                      className="w-full text-left p-2.5 rounded-lg bg-[#F5F7FB] dark:bg-[#101827] border border-slate-200 dark:border-slate-700 text-xs space-y-0.5 cursor-pointer hover:border-[#3978F6]"
                    >
                      <p className="font-mono font-semibold text-[#3978F6] tabular-nums">{a.time}</p>
                      <p className="font-semibold text-[#101827] dark:text-white truncate">{a.customerName}</p>
                      <p className="text-[11px] text-slate-500 truncate">{a.category}</p>
                    </button>
                  ))
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* MONTH VIEW */}
      {viewMode === 'month' && (() => {
        const yearMonth = selectedDate.slice(0, 7);
        const [yr, mo] = yearMonth.split('-').map(Number);
        const daysInMonth = new Date(yr, mo, 0).getDate();
        const monthTitle = new Date(`${yearMonth}-01T12:00:00Z`).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        return (
          <div className="p-5 rounded-xl bg-white dark:bg-[#172337] border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-base font-bold text-[#101827] dark:text-white">{monthTitle}</h2>
              <span className="text-xs text-slate-500">Click any day to inspect</span>
            </div>
            <div className="grid grid-cols-7 gap-2 text-xs">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                <div key={d} className="font-semibold text-slate-500 text-center py-1">{d}</div>
              ))}
              {Array.from({ length: daysInMonth }).map((_, idx) => {
                const dayNum = idx + 1;
                const iso = `${yearMonth}-${String(dayNum).padStart(2, '0')}`;
                const count = filteredApts.filter((a) => a.date === iso).length;
                const holiday = activeLocation?.holidays.find((h) => h.date === iso);
                return (
                  <button
                    key={iso}
                    type="button"
                    onClick={() => {
                      setSelectedDate(iso);
                      setViewMode('day');
                    }}
                    className={`min-h-[68px] p-2 rounded-lg border text-left flex flex-col justify-between cursor-pointer ${
                      holiday
                        ? 'bg-amber-50/70 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800'
                        : 'border-slate-200 dark:border-slate-800 hover:border-[#3978F6]'
                    }`}
                  >
                    <span className="font-mono tabular-nums font-medium">{dayNum}</span>
                    {holiday ? (
                      <span className="text-[10px] text-amber-700 dark:text-amber-300 truncate">{holiday.label}</span>
                    ) : count > 0 ? (
                      <span className="text-[11px] font-medium text-[#3978F6] tabular-nums">{count} booked</span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* AVAILABILITY CONFIGURATION */}
      {viewMode === 'availability' && activeLocation && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 p-5 rounded-xl bg-white dark:bg-[#172337] border border-slate-200 dark:border-slate-800 space-y-4">
            <h2 className="font-display text-base font-bold text-[#101827] dark:text-white">
              Bay Capacity & Operating Hours ({activeLocation.name})
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Concurrent Service Bays (Slot Capacity)"
                type="number"
                min={1}
                max={30}
                value={activeLocation.bayCount}
                onChange={(e) => updateLocation({ ...activeLocation, bayCount: Math.max(1, Number(e.target.value)) })}
              />
              <Input
                label="Default Appointment Slot (Minutes)"
                type="number"
                min={15}
                step={15}
                value={activeLocation.slotDurationMinutes}
                onChange={(e) => updateLocation({ ...activeLocation, slotDurationMinutes: Math.max(15, Number(e.target.value)) })}
              />
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {activeLocation.hours.map((h, idx) => (
                <div key={h.day} className="py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <span className="font-semibold w-24">{h.day}</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="time"
                      disabled={h.closed}
                      value={h.open}
                      onChange={(e) => {
                        const next = [...activeLocation.hours];
                        next[idx] = { ...h, open: e.target.value };
                        updateLocation({ ...activeLocation, hours: next });
                      }}
                      className="px-2 py-1 rounded border border-slate-300 dark:border-slate-700 bg-transparent disabled:opacity-40"
                    />
                    <span>to</span>
                    <input
                      type="time"
                      disabled={h.closed}
                      value={h.close}
                      onChange={(e) => {
                        const next = [...activeLocation.hours];
                        next[idx] = { ...h, close: e.target.value };
                        updateLocation({ ...activeLocation, hours: next });
                      }}
                      className="px-2 py-1 rounded border border-slate-300 dark:border-slate-700 bg-transparent disabled:opacity-40"
                    />
                  </div>
                  <label className="inline-flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={h.closed}
                      onChange={(e) => {
                        const next = [...activeLocation.hours];
                        next[idx] = { ...h, closed: e.target.checked };
                        updateLocation({ ...activeLocation, hours: next });
                      }}
                    />
                    <span>Closed</span>
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-5 p-5 rounded-xl bg-white dark:bg-[#172337] border border-slate-200 dark:border-slate-800 space-y-4">
            <h2 className="font-display text-base font-bold text-[#101827] dark:text-white">Holidays & Shop Closures</h2>
            <p className="text-xs text-slate-500">AI receptionist automatically blocks bookings on listed closure dates.</p>
            <div className="space-y-2">
              {activeLocation.holidays.map((hol) => (
                <div key={hol.date} className="flex items-center justify-between p-2.5 rounded-lg bg-[#F5F7FB] dark:bg-[#101827] text-xs">
                  <div>
                    <p className="font-semibold">{hol.label}</p>
                    <p className="font-mono text-slate-500">{hol.date}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      updateLocation({
                        ...activeLocation,
                        holidays: activeLocation.holidays.filter((x) => x.date !== hol.date),
                      })
                    }
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              iconLeft={<CalendarIcon className="w-3.5 h-3.5" />}
              onClick={() => {
                updateLocation({
                  ...activeLocation,
                  holidays: [...activeLocation.holidays, { date: '2027-01-01', label: "New Year's Day" }],
                });
                addToast({ title: 'Closure date added', variant: 'success' });
              }}
            >
              Add New Year's Day Closure
            </Button>

            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-2.5">
              <h3 className="font-display text-sm font-bold text-[#101827] dark:text-white">
                Relative Date Interpreter ({activeLocation.timezone})
              </h3>
              <p className="text-xs text-slate-500">
                Test natural spoken date phrases relative to shop date <span className="font-mono">{todayIso}</span>:
              </p>
              <Input
                value={relativePhrase}
                onChange={(e) => setRelativePhrase(e.target.value)}
                placeholder='e.g. "tomorrow", "next Monday", "the Friday after next"'
              />
              <div className="p-2.5 rounded-lg bg-[#F5F7FB] dark:bg-[#101827] text-xs font-mono">
                <span className="text-[#3978F6] font-semibold">{relativePreview.iso}</span> · {relativePreview.explanation}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* NEW / EDIT / RESCHEDULE MODAL */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingApt ? 'Edit or Reschedule Appointment' : 'Schedule New Appointment'}
        description="Checks bay capacity, duplicate customer slots, and holiday closures before saving."
      >
        <form onSubmit={handleSave} className="space-y-4">
          {conflictError && (
            <div role="alert" className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-xs text-[#DC4C4C]">
              <strong>Availability Conflict:</strong> {conflictError}
            </div>
          )}

          <Select
            label="Shop Location"
            value={form.locationId}
            onChange={(e) => setForm({ ...form, locationId: e.target.value })}
            options={locations.map((l) => ({ value: l.id, label: l.name }))}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Customer"
              value={form.customerId}
              onChange={(e) => setForm({ ...form, customerId: e.target.value })}
              options={customers.map((c) => ({ value: c.id, label: c.name }))}
            />
            <Select
              label="Vehicle"
              value={form.vehicleId}
              onChange={(e) => setForm({ ...form, vehicleId: e.target.value })}
              options={vehicles.map((v) => ({ value: v.id, label: `${v.year} ${v.make} ${v.model}` }))}
            />
          </div>
          <Select
            label="Service Category"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value as ServiceCategory })}
            options={allCategoryOptions}
          />
          <div className="grid grid-cols-3 gap-3">
            <Input label="Date" type="date" required value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            <Input label="Time" type="time" required value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} />
            <Input
              label="Duration (min)"
              type="number"
              min={30}
              step={15}
              value={form.durationMinutes}
              onChange={(e) => setForm({ ...form, durationMinutes: Number(e.target.value) })}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Assigned Employee"
              value={form.assignedEmployeeId}
              onChange={(e) => setForm({ ...form, assignedEmployeeId: e.target.value })}
              options={team.map((m) => ({ value: m.id, label: `${m.name} (${m.role})` }))}
            />
            <Select
              label="Status"
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value as AppointmentStatus })}
              options={['Scheduled', 'Confirmed', 'In Bay', 'Completed', 'Rescheduled', 'Cancelled'].map((s) => ({
                value: s,
                label: s,
              }))}
            />
          </div>
          <Textarea
            label="Internal Notes"
            rows={2}
            value={form.internalNotes}
            onChange={(e) => setForm({ ...form, internalNotes: e.target.value })}
            placeholder="Symptoms, waiter vs drop-off, fleet PO..."
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit">{editingApt ? 'Save Changes' : 'Confirm Booking'}</Button>
          </div>
        </form>
      </Modal>

      {/* CUSTOM APPOINTMENT CATEGORIES MODAL */}
      <Modal
        open={catModalOpen}
        onClose={() => setCatModalOpen(false)}
        title="Custom Appointment Categories & Rules"
        description="Define shop-specific service categories, slot durations, and per-slot bay limits."
      >
        <div className="space-y-4">
          <div className="space-y-2 max-h-56 overflow-y-auto">
            {customCategories.map((cat) => (
              <div
                key={cat.id}
                className="p-3 rounded-lg bg-[#F5F7FB] dark:bg-[#101827] border border-slate-200 dark:border-slate-800 flex items-start justify-between gap-3 text-xs"
              >
                <div>
                  <p className="font-semibold text-[#101827] dark:text-white">{cat.name}</p>
                  <p className="font-mono text-slate-500">
                    {cat.defaultDurationMinutes} min · Max {cat.maxPerSlot} per slot
                  </p>
                  {cat.notes && <p className="text-slate-500 mt-0.5">{cat.notes}</p>}
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  iconLeft={<Trash2 className="w-3.5 h-3.5" />}
                  onClick={() => removeCustomCategory(cat.id)}
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!newCatForm.name.trim()) return;
              addCustomCategory({
                name: newCatForm.name.trim(),
                defaultDurationMinutes: Number(newCatForm.defaultDurationMinutes),
                maxPerSlot: Number(newCatForm.maxPerSlot),
                notes: newCatForm.notes.trim(),
              });
              setNewCatForm({ name: '', defaultDurationMinutes: 60, maxPerSlot: 1, notes: '' });
            }}
            className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-3"
          >
            <Input
              label="New Category Name"
              required
              value={newCatForm.name}
              onChange={(e) => setNewCatForm({ ...newCatForm, name: e.target.value })}
              placeholder="e.g., ADAS Radar Calibration"
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Duration (min)"
                type="number"
                min={15}
                step={15}
                value={newCatForm.defaultDurationMinutes}
                onChange={(e) => setNewCatForm({ ...newCatForm, defaultDurationMinutes: Number(e.target.value) })}
              />
              <Input
                label="Max Per Time Slot"
                type="number"
                min={1}
                max={10}
                value={newCatForm.maxPerSlot}
                onChange={(e) => setNewCatForm({ ...newCatForm, maxPerSlot: Number(e.target.value) })}
              />
            </div>
            <Input
              label="Scheduling Rule Notes"
              value={newCatForm.notes}
              onChange={(e) => setNewCatForm({ ...newCatForm, notes: e.target.value })}
              placeholder="e.g., Requires level alignment rack"
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setCatModalOpen(false)}>Close</Button>
              <Button type="submit">Add Category</Button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
}
