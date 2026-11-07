import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type FrameProps = {
  children: ReactNode;
  className?: string;
  overhang?: 'small' | 'large';
};

export const Frame = ({ children, className, overhang = 'small' }: FrameProps) => {
  const reach = overhang === 'large' ? '-12px' : '-8px';
  return (
    <div className={cn('relative', className)}>
      <span aria-hidden className="absolute top-0 h-px bg-line-strong" style={{ left: reach, right: reach }} />
      <span aria-hidden className="absolute bottom-0 h-px bg-line-strong" style={{ left: reach, right: reach }} />
      <span aria-hidden className="absolute left-0 w-px bg-line-strong" style={{ top: reach, bottom: reach }} />
      <span aria-hidden className="absolute right-0 w-px bg-line-strong" style={{ top: reach, bottom: reach }} />
      {children}
    </div>
  );
};
