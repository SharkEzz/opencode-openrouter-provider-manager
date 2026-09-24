# Repository Guidelines

## Project Structure & Module Organization

This is a pnpm workspace around an OpenCode V2 plugin for choosing a specific OpenRouter endpoint per model. Libraries live in `packages/`, applications in `apps/`; shared tooling (`tsconfig.base.json`, `.oxfmtrc.json`, `.oxlintrc.json`) stays at the root.

- `packages/plugin/` (`openrouter-provider-manager`): `index.ts` loads the server plugin; `tui.tsx` provides the `/provider` picker and sidebar. `rpc.ts` defines their shared RPC schemas. Keep request hooks, endpoint fetching, pinning, formatting, and model state helpers in `src/`. Put Vitest files in `tests/*.test.ts` and sample API responses in `tests/fixtures/`.
- `packages/bench/` (`@orpm/bench`): the Auto vs pinned benchmark. `SPEC.md` is the source of truth until the code exists.
- `packages/design-system/` (`@orpm/design-system`): design tokens and components for the site. The generated bundle is excluded from lint and format. The `.claude/skills/` entry only points to this package.
- `apps/site/` and `apps/docs/` are planned.

Internal packages use the `@orpm/` scope and `workspace:*` dependencies. Declare every package a file imports in that package's own `package.json`; pnpm does not hoist undeclared dependencies.

## Build, Test, and Development Commands

Run these from the repository root:

- `pnpm install --frozen-lockfile` installs the locked dependencies (Node 26, pnpm 12).
- `pnpm typecheck` checks every package's strict TypeScript project without emitting files.
- `pnpm test` runs every package's Vitest suite once; `pnpm --filter <package> test:watch` reruns one during development.
- `pnpm test:coverage` reports V8 coverage (for the plugin: `src/`, `index.ts`, and `rpc.ts`).
- `pnpm format:check` and `pnpm lint:check` validate formatting and lint rules. `pnpm format` and `pnpm lint` rewrite files, so inspect the diff afterward.

There is no build script for the plugin. To check TUI behavior locally, load `packages/plugin` as an OpenCode plugin by absolute path and open `/provider` on an OpenRouter model. Do not send a model request merely to inspect the picker.

## Coding Style & Naming Conventions

Use TypeScript ESM, two spaces, single quotes, semicolons, and a 100-character line width, as configured in `.oxfmtrc.json`. Follow existing camelCase names for functions and variables, PascalCase for types and schemas, and descriptive kebab-case module names. Preserve strict types; validate external API and stored data at runtime. Keep the TUI and server entry points separate and update `rpc.ts` when their contract changes.

## Testing Guidelines

Use Vitest with `describe` and behavior-focused `it` names. Add or update tests for routing, RPC, API normalization, and state changes; use fixtures instead of live API calls. No minimum coverage threshold is configured. For picker changes, also verify filtering, selection, and ANSI colors in OpenCode because unit tests do not render the host TUI.

## Commit & Pull Request Guidelines

Recent commits use concise subjects, sometimes with `fix:` or `chore:` prefixes; follow that style and describe the behavior changed. In pull requests, explain the user-visible effect, list verification commands and results, and include a screenshot or ANSI capture for TUI changes. Link an issue when one exists. Never commit API keys or request logs; credentials come from the OpenCode connection, `OPENROUTER_API_KEY`, or, for analytics exports only, `OPENROUTER_MANAGEMENT_KEY`.
