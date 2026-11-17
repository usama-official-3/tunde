import React, { useState } from 'react';
import { CheckCircle2, Play, Plus, ShieldAlert, Trash2, UploadCloud } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ASSETS, SERVICE_CATEGORIES } from '../../data/mockData';
import { InteractiveCallSimulator } from '../../components/shared/InteractiveCallSimulator';
import { Button } from '../../components/ui/Button';
import { Input, Select, Textarea, ToggleSwitch } from '../../components/ui/FormControls';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { AnsweringMode, ServiceCategory } from '../../types/tunde';

const VOICE_OPTIONS = [
  { id: 'voice-nova-en-us', label: 'Maya — Warm Service Advisor (Female, US)', gender: 'Female' as const },
  { id: 'voice-claire-en-us', label: 'Claire — Crisp Front Desk (Female, US)', gender: 'Female' as const },
  { id: 'voice-atlas-en-us', label: 'Jordan — Calm Diagnostic Lead (Male, US)', gender: 'Male' as const },
  { id: 'voice-marcus-en-us', label: 'Marcus — Friendly Garage Advisor (Male, US)', gender: 'Male' as const },
];

const ANSWERING_MODES: { id: AnsweringMode; label: string; desc: string }[] = [
  { id: 'never', label: 'Never answer automatically', desc: 'Agent paused; calls ring straight through to shop.' },
  { id: 'after_missed', label: 'Answer after missed call', desc: 'Picks up automatically if front desk does not answer within N rings.' },
  { id: 'when_busy', label: 'Answer when busy', desc: 'Handles overflow calls when all shop lines are occupied.' },
  { id: 'after_hours', label: 'After-hours answering', desc: 'Answers nights, weekends, and holiday closures.' },
  { id: '24_7', label: '24/7 answering', desc: 'Answers all inbound calls first and transfers live requests.' },
  { id: 'dedicated_number', label: 'Dedicated AI number', desc: 'Answers a standalone local Tunde AI phone number directly.' },
];

