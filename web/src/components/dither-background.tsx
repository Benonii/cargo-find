import { Dithering } from '@paper-design/shaders-react';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { cn } from '@/lib/utils';

type DitherPanelProps = {
  className?: string;
  shape?: 'simplex' | 'warp' | 'wave' | 'ripple' | 'swirl';
  speed?: number;
};

export const DitherPanel = ({ className, shape = 'warp', speed = 0.3 }: DitherPanelProps) => {
  const scheme = useColorScheme();
  return (
    <div aria-hidden className={cn('pointer-events-none relative overflow-hidden', className)}>
      <Dithering
        style={{ position: 'absolute', inset: 0, imageRendering: 'pixelated' }}
        colorBack="#00000000"
        colorFront={scheme === 'dark' ? '#2f8a52' : '#9cc5aa'}
        shape={shape}
        type="4x4"
        size={3}
        speed={speed}
        scale={0.6}
      />
    </div>
  );
};
