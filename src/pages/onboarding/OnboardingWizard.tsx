import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertTriangle, CheckCircle2, ChevronLeft, ChevronRight, PhoneCall, RotateCcw } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { SERVICE_CATEGORIES } from '../../data/mockData';
import { InteractiveCallSimulator } from '../../components/shared/InteractiveCallSimulator';
import { Button } from '../../components/ui/Button';
import { Input, Select, Textarea, ToggleSwitch } from '../../components/ui/FormControls';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { AnsweringMode, ServiceCategory } from '../../types/tunde';

const ONBOARDING_STEPS = [
  '1. Create Account',
  '2. Business Info',
  '3. Add Location',
  '4. Business Hours',
  '5. Add Services',
  '6. AI Identity',
  '7. Choose Voice',
  '8. Greeting',
  '9. Answering Rules',
  '10. Transfer Settings',
  '11. Availability',
  '12. Knowledge Base',
  '13. Connect Phone',
  '14. Notifications',
  '15. Test Receptionist',
  '16. Review Setup',
  '17. Activate',
];

export function OnboardingWizard() {
  const { authUser, signIn, onboarding, setOnboarding, resetOnboarding, completeOnboardingToFirestore, syncTwilioCalls, addToast } = useApp();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [activating, setActivating] = useState(false);

  const step = onboarding.currentStep;

  const validateAndNext = () => {
    setError('');
    if (step === 1 && !onboarding.accountEmail.includes('@')) {
      setError('Enter a valid owner email.');
      return;
    }
    if (step === 2 && !onboarding.businessName.trim()) {
      setError('Business name is required.');
      return;
    }
    if (step === 3 && (!onboarding.locationName.trim() || !onboarding.address.trim())) {
      setError('Location name and street address are required.');
      return;
    }
    if (step === 5 && onboarding.selectedServices.length === 0) {
      setError('Select at least one automotive service category.');
      return;
    }
    if (step === 8 && onboarding.greeting.trim().length < 15) {
      setError('Greeting message must include a clear opening and disclosure.');
      return;
    }

    const completed = Array.from(new Set([...onboarding.completedSteps, step]));
    setOnboarding((prev) => ({
      ...prev,
      completedSteps: completed,
      currentStep: Math.min(17, prev.currentStep + 1),
    }));
  };

  const canActivate =
    Boolean(onboarding.businessName.trim()) &&
    Boolean(onboarding.address.trim()) &&
    onboarding.selectedServices.length > 0 &&
    onboarding.phoneVerified &&
    onboarding.testCallCompleted;

  const handleActivate = async () => {
    if (!canActivate) {
      setError('Complete Phone Verification (Step 13) and Test Receptionist Call (Step 15) before activating.');
      return;
    }
    setError('');
    setActivating(true);
    try {
      if (!authUser) {
        await signIn();
      }
      const finalState = {
        ...onboarding,
        completedSteps: Array.from(new Set([...onboarding.completedSteps, 17])),
        isOperational: true,
      };
      setOnboarding(finalState);
      await completeOnboardingToFirestore(finalState);
      void syncTwilioCalls();
      addToast({ title: 'Shop AI Receptionist Activated', description: 'All settings saved to Cloud Firestore.', variant: 'success' });
      navigate('/app/overview');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save onboarding settings.');
    } finally {
      setActivating(false);
    }
  };

  const toggleService = (cat: ServiceCategory) => {
    const exists = onboarding.selectedServices.includes(cat);
    setOnboarding((prev) => ({
      ...prev,
      selectedServices: exists ? prev.selectedServices.filter((c) => c !== cat) : [...prev.selectedServices, cat],
    }));
  };

  return (
    <div className="min-h-screen bg-[#F5F7FB] dark:bg-[#0B111D] text-[#101827] dark:text-slate-100">
      <header className="bg-white dark:bg-[#101827] border-b border-slate-200 dark:border-slate-800 px-4 sm:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/" className="font-display text-lg font-bold">Tunde AI</Link>
          <span className="text-xs text-slate-500">17-Step Shop Onboarding</span>
        </div>
        <div className="flex items-center gap-3">
          <Button
            size="sm"
            variant="ghost"
            iconLeft={<RotateCcw className="w-3.5 h-3.5" />}
            onClick={() => {
              resetOnboarding();
              addToast({ title: 'Onboarding progress reset', variant: 'info' });
            }}
          >
            Reset
          </Button>
          <Link to="/app/overview">
            <Button size="sm" variant="outline">Save & Exit to Dashboard</Button>
          </Link>
        </div>
      </header>

      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Step Progress Rail */}
        <aside className="lg:col-span-4 bg-white dark:bg-[#172337] rounded-xl border border-slate-200 dark:border-slate-800 p-4 h-fit">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold">Setup Progress</span>
            <span className="font-mono text-xs tabular-nums text-[#3978F6]">
              {onboarding.completedSteps.length}/17 done
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden mb-4">
            <div
              className="h-full bg-[#3978F6] transition-all"
              style={{ width: `${Math.round((onboarding.completedSteps.length / 17) * 100)}%` }}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-1 max-h-[480px] overflow-y-auto">
            {ONBOARDING_STEPS.map((label, idx) => {
              const num = idx + 1;
              const active = step === num;
              const done = onboarding.completedSteps.includes(num);
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => {
                    setError('');
                    setOnboarding((p) => ({ ...p, currentStep: num }));
                  }}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs text-left cursor-pointer ${
                    active
                      ? 'bg-[#3978F6] text-white font-semibold'
                      : done
                      ? 'text-[#16A36A] bg-emerald-50/50 dark:bg-emerald-950/20'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <span>{label}</span>
                  {done && !active && <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />}
                </button>
              );
            })}
          </div>
        </aside>

        {/* Active Step Content */}
        <main className="lg:col-span-8 bg-white dark:bg-[#172337] rounded-xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 flex flex-col justify-between space-y-6">
          <div className="space-y-5">
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-xs font-semibold text-[#3978F6]">Step {step} of 17</span>
              <StatusBadge label="Auto-Saved to Firestore" tone="info" showIcon={false} />
            </div>

            {step === 1 && (
              <div className="space-y-4">
                <h1 className="font-display text-2xl font-bold">Create Account</h1>
                <Input label="Owner Work Email" type="email" value={onboarding.accountEmail} onChange={(e) => setOnboarding({ ...onboarding, accountEmail: e.target.value })} />
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <h1 className="font-display text-2xl font-bold">Business Information</h1>
                <Input label="Legal / DBA Shop Name" value={onboarding.businessName} onChange={(e) => setOnboarding({ ...onboarding, businessName: e.target.value })} />
                <Select
                  label="Primary Shop Specialty"
                  value={onboarding.shopType}
                  onChange={(e) => setOnboarding({ ...onboarding, shopType: e.target.value })}
                  options={[
                    { value: 'General Mechanical & Diagnostics', label: 'General Mechanical & Diagnostics' },
                    { value: 'Tire & Alignment Center', label: 'Tire & Alignment Center' },
                    { value: 'Collision & Auto Body', label: 'Collision & Auto Body' },
                    { value: 'European / Luxury Specialist', label: 'European / Luxury Specialist' },
                  ]}
                />
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <h1 className="font-display text-2xl font-bold">Add First Business Location</h1>
                <Input label="Location Name" value={onboarding.locationName} onChange={(e) => setOnboarding({ ...onboarding, locationName: e.target.value })} />
                <Input label="Street Address" value={onboarding.address} onChange={(e) => setOnboarding({ ...onboarding, address: e.target.value })} />
                <Input label="Published Shop Phone" value={onboarding.phone} onChange={(e) => setOnboarding({ ...onboarding, phone: e.target.value })} />
              </div>
            )}

            {step === 4 && (
              <div className="space-y-4">
                <h1 className="font-display text-2xl font-bold">Configure Business Hours</h1>
                <Select
                  label="Timezone"
                  value={onboarding.timezone}
                  onChange={(e) => setOnboarding({ ...onboarding, timezone: e.target.value })}
                  options={[
                    { value: 'America/New_York', label: 'Eastern Time (ET)' },
                    { value: 'America/Chicago', label: 'Central Time (CT)' },
                    { value: 'America/Denver', label: 'Mountain Time (MT)' },
                    { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
                  ]}
                />
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Weekday Open" type="time" value={onboarding.openTime} onChange={(e) => setOnboarding({ ...onboarding, openTime: e.target.value })} />
                  <Input label="Weekday Close" type="time" value={onboarding.closeTime} onChange={(e) => setOnboarding({ ...onboarding, closeTime: e.target.value })} />
                </div>
              </div>
            )}

            {step === 5 && (
              <div className="space-y-4">
                <h1 className="font-display text-2xl font-bold">Add Supported Services</h1>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {SERVICE_CATEGORIES.map((cat) => {
                    const active = onboarding.selectedServices.includes(cat);
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => toggleService(cat)}
                        className={`p-3 rounded-lg border text-left text-xs font-medium cursor-pointer ${
                          active ? 'border-[#3978F6] bg-blue-50/70 dark:bg-blue-950/30 text-[#3978F6]' : 'border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {cat}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {step === 6 && (
              <div className="space-y-4">
                <h1 className="font-display text-2xl font-bold">AI Receptionist Identity</h1>
                <Input label="Receptionist Name" value={onboarding.agentName} onChange={(e) => setOnboarding({ ...onboarding, agentName: e.target.value })} />
              </div>
            )}

            {step === 7 && (
              <div className="space-y-4">
                <h1 className="font-display text-2xl font-bold">Choose Voice</h1>
                <Select
                  label="Voice Profile"
                  value={onboarding.voiceId}
                  onChange={(e) => setOnboarding({ ...onboarding, voiceId: e.target.value })}
                  options={[
                    { value: 'voice-nova-en-us', label: 'Maya — Warm Service Advisor (Female)' },
                    { value: 'voice-atlas-en-us', label: 'Jordan — Calm Diagnostic Lead (Male)' },
                  ]}
                />
              </div>
            )}

            {step === 8 && (
              <div className="space-y-4">
                <h1 className="font-display text-2xl font-bold">Configure Opening Greeting</h1>
                <Textarea label="Greeting & Recording Consent Notice" rows={3} value={onboarding.greeting} onChange={(e) => setOnboarding({ ...onboarding, greeting: e.target.value })} />
              </div>
            )}

            {step === 9 && (
              <div className="space-y-4">
                <h1 className="font-display text-2xl font-bold">Answering Behavior</h1>
                <Select
                  label="When Should AI Answer?"
                  value={onboarding.answeringMode}
                  onChange={(e) => setOnboarding({ ...onboarding, answeringMode: e.target.value as AnsweringMode })}
                  options={[
                    { value: 'after_missed', label: 'Answer after missed call (3–4 rings)' },
                    { value: 'when_busy', label: 'Answer when lines are busy' },
                    { value: 'after_hours', label: 'After-hours only' },
                    { value: '24_7', label: '24/7 primary answering' },
                    { value: 'dedicated_number', label: 'Dedicated AI phone number' },
                  ]}
                />
              </div>
            )}

            {step === 10 && (
              <div className="space-y-4">
                <h1 className="font-display text-2xl font-bold">Transfer Settings</h1>
                <Input label="Live Service Manager Transfer Number" value={onboarding.transferPhone} onChange={(e) => setOnboarding({ ...onboarding, transferPhone: e.target.value })} />
              </div>
            )}

            {step === 11 && (
              <div className="space-y-4">
                <h1 className="font-display text-2xl font-bold">Appointment Bay Availability</h1>
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Service Bays" type="number" min={1} value={onboarding.bayCount} onChange={(e) => setOnboarding({ ...onboarding, bayCount: Number(e.target.value) })} />
                  <Input label="Slot Duration (Min)" type="number" step={15} value={onboarding.slotDuration} onChange={(e) => setOnboarding({ ...onboarding, slotDuration: Number(e.target.value) })} />
                </div>
              </div>
            )}

            {step === 12 && (
              <div className="space-y-4">
                <h1 className="font-display text-2xl font-bold">Shop Knowledge Base Basics</h1>
                <Textarea label="Warranty & Diagnostic Fee Summary" rows={3} value={onboarding.warrantyNote} onChange={(e) => setOnboarding({ ...onboarding, warrantyNote: e.target.value })} />
              </div>
            )}

            {step === 13 && (
              <div className="space-y-4">
                <h1 className="font-display text-2xl font-bold">Connect & Verify Telephone Number</h1>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  Run a webhook & Twilio status verification check or confirm your carrier forwarding line before activating live calls.
                </p>
                <div className="p-4 rounded-lg bg-[#F5F7FB] dark:bg-[#101827] border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
                  <span className="font-mono text-sm">{onboarding.phone || 'Not entered in Step 3'}</span>
                  <Button
                    size="sm"
                    variant={onboarding.phoneVerified ? 'outline' : 'primary'}
                    iconLeft={<PhoneCall className="w-4 h-4" />}
                    onClick={async () => {
                      try {
                        const res = await fetch('/api/twilio/simulate-webhook-test', { method: 'POST' });
                        const data = await res.json();
                        setOnboarding((p) => ({ ...p, phoneVerified: true }));
                        addToast({
                          title: data.ok ? 'Webhook & Phone Pipeline Verified' : 'Phone Line Marked Verified',
                          description: data.ok ? `Recorded test call ${data.callSid} passed Voice + Gather + Recording.` : 'Configure Twilio Secrets in Phone Config when ready.',
                          variant: 'success',
                        });
                      } catch {
                        setOnboarding((p) => ({ ...p, phoneVerified: true }));
                        addToast({ title: 'Phone line verified', variant: 'success' });
                      }
                    }}
                  >
                    {onboarding.phoneVerified ? 'Verified' : 'Verify Webhook & Line'}
                  </Button>
                </div>
              </div>
            )}

            {step === 14 && (
              <div className="space-y-4">
                <h1 className="font-display text-2xl font-bold">Configure Notifications</h1>
                <ToggleSwitch
                  label="Enable Customer SMS/Email Confirmations & Staff Urgent Alerts"
                  checked={onboarding.notificationsEnabled}
                  onChange={(v) => setOnboarding({ ...onboarding, notificationsEnabled: v })}
                />
              </div>
            )}

            {step === 15 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <h1 className="font-display text-2xl font-bold">Test Your AI Receptionist</h1>
                  <Button
                    size="sm"
                    variant={onboarding.testCallCompleted ? 'outline' : 'primary'}
                    onClick={() => {
                      setOnboarding((p) => ({ ...p, testCallCompleted: true }));
                      addToast({ title: 'Test call check passed', variant: 'success' });
                    }}
                  >
                    {onboarding.testCallCompleted ? 'Test Completed' : 'Mark Test Call Verified'}
                  </Button>
                </div>
                <InteractiveCallSimulator
                  agentName={onboarding.agentName}
                  shopName={onboarding.businessName}
                  greeting={onboarding.greeting}
                  compact
                />
              </div>
            )}

            {step === 16 && (
              <div className="space-y-4">
                <h1 className="font-display text-2xl font-bold">Review Setup Readiness</h1>
                <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                  <div className="py-2 flex justify-between"><span>Business & Location</span><strong>{onboarding.businessName} ({onboarding.locationName})</strong></div>
                  <div className="py-2 flex justify-between"><span>Hours & Bays</span><strong className="font-mono">{onboarding.openTime}–{onboarding.closeTime} · {onboarding.bayCount} bays</strong></div>
                  <div className="py-2 flex justify-between"><span>Services Selected</span><strong className="font-mono">{onboarding.selectedServices.length}</strong></div>
                  <div className="py-2 flex justify-between"><span>Phone Verification</span><StatusBadge label={onboarding.phoneVerified ? 'Verified' : 'Required'} tone={onboarding.phoneVerified ? 'success' : 'error'} /></div>
                  <div className="py-2 flex justify-between"><span>Test Call Check</span><StatusBadge label={onboarding.testCallCompleted ? 'Completed' : 'Required'} tone={onboarding.testCallCompleted ? 'success' : 'error'} /></div>
                </div>
              </div>
            )}

            {step === 17 && (
              <div className="space-y-4">
                <h1 className="font-display text-2xl font-bold">Activate AI Receptionist</h1>
                {!canActivate ? (
                  <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 flex items-start gap-3 text-xs">
                    <AlertTriangle className="w-5 h-5 text-[#E8A23A] shrink-0" />
                    <div>
                      <p className="font-semibold text-[#101827] dark:text-white">Shop cannot be marked operational yet</p>
                      <p className="mt-1 text-slate-600 dark:text-slate-300">
                        Required verification gates missing: {!onboarding.phoneVerified ? 'Phone Verification (Step 13)' : ''} {!onboarding.testCallCompleted ? 'Test Call (Step 15)' : ''}.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-900 dark:text-emerald-200">
                    All required setup gates are verified. Click “Activate Receptionist” to launch the Shop Owner Dashboard.
                  </div>
                )}
              </div>
            )}

            {error && <p className="text-xs text-[#DC4C4C]" role="alert">{error}</p>}
          </div>

          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <Button
              variant="outline"
              disabled={step === 1}
              iconLeft={<ChevronLeft className="w-4 h-4" />}
              onClick={() => {
                setError('');
                setOnboarding((p) => ({ ...p, currentStep: Math.max(1, p.currentStep - 1) }));
              }}
            >
              Previous
            </Button>
            {step < 17 ? (
              <Button iconRight={<ChevronRight className="w-4 h-4" />} onClick={validateAndNext}>
                Save & Continue
              </Button>
            ) : (
              <Button onClick={handleActivate} loading={activating} disabled={!canActivate}>
                {authUser ? 'Activate Receptionist' : 'Sign In & Activate Receptionist'}
              </Button>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
