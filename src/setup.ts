import { Plugin } from '@opencode/plugin';
import type { SessionHttpRequest } from '@opencode/plugin/promise/session';
import { Choice, OpenRouterProviders } from '../rpc.ts';
import { DEBUG_LOG, logRequest } from './debug.ts';
import { fetchEndpoints } from './openrouter.ts';
import { pinProvider } from './pin.ts';

const PROVIDER = 'openrouter';

type RuntimeContext = {
  storage: Pick<Plugin.Context['storage'], 'get' | 'set' | 'remove'>;
  rpc: Pick<Plugin.Context['rpc'], 'register'>;
  session: {
    hook: (
      name: 'http.request',
      callback: (event: SessionHttpRequest) => void | Promise<void>,
      options?: { providerID?: string },
    ) => Promise<{ dispose: () => Promise<void> }>;
  };
  integration: {
    connection: Pick<Plugin.Context['integration']['connection'], 'active' | 'resolve'>;
  };
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export async function setupPlugin(ctx: RuntimeContext) {
  const storageKey = (model: string) => `choice/${encodeURIComponent(model)}`;

  // Storage is shared by every location's instance of this plugin, so always read it:
  // an in-memory cache here goes stale when another location changes the choice.
  async function getChoice(model: string) {
    const parsed = Choice.safeParse(await ctx.storage.get(storageKey(model)));
    return parsed.success ? parsed.data : null;
  }

  async function debugEnabled() {
    return (await ctx.storage.get('debug')) === true;
  }

  async function apiKey() {
    const connection = await ctx.integration.connection.active(PROVIDER).catch(() => undefined);
    const credential =
      connection && (await ctx.integration.connection.resolve(connection).catch(() => undefined));
    if (credential?.type === 'key') return credential.key;
    if (credential?.type === 'oauth') return credential.access;
    return process.env.OPENROUTER_API_KEY;
  }

  const rpc = await ctx.rpc.register(OpenRouterProviders, {
    listEndpoints: async ({ model }, { signal }) => ({
      endpoints: await fetchEndpoints(model, await apiKey(), signal),
    }),
    getChoice: async ({ model }) => ({ choice: await getChoice(model) }),
    setChoice: async ({ model, choice }) => {
      if (choice) await ctx.storage.set(storageKey(model), choice);
      else await ctx.storage.remove(storageKey(model));
      await rpc.events.emit('choice', { model, choice });
      return { choice };
    },
    debug: async ({ enabled }) => {
      if (enabled !== undefined) await ctx.storage.set('debug', enabled);
      return { enabled: await debugEnabled(), log: DEBUG_LOG };
    },
  });

  // Pin the chosen endpoint on every OpenRouter call. Only `provider` is touched, so the
  // variant's `reasoning` settings chosen in the native picker pass through unchanged.
  const hook = await ctx.session.hook(
    'http.request',
    async (event) => {
      const [choice, debug] = await Promise.all([getChoice(event.model.id), debugEnabled()]);
      const request = event.request;
      if ((!choice && !debug) || request.method !== 'POST') return;
      if (!request.headers.get('content-type')?.includes('application/json')) return;

      let body: Record<string, unknown>;
      try {
        const parsed: unknown = await request.clone().json();
        if (!isRecord(parsed)) return;
        body = parsed;
      } catch {
        return;
      }
      const sent = choice ? pinProvider(body, choice.tag) : body;
      if (choice) {
        const headers = new Headers(request.headers);
        headers.delete('content-length');
        event.request = new Request(request, { headers, body: JSON.stringify(sent) });
      }
      // Logged after the rewrite: this is exactly what leaves for OpenRouter.
      if (debug) {
        await logRequest({
          kind: event.kind,
          model: event.model.id,
          sessionID: event.sessionID,
          body: sent,
        }).catch(() => {});
      }
    },
    { providerID: PROVIDER },
  );

  return async () => {
    await hook.dispose();
    await rpc.dispose();
  };
}
