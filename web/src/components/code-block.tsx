import { CopyButton } from '@/components/copy-button';

type CodeBlockProps = {
  code: string;
  label?: string;
};

export const CodeBlock = ({ code, label = 'Copy' }: CodeBlockProps) => (
  <div className="flex items-start gap-2 border border-line-strong bg-background/60 p-2.5">
    <pre className="max-h-48 min-w-0 flex-1 overflow-auto py-1 font-mono text-[12px] leading-relaxed whitespace-pre-wrap break-all text-ink">
      {code}
    </pre>
    <div className="shrink-0">
      <CopyButton value={code} label={label} />
    </div>
  </div>
);
