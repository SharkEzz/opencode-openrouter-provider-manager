import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { fetchGeneration, parseSse, send } from '../client.ts';

const KEY = 'sk-or-test-secret';
const fixture = readFileSync(path.join(import.meta.dirname, 'fixtures/stream.sse'), 'utf8');

/** A body that sends `parts` one by one, then ends (or stalls forever with `stall`). */
async function body(parts: string[], { stall = false } = {}) {
  const encoder = new TextEncoder();
  return new ReadableStream<Uint8Array>({
    async pull(controller) {
      const part = parts.shift();
      if (part !== undefined) controller.enqueue(encoder.encode(part));
      else if (!stall) controller.close();
      else return new Promise(() => undefined);
      return undefined;
    },
  });
}

const sse = (...chunks: unknown[]) =>
  `${chunks.map((c) => `data: ${JSON.stringify(c)}\n\n`).join('')}data: [DONE]\n\n`;

/** Every call to the clock advances it by 100ms. */
function clock() {
  let t = -100;
  return () => (t += 100);
}

function mockFetch(response: () => Response | Promise<Response>) {
  return vi.fn<typeof fetch>(async () => response());
}

describe('parseSse', () => {
  it('yields data payloads, skipping comments, across chunk boundaries', async () => {
    const split = [fixture.slice(0, 57), fixture.slice(57, 130), fixture.slice(130)];
    const payloads = [];
    for await (const payload of parseSse(await body(split))) payloads.push(payload);
    expect(payloads).toHaveLength(5);
    expect(payloads[4]).toMatchObject({ usage: { completion_tokens: 20 } });
  });

  it('accepts CRLF line endings', async () => {
    const payloads = [];
    for await (const p of parseSse(await body(['data: {"a":1}\r\n\r\ndata: [DONE]\r\n'])))
      payloads.push(p);
    expect(payloads).toEqual([{ a: 1 }]);
  });
});

describe('send', () => {
  it('times the stream and reads usage', async () => {
    const fetch = mockFetch(async () => new Response(await body([fixture])));
    const metrics = await send({ model: 'a/model' }, { apiKey: KEY, fetch, now: clock() });
    // Clock: start 0, one tick per payload (100…500), end 600.
    expect(metrics).toMatchObject({
      status: 'ok',
      error: null,
      generationId: 'gen-1',
      finishReason: 'stop',
      ttftMs: 200, // the role-only delta at 100 is ignored, reasoning at 200 counts
      ttfvtMs: 300,
      totalMs: 600,
      outputTps: (20 * 1000) / (600 - 200),
      promptTokens: 1200,
      completionTokens: 20,
      reasoningTokens: 8,
      cachedTokens: 1000,
      costUsd: 0.00042,
      toolCalls: [],
    });
  });

  it('streams with usage accounting and sends the key only as a header', async () => {
    const fetch = mockFetch(async () => new Response(await body([fixture])));
    const metrics = await send({ model: 'a/model' }, { apiKey: KEY, fetch });
    const [url, init] = fetch.mock.calls[0] ?? [];
    expect(url).toBe('https://openrouter.ai/api/v1/chat/completions');
    expect(await new Request(url ?? '', init).json()).toEqual({
      model: 'a/model',
      stream: true,
      usage: { include: true },
    });
    expect(new Headers(init?.headers).get('authorization')).toBe(`Bearer ${KEY}`);
    expect(JSON.stringify(metrics)).not.toContain(KEY);
  });

  it('assembles streamed tool calls and counts their arguments as output', async () => {
    const call = (index: number, fn: object, id?: string) => ({
      id: 'gen-2',
      choices: [{ delta: { tool_calls: [{ index, ...(id && { id }), function: fn }] } }],
    });
    const stream = sse(
      call(0, { name: 'read_file', arguments: '' }, 'call-a'),
      call(0, { arguments: '{"path":' }),
      call(0, { arguments: '"a.ts"}' }),
      call(1, { name: 'run_tests', arguments: '{}' }, 'call-b'),
      { id: 'gen-2', choices: [{ delta: {}, finish_reason: 'tool_calls' }] },
    );
    const fetch = mockFetch(async () => new Response(await body([stream])));
    const metrics = await send({}, { apiKey: KEY, fetch, now: clock() });
    expect(metrics.toolCalls).toEqual([
      { id: 'call-a', name: 'read_file', arguments: '{"path":"a.ts"}' },
      { id: 'call-b', name: 'run_tests', arguments: '{}' },
    ]);
    expect(metrics.ttftMs).toBe(200);
    expect(metrics.ttfvtMs).toBeNull();
  });

  it('marks a response cut by max_tokens as truncated', async () => {
    const stream = sse({
      id: 'g',
      choices: [{ delta: { content: 'x' }, finish_reason: 'length' }],
    });
    const fetch = mockFetch(async () => new Response(await body([stream])));
    expect((await send({}, { apiKey: KEY, fetch })).status).toBe('truncated');
  });

  it.each([
    [429, 'http_429'],
    [400, 'http_4xx'],
    [502, 'http_5xx'],
  ])('classifies HTTP %i as %s with a truncated message', async (code, status) => {
    const fetch = mockFetch(() => new Response('x'.repeat(500), { status: code }));
    const metrics = await send({}, { apiKey: KEY, fetch });
    expect(metrics.status).toBe(status);
    expect(metrics.error).toEqual({ code, message: 'x'.repeat(200) });
    expect(metrics.ttftMs).toBeNull();
  });

  it('reports an error sent inside the stream', async () => {
    const stream = sse(
      { id: 'g', choices: [{ delta: { content: 'x' } }] },
      { id: 'g', error: { code: 502, message: 'provider disconnected' } },
    );
    const fetch = mockFetch(async () => new Response(await body([stream])));
    const metrics = await send({}, { apiKey: KEY, fetch });
    expect(metrics.status).toBe('stream_error');
    expect(metrics.error).toEqual({ code: 502, message: 'provider disconnected' });
  });

  it('reports a stream that ends without a finish reason', async () => {
    const stream = sse({ id: 'g', choices: [{ delta: { content: 'x' } }] });
    const fetch = mockFetch(async () => new Response(await body([stream])));
    expect((await send({}, { apiKey: KEY, fetch })).status).toBe('stream_error');
  });

  it('keeps the network code of a failed connection', async () => {
    const fetch = mockFetch(async () => {
      throw new TypeError('fetch failed', {
        cause: Object.assign(new Error(), { code: 'ENOTFOUND' }),
      });
    });
    const metrics = await send({ model: 'a/model' }, { apiKey: KEY, fetch });
    expect(metrics).toMatchObject({
      status: 'stream_error',
      error: { code: null, message: 'fetch failed: ENOTFOUND' },
    });
  });

  it('times out when the headers never come', async () => {
    const hang = vi.fn<typeof globalThis.fetch>(
      async (_url, init) =>
        new Promise((_resolve, reject) =>
          init?.signal?.addEventListener('abort', () => reject(init.signal?.reason)),
        ),
    );
    const metrics = await send({}, { apiKey: KEY, fetch: hang, timeoutMs: 20 });
    expect(metrics.status).toBe('timeout');
  });

  it('times out when the body stalls', async () => {
    const start = sse({ id: 'g', choices: [{ delta: { content: 'x' } }] }).split('data: [DONE]')[0];
    if (start == undefined) {
      throw new Error('start is not defined');
    }
    const fetch = mockFetch(async () => new Response(await body([start], { stall: true })));
    const metrics = await send({}, { apiKey: KEY, fetch, timeoutMs: 20 });
    expect(metrics.status).toBe('timeout');
    expect(metrics.ttfvtMs).not.toBeNull();
  });
});

