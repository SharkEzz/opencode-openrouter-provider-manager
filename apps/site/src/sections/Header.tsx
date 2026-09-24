import { Moon, Sun } from 'lucide-react';
import { IconButton } from '@/components/ds';
import { useTheme } from '@/lib/theme';

export const REPO_URL = 'https://github.com/SharkEzz/opencode-openrouter-provider-manager';

export function Header() {
  const { theme, toggle } = useTheme();
  return (
    <header className="sticky top-0 z-10 border-b border-hairline bg-surface-app">
      <div className="mx-auto flex h-12 max-w-6xl items-center gap-6 px-4">
        <a
          href="#top"
          className="border-none font-mono text-[13px] font-semibold tracking-tight text-text-primary">
          openrouter-provider-manager
        </a>
        <nav className="body-sm flex gap-4 text-text-muted">
          <a className="border-none text-text-muted hover:text-telemetry-ink" href="#benchmark">
            benchmark
          </a>
          <a className="border-none text-text-muted hover:text-telemetry-ink" href="#observed">
            observed usage
          </a>
          <a className="border-none text-text-muted hover:text-telemetry-ink" href="#install">
            install
          </a>
        </nav>
        <span className="flex-1" />
        <a className="body-sm border-none text-text-muted hover:text-telemetry-ink" href={REPO_URL}>
          github
        </a>
        <IconButton
          label={theme === 'light' ? 'switch to dark' : 'switch to light'}
          onClick={toggle}>
          {theme === 'light' ? <Moon size={14} /> : <Sun size={14} />}
        </IconButton>
      </div>
    </header>
  );
}
