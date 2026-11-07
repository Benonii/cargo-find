import { useEffect, useState } from 'react';

const cells = Array.from({ length: 9 }, (_, index) => {
  const row = Math.floor(index / 3);
  const column = index % 3;
  return { id: `cell-${row}-${column}`, delay: (column + Math.abs(row - 1)) * 90 };
});

const useElapsed = (): string => {
  const [tenths, setTenths] = useState(0);
  useEffect(() => {
    const timer = window.setInterval(() => setTenths((value) => value + 1), 100);
    return () => window.clearInterval(timer);
  }, []);
  return `${(tenths / 10).toFixed(1)}s`;
};

export const LoadingState = ({ label }: { label: string }) => {
  const elapsed = useElapsed();
  return (
    <div role="status" className="flex w-fit items-center gap-2.5">
      <span aria-hidden className="grid shrink-0 grid-cols-[repeat(3,4px)] gap-[1.5px]">
        {cells.map(({ id, delay }) => (
          <span
            key={id}
            className="size-[4px] rounded-[1px] bg-brand"
            style={{ opacity: 0.15, animation: `pixel-on 650ms ease-in-out ${delay}ms infinite` }}
          />
        ))}
      </span>
      <span
        className="bg-clip-text text-[13px] font-medium text-transparent"
        style={{
          backgroundImage: 'linear-gradient(90deg, var(--ink-3) 35%, var(--ink) 50%, var(--ink-3) 65%)',
          backgroundSize: '200% 100%',
          animation: 'shimmer-text 1.4s linear infinite'
        }}
      >
        {label}
      </span>
      <span className="font-mono text-[12px] text-ink-3 tabular-nums">{elapsed}</span>
    </div>
  );
};
