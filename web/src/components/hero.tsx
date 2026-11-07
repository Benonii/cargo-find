import { type ReactNode, useLayoutEffect, useRef, useState } from 'react';
import { DitherPanel } from '@/components/dither-background';

const leftTools = ['HubSpot', 'Apollo', 'Sales Navigator'];
const rightTools = ['Slack', 'Salesforce', 'Clay'];

type Wire = { id: string; path: string };

const hatch = {
  backgroundImage: 'repeating-linear-gradient(135deg, var(--line-strong) 0 1px, transparent 1px 7px)'
};

const Pins = () => (
  <>
    <span aria-hidden className="absolute top-1 left-1 size-[3px] bg-ink-3" />
    <span aria-hidden className="absolute top-1 right-1 size-[3px] bg-ink-3" />
    <span aria-hidden className="absolute bottom-1 left-1 size-[3px] bg-ink-3" />
    <span aria-hidden className="absolute right-1 bottom-1 size-[3px] bg-ink-3" />
  </>
);

const Chip = ({ children, wire }: { children: ReactNode; wire?: 'left' | 'right' }) => (
  <span
    data-wire={wire}
    className="relative flex w-fit items-center gap-2 rounded-md border border-line-strong bg-surface px-3.5 py-2 font-mono text-[12px] whitespace-nowrap text-ink shadow-hairline"
  >
    <Pins />
    {children}
  </span>
);

const Ticks = ({ count = 18 }: { count?: number }) => (
  <span aria-hidden className="flex h-3 gap-[3px]">
    {Array.from({ length: count }, (_, position) => `tick-${position}`).map((key) => (
      <span key={key} className="w-px bg-line-strong" />
    ))}
  </span>
);

const Pads = ({ count = 6 }: { count?: number }) => (
  <span aria-hidden className="grid w-fit grid-cols-3 gap-1.5">
    {Array.from({ length: count }, (_, position) => `pad-${position}`).map((key) => (
      <span key={key} className="h-2.5 w-2 rounded-[2px] border border-line-strong" />
    ))}
  </span>
);

const Label = ({ children }: { children: ReactNode }) => (
  <span className="font-mono text-[10.5px] leading-snug tracking-wide text-ink-3 uppercase">{children}</span>
);

const curve = (fromX: number, fromY: number, toX: number, toY: number, bend: number) => {
  const middle = fromX + (toX - fromX) * bend;
  if (Math.abs(toY - fromY) < 17) {
    return `M ${fromX} ${fromY} H ${middle} V ${toY} H ${toX}`;
  }
  return `M ${fromX} ${fromY} H ${middle - 8} Q ${middle} ${fromY} ${middle} ${fromY + Math.sign(toY - fromY) * 8} V ${toY - Math.sign(toY - fromY) * 8} Q ${middle} ${toY} ${middle + Math.sign(toX - fromX) * 8} ${toY} H ${toX}`;
};