export function AIReceptionistPage() {
  const { agentConfigs, updateAgentConfig, publishAgentConfig, locations, selectedLocationId, team, addToast } = useApp();
  const targetLocId = selectedLocationId === 'all' ? locations[0]?.id || 'loc_primary' : selectedLocationId;
  const agent = agentConfigs.find((a) => a.locationId === targetLocId) || agentConfigs[0];
  const loc = locations.find((l) => l.id === agent?.locationId) || locations[0];
  const [previewPlaying, setPreviewPlaying] = useState(false);

  if (!agent || !loc) {
    return (
      <div className="p-8 rounded-xl bg-white dark:bg-[#172337] border border-slate-200 dark:border-slate-800 text-center text-sm text-slate-500">
        Loading your shop AI receptionist configuration from Cloud Firestore...
      </div>
    );
  }

  const handleVoicePreview = () => {
    setPreviewPlaying(true);
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        const utter = new SpeechSynthesisUtterance(agent.greetingMessage);
        utter.rate = 1.0;
        utter.onend = () => setPreviewPlaying(false);
        utter.onerror = () => setPreviewPlaying(false);
        window.speechSynthesis.speak(utter);
      } catch {
        setTimeout(() => setPreviewPlaying(false), 1800);
      }
    } else {
      setTimeout(() => setPreviewPlaying(false), 1800);
    }
    addToast({ title: 'Playing voice preview', description: `${agent.name} (${agent.voiceGender})`, variant: 'info' });
  };

  const toggleCategory = (cat: ServiceCategory) => {
    const exists = agent.schedulingRules.supportedCategories.includes(cat);
    const next = exists
      ? agent.schedulingRules.supportedCategories.filter((c) => c !== cat)
      : [...agent.schedulingRules.supportedCategories, cat];
    updateAgentConfig({
      ...agent,
      schedulingRules: { ...agent.schedulingRules, supportedCategories: next },
    });
  };

  return (
    <div className="space-y-6">
      {/* Header + Publish Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 rounded-xl bg-white dark:bg-[#172337] border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-4">
          <img
            src={agent.avatarUrl || ASSETS.agentAvatar}
            alt={agent.name}
            referrerPolicy="no-referrer"
            className="w-12 h-12 rounded-full object-cover border border-slate-300 dark:border-slate-700"
          />
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display text-xl font-bold text-[#101827] dark:text-white">
                AI Receptionist · {agent.name}
              </h1>
              <StatusBadge label={agent.isActive ? 'Active' : 'Paused'} tone={agent.isActive ? 'success' : 'neutral'} />
              {agent.hasUnpublishedDraft && <StatusBadge label="Unpublished Draft Changes" tone="warning" />}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Location: {loc.name} · Last published {agent.publishedAt}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => updateAgentConfig({ ...agent, isActive: !agent.isActive })}
          >
            {agent.isActive ? 'Pause Receptionist' : 'Activate Receptionist'}
          </Button>
          <Button
            size="sm"
            iconLeft={<UploadCloud className="w-4 h-4" />}
            onClick={() => publishAgentConfig(agent.id)}
          >
            Publish Changes
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 space-y-6">
          {/* 1. Identity & 2. Voice */}
          <section className="p-5 rounded-xl bg-white dark:bg-[#172337] border border-slate-200 dark:border-slate-800 space-y-4">
            <h2 className="font-display text-base font-bold text-[#101827] dark:text-white">1. Agent Identity & 2. Agent Voice</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Agent Name"
                value={agent.name}
                onChange={(e) => updateAgentConfig({ ...agent, name: e.target.value })}
              />
              <Select
                label="Voice Selection (Provider-Supported)"
                value={agent.voiceId}
                onChange={(e) => {
                  const chosen = VOICE_OPTIONS.find((v) => v.id === e.target.value);
                  updateAgentConfig({
                    ...agent,
                    voiceId: e.target.value,
                    voiceGender: chosen?.gender || agent.voiceGender,
                  });
                }}
                options={VOICE_OPTIONS.map((v) => ({ value: v.id, label: v.label }))}
              />
            </div>
            <div className="flex items-center justify-between gap-4 p-3 rounded-lg bg-[#F5F7FB] dark:bg-[#101827] border border-slate-200 dark:border-slate-800 text-xs">
              <span>Selected voice gender: <strong>{agent.voiceGender}</strong></span>
              <Button size="sm" variant="outline" loading={previewPlaying} iconLeft={<Play className="w-3.5 h-3.5" />} onClick={handleVoicePreview}>
                {previewPlaying ? 'Playing Sample...' : 'Preview Voice'}
              </Button>
            </div>
          </section>

          {/* 3. Greeting, 4. Personality, 5. Speaking Style */}
          <section className="p-5 rounded-xl bg-white dark:bg-[#172337] border border-slate-200 dark:border-slate-800 space-y-4">
            <h2 className="font-display text-base font-bold text-[#101827] dark:text-white">
              3. Greeting, 4. Personality & 5. Speaking Style
            </h2>
            <Textarea
              label="Opening Greeting Message"
              rows={3}
              value={agent.greetingMessage}
              onChange={(e) => updateAgentConfig({ ...agent, greetingMessage: e.target.value })}
              helperText="Include your recording disclosure notice as required by state law."
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="Personality / Tone"
                value={agent.tone}
                onChange={(e) => updateAgentConfig({ ...agent, tone: e.target.value as typeof agent.tone })}
                options={[
                  { value: 'Warm & Professional', label: 'Warm & Professional' },
                  { value: 'Direct & Efficient', label: 'Direct & Efficient' },
                  { value: 'Friendly Neighborhood', label: 'Friendly Neighborhood' },
                ]}
              />
              <Select
                label="Speaking Style"
                value={agent.speakingStyle}
                onChange={(e) => updateAgentConfig({ ...agent, speakingStyle: e.target.value as typeof agent.speakingStyle })}
                options={[
                  { value: 'Conversational', label: 'Conversational' },
                  { value: 'Concise', label: 'Concise' },
                  { value: 'Detailed Advisor', label: 'Detailed Advisor' },
                ]}
              />
            </div>
          </section>

          {/* 6. Business Hours & 7. Call Answering Rules */}
          <section className="p-5 rounded-xl bg-white dark:bg-[#172337] border border-slate-200 dark:border-slate-800 space-y-4">
            <h2 className="font-display text-base font-bold text-[#101827] dark:text-white">
              6. Business Hours & 7. Call Answering Rules
            </h2>
            <p className="text-xs text-slate-500">
              Active hours synced from <strong>{loc.name}</strong> ({loc.bayCount} service bays).
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {ANSWERING_MODES.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => updateAgentConfig({ ...agent, answeringMode: m.id })}
                  className={`p-3 rounded-lg border text-left cursor-pointer transition-colors ${
                    agent.answeringMode === m.id
                      ? 'border-[#3978F6] bg-blue-50/70 dark:bg-blue-950/30'
                      : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-[#101827]'
                  }`}
                >
                  <p className="text-xs font-semibold text-[#101827] dark:text-white">{m.label}</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{m.desc}</p>
                </button>
              ))}
            </div>
            {(agent.answeringMode === 'after_missed' || agent.answeringMode === 'when_busy') && (
              <Input
                label="Rings Before AI Picks Up"
                type="number"
                min={2}
                max={8}
                value={agent.ringsBeforePickup}
                onChange={(e) => updateAgentConfig({ ...agent, ringsBeforePickup: Number(e.target.value) })}
              />
            )}
          </section>

          {/* 8. Transfer Settings */}
          <section className="p-5 rounded-xl bg-white dark:bg-[#172337] border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-base font-bold text-[#101827] dark:text-white">8. Transfer Settings</h2>
              <Button
                size="sm"
                variant="outline"
                iconLeft={<Plus className="w-3.5 h-3.5" />}
                onClick={() =>
                  updateAgentConfig({
                    ...agent,
                    transferRules: [
                      ...agent.transferRules,
                      {
                        id: `tr-${Date.now()}`,
                        trigger: 'Customer asks for live parts status',
                        destinationMemberId: team[1]?.id || team[0]?.id || '',
                        destinationPhone: team[1]?.phone || team[0]?.phone || '',
                        enabled: true,
                      },
                    ],
                  })
                }
              >
                Add Transfer Rule
              </Button>
            </div>
            <div className="space-y-3">
              {agent.transferRules.map((rule, idx) => (
                <div key={rule.id} className="p-3 rounded-lg border border-slate-200 dark:border-slate-700 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <Input
                      value={rule.trigger}
                      onChange={(e) => {
                        const next = [...agent.transferRules];
                        next[idx] = { ...rule, trigger: e.target.value };
                        updateAgentConfig({ ...agent, transferRules: next });
                      }}
                    />
                    <button
                      type="button"
                      aria-label="Delete rule"
                      onClick={() =>
                        updateAgentConfig({
                          ...agent,
                          transferRules: agent.transferRules.filter((r) => r.id !== rule.id),
                        })
                      }
                      className="p-2 text-slate-400 hover:text-[#DC4C4C]"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
                    <select
                      value={rule.destinationMemberId}
                      onChange={(e) => {
                        const member = team.find((m) => m.id === e.target.value);
                        const next = [...agent.transferRules];
                        next[idx] = {
                          ...rule,
                          destinationMemberId: e.target.value,
                          destinationPhone: member?.phone || rule.destinationPhone,
                        };
                        updateAgentConfig({ ...agent, transferRules: next });
                      }}
                      className="px-2.5 py-1.5 rounded-md border border-slate-300 dark:border-slate-700 bg-transparent"
                    >
                      {team.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name} ({m.phone})
                        </option>
                      ))}
                    </select>
                    <label className="inline-flex items-center gap-1.5">
                      <input
                        type="checkbox"
                        checked={rule.enabled}
                        onChange={(e) => {
                          const next = [...agent.transferRules];
                          next[idx] = { ...rule, enabled: e.target.checked };
                          updateAgentConfig({ ...agent, transferRules: next });
                        }}
                      />
                      <span>Enabled</span>
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* 9. Scheduling Rules & 10. Custom Instructions */}
          <section className="p-5 rounded-xl bg-white dark:bg-[#172337] border border-slate-200 dark:border-slate-800 space-y-4">
            <h2 className="font-display text-base font-bold text-[#101827] dark:text-white">
              9. Scheduling Rules & 10. Custom Instructions
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Max AI Bookings Per Day"
                type="number"
                value={agent.schedulingRules.maxDailyBookings}
                onChange={(e) =>
                  updateAgentConfig({
                    ...agent,
                    schedulingRules: { ...agent.schedulingRules, maxDailyBookings: Number(e.target.value) },
                  })
                }
              />
              <Input
                label="Buffer Between Slots (Minutes)"
                type="number"
                value={agent.schedulingRules.bufferMinutes}
                onChange={(e) =>
                  updateAgentConfig({
                    ...agent,
                    schedulingRules: { ...agent.schedulingRules, bufferMinutes: Number(e.target.value) },
                  })
                }
              />
            </div>

            <ToggleSwitch
              label="Allow Same-Day AI Bookings"
              checked={agent.schedulingRules.allowSameDayBooking}
              onChange={(v) =>
                updateAgentConfig({
                  ...agent,
                  schedulingRules: { ...agent.schedulingRules, allowSameDayBooking: v },
                })
              }
            />
            <ToggleSwitch
              label="Require 17-Char VIN for Diagnostics"
              checked={agent.schedulingRules.requireVinForDiagnostics}
              onChange={(v) =>
                updateAgentConfig({
                  ...agent,
                  schedulingRules: { ...agent.schedulingRules, requireVinForDiagnostics: v },
                })
              }
            />

            <div>
              <p className="text-xs font-medium text-slate-600 dark:text-slate-300 mb-2">Allowed AI Booking Categories:</p>
              <div className="flex flex-wrap gap-2">
                {SERVICE_CATEGORIES.map((cat) => {
                  const active = agent.schedulingRules.supportedCategories.includes(cat);
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => toggleCategory(cat)}
                      className={`px-2.5 py-1 text-xs rounded-md border cursor-pointer ${
                        active
                          ? 'bg-[#3978F6] text-white border-[#3978F6]'
                          : 'bg-slate-50 dark:bg-[#101827] text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>
            </div>

            <Textarea
              label="10. Custom Shop Instructions"
              rows={3}
              value={agent.customInstructions}
              onChange={(e) => updateAgentConfig({ ...agent, customInstructions: e.target.value })}
            />
            <div className="flex items-start gap-2 p-3 rounded-lg bg-slate-50 dark:bg-[#101827] border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-400">
              <ShieldAlert className="w-4 h-4 text-[#E8A23A] shrink-0 mt-0.5" />
              <span>Custom instructions cannot override platform safety, recording consent notices, or bay conflict verification.</span>
            </div>
          </section>
        </div>

        {/* Right Column: 11. Test Your Agent & 12. Configuration Summary */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-5 rounded-xl bg-white dark:bg-[#172337] border border-slate-200 dark:border-slate-800 space-y-3">
            <h2 className="font-display text-base font-bold text-[#101827] dark:text-white">
              12. Configuration Summary & Activation
            </h2>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Receptionist State</span>
                <span className="font-semibold">{agent.isActive ? 'Active' : 'Paused'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Answering Rule</span>
                <span className="font-semibold">{ANSWERING_MODES.find((m) => m.id === agent.answeringMode)?.label}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Transfer Rules Enabled</span>
                <span className="font-mono font-semibold">{agent.transferRules.filter((r) => r.enabled).length}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-500">Categories Enabled</span>
                <span className="font-mono font-semibold">{agent.schedulingRules.supportedCategories.length}</span>
              </div>
            </div>
            <Button className="w-full" iconLeft={<CheckCircle2 className="w-4 h-4" />} onClick={() => publishAgentConfig(agent.id)}>
              Publish Configuration
            </Button>
          </div>

          <div className="space-y-2">
            <h2 className="font-display text-base font-bold text-[#101827] dark:text-white">11. Test Your Agent</h2>
            <InteractiveCallSimulator
              agentName={agent.name}
              shopName={loc.name}
              greeting={agent.greetingMessage}
              compact
            />
          </div>
        </div>
      </div>
    </div>
  );
}
