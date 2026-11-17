import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { GitCompare, History, RotateCcw, Save, ShieldAlert, UploadCloud } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { InteractiveCallSimulator } from '../../components/shared/InteractiveCallSimulator';
import { Button } from '../../components/ui/Button';
import { Input, Textarea } from '../../components/ui/FormControls';
import { Modal } from '../../components/ui/Overlays';
import { StatusBadge } from '../../components/ui/StatusBadge';

export function AdminAIAgentsPage() {
  const { agentConfigs, locations, updateAgentConfig, publishAgentConfig } = useApp();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-[#101827] dark:text-white">AI Agents Administration</h1>
          <p className="text-xs text-slate-500 mt-1">Inspect tenant receptionists, voices, fallback behavior, and prompt releases</p>
        </div>
        <Link to="/admin/prompts"><Button size="sm">Open Prompt Management</Button></Link>
      </div>

      <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 flex items-start gap-3 text-xs text-amber-900 dark:text-amber-200">
        <ShieldAlert className="w-5 h-5 text-[#E8A23A] shrink-0" />
        <div>
          <strong>Platform Safety Safeguard:</strong> Custom business prompts and admin overrides cannot bypass platform safety policies, customer privacy boundaries, bay booking verification, or two-party recording consent disclosures.
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {agentConfigs.map((agent) => {
          const loc = locations.find((l) => l.id === agent.locationId);
          return (
            <div key={agent.id} className="p-5 rounded-xl bg-white dark:bg-[#172337] border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="font-display text-base font-bold text-[#101827] dark:text-white">{agent.name}</h2>
                  <p className="text-xs text-slate-500">{loc?.name}</p>
                </div>
                <StatusBadge label={agent.isActive ? 'Active' : 'Paused'} tone={agent.isActive ? 'success' : 'neutral'} />
              </div>
              <div className="text-xs space-y-1 text-slate-600 dark:text-slate-300">
                <p>Voice: <span className="font-mono">{agent.voiceId}</span> ({agent.voiceGender})</p>
                <p>Answering Mode: <strong>{agent.answeringMode}</strong></p>
                <p>Published: <span className="font-mono">{agent.publishedAt}</span></p>
              </div>
              <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <Link to="/admin/prompts"><Button size="sm" variant="primary">Edit Prompts & Workflows</Button></Link>
                <Button size="sm" variant="outline" onClick={() => updateAgentConfig({ ...agent, isActive: !agent.isActive })}>
                  {agent.isActive ? 'Pause Agent' : 'Activate Agent'}
                </Button>
                {agent.hasUnpublishedDraft && (
                  <Button size="sm" variant="secondary" onClick={() => publishAgentConfig(agent.id)}>Publish Draft</Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function AdminPromptsPage() {
  const { promptVersions, savePromptDraft, publishPromptVersion, rollbackPromptVersion, knowledgeBase, businessId, businessProfile, authUser } = useApp();
  const latest = promptVersions[0] || {
    id: 'starter-template',
    version: 'v1.0.0',
    businessId: businessId || 'default',
    businessName: businessProfile?.name || knowledgeBase.businessName || 'My Auto Shop',
    author: authUser?.email || 'Super Admin',
    createdAt: new Date().toISOString().slice(0, 16),
    status: 'Draft' as const,
    systemPrompt:
      'You are Tunde AI, a calm, professional automotive service receptionist. Collect caller name, phone number, vehicle year/make/model, and service issue. Check bay capacity before confirming times and never guess repair pricing.',
    customInstructions: knowledgeBase.customBusinessInstructions || 'Confirm Check Engine Light solid vs flashing before booking.',
    requiredQuestions: ['Customer Name', 'Callback Phone', 'Vehicle Year/Make/Model', 'Service Request'],
    workflowSteps: [
      'Greet caller & disclose call recording policy',
      'Collect vehicle Year/Make/Model and symptom',
      'Triage safety warnings (e.g., flashing CEL -> tow recommendation)',
      'Check live bay availability and confirm booking or callback',
    ],
    fallbackResponse: 'Let me have our Service Manager return your call shortly so we can verify bay availability for your vehicle.',
    changeNote: 'Initial shop prompt configuration',
  };

  const [systemPrompt, setSystemPrompt] = useState(latest.systemPrompt);
  const [customInstructions, setCustomInstructions] = useState(latest.customInstructions);
  const [requiredQuestions, setRequiredQuestions] = useState(latest.requiredQuestions.join(', '));
  const [workflowStepsText, setWorkflowStepsText] = useState((latest.workflowSteps || []).join('\n'));
  const [fallbackResponse, setFallbackResponse] = useState(latest.fallbackResponse);
  const [changeNote, setChangeNote] = useState('');
  const [compareVersionId, setCompareVersionId] = useState(promptVersions[1]?.id || latest.id);
  const [publishConfirmId, setPublishConfirmId] = useState<string | null>(null);
  const [showDiff, setShowDiff] = useState(false);

  const compareTarget = promptVersions.find((p) => p.id === compareVersionId) || latest;

  const handleSaveDraft = () => {
    const nextNum = `v1.${promptVersions.length + 1}.0`;
    savePromptDraft({
      version: nextNum,
      businessId: businessId || 'default',
      businessName: businessProfile?.name || knowledgeBase.businessName || 'My Auto Shop',
      author: authUser?.email || 'Super Admin',
      status: 'Draft',
      systemPrompt,
      customInstructions,
      requiredQuestions: requiredQuestions.split(',').map((q) => q.trim()).filter(Boolean),
      workflowSteps: workflowStepsText.split('\n').map((s) => s.trim()).filter(Boolean),
      fallbackResponse,
      changeNote: changeNote || 'Admin prompt revision draft',
    });
    setChangeNote('');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-[#101827] dark:text-white">Prompt & Workflow Management</h1>
          <p className="text-xs text-slate-500 mt-1">
            Edit system prompts, required intake questions, fallback responses, compare versions, and publish/rollback
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" iconLeft={<GitCompare className="w-4 h-4" />} onClick={() => setShowDiff((v) => !v)}>
            {showDiff ? 'Hide Version Diff' : 'Compare Versions'}
          </Button>
          <Button variant="outline" size="sm" iconLeft={<Save className="w-4 h-4" />} onClick={handleSaveDraft}>
            Save Draft
          </Button>
          {promptVersions[0] && (
            <Button size="sm" iconLeft={<UploadCloud className="w-4 h-4" />} onClick={() => setPublishConfirmId(promptVersions[0].id)}>
              Publish Latest
            </Button>
          )}
        </div>
      </div>

      {/* Mandatory Safeguard Warning */}
      <div role="alert" className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 flex items-start gap-3 text-xs text-rose-900 dark:text-rose-200">
        <ShieldAlert className="w-5 h-5 text-[#DC4C4C] shrink-0" />
        <div>
          <strong>Immutable Platform Guardrails:</strong> Custom prompts and business instructions cannot override platform safety checks, privacy rules, bay availability verification, or mandatory recording consent disclosures.
        </div>
      </div>

      {showDiff && (
        <div className="p-5 rounded-xl bg-white dark:bg-[#172337] border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-sm font-bold">Version Diff Comparison</h2>
            <select
              value={compareVersionId}
              onChange={(e) => setCompareVersionId(e.target.value)}
              className="px-2.5 py-1 text-xs rounded border border-slate-300 dark:border-slate-700 bg-transparent"
            >
              {promptVersions.map((pv) => (
                <option key={pv.id} value={pv.id}>{pv.version} ({pv.status})</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-[#101827] border border-slate-200 dark:border-slate-800">
              <p className="font-semibold mb-1 text-slate-500">Selected Baseline: {compareTarget.version}</p>
              <p className="whitespace-pre-wrap">{compareTarget.systemPrompt}</p>
            </div>
            <div className="p-3 rounded-lg bg-blue-50/40 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
              <p className="font-semibold mb-1 text-[#3978F6]">Current Editor Buffer</p>
              <p className="whitespace-pre-wrap">{systemPrompt}</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 space-y-5">
          <div className="p-5 rounded-xl bg-white dark:bg-[#172337] border border-slate-200 dark:border-slate-800 space-y-4">
            <Textarea label="System Prompt Editor" rows={5} value={systemPrompt} onChange={(e) => setSystemPrompt(e.target.value)} />
            <Textarea label="Business-Specific Instructions" rows={3} value={customInstructions} onChange={(e) => setCustomInstructions(e.target.value)} />
            <Textarea
              label="Custom Conversation Workflow Steps (one step per line)"
              rows={5}
              value={workflowStepsText}
              onChange={(e) => setWorkflowStepsText(e.target.value)}
            />
            <Input
              label="Required Intake Questions (comma-separated)"
              value={requiredQuestions}
              onChange={(e) => setRequiredQuestions(e.target.value)}
            />
            <Textarea label="Fallback Response (When Uncertain or Transfer Fails)" rows={2} value={fallbackResponse} onChange={(e) => setFallbackResponse(e.target.value)} />
            <Input
              label="Version Change Note (Audit Reason)"
              value={changeNote}
              onChange={(e) => setChangeNote(e.target.value)}
              placeholder="e.g., Added EV high-voltage triage check"
            />
          </div>

          <div className="p-5 rounded-xl bg-white dark:bg-[#172337] border border-slate-200 dark:border-slate-800 space-y-2">
            <h2 className="font-display text-sm font-bold">Injected Business Knowledge Context (Read-Only Snapshot)</h2>
            <p className="text-xs text-slate-500 font-mono">
              {knowledgeBase.businessName} · Hours: {knowledgeBase.hoursSummary} · Diagnostic Policy: {knowledgeBase.diagnosticFees}
            </p>
          </div>
        </div>

        <div className="lg:col-span-5 space-y-5">
          {/* Version History */}
          <div className="p-5 rounded-xl bg-white dark:bg-[#172337] border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-[#3978F6]" />
              <h2 className="font-display text-base font-bold">Version History</h2>
            </div>
            <div className="space-y-2.5 max-h-64 overflow-y-auto">
              {promptVersions.map((pv) => (
                <div key={pv.id} className="p-3 rounded-lg bg-[#F5F7FB] dark:bg-[#101827] border border-slate-200 dark:border-slate-800 text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold">{pv.version}</span>
                    <StatusBadge label={pv.status} tone={pv.status === 'Published' ? 'success' : pv.status === 'Draft' ? 'info' : 'neutral'} />
                  </div>
                  <p className="text-slate-600 dark:text-slate-300">{pv.changeNote}</p>
                  <p className="text-[11px] text-slate-500">{pv.author} · {pv.createdAt}</p>
                  <div className="flex gap-2 pt-1">
                    {pv.status === 'Draft' && (
                      <Button size="sm" variant="primary" onClick={() => setPublishConfirmId(pv.id)}>Publish</Button>
                    )}
                    {pv.status === 'Archived' && (
                      <Button size="sm" variant="outline" iconLeft={<RotateCcw className="w-3 h-3" />} onClick={() => rollbackPromptVersion(pv.id)}>
                        Rollback
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <InteractiveCallSimulator agentName="Maya (Test Sandbox)" shopName={businessProfile?.name || knowledgeBase.businessName || 'Shop'} compact />
        </div>
      </div>

      <Modal
        open={Boolean(publishConfirmId)}
        onClose={() => setPublishConfirmId(null)}
        title="Confirm Prompt Release"
        description="Publishing updates the active AI prompt version and records an entry in the Admin Audit Log."
      >
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setPublishConfirmId(null)}>Cancel</Button>
          <Button
            onClick={() => {
              if (publishConfirmId) publishPromptVersion(publishConfirmId);
              setPublishConfirmId(null);
            }}
          >
            Confirm Publish
          </Button>
        </div>
      </Modal>
    </div>
  );
}
