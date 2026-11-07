import { useLayoutEffect, useRef, useState } from 'react';

const leftTools = ['HubSpot', 'Apollo', 'Sales Navigator'];
const rightTools = ['Slack', 'Salesforce', 'Clay'];

type Wire = { id: string; path: string };

const ToolChip = ({ name, side }: { name: string; side: 'left' | 'right' }) => (
  <span
    data-wire={side}
    className="relative flex items-center gap-2 border border-line-strong bg-background px-3 py-1.5 font-mono text-[12px] whitespace-nowrap text-ink"
  >
    <span aria-hidden className="size-1.5 bg-brand" />
    {name}
  </span>
);

const curve = (fromX: number, fromY: number, toX: number, toY: number) => {
  const middle = (fromX + toX) / 2;
  return `M ${fromX} ${fromY} C ${middle} ${fromY}, ${middle} ${toY}, ${toX} ${toY}`;
};

const useWires = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const [wires, setWires] = useState<Wire[]>([]);

  useLayoutEffect(() => {
    const container = containerRef.current;
    const title = titleRef.current;
    if (!container || !title) {
      return;
    }
    const measure = () => {
      const box = container.getBoundingClientRect();
      const titleBox = title.getBoundingClientRect();
      const chips = [...container.querySelectorAll<HTMLElement>('[data-wire]')];
      const visible = chips.filter((chip) => chip.offsetParent !== null);
      const next = visible.map((chip, index) => {
        const chipBox = chip.getBoundingClientRect();
        const side = chip.dataset.wire;
        const sameSide = visible.filter((other) => other.dataset.wire === side);
        const order = sameSide.indexOf(chip);
        const spread = (order - (sameSide.length - 1) / 2) * 18;
        const targetY = titleBox.top + titleBox.height / 2 + spread - box.top;
        const fromY = chipBox.top + chipBox.height / 2 - box.top;
        const path =
          side === 'left'
            ? curve(chipBox.right - box.left, fromY, titleBox.left - box.left - 6, targetY)
            : curve(chipBox.left - box.left, fromY, titleBox.right - box.left + 6, targetY);
        return { id: `${side}-${index}`, path };
      });
      setWires(next);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  return { containerRef, titleRef, wires };
};

export const Hero = () => {
  const { containerRef, titleRef, wires } = useWires();

  return (
    <div ref={containerRef} className="relative flex flex-col items-center gap-6">
      <svg aria-hidden className="pointer-events-none absolute inset-0 hidden size-full overflow-visible md:block">
        {wires.map((wire, index) => (
          <g key={wire.id}>
            <path d={wire.path} fill="none" stroke="var(--line-strong)" strokeWidth="1" />
            <path
              d={wire.path}
              fill="none"
              stroke="var(--brand)"
              strokeWidth="1.25"
              strokeDasharray="3 17"
              style={{ animation: `wire-flow ${1.4 + index * 0.15}s linear infinite` }}
            />
          </g>
        ))}
      </svg>
      <div className="grid w-full items-center gap-x-16 md:grid-cols-[auto_1fr_auto] lg:gap-x-24">
        <div className="hidden flex-col items-start gap-5 md:flex">
          {leftTools.map((name) => (
            <ToolChip key={name} name={name} side="left" />
          ))}
        </div>
        <div ref={titleRef} className="relative mx-auto flex max-w-[34rem] flex-col items-center gap-3 text-center">
          <h1 className="text-[2.1rem] leading-[1.08] font-semibold tracking-tight text-balance text-ink sm:text-5xl">
            Give your agent the exact <span className="text-green">GTM tools</span> it needs.
          </h1>
        </div>
        <div className="hidden flex-col items-end gap-5 md:flex">
          {rightTools.map((name) => (
            <ToolChip key={name} name={name} side="right" />
          ))}
        </div>
      </div>
      <div className="flex flex-wrap justify-center gap-2 md:hidden">
        {[...leftTools, ...rightTools].map((name) => (
          <span
            key={name}
            className="flex items-center gap-1.5 border border-line-strong px-2 py-1 font-mono text-[11px] text-ink"
          >
            <span aria-hidden className="size-1.5 bg-brand" />
            {name}
          </span>
        ))}
      </div>
      <p className="max-w-xl text-center text-[15px] text-ink-2 sm:text-[16px]">
        cargo-find connects any AI agent to 800+ go-to-market actions on{' '}
        <a href="https://www.getcargo.ai" className="text-ink underline decoration-line-strong underline-offset-4">
          Cargo
        </a>
        : find leads, enrich them, update your CRM, alert your team. It picks real tools, so the workflow runs.
      </p>
    </div>
  );
};
