import { REPO_URL } from './Header';

export function Footer() {
  return (
    <footer className="border-t border-hairline">
      <div className="body-sm mx-auto flex max-w-6xl flex-wrap gap-x-4 gap-y-1 px-4 py-6 text-text-faint">
        <span>openrouter-provider-manager · mit</span>
        <span className="flex-1" />
        <a href={REPO_URL}>source</a>
      </div>
    </footer>
  );
}
