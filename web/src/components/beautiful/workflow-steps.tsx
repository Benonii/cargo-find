import { useState } from 'react';
import { CopyButton } from '@/components/copy-button';
import type { PlanStep } from '@/types';

const CheckIcon = (
  <svg
    width="12"
    height="12"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="3.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M20 6L9 17l-5-5" />
  </svg>
);

const CrossIcon = (
  <svg
    width="11"
    height="11"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="3.5"
    strokeLinecap="round"
    aria-hidden="true"
  >
    <path d="M18 6L6 18M6 6l12 12" />
  </svg>
);

const Connector = ({ broken, delay }: { broken: boolean; delay: number }) => (
  <div
    aria-hidden
    className="flex flex-col items-center"
    style={{ animation: `fade-up 300ms cubic-bezier(0.23,1,0.32,1) ${delay}ms both` }}
  >
    <svg width="12" height="28" viewBox="0 0 12 28" className="overflow-visible" aria-hidden="true">
      <path
        d="M6 0 V24"
        stroke={broken ? 'var(--red)' : 'var(--line-strong)'}
        strokeWidth="1"
        strokeDasharray={broken ? '3 3' : undefined}
      />
      {broken ? null : (
        <path
          d="M6 0 V24"
          stroke="var(--brand)"
          strokeWidth="1.25"
          strokeDasharray="3 9"
          style={{ animation: 'wire-flow 1.2s linear infinite' }}
        />
      )}
      <path d="M2 21 L6 26 L10 21" fill="none" stroke={broken ? 'var(--red)' : 'var(--ink-3)'} strokeWidth="1" />
    </svg>
  </div>
);

const Terminal = ({ label, tone, delay }: { label: string; tone: 'neutral' | 'good' | 'bad'; delay: number }) => (
  <div
    className={`mx-auto w-fit border px-3 py-1 font-mono text-[11.5px] ${
      tone === 'good'
        ? 'border-green bg-green-tint text-green'
        : tone === 'bad'
          ? 'border-red bg-red-tint text-red'
          : 'border-line-strong bg-background text-ink-2'
    }`}
    style={{ animation: `fade-up 300ms cubic-bezier(0.23,1,0.32,1) ${delay}ms both` }}
  >
    {label}
  </div>
);

const StepNode = ({ step, index }: { step: PlanStep; index: number }) => {
  const [open, setOpen] = useState(false);
  return (
    <div
      className={`border bg-background/80 backdrop-blur-sm ${step.real ? 'border-line-strong' : 'border-red/60'}`}
      style={{ animation: `fade-up 400ms cubic-bezier(0.23,1,0.32,1) ${index * 120 + 80}ms both` }}
    >
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className="flex min-h-11 w-full items-center gap-2.5 px-3 py-2 text-left hover:bg-inset"
      >
        <span
          className={`flex size-5 shrink-0 items-center justify-center rounded-full text-background ${
            step.real ? 'bg-green' : 'bg-red'
          }`}
        >
          {step.real ? CheckIcon : CrossIcon}
        </span>
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="text-[13px] leading-snug font-medium text-ink">{step.title}</span>
          <code
            className={`truncate font-mono text-[11.5px] ${step.real ? 'text-ink-2' : 'text-red line-through'}`}
          >
            {step.actionId}
          </code>
        </span>
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className="shrink-0 text-ink-3 transition-transform duration-300"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0)' }}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      <div
        className="grid transition-[grid-template-rows,opacity] duration-300"
        style={{ gridTemplateRows: open ? '1fr' : '0fr', opacity: open ? 1 : 0 }}
      >
        <div className="overflow-hidden">
          <div className="flex flex-col gap-2 border-t border-line px-3 py-2.5 text-[12.5px]">
            <p className="text-ink">{step.why}</p>
            {step.entry ? (
              <p className="text-ink-2">
                {step.entry.name}
                {step.entry.integration ? ` in ${step.entry.integration}` : ''}.{' '}
                {step.entry.description.replace(/\.$/, '')}. Cost: {step.entry.price}.
              </p>
            ) : (
              <p className="text-ink-2">No Cargo action has this id, so the workflow would stop here.</p>
            )}
            {step.entry?.usage ? (
              <div>
                <CopyButton
                  value={step.entry.usage}
                  label={step.entry.kind === 'extractor' ? 'Copy model' : 'Copy dry run'}
                />
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};

export const WorkflowSteps = ({ steps }: { steps: PlanStep[] }) => {
  const firstBroken = steps.findIndex((step) => !step.real);
  const endDelay = steps.length * 120 + 160;
  return (
    <div className="flex flex-col">
      <Terminal label="Your goal" tone="neutral" delay={0} />
      {steps.map((step, index) => (
        <div key={`${step.title}:${step.actionId}`} className="flex flex-col">
          <Connector broken={!step.real} delay={index * 120 + 40} />
          <StepNode step={step} index={index} />
        </div>
      ))}
      <Connector broken={firstBroken !== -1} delay={endDelay - 40} />
      <Terminal
        label={firstBroken === -1 ? 'Runs in Cargo' : `Breaks at step ${firstBroken + 1}`}
        tone={firstBroken === -1 ? 'good' : 'bad'}
        delay={endDelay}
      />
    </div>
  );
};
