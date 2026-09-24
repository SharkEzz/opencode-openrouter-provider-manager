import { readFileSync, rmSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { setupPlugin } from '../src/setup.ts';
import { Credential as CredentialSchema, Plugin } from '@opencode/plugin';
import { Schema } from 'effect';
import { Agent } from '@opencode/schema/agent';
import { Model } from '@opencode/schema/model';
import { Provider } from '@opencode/schema/provider';
import { Session } from '@opencode/schema/session';
import type { SessionHttpRequest } from '@opencode/plugin/promise/session';
import sol from './fixtures/gpt-6-sol.endpoints.json' with { type: 'json' };
import { DEBUG_LOG } from '../src/debug.ts';
import { clearEndpointCache } from '../src/openrouter.ts';

type Credential = Schema.Schema.Type<typeof CredentialSchema.Value>;
const makeCredential = (value: unknown): Credential =>
  Schema.decodeUnknownSync(CredentialSchema.Value)(value);
const CHOICE = {
  tag: 'openai/flex',
  provider: 'OpenAI',
  tier: 'flex',
  input: 1,
  output: 5,
} as const;
const signal = new AbortController().signal;

/** Minimal stand-in for the server plugin context: only what the plugin touches. */
async function start(credential?: Credential) {
  const storage = new Map<string, Awaited<ReturnType<Plugin.Context['storage']['get']>>>();
  const handlers: Record<
    string,
    (input: unknown, context: { signal: AbortSignal }) => Promise<unknown>
  > = {};
  const emit = vi.fn<(...args: unknown[]) => Promise<void>>(async () => {});
  let hook:
    | {
        name: string;
        callback: (event: SessionHttpRequest) => void | Promise<void>;
        options: unknown;
      }
    | undefined;

  const ctx = {
    storage: {
      get: async (key) => storage.get(key),
      set: async (key, value) => void storage.set(key, value),
      remove: async (key) => void storage.delete(key),
    },
    rpc: {
      register: async (_definition, registered) => {
        Object.assign(handlers, registered);
        return { dispose: async () => {}, events: { emit } };
      },
    },
    session: {
      hook: async (name, callback, options) => {
        hook = { name, callback, options };
        return { dispose: async () => {} };
      },
    },
    integration: {
      connection: {
        active: async () =>
          credential
            ? {
                id: 'connection',
                type: 'credential' as const,
                label: 'Connection',
                method: credential.type,
              }
            : undefined,
        resolve: async () => credential,
      },
    },
  } satisfies Parameters<typeof setupPlugin>[0];
  await setupPlugin(ctx);

  const call = (method: string, input: unknown) => handlers[method]!(input, { signal });
  /** Runs the http.request hook and returns the request that would be sent. */
  const send = async (request: Request, model = 'openai/gpt-6-sol') => {
    const event: SessionHttpRequest = {
      sessionID: Schema.decodeUnknownSync(Session.ID)('ses_test'),
      agent: Schema.decodeUnknownSync(Agent.ID)('build'),
      model: { providerID: Provider.ID.openrouter, id: Schema.decodeUnknownSync(Model.ID)(model) },
      kind: 'primary',
      request,
    };
    await hook!.callback(event);
    return event.request;
  };
  return { storage, call, send, emit, hook: () => hook! };
}

const chatRequest = (body: unknown, init: RequestInit = {}) =>
  new Request('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: 'Bearer sk-or-test',
      'content-length': '999',
    },
    body: JSON.stringify(body),
    ...init,
  });

beforeEach(() => clearEndpointCache());
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  rmSync(DEBUG_LOG, { force: true });
});

