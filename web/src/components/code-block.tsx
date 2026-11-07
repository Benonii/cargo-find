import { CopyButton } from '@/components/copy-button';

type CodeBlockProps = {
  code: string;
  label?: string;
};

export const CodeBlock = ({ code, label = 'Copy' }: CodeBlockProps) => (
  <div className="flex flex-col gap-2 rounded-card bg-inset p-3 shadow-hairline">
    <pre className="max-h-64 overflow-auto font-mono text-[12px] leading-relaxed whitespace-pre-wrap break-all text-ink">
      {code}
    </pre>
    <div className="flex justify-end">
      <CopyButton value={code} label={label} />
    </div>
  </div>
);
