import { Moon, Sun } from 'lucide-react';
import { cn } from 'cn';
import { IconButton } from '@/components/ds';
import { useActiveSection } from '@/lib/sections';
import { useTheme } from '@/lib/theme';
import plugin from '../../../../packages/plugin/package.json';

export const REPO_URL = 'https://github.com/SharkEzz/opencode-openrouter-provider-manager';

const NAV = [
  { id: 'benchmark', label: 'benchmark' },
  { id: 'observed', label: 'observed usage' },
  { id: 'install', label: 'install' },
] as const;
const NAV_IDS = NAV.map((item) => item.id);

/** Transparent over the hero; glass once stuck (see `.site-header` in globals.css). */
export function Header() {
  const { theme, toggle } = useTheme();
  const active = useActiveSection(NAV_IDS);
  return (
    <header className="site-header sticky top-0 z-20">
      <div className="site-header-bar">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-4">
          <a href="#top" className="flex items-center gap-2 border-none text-text-primary">
            <span className="grid size-7 place-items-center rounded-md bg-route font-mono text-[12px] font-semibold text-text-on-accent">
              or
            </span>
            <span className="hidden font-mono text-[13px] font-semibold tracking-tight sm:inline">
              openrouter-provider-manager
            </span>
          </a>
          <span className="label-sm hidden items-center gap-1.5 rounded-full border border-hairline px-2 py-0.5 text-text-faint normal-case lg:inline-flex">
            <span className="size-1.5 rounded-full bg-telemetry-ink" />
            opencode v2 · v{plugin.version}
          </span>
          <span className="flex-1" />
          <nav className="body-sm hidden items-center gap-1 md:flex">
            {NAV.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                aria-current={active === item.id ? 'location' : undefined}
                className={cn(
                  'rounded-md border px-3 py-1 transition-[background-color,color,border-color] duration-[140ms] ease-out',
                  active === item.id
                    ? 'border-hairline bg-surface-raised text-text-primary'
                    : 'border-transparent text-text-muted hover:text-telemetry-ink',
                )}>
                {item.label}
              </a>
            ))}
          </nav>
          <span className="flex-1" />
          <a
            className="body-sm hidden border-none text-text-muted transition-colors duration-[140ms] ease-out hover:text-telemetry-ink sm:inline"
            href={REPO_URL}>
            github
          </a>
          <IconButton
            label={theme === 'light' ? 'switch to dark' : 'switch to light'}
            onClick={(event) => {
              const box = event.currentTarget.getBoundingClientRect();
              toggle({ x: box.left + box.width / 2, y: box.top + box.height / 2 });
            }}>
            {theme === 'light' ? <Moon size={14} /> : <Sun size={14} />}
          </IconButton>
          <a href="#install" className="btn-primary body-sm px-3 py-1.5">
            install
          </a>
        </div>
      </div>
    </header>
  );
}