const useWires = () => {
  const boardRef = useRef<HTMLDivElement>(null);
  const targetRef = useRef<HTMLDivElement>(null);
  const [wires, setWires] = useState<Wire[]>([]);

  useLayoutEffect(() => {
    const board = boardRef.current;
    const target = targetRef.current;
    if (!board || !target) {
      return;
    }
    const measure = () => {
      const box = board.getBoundingClientRect();
      const targetBox = target.getBoundingClientRect();
      const chips = [...board.querySelectorAll<HTMLElement>('[data-wire]')].filter(
        (chip) => chip.offsetParent !== null
      );
      const next = chips.map((chip, index) => {
        const chipBox = chip.getBoundingClientRect();
        const side = chip.dataset.wire;
        const sameSide = chips.filter((other) => other.dataset.wire === side);
        const order = sameSide.indexOf(chip);
        const spread = (order - (sameSide.length - 1) / 2) * 18;
        const toY = targetBox.top + targetBox.height / 2 + spread - box.top;
        const fromY = chipBox.top + chipBox.height / 2 - box.top;
        const bend = 0.3 + order * 0.2;
        const path =
          side === 'left'
            ? curve(chipBox.right - box.left, fromY, targetBox.left - box.left, toY, bend)
            : curve(chipBox.left - box.left, fromY, targetBox.right - box.left, toY, 1 - bend);
        return { id: `${side}-${index}`, path };
      });
      setWires(next);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(board);
    return () => observer.disconnect();
  }, []);

  return { boardRef, targetRef, wires };
};

const Trace = () => (
  <svg aria-hidden width="12" height="40" viewBox="0 0 12 40" className="mx-auto block overflow-visible">
    <path d="M6 0 V40" stroke="var(--line-strong)" strokeWidth="1" />
    <path
      d="M6 0 V40"
      stroke="var(--brand)"
      strokeWidth="1.25"
      strokeDasharray="3 9"
      style={{ animation: 'wire-flow 1.2s linear infinite' }}
    />
  </svg>
);

const SideColumn = ({ side }: { side: 'left' | 'right' }) => {
  const tools = side === 'left' ? leftTools : rightTools;
  const outer = (
    <div className="hidden flex-col gap-4 border-dashed border-line-strong py-6 xl:flex">
      {side === 'left' ? (
        <>
          <div className="relative flex flex-col gap-4 rounded-md border border-line-strong p-4">
            <Pads />
            <Label>Find leads.</Label>
          </div>
          <DitherPanel shape="warp" className="h-40 rounded-md border border-line-strong" />
          <div className="h-28 rounded-md border border-line-strong" style={hatch} />
        </>
      ) : (
        <>
          <div className="h-28 rounded-md border border-line-strong" style={hatch} />
          <div className="relative flex flex-col gap-4 rounded-md border border-line-strong p-4">
            <Pads />
            <Label>Update the CRM.</Label>
          </div>
          <DitherPanel shape="swirl" className="h-40 rounded-md border border-line-strong" />
        </>
      )}
    </div>
  );
  const inner = (
    <div
      className={`flex flex-col justify-center gap-7 border-dashed border-line-strong px-6 py-6 xl:w-48 ${
        side === 'left' ? 'items-start border-r xl:border-l' : 'items-end border-l xl:border-r'
      }`}
    >
      <Ticks />
      {tools.map((name) => (
        <Chip key={name} wire={side}>
          <span aria-hidden className="size-1.5 bg-brand" />
          {name}
        </Chip>
      ))}
      <Pads count={9} />
    </div>
  );
  return (
    <div
      className={`hidden lg:grid ${side === 'left' ? 'xl:grid-cols-[1fr_auto]' : 'xl:grid-cols-[auto_1fr]'} gap-0`}
    >
      {side === 'left' ? outer : inner}
      {side === 'left' ? inner : outer}
    </div>
  );
};

export const Hero = ({ composer }: { composer: ReactNode }) => {
  const { boardRef, targetRef, wires } = useWires();

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col items-center gap-4 text-center">
        <h1 className="max-w-4xl text-[2.25rem] leading-[1.05] font-semibold tracking-tight text-balance text-ink sm:text-6xl lg:text-7xl">
          Give your agent the exact <span className="text-green">GTM tools</span> it needs.
        </h1>
        <p className="max-w-2xl text-[15px] text-ink-2 sm:text-[17px]">
          cargo-find connects any AI agent to 800+ go-to-market actions on{' '}
          <a href="https://www.getcargo.ai" className="text-ink underline decoration-line-strong underline-offset-4">
            Cargo
          </a>
          : find leads, enrich them, update your CRM, alert your team. It picks real tools, so the workflow runs.
        </p>
      </div>
      <div
        ref={boardRef}
        className="relative grid lg:grid-cols-[1fr_minmax(0,40rem)_1fr] xl:grid-cols-[1.7fr_minmax(0,38rem)_1.7fr]"
      >
        <svg aria-hidden className="pointer-events-none absolute inset-0 hidden size-full overflow-visible lg:block">
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
        <SideColumn side="left" />
        <div className="relative flex min-w-0 flex-col py-6 lg:px-8">
          <div className="mx-auto">
            <Chip>
              <span aria-hidden className="size-1.5 bg-brand" />
              Try it: Cargo AI + cargo-find
            </Chip>
          </div>
          <Trace />
          <div ref={targetRef} className="relative z-10">
            {composer}
          </div>
          <Trace />
          <div className="mx-auto flex flex-wrap justify-center gap-2 lg:hidden">
            {[...leftTools, ...rightTools].map((name) => (
              <span
                key={name}
                className="flex items-center gap-1.5 rounded-md border border-line-strong bg-surface px-2 py-1 font-mono text-[11px] text-ink"
              >
                <span aria-hidden className="size-1.5 bg-brand" />
                {name}
              </span>
            ))}
          </div>
          <div className="mx-auto hidden lg:block">
            <Chip>
              <span aria-hidden className="size-1.5 rounded-full bg-brand" />
              800+ GTM tools connected
            </Chip>
          </div>
        </div>
        <SideColumn side="right" />
      </div>
    </div>
  );
};
