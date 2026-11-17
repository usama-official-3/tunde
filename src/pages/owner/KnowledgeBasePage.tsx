import React, { useState } from 'react';
import { Eye, Plus, Save } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Button } from '../../components/ui/Button';
import { Input, SearchField, Textarea } from '../../components/ui/FormControls';
import { Modal } from '../../components/ui/Overlays';

export function KnowledgeBasePage() {
  const { knowledgeBase, updateKnowledgeBase } = useApp();
  const [draft, setDraft] = useState(knowledgeBase);
  const [query, setQuery] = useState('');
  const [previewOpen, setPreviewOpen] = useState(false);

  const sections = [
    { key: 'profile', title: 'Business Profile, Address & Contact Details' },
    { key: 'hours', title: 'Business Hours & Holiday Hours' },
    { key: 'services', title: 'Services Offered, Services Not Offered & Supported Makes' },
    { key: 'policies', title: 'Warranty, Diagnostic Fees & Inspection Policies' },
    { key: 'payments', title: 'Payment Methods, Financing & Towing' },
    { key: 'faqs', title: 'Frequently Asked Questions & Custom Instructions' },
  ].filter((s) => !query.trim() || s.title.toLowerCase().includes(query.toLowerCase()));

  const saveAll = (e: React.FormEvent) => {
    e.preventDefault();
    updateKnowledgeBase(draft);
  };

  return (
    <form onSubmit={saveAll} className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-[#101827] dark:text-white">Shop Knowledge Base</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Structured answers your AI receptionist references during live customer calls · Updated {knowledgeBase.lastUpdated}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <SearchField value={query} onChange={setQuery} placeholder="Filter sections..." className="w-56" />
          <Button type="button" variant="outline" iconLeft={<Eye className="w-4 h-4" />} onClick={() => setPreviewOpen(true)}>
            Preview AI Context
          </Button>
          <Button type="submit" iconLeft={<Save className="w-4 h-4" />}>
            Save Knowledge Base
          </Button>
        </div>
      </div>

      <div className="space-y-5">
        {sections.some((s) => s.key === 'profile') && (
          <section className="p-5 rounded-xl bg-white dark:bg-[#172337] border border-slate-200 dark:border-slate-800 space-y-4">
            <h2 className="font-display text-base font-bold text-[#101827] dark:text-white">
              Business Profile, Address & Contact Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Business Name" value={draft.businessName} onChange={(e) => setDraft({ ...draft, businessName: e.target.value })} />
              <Input label="Street Address" value={draft.address} onChange={(e) => setDraft({ ...draft, address: e.target.value })} />
              <Input label="Primary Phone" value={draft.phone} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} />
              <Input label="Public Service Email" value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })} />
            </div>
          </section>
        )}

        {sections.some((s) => s.key === 'hours') && (
          <section className="p-5 rounded-xl bg-white dark:bg-[#172337] border border-slate-200 dark:border-slate-800 space-y-4">
            <h2 className="font-display text-base font-bold text-[#101827] dark:text-white">Business Hours & Holiday Hours</h2>
            <Input label="Standard Hours Summary" value={draft.hoursSummary} onChange={(e) => setDraft({ ...draft, hoursSummary: e.target.value })} />
            <Input label="Holiday & Special Closures" value={draft.holidayHours} onChange={(e) => setDraft({ ...draft, holidayHours: e.target.value })} />
          </section>
        )}

        {sections.some((s) => s.key === 'services') && (
          <section className="p-5 rounded-xl bg-white dark:bg-[#172337] border border-slate-200 dark:border-slate-800 space-y-4">
            <h2 className="font-display text-base font-bold text-[#101827] dark:text-white">
              Services Offered, Not Offered & Supported Vehicle Makes
            </h2>
            <Textarea
              label="Services Offered (comma-separated)"
              rows={2}
              value={draft.servicesOffered.join(', ')}
              onChange={(e) => setDraft({ ...draft, servicesOffered: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })}
            />
            <Textarea
              label="Services NOT Offered (AI politely declines)"
              rows={2}
              value={draft.servicesNotOffered.join(', ')}
              onChange={(e) => setDraft({ ...draft, servicesNotOffered: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })}
            />
            <Input
              label="Supported Vehicle Makes"
              value={draft.supportedMakes.join(', ')}
              onChange={(e) => setDraft({ ...draft, supportedMakes: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })}
            />
          </section>
        )}

        {sections.some((s) => s.key === 'policies') && (
          <section className="p-5 rounded-xl bg-white dark:bg-[#172337] border border-slate-200 dark:border-slate-800 space-y-4">
            <h2 className="font-display text-base font-bold text-[#101827] dark:text-white">
              Warranty, Diagnostic Fees & Inspection Policies
            </h2>
            <Textarea label="Warranty Information" rows={2} value={draft.warrantyInfo} onChange={(e) => setDraft({ ...draft, warrantyInfo: e.target.value })} />
            <Textarea label="Diagnostic Fees" rows={2} value={draft.diagnosticFees} onChange={(e) => setDraft({ ...draft, diagnosticFees: e.target.value })} />
            <Textarea label="Inspection Policies" rows={2} value={draft.inspectionPolicies} onChange={(e) => setDraft({ ...draft, inspectionPolicies: e.target.value })} />
          </section>
        )}

        {sections.some((s) => s.key === 'payments') && (
          <section className="p-5 rounded-xl bg-white dark:bg-[#172337] border border-slate-200 dark:border-slate-800 space-y-4">
            <h2 className="font-display text-base font-bold text-[#101827] dark:text-white">Payment Methods, Financing & Towing</h2>
            <Input
              label="Accepted Payment Methods"
              value={draft.paymentMethods.join(', ')}
              onChange={(e) => setDraft({ ...draft, paymentMethods: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })}
            />
            <Textarea label="Financing Information" rows={2} value={draft.financingInfo} onChange={(e) => setDraft({ ...draft, financingInfo: e.target.value })} />
            <Textarea label="Towing & After-Hours Drop-Off Policy" rows={2} value={draft.towingPolicy} onChange={(e) => setDraft({ ...draft, towingPolicy: e.target.value })} />
          </section>
        )}

        {sections.some((s) => s.key === 'faqs') && (
          <section className="p-5 rounded-xl bg-white dark:bg-[#172337] border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-base font-bold text-[#101827] dark:text-white">
                Shop FAQs & Custom Instructions
              </h2>
              <Button
                type="button"
                size="sm"
                variant="outline"
                iconLeft={<Plus className="w-3.5 h-3.5" />}
                onClick={() =>
                  setDraft({
                    ...draft,
                    faqs: [...draft.faqs, { id: `faq-${Date.now()}`, question: 'New Question', answer: 'Answer...' }],
                  })
                }
              >
                Add FAQ
              </Button>
            </div>
            <div className="space-y-3">
              {draft.faqs.map((f, idx) => (
                <div key={f.id} className="p-3 rounded-lg bg-[#F5F7FB] dark:bg-[#101827] border border-slate-200 dark:border-slate-800 space-y-2">
                  <Input
                    label={`Question ${idx + 1}`}
                    value={f.question}
                    onChange={(e) => {
                      const next = [...draft.faqs];
                      next[idx] = { ...f, question: e.target.value };
                      setDraft({ ...draft, faqs: next });
                    }}
                  />
                  <Textarea
                    label="Answer"
                    rows={2}
                    value={f.answer}
                    onChange={(e) => {
                      const next = [...draft.faqs];
                      next[idx] = { ...f, answer: e.target.value };
                      setDraft({ ...draft, faqs: next });
                    }}
                  />
                </div>
              ))}
            </div>
            <Textarea
              label="Custom Business Instructions"
              rows={3}
              value={draft.customBusinessInstructions}
              onChange={(e) => setDraft({ ...draft, customBusinessInstructions: e.target.value })}
            />
          </section>
        )}
      </div>

      <Modal open={previewOpen} onClose={() => setPreviewOpen(false)} title="AI Knowledge Context Preview" maxWidth="max-w-2xl">
        <pre className="text-xs font-mono whitespace-pre-wrap bg-[#F5F7FB] dark:bg-[#101827] p-4 rounded-lg border border-slate-200 dark:border-slate-800 leading-relaxed">
          {`SHOP: ${draft.businessName}
ADDRESS: ${draft.address}
HOURS: ${draft.hoursSummary}
HOLIDAYS: ${draft.holidayHours}
OFFERED: ${draft.servicesOffered.join(', ')}
NOT OFFERED: ${draft.servicesNotOffered.join(', ')}
MAKES: ${draft.supportedMakes.join(', ')}
DIAGNOSTIC FEE: ${draft.diagnosticFees}
WARRANTY: ${draft.warrantyInfo}
TOWING: ${draft.towingPolicy}
CUSTOM RULE: ${draft.customBusinessInstructions}`}
        </pre>
      </Modal>
    </form>
  );
}
