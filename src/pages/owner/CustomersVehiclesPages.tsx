import React, { useMemo, useState } from 'react';
import { Car, Plus, User } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Button } from '../../components/ui/Button';
import { Input, SearchField, Select, Textarea } from '../../components/ui/FormControls';
import { Drawer, Modal } from '../../components/ui/Overlays';
import { EmptyState } from '../../components/ui/Feedback';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Customer, Vehicle } from '../../types/tunde';

export function CustomersPage() {
  const { customers, addCustomer, vehicles, calls, appointments, callbacks, selectedLocationId, locations, addToast } = useApp();
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'New' | 'Returning'>('all');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [newForm, setNewForm] = useState({ name: '', phone: '', email: '', notes: '' });

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return customers.filter((c) => {
      if (selectedLocationId !== 'all' && c.locationId !== selectedLocationId) return false;
      if (statusFilter !== 'all' && c.status !== statusFilter) return false;
      if (!q) return true;
      return c.name.toLowerCase().includes(q) || c.phone.toLowerCase().includes(q) || c.email.toLowerCase().includes(q);
    });
  }, [customers, selectedLocationId, statusFilter, query]);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newForm.name.trim() || !newForm.phone.trim()) return;
    addCustomer({
      locationId: selectedLocationId === 'all' ? locations[0]?.id || 'loc_primary' : selectedLocationId,
      name: newForm.name.trim(),
      phone: newForm.phone.trim(),
      email: newForm.email.trim(),
      status: 'New',
      preferredContact: newForm.email.trim() ? 'Email' : 'SMS',
      notes: newForm.notes.trim(),
    });
    addToast({ title: 'Customer added', description: newForm.name, variant: 'success' });
    setCreateOpen(false);
    setNewForm({ name: '', phone: '', email: '', notes: '' });
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-[#101827] dark:text-white">Customers Directory</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Customer profiles with linked vehicles, call history, appointments, and callbacks
          </p>
        </div>
        <Button iconLeft={<Plus className="w-4 h-4" />} onClick={() => setCreateOpen(true)}>
          Add Customer
        </Button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1 p-1 rounded-lg bg-white dark:bg-[#172337] border border-slate-200 dark:border-slate-800">
          {(['all', 'New', 'Returning'] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md cursor-pointer ${
                statusFilter === s ? 'bg-[#3978F6] text-white' : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              {s === 'all' ? 'All Customers' : s}
            </button>
          ))}
        </div>
        <SearchField value={query} onChange={setQuery} placeholder="Search name, phone, email..." className="w-full sm:w-72" />
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={<User className="w-8 h-8" />} title="No matching customers" description="Try clearing filters or add a new customer." />
      ) : (
        <div className="rounded-xl bg-white dark:bg-[#172337] border border-slate-200 dark:border-slate-800 overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold text-slate-500 bg-slate-50 dark:bg-[#101827]/60">
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Contact</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Vehicles</th>
                <th className="py-3 px-4">Appointments</th>
                <th className="py-3 px-4 text-right">Profile</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
              {filtered.map((cust) => {
                const custVehs = vehicles.filter((v) => v.customerId === cust.id);
                const custApts = appointments.filter((a) => a.customerId === cust.id);
                return (
                  <tr
                    key={cust.id}
                    onClick={() => setSelectedCustomer(cust)}
                    className="hover:bg-slate-50 dark:hover:bg-[#101827]/40 cursor-pointer"
                  >
                    <td className="py-3 px-4 font-semibold text-[#101827] dark:text-white">{cust.name}</td>
                    <td className="py-3 px-4 text-xs">
                      <p className="font-mono tabular-nums">{cust.phone}</p>
                      <p className="text-slate-500">{cust.email}</p>
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge label={cust.status} tone={cust.status === 'Returning' ? 'info' : 'success'} showIcon={false} />
                    </td>
                    <td className="py-3 px-4 text-xs font-mono tabular-nums">{custVehs.length} on file</td>
                    <td className="py-3 px-4 text-xs font-mono tabular-nums">{custApts.length}</td>
                    <td className="py-3 px-4 text-right text-xs font-medium text-[#3978F6]">Inspect</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Customer Profile Drawer */}
      <Drawer
        open={Boolean(selectedCustomer)}
        onClose={() => setSelectedCustomer(null)}
        title={selectedCustomer?.name || ''}
        subtitle={selectedCustomer ? `${selectedCustomer.phone} · ${selectedCustomer.email}` : undefined}
      >
        {selectedCustomer && (
          <div className="space-y-6 text-sm">
            <div className="p-4 rounded-xl bg-[#F5F7FB] dark:bg-[#101827] border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-[#101827] dark:text-white">Profile Details</span>
                <StatusBadge label={selectedCustomer.status} tone="info" showIcon={false} />
              </div>
              <p>Preferred Contact: {selectedCustomer.preferredContact}</p>
              <p>Customer Since: <span className="font-mono">{selectedCustomer.createdAt}</span></p>
              <p className="text-slate-600 dark:text-slate-300">{selectedCustomer.notes || 'No advisor notes.'}</p>
            </div>

            <div>
              <h3 className="font-display text-sm font-bold mb-2">Vehicles</h3>
              <div className="space-y-2">
                {vehicles
                  .filter((v) => v.customerId === selectedCustomer.id)
                  .map((v) => (
                    <div key={v.id} className="p-3 rounded-lg border border-slate-200 dark:border-slate-700 text-xs">
                      <p className="font-semibold">{v.year} {v.make} {v.model} {v.trim}</p>
                      <p className="font-mono text-slate-500 mt-0.5">VIN: {v.vin} · {v.mileage.toLocaleString()} mi</p>
                    </div>
                  ))}
              </div>
            </div>

            <div>
              <h3 className="font-display text-sm font-bold mb-2">Call History</h3>
              <div className="space-y-2">
                {calls
                  .filter((c) => c.customerId === selectedCustomer.id)
                  .map((c) => (
                    <div key={c.id} className="p-3 rounded-lg border border-slate-200 dark:border-slate-700 text-xs">
                      <div className="flex justify-between">
                        <span className="font-semibold">{c.serviceRequest}</span>
                        <span className="font-mono text-slate-500">{c.date}</span>
                      </div>
                      <p className="text-slate-500 mt-1">{c.aiSummary}</p>
                    </div>
                  ))}
              </div>
            </div>

            <div>
              <h3 className="font-display text-sm font-bold mb-2">Appointments & Callbacks</h3>
              <div className="space-y-2 text-xs">
                {appointments
                  .filter((a) => a.customerId === selectedCustomer.id)
                  .map((a) => (
                    <div key={a.id} className="p-2.5 rounded-lg bg-slate-50 dark:bg-[#101827] flex justify-between">
                      <span>{a.category} ({a.date} {a.time})</span>
                      <StatusBadge label={a.status} tone="info" showIcon={false} />
                    </div>
                  ))}
                {callbacks
                  .filter((cb) => cb.customerId === selectedCustomer.id)
                  .map((cb) => (
                    <div key={cb.id} className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/20 flex justify-between">
                      <span>Callback: {cb.reason}</span>
                      <span>{cb.status}</span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}
      </Drawer>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Add Customer">
        <form onSubmit={handleCreate} className="space-y-4">
          <Input label="Full Name" required value={newForm.name} onChange={(e) => setNewForm({ ...newForm, name: e.target.value })} />
          <Input label="Phone Number" required value={newForm.phone} onChange={(e) => setNewForm({ ...newForm, phone: e.target.value })} />
          <Input label="Email" type="email" value={newForm.email} onChange={(e) => setNewForm({ ...newForm, email: e.target.value })} />
          <Textarea label="Notes" rows={2} value={newForm.notes} onChange={(e) => setNewForm({ ...newForm, notes: e.target.value })} />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button type="submit">Save Customer</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export function VehiclesPage() {
  const { vehicles, addVehicle, customers, selectedLocationId, locations, addToast } = useApp();
  const [query, setQuery] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [vForm, setVForm] = useState({
    customerId: customers[0]?.id || '',
    year: 2022,
    make: '',
    model: '',
    trim: '',
    mileage: 32000,
    vin: '',
  });

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return vehicles.filter((v) => {
      if (selectedLocationId !== 'all' && v.locationId !== selectedLocationId) return false;
      if (!q) return true;
      const owner = customers.find((c) => c.id === v.customerId)?.name.toLowerCase() || '';
      return (
        `${v.year} ${v.make} ${v.model} ${v.trim}`.toLowerCase().includes(q) ||
        v.vin.toLowerCase().includes(q) ||
        owner.includes(q)
      );
    });
  }, [vehicles, customers, selectedLocationId, query]);

  const handleAddVehicle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vForm.make.trim() || !vForm.model.trim()) return;
    addVehicle({
      customerId: vForm.customerId || customers[0]?.id || '',
      locationId: selectedLocationId === 'all' ? locations[0]?.id || 'loc_primary' : selectedLocationId,
      year: Number(vForm.year),
      make: vForm.make.trim(),
      model: vForm.model.trim(),
      trim: vForm.trim.trim(),
      mileage: Number(vForm.mileage),
      vin: vForm.vin.trim(),
      serviceHistory: [],
    });
    addToast({ title: 'Vehicle added', description: `${vForm.year} ${vForm.make} ${vForm.model}`, variant: 'success' });
    setAddOpen(false);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-[#101827] dark:text-white">Vehicles Directory</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Year, make, model, trim, mileage, VIN, and shop service history
          </p>
        </div>
        <div className="flex items-center gap-3">
          <SearchField value={query} onChange={setQuery} placeholder="Search make, model, VIN, owner..." className="w-64" />
          <Button iconLeft={<Plus className="w-4 h-4" />} onClick={() => setAddOpen(true)}>Add Vehicle</Button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={<Car className="w-8 h-8" />} title="No vehicles found" description="Adjust your search or add a new vehicle record." />
      ) : (
        <div className="rounded-xl bg-white dark:bg-[#172337] border border-slate-200 dark:border-slate-800 overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold text-slate-500 bg-slate-50 dark:bg-[#101827]/60">
                <th className="py-3 px-4">Vehicle</th>
                <th className="py-3 px-4">VIN</th>
                <th className="py-3 px-4">Mileage</th>
                <th className="py-3 px-4">Owner</th>
                <th className="py-3 px-4 text-right">Service Records</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
              {filtered.map((v) => {
                const owner = customers.find((c) => c.id === v.customerId);
                return (
                  <tr
                    key={v.id}
                    onClick={() => setSelectedVehicle(v)}
                    className="hover:bg-slate-50 dark:hover:bg-[#101827]/40 cursor-pointer"
                  >
                    <td className="py-3 px-4">
                      <p className="font-semibold text-[#101827] dark:text-white">{v.year} {v.make} {v.model}</p>
                      <p className="text-xs text-slate-500">{v.trim}</p>
                    </td>
                    <td className="py-3 px-4 font-mono text-xs tabular-nums">{v.vin}</td>
                    <td className="py-3 px-4 font-mono text-xs tabular-nums">{v.mileage.toLocaleString()} mi</td>
                    <td className="py-3 px-4 text-xs">{owner?.name || 'Unassigned'}</td>
                    <td className="py-3 px-4 text-right font-mono text-xs tabular-nums text-[#3978F6]">
                      {v.serviceHistory.length} entries
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Drawer
        open={Boolean(selectedVehicle)}
        onClose={() => setSelectedVehicle(null)}
        title={selectedVehicle ? `${selectedVehicle.year} ${selectedVehicle.make} ${selectedVehicle.model}` : ''}
        subtitle={selectedVehicle ? `VIN ${selectedVehicle.vin} · ${selectedVehicle.mileage.toLocaleString()} mi` : undefined}
      >
        {selectedVehicle && (
          <div className="space-y-4 text-sm">
            <div className="p-4 rounded-xl bg-[#F5F7FB] dark:bg-[#101827] border border-slate-200 dark:border-slate-800 text-xs space-y-1">
              <p>Trim: <strong>{selectedVehicle.trim || 'Standard'}</strong></p>
              <p>Plate: <span className="font-mono">{selectedVehicle.licensePlate || 'N/A'}</span></p>
              <p>Associated Owner: <strong>{customers.find((c) => c.id === selectedVehicle.customerId)?.name}</strong></p>
            </div>
            <h3 className="font-display text-sm font-bold">Service History</h3>
            {selectedVehicle.serviceHistory.length === 0 ? (
              <p className="text-xs text-slate-500">No completed repair orders recorded yet.</p>
            ) : (
              <div className="space-y-2.5">
                {selectedVehicle.serviceHistory.map((h, i) => (
                  <div key={i} className="p-3 rounded-lg border border-slate-200 dark:border-slate-700 text-xs">
                    <div className="flex justify-between font-semibold">
                      <span>{h.service}</span>
                      <span className="font-mono text-slate-500">{h.date}</span>
                    </div>
                    <p className="font-mono text-[11px] text-slate-500 mt-0.5">{h.mileage.toLocaleString()} mi</p>
                    <p className="mt-1 text-slate-600 dark:text-slate-300">{h.notes}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Drawer>

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add Vehicle">
        <form onSubmit={handleAddVehicle} className="space-y-4">
          <Select
            label="Customer"
            value={vForm.customerId}
            onChange={(e) => setVForm({ ...vForm, customerId: e.target.value })}
            options={customers.map((c) => ({ value: c.id, label: c.name }))}
          />
          <div className="grid grid-cols-3 gap-3">
            <Input label="Year" type="number" required value={vForm.year} onChange={(e) => setVForm({ ...vForm, year: Number(e.target.value) })} />
            <Input label="Make" required value={vForm.make} onChange={(e) => setVForm({ ...vForm, make: e.target.value })} placeholder="Toyota" />
            <Input label="Model" required value={vForm.model} onChange={(e) => setVForm({ ...vForm, model: e.target.value })} placeholder="RAV4" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Trim" value={vForm.trim} onChange={(e) => setVForm({ ...vForm, trim: e.target.value })} placeholder="XLE AWD" />
            <Input label="Mileage" type="number" value={vForm.mileage} onChange={(e) => setVForm({ ...vForm, mileage: Number(e.target.value) })} />
          </div>
          <Input label="VIN (17 characters)" value={vForm.vin} onChange={(e) => setVForm({ ...vForm, vin: e.target.value })} placeholder="1HGBH41JXMN109186" />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button type="submit">Save Vehicle</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
