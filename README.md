# OpenRouter Provider Manager

An OpenCode V2 plugin that pins a specific OpenRouter endpoint per model, plus the tools used to measure what pinning changes.

This repository is a [pnpm](https://pnpm.io) workspace:

| Path                      | Package                       | Contents                                                             |
| ------------------------- | ----------------------------- | -------------------------------------------------------------------- |
| `packages/plugin/`        | `openrouter-provider-manager` | the OpenCode plugin; see its [README](packages/plugin/README.md)     |
| `packages/bench/`         | `@orpm/bench`                 | the Auto vs pinned benchmark; see its [spec](packages/bench/SPEC.md) |
| `packages/design-system/` | `@orpm/design-system`         | tokens and components of the Obsidian Cyber IDE design system        |
| `apps/site/`              | `@orpm/site`                  | presentation site (planned)                                          |
| `apps/docs/`              | `@orpm/docs`                  | documentation (planned)                                              |

## Development

Node.js 26 and pnpm 12 are required.

```sh
pnpm install --frozen-lockfile
pnpm typecheck
pnpm test
pnpm lint:check
pnpm format:check
```

See [AGENTS.md](AGENTS.md) for repository conventions.