describe('fetchGeneration', () => {
  const entry = { data: { provider_name: 'DeepInfra', latency: 812, generation_time: 2400 } };

  it('retries with backoff until the entry appears', async () => {
    const responses = [
      new Response('not found', { status: 404 }),
      new Response('not found', { status: 404 }),
      Response.json(entry),
    ];
    const fetch = mockFetch(() => responses.shift()!);
    const sleep = vi.fn<(ms: number) => Promise<void>>(async () => undefined);
    const generation = await fetchGeneration('gen-1', { apiKey: KEY, fetch, sleep });
    expect(generation).toEqual({
      providerUsed: 'DeepInfra',
      latencyMs: 812,
      generationTimeMs: 2400,
    });
    expect(sleep.mock.calls).toEqual([[500], [1000]]);
    expect(fetch.mock.calls[0]?.[0]).toBe('https://openrouter.ai/api/v1/generation?id=gen-1');
  });

  it('abandons a stalled attempt and retries it', async () => {
    const stall = vi.fn<typeof globalThis.fetch>(
      async (_url, init) =>
        new Promise((_resolve, reject) =>
          init?.signal?.addEventListener('abort', () => reject(init.signal?.reason)),
        ),
    );
    stall.mockImplementationOnce(stall.getMockImplementation()!);
    stall.mockImplementation(async () => Response.json(entry));
    const generation = await fetchGeneration('gen-1', {
      apiKey: KEY,
      fetch: stall,
      attemptTimeoutMs: 20,
      sleep: async () => undefined,
    });
    expect(generation?.providerUsed).toBe('DeepInfra');
    expect(stall).toHaveBeenCalledTimes(2);
  });

  it('gives up after the last attempt', async () => {
    const fetch = mockFetch(() => new Response('not found', { status: 404 }));
    const generation = await fetchGeneration('gen-1', {
      apiKey: KEY,
      fetch,
      sleep: async () => undefined,
    });
    expect(generation).toBeNull();
    expect(fetch).toHaveBeenCalledTimes(5);
  });
});
