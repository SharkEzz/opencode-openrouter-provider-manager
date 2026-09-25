import { useEffect, useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { cn } from 'cn';

/** Shell command with a copy button; the icon turns into a check for 1.5 s. */
export function CopyCommand({ command, className }: { command: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!copied) return undefined;
    const timer = setTimeout(() => setCopied(false), 1500);
    return () => clearTimeout(timer);
  }, [copied]);

  return (
    <div
      className={cn(
        'body-sm flex min-w-0 items-center gap-3 rounded-md border border-border-strong bg-surface-input py-1.5 pr-1.5 pl-3',
        className,
      )}>
      <span className="text-telemetry-ink select-none">$</span>
      <code className="min-w-0 flex-1 truncate text-left text-text-primary">{command}</code>
      <button
        type="button"
        aria-label={copied ? 'copied' : 'copy command'}
        title="copy"
        onClick={() => {
          void navigator.clipboard.writeText(command).then(() => setCopied(true));
        }}
        className="inline-grid size-7 shrink-0 cursor-pointer place-items-center rounded-md text-text-muted transition-[background-color,color,box-shadow] duration-[140ms] ease-out hover:bg-surface-hover hover:text-telemetry-ink focus-visible:shadow-[var(--focus-ring)] focus-visible:outline-none active:translate-y-[0.5px]">
        {copied ? <Check size={14} className="text-ok" /> : <Copy size={14} />}
      </button>
      <span className="sr-only" aria-live="polite">
        {copied ? 'command copied' : ''}
      </span>
    </div>
  );
}
