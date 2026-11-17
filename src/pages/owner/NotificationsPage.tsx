import React, { useState } from 'react';
import { Mail, MessageSquare, Save } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Button } from '../../components/ui/Button';
import { Input, ToggleSwitch } from '../../components/ui/FormControls';
import { Tabs } from '../../components/ui/Navigation';

export function NotificationsPage() {
  const { notifications, updateNotifications } = useApp();
  const [form, setForm] = useState(notifications);
  const [previewTab, setPreviewTab] = useState<'sms' | 'email'>('sms');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateNotifications(form);
  };

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-[#101827] dark:text-white">Notifications & Reminders</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Automated customer confirmations, reminders, and internal urgent callback alerts
          </p>
        </div>
        <Button type="submit" iconLeft={<Save className="w-4 h-4" />}>
          Save Preferences
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6 p-5 rounded-xl bg-white dark:bg-[#172337] border border-slate-200 dark:border-slate-800 space-y-2 divide-y divide-slate-100 dark:divide-slate-800">
          <ToggleSwitch label="Email Appointment Confirmations" description="Send branded booking summary to customer email." checked={form.emailConfirmations} onChange={(v) => setForm({ ...form, emailConfirmations: v })} />
          <ToggleSwitch label="SMS Appointment Confirmations" description="Immediate text confirmation upon AI or manual booking." checked={form.smsConfirmations} onChange={(v) => setForm({ ...form, smsConfirmations: v })} />
          <ToggleSwitch label="24-Hour Appointment Reminders" description="Automated SMS/email reminder 24 hours before bay slot." checked={form.reminder24h} onChange={(v) => setForm({ ...form, reminder24h: v })} />
          <ToggleSwitch label="Same-Day Morning Reminders" description="Reminder sent at 7:00 AM on service day with drop-off directions." checked={form.reminderSameDay} onChange={(v) => setForm({ ...form, reminderSameDay: v })} />
          <ToggleSwitch label="Cancellation Notifications" description="Notify customer and dispatch desk when cancelled." checked={form.cancellationAlerts} onChange={(v) => setForm({ ...form, cancellationAlerts: v })} />
          <ToggleSwitch label="Rescheduling Notifications" description="Confirm updated date/time after rescheduling." checked={form.rescheduleAlerts} onChange={(v) => setForm({ ...form, rescheduleAlerts: v })} />
          <ToggleSwitch label="Staff Callback Alerts" description="Alert assigned advisor when AI creates a callback task." checked={form.callbackAlerts} onChange={(v) => setForm({ ...form, callbackAlerts: v })} />
          <ToggleSwitch label="Urgent Request Alerts (Tow-In / Breakdown)" description="Immediate SMS/email escalation for stranded vehicle calls." checked={form.urgentRequestAlerts} onChange={(v) => setForm({ ...form, urgentRequestAlerts: v })} />

          <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input label="Staff Alert Email" value={form.alertRecipientEmail} onChange={(e) => setForm({ ...form, alertRecipientEmail: e.target.value })} />
            <Input label="Staff Alert SMS Number" value={form.alertRecipientPhone} onChange={(e) => setForm({ ...form, alertRecipientPhone: e.target.value })} />
          </div>
        </div>

        {/* Branded Template Previews */}
        <div className="lg:col-span-6 p-5 rounded-xl bg-white dark:bg-[#172337] border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-display text-base font-bold text-[#101827] dark:text-white">Branded Template Preview</h2>
            <Tabs
              activeId={previewTab}
              onChange={(id) => setPreviewTab(id as 'sms' | 'email')}
              tabs={[
                { id: 'sms', label: 'SMS Template' },
                { id: 'email', label: 'Email Template' },
              ]}
            />
          </div>

          {previewTab === 'sms' ? (
            <div className="p-5 rounded-xl bg-[#F5F7FB] dark:bg-[#101827] border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <MessageSquare className="w-4 h-4 text-[#3978F6]" />
                <span>SMS Preview (Not dispatched in prototype)</span>
              </div>
              <div className="p-4 rounded-xl bg-[#3978F6] text-white text-sm leading-relaxed max-w-md">
                Apex Auto Care: Your Brake Inspection for your 2021 BMW X5 is confirmed for Tue Nov 17 at 9:00 AM (418 Industrial Way). Reply R to reschedule or call (614) 555-0142.
              </div>
            </div>
          ) : (
            <div className="p-5 rounded-xl bg-[#F5F7FB] dark:bg-[#101827] border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Mail className="w-4 h-4 text-[#3978F6]" />
                <span>Email Preview (All 9 required PRD fields · AI confirms email accurately before sending)</span>
              </div>
              <div className="rounded-lg bg-white dark:bg-[#172337] border border-slate-200 dark:border-slate-700 overflow-hidden text-xs">
                <div className="px-4 py-3 bg-[#101827] text-white font-display font-bold flex items-center justify-between">
                  <span>Apex Auto Care — Downtown Flagship</span>
                  <span className="text-[11px] font-normal text-slate-300">Appointment Confirmed</span>
                </div>
                <div className="p-4 space-y-2.5 text-slate-700 dark:text-slate-200">
                  <p>Hello <strong>Marcus Henderson</strong>,</p>
                  <p>Your service bay appointment is confirmed. Here are your complete booking details:</p>
                  <div className="p-3 rounded bg-slate-50 dark:bg-[#101827] space-y-1 font-mono text-[11px]">
                    <p>Shop Name: Apex Auto Care — Downtown Flagship</p>
                    <p>Customer Name: Marcus Henderson</p>
                    <p>Appointment Date: Tuesday, November 17, 2026</p>
                    <p>Appointment Time: 9:00 AM</p>
                    <p>Vehicle: 2021 BMW X5 xDrive40i</p>
                    <p>Service Requested: Brake Inspection</p>
                    <p>Shop Address: 418 Industrial Way, Columbus, OH 43215</p>
                    <p>Shop Phone: (614) 555-0142</p>
                  </div>
                  <p className="text-slate-600 dark:text-slate-300">
                    <strong>Shop Drop-Off Instructions:</strong> After-hours key drop box is mounted beside Bay 1. Complimentary local Uber rides are available within 10 miles.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </form>
  );
}
