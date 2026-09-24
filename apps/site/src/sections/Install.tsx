import { Panel } from '@/components/ds';
import { REPO_URL } from './Header';

const CONFIG = `{
  "$schema": "https://opencode.ai/config.json",
  "plugins": ["/absolute/path/to/opencode-openrouter-provider-manager/packages/plugin"]
}`;

export function Install() {
  return (
    <section id="install" className="mx-auto grid max-w-6xl gap-4 px-4 py-16">
      <h2 className="headline-md">Install</h2>
      <p className="body-md text-text-secondary">
        not on npm yet — install from a checkout of the <a href={REPO_URL}>repository</a>. requires
        opencode v2, node 26 and pnpm.
      </p>
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="1 · clone and install">
          <pre className="code-dense overflow-x-auto text-text-primary">{`git clone ${REPO_URL}.git
cd opencode-openrouter-provider-manager
pnpm install --frozen-lockfile`}</pre>
        </Panel>
        <Panel title="2 · register the plugin" meta="~/.config/opencode/opencode.jsonc">
          <pre className="code-dense overflow-x-auto text-text-primary">{CONFIG}</pre>
        </Panel>
      </div>
      <p className="body-sm text-text-muted">
        restart opencode, connect openrouter with <code>/connect</code>, pick a model with{' '}
        <code>/models</code>, then open <code>/provider</code>. once published:{' '}
        <code>opencode plugin add opencode-openrouter-provider-manager</code> (not available yet).
      </p>
    </section>
  );
}
