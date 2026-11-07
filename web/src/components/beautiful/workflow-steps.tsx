import { useState } from 'react';
import { CopyButton } from '@/components/copy-button';
import type { PlanStep } from '@/types';

const CheckIcon = (
  <svg
    width="13"
    height="13"
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
    width="12"
    height="12"
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

const StatusBadge = ({ real }: { real: boolean }) => (
  <span
    className={`flex size-5.5 shrink-0 items-center justify-center rounded-full ${
      real ? 'bg-green text-background' : 'bg-red text-background'
    }`}
    style={{ animation: 'pop-in 300ms cubic-bezier(0.23,1,0.32,1) both' }}
  >
    {real ? CheckIcon : CrossIcon}
  </span>
);

const StatusPill = ({ real }: { real: boolean }) => (
  <span
    className={`hidden h-5.5 shrink-0 items-center rounded-full px-2 text-[11.5px] font-medium sm:inline-flex ${
      real ? 'bg-green-tint text-green' : 'bg-red-tint text-red'
    }`}
  >
    {real ? 'In Cargo' : 'Not in Cargo'}
  </span>
);

const stepKey = (step: PlanStep, position: number) => `${position}:${step.actionId}`;

export const WorkflowSteps = ({ steps }: { steps: PlanStep[] }) => {
  const [openSteps, setOpenSteps] = useState<Record<string, boolean>>({});

  return (
    <ol className="flex w-full flex-col overflow-hidden rounded-card bg-surface shadow-card">
      {steps.map((step, index) => {
        const key = stepKey(step, index);
        const open = openSteps[key] ?? false;
        return (
          <li
            key={key}
            className="border-b border-line transition-colors duration-300 last:border-0 hover:bg-inset"
            style={{ animation: `fade-up 450ms cubic-bezier(0.23,1,0.32,1) ${index * 80}ms both` }}
          >
            <button
              type="button"
              aria-expanded={open}
              onClick={() => setOpenSteps((current) => ({ ...current, [key]: !open }))}
              className="flex min-h-12 w-full items-center gap-2.5 px-3 py-2 text-left"
            >
              <StatusBadge real={step.real} />
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="text-[13px] leading-snug font-medium text-ink">{step.title}</span>
                <code
                  className={`truncate font-mono text-[11.5px] ${step.real ? 'text-ink-2' : 'text-ink-3 line-through'}`}
                >
                  {step.actionId}
                </code>
              </span>
              <StatusPill real={step.real} />
              <svg
                width="15"
                height="15"
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
              style={{
                gridTemplateRows: open ? '1fr' : '0fr',
                opacity: open ? 1 : 0,
                transitionTimingFunction: 'cubic-bezier(0.23, 1, 0.32, 1)'
              }}
            >
              <div className="overflow-hidden">
                <div className="mb-3 grid grid-cols-[22px_1fr] gap-2.5 px-3">
                  <span aria-hidden className="mx-auto h-full w-px bg-line" />
                  <div className="flex min-w-0 flex-col gap-2 text-[12.5px]">
                    <p className="text-ink">{step.why}</p>
                    {step.entry ? (
                      <p className="text-ink-2">
                        {step.entry.name}
                        {step.entry.integration ? ` in ${step.entry.integration}` : ''}.{' '}
                        {step.entry.description.replace(/\.$/, '')}. Cost: {step.entry.price}.
                      </p>
                    ) : (
                      <p className="text-ink-2">
                        No Cargo action has this id. A workflow using it would fail on the first run.
                      </p>
                    )}
                    {step.entry?.usage ? (
                      <div className="flex justify-start">
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
          </li>
        );
      })}
    </ol>
  );
};
