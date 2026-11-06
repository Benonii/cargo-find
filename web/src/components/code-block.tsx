import { CopyButton } from '@/components/copy-button';

type CodeBlockProps = {
  code: string;
  label?: string;
};

export const CodeBlock = ({ code, label = 'Copy' }: CodeBlockProps) => (
  <div className="flex flex-col gap-2 border bg-muted p-3">
    <pre className="overflow-x-auto font-mono text-xs leading-relaxed whitespace-pre-wrap break-all">{code}</pre>
    <div className="flex justify-end">
      <CopyButton value={code} label={label} />
    </div>
  </div>
);
