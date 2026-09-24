import { Plugin } from '@opencode/plugin/tui';
import { watch } from 'node:fs';
import path from 'node:path';
import { createEffect, Show } from 'solid-js';
import { type Choice, type Endpoint, OpenRouterProviders } from './rpc.ts';
import { degraded, price, summary, tokens } from './src/format.ts';
import { resolveModel } from './src/model.ts';
import { MODEL_STATE_FILE, type ModelRef, pickedModel } from './src/tui-state.ts';
import type { DialogSelectOption } from '@opencode/plugin/tui/context';

const PROVIDER = 'openrouter';
const COMMAND = 'openrouter.provider';
const AUTO = '__auto__';

type Theme = Plugin.Context['theme'];
type Color = Theme['text']['base'];
type ColoredOption = DialogSelectOption<string> & { footerColor?: Color; searchText: string };

/** Flex and priority endpoints stand out; default ones use the surrounding color. */
function tierColor(theme: Theme, tier: Endpoint['tier']): Color | undefined {
  if (tier === 'flex') return theme.text.feedback.success.base;
  if (tier === 'priority') return theme.text.feedback.warning.base;
  return undefined;
}
const HOME = '__home__';

export default Plugin.define({
  id: 'openrouter-provider-manager.tui',
  setup(ctx) {
    const rpc = ctx.client.rpc(OpenRouterProviders);
    // model id -> choice (null = Auto). Absent key = not loaded yet.
    const [choices, updateChoices] = ctx.storage.memory<Record<string, Choice | null>>('choices', {
      initial: {},
    });
    const loading = new Set<string>();

    function load(model: string) {
      if (model in choices || loading.has(model)) return;
      loading.add(model);
      rpc
        .getChoice({ model })
        .then(({ choice }) => updateChoices((draft) => void (draft[model] = choice)))
        .catch(() => {})
        .finally(() => loading.delete(model));
    }

    const stopChoiceEvents = rpc.events.on('choice', (event) => {
      updateChoices((draft) => void (draft[event.data.model] = event.data.choice));
    });

    // Picks made in the TUI's model picker, keyed by the screen they were made on (a session
    // ID, or HOME). A pick only applies where it was made: reopening a session makes the TUI
    // restore that session's model, whatever was picked elsewhere since.
    const [picks, updatePicks] = ctx.storage.memory<Record<string, ModelRef>>('picks', {
      initial: {},
    });
    const screen = () => {
      const route = ctx.ui.router.current();
      return route.type === 'session' ? route.sessionID : HOME;
    };
    let watcher: ReturnType<typeof watch> | undefined;
    try {
      watcher = watch(path.dirname(MODEL_STATE_FILE), (_event, file) => {
        if (file !== path.basename(MODEL_STATE_FILE)) return;
        const picked = pickedModel()?.model;
        if (picked) updatePicks((draft) => void (draft[screen()] = picked));
      });
    } catch {}

    function sessionModel(sessionID: string | undefined): ModelRef | undefined {
      return sessionID ? ctx.data.session.get(sessionID)?.model : undefined;
    }

    /** A pick made on this screen, else the session's model; on the home screen, the last pick. */
    function currentModel(sessionID: string | undefined): ModelRef | undefined {
      return resolveModel({
        sessionID,
        sessionModel: sessionModel(sessionID),
        pick: picks[sessionID ?? HOME],
        lastPicked: () => pickedModel()?.model,
      });
    }

    async function activeModel(): Promise<ModelRef | undefined> {
      const route = ctx.ui.router.current();
      const current = currentModel(route.type === 'session' ? route.sessionID : undefined);
      if (current) return current;
      const fallback = await ctx.client.model.default().catch(() => undefined);
      const info = fallback?.data as { providerID?: string; id?: string } | null | undefined;
      return info?.providerID && info.id ? { providerID: info.providerID, id: info.id } : undefined;
    }

    function option(endpoint: Endpoint, model: ModelRef): ColoredOption {
      const warnings = [
        degraded(endpoint) ? 'degraded' : '',
        model.variant && !endpoint.reasoning ? `ignores "${model.variant}" effort` : '',
      ].filter(Boolean);
      const footerColor = tierColor(ctx.theme, endpoint.tier);
      return {
        title: endpoint.provider,
        value: endpoint.tag,
        description: [
          `${price(endpoint.input)} in / ${price(endpoint.output)} out /M`,
          `ctx ${tokens(endpoint.context)}`,
          endpoint.quantization ?? '',
          endpoint.uptime !== null ? `uptime ${endpoint.uptime.toFixed(1)}%` : '',
          ...warnings,
        ]
          .filter(Boolean)
          .join(' · '),
        footer: endpoint.tag,
        // OpenCode searches title/category/searchText, not footer. Both extra fields are
        // undocumented; if support disappears, the tag still renders as plain text.
        searchText: endpoint.tag,
        ...(footerColor ? { footerColor } : undefined),
      };
    }

    const dialogTitle = (model: ModelRef) =>
      `Endpoint OpenRouter · ${model.id}${model.variant ? ` #${model.variant}` : ''}`;

    async function pick() {
      const model = await activeModel();
      if (!model || model.providerID !== PROVIDER) {
        ctx.ui.toast.show({
          title: 'OpenRouter',
          message: model
            ? `${model.providerID}/${model.id} is not an OpenRouter model.`
            : 'No active model.',
          variant: 'warning',
        });
        return;
      }

      // Fetching endpoints can take a few seconds: show a loader right away. Esc closes it
      // and aborts the request.
      const abort = new AbortController();
      let loaded = false;
      ctx.ui.dialog.show(
        () => <Loading ctx={ctx} title={dialogTitle(model)} />,
        () => loaded || abort.abort(),
      );
      const [listed, stored] = await Promise.all([
        rpc
          .listEndpoints({ model: model.id }, { signal: abort.signal })
          .catch((error: unknown) => (error instanceof Error ? error : new Error(String(error)))),
        rpc.getChoice({ model: model.id }).catch(() => ({ choice: null })),
      ]);
      loaded = true;
      if (abort.signal.aborted) return;
      if (listed instanceof Error) {
        ctx.ui.dialog.clear();
        ctx.ui.toast.show({
          title: 'OpenRouter',
          message: listed.message,
          variant: 'error',
        });
        return;
      }

      const current = stored.choice?.tag ?? AUTO;
      const selection = ctx.ui.dialog.select<string>({
        title: dialogTitle(model),
        placeholder: 'Filter providers…',
        current,
        options: [
          {
            title: 'Auto',
            value: AUTO,
            description: 'Default OpenRouter routing (price, availability, fallbacks)',
          },
          ...listed.endpoints.map((endpoint) => option(endpoint, model)),
        ],
      });
      // Prices and warnings don't fit the default width.
      ctx.ui.dialog.set({ size: 'large' });
      const value = await selection;
      if (value === undefined || value === current) return;
      await apply(model, value, listed.endpoints);
    }

    async function apply(model: ModelRef, value: string, endpoints: readonly Endpoint[]) {
      const endpoint = endpoints.find((e) => e.tag === value);
      const choice: Choice | null = endpoint
        ? {
            tag: endpoint.tag,
            provider: endpoint.provider,
            tier: endpoint.tier,
            input: endpoint.input,
            output: endpoint.output,
          }
        : null;
      await rpc.setChoice({ model: model.id, choice });
      updateChoices((draft) => void (draft[model.id] = choice));
      ctx.ui.toast.show({
        title: 'OpenRouter',
        message: choice
          ? `${model.id} → ${summary(choice)} (strict)`
          : `${model.id} → automatic routing`,
        variant: 'success',
      });
    }

    // Request logging is a plugin option (cli.json `plugins[].options.debug`), mirrored to the
    // server plugin, which owns the request hook. Absent or false turns it off.
    const debug = ctx.options.debug === true;
    rpc
      .debug({ enabled: debug })
      .then(({ log }) => {
        if (debug)
          ctx.ui.toast.show({
            title: 'OpenRouter',
            message: `Request log enabled: ${log}`,
            variant: 'info',
          });
        return undefined;
      })
      .catch(() => undefined);

    // keymap.layer needs the host's Keymap provider, which only exists inside the rendered
    // tree: register it from an invisible component mounted in the `app` slot.
    ctx.ui.slot({
      append: 'app',
      render: () => {
        ctx.keymap.layer(() => ({
          mode: 'global',
          commands: [
            {
              id: COMMAND,
              title: 'OpenRouter: choose endpoint',
              description: 'Pin an OpenRouter provider for the active model',
              group: 'OpenRouter',
              bind: '<leader>o',
              palette: true,
              slash: { name: 'provider' },
              run: () => pick(),
            },
          ],
          bindings: [COMMAND],
        }));
        return null;
      },
    });

    ctx.ui.slot({
      // First in the sidebar, right above the built-in "Context" section.
      prepend: 'sidebar.content',
      render: (input) => (
        <SidebarSection
          ctx={ctx}
          model={() => currentModel(input.sessionID)}
          choices={choices}
          load={load}
        />
      ),
    });

    const stopModelSelected = ctx.data.on('session.model.selected', (event): void => {
      updatePicks((draft): void => {
        Reflect.deleteProperty(draft, event.data.sessionID);
      });
    });

    // A strict pin fails loudly when its endpoint is down; point the user at the fix.
    const stopFailures = ctx.data.on('session.execution.failed', (event) => {
      const model = sessionModel(event.data.sessionID);
      const choice = model?.providerID === PROVIDER ? choices[model.id] : undefined;
      if (!choice) return;
      ctx.ui.toast.show({
        title: 'OpenRouter',
        message: `Request failed on pinned endpoint ${choice.tag}. Use /provider to switch or go back to Auto.`,
        variant: 'error',
        sessionID: event.data.sessionID,
      });
    });

    return () => {
      stopChoiceEvents();
      stopFailures();
      stopModelSelected();
      watcher?.close();
    };
  },
});