describe('http.request hook', () => {
  it('is scoped to the openrouter provider', async () => {
    const { hook } = await start();
    expect(hook().name).toBe('http.request');
    expect(hook().options).toEqual({ providerID: 'openrouter' });
  });

  it('leaves the request untouched without a pin or debug log', async () => {
    const { send } = await start();
    const request = chatRequest({ model: 'openai/gpt-6-sol' });
    expect(await send(request)).toBe(request);
  });

  it("pins the chosen endpoint and keeps the variant's reasoning", async () => {
    const { call, send } = await start();
    await call('setChoice', { model: 'openai/gpt-6-sol', choice: CHOICE });

    const sent = await send(
      chatRequest({ model: 'openai/gpt-6-sol', reasoning: { effort: 'high' } }),
    );
    expect(await sent.json()).toEqual({
      model: 'openai/gpt-6-sol',
      reasoning: { effort: 'high' },
      provider: { only: ['openai/flex'], allow_fallbacks: false },
    });
    expect(sent.method).toBe('POST');
    expect(sent.url).toBe('https://openrouter.ai/api/v1/chat/completions');
    expect(sent.headers.get('authorization')).toBe('Bearer sk-or-test');
    // The body changed size: a stale content-length would corrupt the request.
    expect(sent.headers.get('content-length')).toBeNull();
  });

  it('only pins the model the choice was made for', async () => {
    const { call, send } = await start();
    await call('setChoice', { model: 'openai/gpt-6-sol', choice: CHOICE });
    const request = chatRequest({ model: 'openai/gpt-6-luna' });
    expect(await send(request, 'openai/gpt-6-luna')).toBe(request);
  });

  it('ignores non-POST and non-JSON requests', async () => {
    const { call, send } = await start();
    await call('setChoice', { model: 'openai/gpt-6-sol', choice: CHOICE });
    const get = new Request('https://openrouter.ai/api/v1/models');
    expect(await send(get)).toBe(get);
    const text = new Request('https://openrouter.ai/api/v1/x', {
      method: 'POST',
      body: 'hi',
      headers: { 'content-type': 'text/plain' },
    });
    expect(await send(text)).toBe(text);
  });

  it('ignores malformed or non-object JSON bodies', async () => {
    const { call, send } = await start();
    await call('setChoice', { model: 'openai/gpt-6-sol', choice: CHOICE });

    await Promise.all(
      ['null', '[]', '{'].map(async (body) => {
        const request = new Request('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body,
        });
        expect(await send(request)).toBe(request);
      }),
    );
  });

  it('rereads the choice from storage on every request', async () => {
    // Regression: each location runs its own plugin instance over shared storage, so an
    // in-memory cache served a stale pin after another location changed it.
    const { storage, call, send } = await start();
    await call('setChoice', { model: 'openai/gpt-6-sol', choice: CHOICE });
    storage.set(`choice/${encodeURIComponent('openai/gpt-6-sol')}`, {
      ...CHOICE,
      tag: 'azure',
      tier: 'default',
    });

    const sent = await send(chatRequest({}));
    const result: unknown = await sent.json();
    expect(result).toMatchObject({ provider: { only: ['azure'] } });
  });

  it('logs what is actually sent when debug is on', async () => {
    const { call, send } = await start();
    await call('debug', { enabled: true });
    await call('setChoice', { model: 'openai/gpt-6-sol', choice: CHOICE });
    await send(chatRequest({ reasoning: { effort: 'low' }, provider: { order: ['azure'] } }));

    const line = readFileSync(DEBUG_LOG, 'utf8').trim();
    expect(line).toContain('model=openai/gpt-6-sol');
    expect(line).toContain('kind=primary');
    expect(line).toContain('reasoning={"effort":"low"}');
    expect(line).toContain('provider={"only":["openai/flex"],"allow_fallbacks":false}');
  });

  it('logs unpinned requests too when debug is on', async () => {
    const { call, send } = await start();
    await call('debug', { enabled: true });
    const request = chatRequest({ reasoning: { effort: 'high' } });
    expect(await send(request)).toBe(request);
    expect(readFileSync(DEBUG_LOG, 'utf8')).toContain('reasoning={"effort":"high"}');
  });
});

describe('RPC', () => {
  it('stores, emits and clears a choice', async () => {
    const { call, emit, storage } = await start();
    expect(await call('setChoice', { model: 'openai/gpt-6-sol', choice: CHOICE })).toEqual({
      choice: CHOICE,
    });
    expect(emit).toHaveBeenCalledWith('choice', { model: 'openai/gpt-6-sol', choice: CHOICE });
    expect(await call('getChoice', { model: 'openai/gpt-6-sol' })).toEqual({ choice: CHOICE });

    await call('setChoice', { model: 'openai/gpt-6-sol', choice: null });
    expect(storage.size).toBe(0);
    expect(emit).toHaveBeenLastCalledWith('choice', { model: 'openai/gpt-6-sol', choice: null });
    expect(await call('getChoice', { model: 'openai/gpt-6-sol' })).toEqual({ choice: null });
  });

  it('ignores an invalid stored choice', async () => {
    const { call, storage } = await start();
    storage.set(`choice/${encodeURIComponent('openai/gpt-6-sol')}`, { tag: 42 });
    expect(await call('getChoice', { model: 'openai/gpt-6-sol' })).toEqual({ choice: null });
  });

  it('toggles debug and reports the log path', async () => {
    const { call } = await start();
    expect(await call('debug', {})).toEqual({ enabled: false, log: DEBUG_LOG });
    expect(await call('debug', { enabled: true })).toEqual({ enabled: true, log: DEBUG_LOG });
    expect(await call('debug', {})).toMatchObject({ enabled: true });
  });

  describe('listEndpoints API key', () => {
    const listWith = async (storedCredential: Credential | undefined) => {
      const fetch = vi.fn<typeof globalThis.fetch>(async () => new Response(JSON.stringify(sol)));
      vi.stubGlobal('fetch', fetch);
      const { call } = await start(storedCredential);
      expect(await call('listEndpoints', { model: 'openai/gpt-6-sol' })).toMatchObject({
        endpoints: expect.arrayContaining([expect.objectContaining({ tag: 'openai/flex' })]),
      });
      const headers = new Headers(fetch.mock.calls[0]?.[1]?.headers);
      return { authorization: headers.get('authorization') };
    };

    it('uses an API key credential', async () => {
      expect(await listWith(makeCredential({ type: 'key', key: 'sk-or-key' }))).toEqual({
        authorization: 'Bearer sk-or-key',
      });
    });
    it('uses an OAuth access token', async () => {
      expect(
        await listWith(
          makeCredential({
            type: 'oauth',
            methodID: 'oauth',
            refresh: 'refresh-token',
            access: 'oauth-token',
            expires: 0,
          }),
        ),
      ).toEqual({
        authorization: 'Bearer oauth-token',
      });
    });
    it('falls back to OPENROUTER_API_KEY', async () => {
      vi.stubEnv('OPENROUTER_API_KEY', 'sk-or-env');
      expect(await listWith(undefined)).toEqual({ authorization: 'Bearer sk-or-env' });
    });
  });
});
