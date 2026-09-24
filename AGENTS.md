# Repository Guidelines

## Project Structure & Module Organization

This is an OpenCode V2 plugin for choosing a specific OpenRouter endpoint per model. `index.ts` loads the server plugin; `tui.tsx` provides the `/provider` picker and sidebar. `rpc.ts` defines their shared RPC schemas. Keep request hooks, endpoint fetching, pinning, formatting, and model state helpers in `src/`. Put Vitest files in `tests/*.test.ts` and sample API responses in `tests/fixtures/`. There are no separate application assets or build output.

## Build, Test, and Development Commands

- `npm ci` installs the locked dependencies (Node 26).
- `npm run typecheck` checks the strict TypeScript project without emitting files.
- `npm test` runs the Vitest suite once; `npm run test:watch` reruns it during development.
- `npm run test:coverage` reports V8 coverage for `src/`, `index.ts`, and `rpc.ts`.
- `npm run format:check` and `npm run lint:check` validate formatting and lint rules. `npm run format` and `npm run lint` rewrite files, so inspect the diff afterward.

There is no build script. To check TUI behavior locally, load this package as an OpenCode plugin and open `/provider` on an OpenRouter model. Do not send a model request merely to inspect the picker.

## Coding Style & Naming Conventions

Use TypeScript ESM, two spaces, single quotes, semicolons, and a 100-character line width, as configured in `.oxfmtrc.json`. Follow existing camelCase names for functions and variables, PascalCase for types and schemas, and descriptive kebab-case module names. Preserve strict types; validate external API and stored data at runtime. Keep the TUI and server entry points separate and update `rpc.ts` when their contract changes.

## Testing Guidelines

Use Vitest with `describe` and behavior-focused `it` names. Add or update tests for routing, RPC, API normalization, and state changes; use fixtures instead of live API calls. No minimum coverage threshold is configured. For picker changes, also verify filtering, selection, and ANSI colors in OpenCode because unit tests do not render the host TUI.

## Commit & Pull Request Guidelines

Recent commits use concise subjects, sometimes with `fix:` or `chore:` prefixes; follow that style and describe the behavior changed. In pull requests, explain the user-visible effect, list verification commands and results, and include a screenshot or ANSI capture for TUI changes. Link an issue when one exists. Never commit API keys or request logs; credentials come from the OpenCode connection or `OPENROUTER_API_KEY`.