function SidebarSection(props: {
  ctx: Plugin.Context;
  model: () => ModelRef | undefined;
  choices: Record<string, Choice | null>;
  load: (model: string) => void;
}) {
  const openrouter = () => {
    const ref = props.model();
    return ref?.providerID === PROVIDER ? ref.id : undefined;
  };
  createEffect(() => {
    const id = openrouter();
    if (id) props.load(id);
  });
  const choice = () => {
    const id = openrouter();
    return id ? props.choices[id] : undefined;
  };
  const color = () => {
    const pinned = choice();
    const theme = props.ctx.theme;
    if (!pinned) return theme.text.muted;
    return tierColor(theme, pinned.tier) ?? theme.text.base;
  };
  // Mirrors the built-in Context section: bold title, then muted detail lines.
  return (
    <Show when={openrouter()}>
      <box>
        <text fg={props.ctx.theme.text.base}>
          <b>OpenRouter</b>
        </text>
        <Show when={choice()} fallback={<text fg={color()}>Auto (OpenRouter routing)</text>}>
          {(pinned: () => Choice) => (
            <>
              <text fg={color()}>{pinned().tag}</text>
              <text fg={props.ctx.theme.text.muted}>
                {price(pinned().input)} in · {price(pinned().output)} out /M
              </text>
            </>
          )}
        </Show>
      </box>
    </Show>
  );
}

function Loading(props: { ctx: Plugin.Context; title: string }) {
  return (
    <box paddingLeft={2} paddingRight={2} paddingBottom={1} gap={1}>
      <text fg={props.ctx.theme.text.base}>
        <b>{props.title}</b>
      </text>
      <box flexDirection="row" gap={1}>
        <spinner interval={80} color={props.ctx.theme.text.muted} />
        <text fg={props.ctx.theme.text.muted}>Loading endpoints…</text>
      </box>
    </box>
  );
}
