import React, { useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Mic,
  MicOff,
  PhoneCall,
  PhoneOff,
  RotateCcw,
  Send,
  Sparkles,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { ASSETS } from '../../data/mockData';
import { useApp } from '../../context/AppContext';
import { Button } from '../ui/Button';
import { StatusBadge } from '../ui/StatusBadge';
import { ServiceCategory } from '../../types/tunde';

function offsetIsoDate(days: number): string {
  return new Date(Date.now() + days * 86400000).toISOString().slice(0, 10);
}

interface SimTurn {
  id: string;
  speaker: 'AI' | 'Caller';
  text: string;
  time: string;
}

interface ExtractedIntake {
  customerName?: string;
  phoneNumber?: string;
  email?: string;
  vehicleYear?: string;
  vehicleMake?: string;
  vehicleModel?: string;
  serviceCategory?: string;
  requestedDate?: string;
  requestedTime?: string;
  isDrivable?: string;
  safetyUrgent?: boolean;
}

const SCENARIOS = [
  {
    id: 'cel',
    label: 'Check Engine Light',
    callerPrompt: 'Hi, my 2019 Honda CR-V check engine light came on today and it idles rough.',
    aiReply:
      'I can help schedule a diagnostic check right away. First, is the check engine light solid or flashing? And what is your name so I can check our diagnostic bay openings?',
    followUpPrompt: "It's solid yellow. My name is Sarah Jenkins, email sarah.j@example.com, phone 614-555-8821.",
    aiConfirm:
      'Thank you, Sarah. I confirmed sarah.j@example.com. Since the light is solid, it is safe to drive short distances. Our diagnostic fee applies toward approved repairs. We have an opening tomorrow at 08:30 AM or the day after at 10:00 AM. Which works better?',
    finalPrompt: 'Tomorrow at 8:30 AM works.',
    aiBooked:
      'Confirmed for Sarah Jenkins — 2019 Honda CR-V Check Engine Diagnostics tomorrow at 08:30 AM. Confirmation details prepared for sarah.j@example.com.',
    intake: {
      customerName: 'Sarah Jenkins',
      phoneNumber: '(614) 555-8821',
      email: 'sarah.j@example.com',
      vehicleYear: '2019',
      vehicleMake: 'Honda',
      vehicleModel: 'CR-V',
      serviceCategory: 'Check Engine Diagnostics',
      requestedTime: '08:30',
    },
  },
  {
    id: 'brakes',
    label: 'Brake Grinding',
    callerPrompt: 'My 2018 BMW 330i is making a grinding noise whenever I brake. Can I bring it in tomorrow?',
    aiReply:
      'Grinding from the brakes should be inspected promptly so we do not damage the rotors. Could I get your full name, phone, and email to reserve a brake bay?',
    followUpPrompt: 'Derek Cole, 614-555-3190, derek.cole@example.com.',
    aiConfirm:
      'Thanks, Derek. Confirming derek.cole@example.com. We have a Brake Inspection slot open tomorrow at 09:00 AM or 13:30 PM. Shall I reserve 09:00 AM for your 2018 BMW 330i?',
    finalPrompt: 'Yes, book 9:00 AM please.',
    aiBooked:
      'Appointment reserved for Derek Cole — 2018 BMW 330i Brake Inspection tomorrow at 09:00 AM. Please drive cautiously or let us know if you need towing.',
    intake: {
      customerName: 'Derek Cole',
      phoneNumber: '(614) 555-3190',
      email: 'derek.cole@example.com',
      vehicleYear: '2018',
      vehicleMake: 'BMW',
      vehicleModel: '330i',
      serviceCategory: 'Brake Inspection',
      requestedTime: '09:00',
    },
  },
  {
    id: 'safety',
    label: 'Flashing CEL (Safety Triage)',
    callerPrompt: 'My 2020 Ford F-150 check engine light is flashing rapidly and it is shaking badly.',
    aiReply:
      'A flashing check engine light indicates an active misfire that can damage your catalytic converter. Please pull over safely and avoid driving the truck. Can I arrange a tow-in or urgent callback from our Service Manager?',
    followUpPrompt: 'Yes, my name is Malik Vance, 614-555-4410. Please have the manager call me right away.',
    aiConfirm:
      'I have flagged this as an Urgent Tow-In / Flashing CEL callback for Malik Vance (2020 Ford F-150) at (614) 555-4410. Our Service Manager is being alerted immediately.',
    finalPrompt: 'Thank you.',
    aiBooked: 'Urgent callback logged and priority alert dispatched to the front desk.',
    intake: {
      customerName: 'Malik Vance',
      phoneNumber: '(614) 555-4410',
      vehicleYear: '2020',
      vehicleMake: 'Ford',
      vehicleModel: 'F-150',
      serviceCategory: 'Check Engine Diagnostics',
      safetyUrgent: true,
    },
  },
];

export function InteractiveCallSimulator({
  agentName = 'Maya',
  shopName = 'Our Auto Shop',
  greeting,
  compact = false,
}: {
  agentName?: string;
  shopName?: string;
  greeting?: string;
  compact?: boolean;
}) {
  const { knowledgeBase, agentConfigs, locations, appointments, logSimulatedCallOutcome } = useApp();
  const [mode, setMode] = useState<'live_gemini' | 'scripted'>('live_gemini');
  const [activeScenarioId, setActiveScenarioId] = useState(SCENARIOS[0].id);
  const scenario = SCENARIOS.find((s) => s.id === activeScenarioId) || SCENARIOS[0];
  const [step, setStep] = useState(0);
  const [callActive, setCallActive] = useState(true);
  const [customInput, setCustomInput] = useState('');
  const [sending, setSending] = useState(false);
  const [voiceSpeak, setVoiceSpeak] = useState(false);
  const [apiError, setApiError] = useState('');
  const [savedToDashboard, setSavedToDashboard] = useState(false);
  const [extracted, setExtracted] = useState<ExtractedIntake>({});

  // Real Browser Microphone Call Recording (MediaRecorder -> saved into CallRecord.recordingUrl)
  const [recordingMic, setRecordingMic] = useState(false);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | undefined>(undefined);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const todayIso = useMemo(() => offsetIsoDate(0), []);
  const tomorrowIso = useMemo(() => offsetIsoDate(1), []);

  const initialGreeting =
    greeting ||
    `Thank you for calling ${shopName}. This call may be recorded for quality and scheduling. My name is ${agentName}, your service receptionist. How can I help with your vehicle today?`;

  const [turns, setTurns] = useState<SimTurn[]>([
    { id: 'init-1', speaker: 'AI', time: '00:02', text: initialGreeting },
  ]);

  const toggleMicRecording = async () => {
    if (recordingMic && mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setRecordingMic(false);
      return;
    }
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setApiError('Browser microphone recording is not supported in this context.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mr = new MediaRecorder(stream, { audioBitsPerSecond: 32000 });
      mr.ondataavailable = (ev) => {
        if (ev.data.size > 0) audioChunksRef.current.push(ev.data);
      };
      mr.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        if (blob.size > 0 && blob.size < 480000) {
          const reader = new FileReader();
          reader.onloadend = () => {
            if (typeof reader.result === 'string') setRecordedAudioUrl(reader.result);
          };
          reader.readAsDataURL(blob);
        } else if (blob.size >= 480000) {
          setApiError('Audio clip exceeded 480 KB Firestore attachment limit; please keep clips under 30s or use Twilio voice calls for unlimited recording storage.');
        }
      };
      mediaRecorderRef.current = mr;
      mr.start();
      setRecordingMic(true);
      setApiError('');
    } catch {
      setApiError('Microphone permission denied or unavailable.');
    }
  };

  const speakText = (text: string) => {
    if (!voiceSpeak || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      utter.rate = 1.02;
      window.speechSynthesis.speak(utter);
    } catch {
      // ignore speech synthesis errors
    }
  };

  const resetCall = (nextScenarioId = activeScenarioId) => {
    if (recordingMic && mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setRecordingMic(false);
    }
    setActiveScenarioId(nextScenarioId);
    setStep(0);
    setCallActive(true);
    setApiError('');
    setSavedToDashboard(false);
    setRecordedAudioUrl(undefined);
    setExtracted({});
    setTurns([{ id: `init-${Date.now()}`, speaker: 'AI', time: '00:02', text: initialGreeting }]);
  };

  const saveOutcomeToDashboard = (
    intakeData: ExtractedIntake,
    outcome: 'Booked' | 'Callback Required',
    transcriptTurns: SimTurn[]
  ) => {
    if (savedToDashboard) return;
    logSimulatedCallOutcome({
      customerName: intakeData.customerName || 'Web Call Customer',
      phoneNumber: intakeData.phoneNumber || 'Unknown',
      email: intakeData.email,
      vehicleYear: Number(intakeData.vehicleYear) || 2020,
      vehicleMake: intakeData.vehicleMake || 'Vehicle',
      vehicleModel: intakeData.vehicleModel || 'Model',
      serviceCategory: (intakeData.serviceCategory as ServiceCategory) || 'General Diagnostics',
      date: intakeData.requestedDate || tomorrowIso,
      time: intakeData.requestedTime || '09:00',
      outcome,
      urgency: intakeData.safetyUrgent ? 'Urgent' : 'High',
      summary: `${outcome} via AI Receptionist Session (${intakeData.serviceCategory || 'Service inquiry'})`,
      transcript: transcriptTurns.map((t) => ({ speaker: t.speaker, timestamp: t.time, text: t.text })),
      recordingUrl: recordedAudioUrl,
    });
    setSavedToDashboard(true);
  };

  const advanceScenario = () => {
    if (!callActive) return;
    const formatTime = (s: number) => `00:${String(s).padStart(2, '0')}`;
    if (step === 0) {
      const nextTurns: SimTurn[] = [
        ...turns,
        { id: `c-${Date.now()}`, speaker: 'Caller', time: formatTime(10), text: scenario.callerPrompt },
        { id: `a-${Date.now() + 1}`, speaker: 'AI', time: formatTime(14), text: scenario.aiReply },
      ];
      setTurns(nextTurns);
      speakText(scenario.aiReply);
      setStep(1);
    } else if (step === 1) {
      const nextTurns: SimTurn[] = [
        ...turns,
        { id: `c-${Date.now()}`, speaker: 'Caller', time: formatTime(24), text: scenario.followUpPrompt },
        { id: `a-${Date.now() + 1}`, speaker: 'AI', time: formatTime(29), text: scenario.aiConfirm },
      ];
      setTurns(nextTurns);
      setExtracted({ ...scenario.intake, requestedDate: tomorrowIso });
      speakText(scenario.aiConfirm);
      setStep(2);
    } else if (step === 2) {
      const nextTurns: SimTurn[] = [
        ...turns,
        { id: `c-${Date.now()}`, speaker: 'Caller', time: formatTime(40), text: scenario.finalPrompt },
        { id: `a-${Date.now() + 1}`, speaker: 'AI', time: formatTime(45), text: scenario.aiBooked },
      ];
      setTurns(nextTurns);
      speakText(scenario.aiBooked);
      setStep(3);
      saveOutcomeToDashboard(
        { ...scenario.intake, requestedDate: tomorrowIso },
        scenario.id === 'safety' ? 'Callback Required' : 'Booked',
        nextTurns
      );
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const msg = customInput.trim();
    if (!msg || !callActive || sending) return;

    const callerTurn: SimTurn = {
      id: `u-${Date.now()}`,
      speaker: 'Caller',
      time: `00:${String(Math.min(59, turns.length * 8)).padStart(2, '0')}`,
      text: msg,
    };
    const nextHistory = [...turns, callerTurn];
    setTurns(nextHistory);
    setCustomInput('');
    setApiError('');

    if (mode === 'scripted') {
      const reply =
        'Scripted Walkthrough Mode: Switch to "Live Gemini AI" above to converse dynamically using your shop Knowledge Base and real bay availability.';
      setTurns([...nextHistory, { id: `r-${Date.now()}`, speaker: 'AI', time: '00:45', text: reply }]);
      return;
    }

    setSending(true);
    try {
      const activeLoc = locations[0];
      const bayCount = activeLoc?.bayCount || 4;
      const tz = activeLoc?.timezone || 'America/New_York';
      const activeAgent = agentConfigs[0];
      const availableSlots = [
        { date: offsetIsoDate(1), times: ['08:30', '09:00', '10:30', '13:30', '15:00'], baysOpen: bayCount },
        { date: offsetIsoDate(2), times: ['08:00', '10:00', '11:30', '14:00'], baysOpen: bayCount },
        { date: offsetIsoDate(3), times: ['08:30', '11:00', '13:00', '15:30'], baysOpen: bayCount },
      ].map((day) => ({
        ...day,
        times: day.times.filter(
          (t) => appointments.filter((a) => a.date === day.date && a.time === t && a.status !== 'Cancelled').length < bayCount
        ),
      }));

      const res = await fetch('/api/ai/receptionist-turn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: nextHistory,
          currentDateIso: todayIso,
          timezone: tz,
          availableSlots,
          shopContext: {
            agentName: activeAgent?.name || agentName,
            shopName: knowledgeBase.businessName || shopName,
            address: knowledgeBase.address,
            phone: knowledgeBase.phone,
            hoursSummary: knowledgeBase.hoursSummary,
            supportedMakes: knowledgeBase.supportedMakes,
            diagnosticFees: knowledgeBase.diagnosticFees,
            warrantyInfo: knowledgeBase.warrantyInfo,
            towingPolicy: knowledgeBase.towingPolicy,
            customInstructions: activeAgent?.customInstructions || knowledgeBase.customBusinessInstructions,
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setApiError(data.error || 'Gemini AI request failed.');
        setSending(false);
        return;
      }

      const aiTurn: SimTurn = {
        id: `ai-${Date.now()}`,
        speaker: 'AI',
        time: `00:${String(Math.min(59, nextHistory.length * 8 + 4)).padStart(2, '0')}`,
        text: data.reply || 'How else can I help with your vehicle?',
      };
      const updatedTurns = [...nextHistory, aiTurn];
      setTurns(updatedTurns);
      speakText(aiTurn.text);

      const mergedIntake: ExtractedIntake = {
        ...extracted,
        ...(data.extracted || {}),
      };
      setExtracted(mergedIntake);

      if (data.action === 'book') {
        saveOutcomeToDashboard(mergedIntake, 'Booked', updatedTurns);
      } else if (data.action === 'callback' || data.action === 'safety_alert' || data.action === 'transfer') {
        saveOutcomeToDashboard(mergedIntake, 'Callback Required', updatedTurns);
      }
    } catch (err: unknown) {
      setApiError(err instanceof Error ? err.message : 'Network error reaching /api/ai/receptionist-turn');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#172337] overflow-hidden">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#101827]">
        <div className="flex items-center gap-3">
          <img
            src={ASSETS.agentAvatar}
            alt={`${agentName} avatar`}
            referrerPolicy="no-referrer"
            className="w-9 h-9 rounded-full object-cover border border-slate-300 dark:border-slate-700"
          />
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold text-[#101827] dark:text-white">{agentName} · AI Service Receptionist</span>
              <StatusBadge label={callActive ? 'Session Active' : 'Call Ended'} tone={callActive ? 'info' : 'neutral'} />
              {savedToDashboard && <StatusBadge label="Saved to Dashboard" tone="success" />}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {mode === 'live_gemini'
                ? 'Live Gemini AI Receptionist (/api/ai/receptionist-turn) · Reads real bay slots & Knowledge Base'
                : 'Scripted Prototype Walkthrough · Offline demonstration mode'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={toggleMicRecording}
            title="Record browser microphone audio onto this Call Record"
            className={`px-2.5 py-1.5 text-xs font-medium rounded-lg border flex items-center gap-1.5 cursor-pointer ${
              recordingMic
                ? 'border-[#DC4C4C] bg-rose-50 dark:bg-rose-950/30 text-[#DC4C4C]'
                : recordedAudioUrl
                ? 'border-[#16A36A] bg-emerald-50 dark:bg-emerald-950/30 text-[#16A36A]'
                : 'border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300'
            }`}
          >
            {recordingMic ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
            <span>{recordingMic ? 'Stop Rec' : recordedAudioUrl ? 'Audio Recorded' : 'Record Mic'}</span>
          </button>
          <button
            type="button"
            onClick={() => setVoiceSpeak((v) => !v)}
            title="Toggle browser voice playback for AI replies"
            className={`px-2.5 py-1.5 text-xs font-medium rounded-lg border flex items-center gap-1.5 cursor-pointer ${
              voiceSpeak
                ? 'border-[#3978F6] bg-blue-50 dark:bg-blue-950/30 text-[#3978F6]'
                : 'border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300'
            }`}
          >
            {voiceSpeak ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            <span>{voiceSpeak ? 'Voice On' : 'Voice Off'}</span>
          </button>
          <Button variant="outline" size="sm" iconLeft={<RotateCcw className="w-3.5 h-3.5" />} onClick={() => resetCall()}>
            Restart
          </Button>
          <Button
            variant={callActive ? 'danger' : 'primary'}
            size="sm"
            iconLeft={callActive ? <PhoneOff className="w-3.5 h-3.5" /> : <PhoneCall className="w-3.5 h-3.5" />}
            onClick={() => setCallActive((v) => !v)}
          >
            {callActive ? 'End Call' : 'Reconnect'}
          </Button>
        </div>
      </div>

      {/* Mode + Scenario Bar */}
      <div className="px-4 py-2.5 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 bg-white dark:bg-[#172337]">
        <div className="flex items-center gap-1 p-0.5 rounded-lg bg-slate-100 dark:bg-[#101827] border border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={() => {
              setMode('live_gemini');
              setApiError('');
            }}
            className={`px-2.5 py-1 text-xs font-medium rounded-md flex items-center gap-1 cursor-pointer ${
              mode === 'live_gemini' ? 'bg-[#3978F6] text-white' : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            <Sparkles className="w-3 h-3" />
            <span>Live Gemini AI</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('scripted');
              setApiError('');
            }}
            className={`px-2.5 py-1 text-xs font-medium rounded-md cursor-pointer ${
              mode === 'scripted' ? 'bg-[#101827] text-white dark:bg-slate-200 dark:text-[#101827]' : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            Scripted Walkthrough
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {SCENARIOS.map((sc) => (
            <button
              key={sc.id}
              type="button"
              onClick={() => resetCall(sc.id)}
              className={`px-2.5 py-1 text-xs font-medium rounded-md border cursor-pointer ${
                activeScenarioId === sc.id
                  ? 'border-[#3978F6] text-[#3978F6] bg-blue-50/50 dark:bg-blue-950/30'
                  : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
              }`}
            >
              {sc.label}
            </button>
          ))}
        </div>
      </div>

      {/* Live Extracted Intake Bar */}
      {(extracted.customerName || extracted.vehicleMake || extracted.safetyUrgent) && (
        <div className="px-4 py-2 bg-slate-50 dark:bg-[#101827]/70 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
          <span className="font-semibold text-[#101827] dark:text-white">Captured Intake:</span>
          {extracted.customerName && <span>Caller: <strong>{extracted.customerName}</strong></span>}
          {extracted.vehicleMake && (
            <span>Vehicle: <strong>{extracted.vehicleYear} {extracted.vehicleMake} {extracted.vehicleModel}</strong></span>
          )}
          {extracted.serviceCategory && <span>Service: <strong>{extracted.serviceCategory}</strong></span>}
          {extracted.requestedDate && (
            <span className="font-mono">Slot: {extracted.requestedDate} {extracted.requestedTime || ''}</span>
          )}
          {extracted.safetyUrgent && <StatusBadge label="Safety Urgent Triage" tone="error" />}
        </div>
      )}

      {/* Transcript Stream */}
      <div className={`p-4 space-y-3 overflow-y-auto ${compact ? 'h-60' : 'h-76'} bg-[#F5F7FB] dark:bg-[#0E1523]`}>
        {turns.map((turn) => (
          <div key={turn.id} className={`flex flex-col ${turn.speaker === 'Caller' ? 'items-end' : 'items-start'}`}>
            <div className="flex items-center gap-2 mb-1 text-[11px] text-slate-500 dark:text-slate-400">
              <span>{turn.speaker === 'AI' ? agentName : 'Caller'}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums">{turn.time}</span>
            </div>
            <div
              className={`max-w-[85%] rounded-xl px-3.5 py-2.5 text-sm leading-relaxed ${
                turn.speaker === 'AI'
                  ? 'bg-white dark:bg-[#172337] text-[#101827] dark:text-slate-100 border border-slate-200 dark:border-slate-700'
                  : 'bg-[#3978F6] text-white'
              }`}
            >
              {turn.text}
            </div>
          </div>
        ))}
        {sending && (
          <div className="text-xs text-slate-500 italic">AI Receptionist is checking bay availability...</div>
        )}
      </div>

      {/* Explicit Error Banner (Never masks missing key/upstream errors) */}
      {apiError && (
        <div role="alert" className="px-4 py-2.5 bg-rose-50 dark:bg-rose-950/30 border-t border-rose-200 dark:border-rose-800 flex items-center justify-between gap-3 text-xs text-[#DC4C4C]">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{apiError}</span>
          </div>
          <Button size="sm" variant="outline" onClick={() => { setMode('scripted'); setApiError(''); }}>
            Use Scripted Walkthrough
          </Button>
        </div>
      )}

      {/* Input & Walkthrough Controls */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-[#172337] space-y-3">
        {mode === 'scripted' && callActive && step < 3 && (
          <div className="flex items-center justify-between gap-3 p-2.5 rounded-lg bg-slate-50 dark:bg-[#101827] border border-slate-200 dark:border-slate-800">
            <span className="text-xs text-slate-600 dark:text-slate-300 truncate">
              Next scripted caller line:{' '}
              <strong className="text-[#101827] dark:text-white">
                {step === 0 ? scenario.callerPrompt : step === 1 ? scenario.followUpPrompt : scenario.finalPrompt}
              </strong>
            </span>
            <Button size="sm" variant="secondary" onClick={advanceScenario}>
              Speak Next Line
            </Button>
          </div>
        )}

        <form onSubmit={handleSendMessage} className="flex items-center gap-2">
          <div className="relative flex-1">
            <Mic className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
            <input
              type="text"
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              disabled={!callActive || sending}
              placeholder={
                callActive
                  ? 'Ask e.g. "My 2018 BMW 330i brakes are grinding, can I come in next Friday morning?"'
                  : 'Reconnect call to continue'
              }
              className="w-full min-h-[40px] pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#101827] text-[#101827] dark:text-slate-100 disabled:opacity-50"
            />
          </div>
          <Button type="submit" loading={sending} disabled={!callActive || !customInput.trim()} iconLeft={<Send className="w-3.5 h-3.5" />}>
            Send
          </Button>
        </form>

        {savedToDashboard && (
          <div className="flex items-center gap-2 text-xs text-[#16A36A]">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Customer, vehicle, transcript{recordedAudioUrl ? ', audio recording,' : ''} and appointment/callback were saved to your Cloud Firestore dashboard.</span>
          </div>
        )}
      </div>
    </div>
  );
}
