import { Dithering } from '@paper-design/shaders-react';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { cn } from '@/lib/utils';

type DitherBackgroundProps = {
  className?: string;
  shape?: 'simplex' | 'warp' | 'wave' | 'ripple' | 'swirl';
};

export const DitherBackground = ({ className, shape = 'warp' }: DitherBackgroundProps) => {
  const scheme = useColorScheme();
  return (
    <div
      aria-hidden
      className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)}
      style={{
        maskImage: 'radial-gradient(70% 70% at 50% 50%, black, transparent)',
        WebkitMaskImage: 'radial-gradient(70% 70% at 50% 50%, black, transparent)'
      }}
    >
      <Dithering
        style={{ width: '100%', height: '100%' }}
        colorBack="#00000000"
        colorFront={scheme === 'dark' ? '#22c55e' : '#15803d'}
        shape={shape}
        type="4x4"
        size={2}
        speed={0.25}
        scale={0.8}
      />
    </div>
  );
};
