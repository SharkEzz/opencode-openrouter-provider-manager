import { z } from 'zod';

/**
 * Streams one chat completion and measures it (SPEC §7). Only metrics come back: the response
 * text is never kept, and tool calls are returned solely so the agentic workload can replay them.
 */

const API = 'https://openrouter.ai/api/v1';
const MESSAGE_LENGTH = 200;

export type Status =
  | 'ok'
  | 'truncated'
  | 'http_4xx'
  | 'http_429'
  | 'http_5xx'
  | 'timeout'
  | 'stream_error';

export type ToolCall = { id: string; name: string; arguments: string };

export type RequestMetrics = {
  status: Status;
  /** HTTP or stream error code, and a message cut to 200 characters. */
  error: { code: number | null; message: string } | null;
  generationId: string | null;
  finishReason: string | null;
  /** First delta carrying text: reasoning, content or tool call arguments. */
  ttftMs: number | null;
  /** First visible content token. */
  ttfvtMs: number | null;
  totalMs: number;
  outputTps: number | null;
  promptTokens: number | null;
  completionTokens: number | null;
  reasoningTokens: number | null;
  cachedTokens: number | null;
  costUsd: number | null;
  toolCalls: ToolCall[];
};

export type ClientOptions = {
  apiKey: string;
  fetch?: typeof fetch;
  timeoutMs?: number;
  now?: () => number;
};

const Usage = z.object({
  prompt_tokens: z.number().optional(),
  completion_tokens: z.number().optional(),
  cost: z.number().optional(),
  prompt_tokens_details: z.object({ cached_tokens: z.number().optional() }).nullish(),
  completion_tokens_details: z.object({ reasoning_tokens: z.number().optional() }).nullish(),
});

const Chunk = z.object({
  id: z.string().optional(),
  error: z.object({ code: z.unknown().optional(), message: z.string().optional() }).optional(),
  usage: Usage.nullish(),
  choices: z
    .array(
      z.object({
        finish_reason: z.string().nullish(),
        delta: z
          .object({
            content: z.string().nullish(),
            reasoning: z.string().nullish(),
            tool_calls: z
              .array(
                z.object({
                  index: z.number(),
                  id: z.string().optional(),
                  function: z
                    .object({ name: z.string().optional(), arguments: z.string().optional() })
                    .optional(),
                }),
              )
              .nullish(),
          })
          .optional(),
      }),
    )
    .optional(),
});

/** The JSON payloads of an SSE stream, until `[DONE]`. Comment lines are keep-alives. */
export async function* parseSse(stream: ReadableStream, signal?: AbortSignal): AsyncGenerator {
  const reader = stream.getReader();
  // Aborting ends a stalled read, so a timeout also covers a body that stops sending.
  const cancel = async () => reader.cancel(signal?.reason).catch(() => undefined);
  signal?.addEventListener('abort', cancel, { once: true });
  if (signal?.aborted) await cancel();
  const decoder = new TextDecoder();
  let buffer = '';
  try {
    for (;;) {
      // oxlint-disable-next-line no-await-in-loop -- a stream is read one chunk at a time
      const { done, value } = await reader.read();
      if (done || signal?.aborted) return;
      buffer += decoder.decode(value, { stream: true });
      let end = buffer.indexOf('\n');
      while (end !== -1) {
        const line = buffer.slice(0, end).replace(/\r$/, '');
        buffer = buffer.slice(end + 1);
        end = buffer.indexOf('\n');
        if (!line.startsWith('data:')) continue;
        const data = line.slice(5).trim();
        if (data === '[DONE]') return;
        if (data) yield JSON.parse(data);
      }
    }
  } finally {
    signal?.removeEventListener('abort', cancel);
    reader.releaseLock();
  }
}

const truncate = (text: string) => text.slice(0, MESSAGE_LENGTH);

function httpStatus(code: number): Status {
  if (code === 429) return 'http_429';
  return code >= 500 ? 'http_5xx' : 'http_4xx';
}

/** Sends `body` as a streamed request with usage accounting, and times it. */
export async function send(
  body: Record<string, unknown>,
  {
    apiKey,
    fetch: fetchImpl = globalThis.fetch,
    timeoutMs = 120_000,
    now = () => performance.now(),
  }: ClientOptions,
): Promise<RequestMetrics> {
  const signal = AbortSignal.timeout(timeoutMs);
  const start = now();
  const metrics: RequestMetrics = {
    status: 'ok',
    error: null,
    generationId: null,
    finishReason: null,
    ttftMs: null,
    ttfvtMs: null,
    totalMs: 0,
    outputTps: null,
    promptTokens: null,
    completionTokens: null,
    reasoningTokens: null,
    cachedTokens: null,
    costUsd: null,
    toolCalls: [],
  };
  const fail = (status: Status, message: string, code: number | null = null) => {
    metrics.status = status;
    metrics.error = { code, message: truncate(message) };
  };
  let tFirst: number | null = null;

  try {
    const response = await fetchImpl(`${API}/chat/completions`, {
      method: 'POST',
      headers: { authorization: `Bearer ${apiKey}`, 'content-type': 'application/json' },
      body: JSON.stringify({ ...body, stream: true, usage: { include: true } }),
      signal,
    });
    if (!response.ok || !response.body) {
      const text = await response.text().catch(() => '');
      fail(httpStatus(response.status), text || response.statusText, response.status);
    } else {
      const calls = new Map<number, ToolCall>();
      for await (const payload of parseSse(response.body, signal)) {
        const chunk = Chunk.parse(payload);
        const t = now();
        metrics.generationId ??= chunk.id ?? null;
        if (chunk.error) {
          const code = typeof chunk.error.code === 'number' ? chunk.error.code : null;
          fail('stream_error', chunk.error.message ?? 'error in stream', code);
          break;
        }
        for (const choice of chunk.choices ?? []) {
          const delta = choice.delta;
          const content = delta?.content ?? '';
          let text = content.length > 0 || (delta?.reasoning ?? '').length > 0;
          for (const call of delta?.tool_calls ?? []) {
            const seen = calls.get(call.index) ?? { id: '', name: '', arguments: '' };
            seen.id ||= call.id ?? '';
            seen.name += call.function?.name ?? '';
            seen.arguments += call.function?.arguments ?? '';
            calls.set(call.index, seen);
            text ||= (call.function?.arguments ?? '').length > 0;
          }
          if (text) tFirst ??= t;
          if (content.length > 0) metrics.ttfvtMs ??= t - start;
          if (choice.finish_reason) metrics.finishReason = choice.finish_reason;
        }
        if (chunk.usage) {
          const usage = chunk.usage;
          metrics.promptTokens = usage.prompt_tokens ?? null;
          metrics.completionTokens = usage.completion_tokens ?? null;
          metrics.reasoningTokens = usage.completion_tokens_details?.reasoning_tokens ?? null;
          metrics.cachedTokens = usage.prompt_tokens_details?.cached_tokens ?? null;
          metrics.costUsd = usage.cost ?? null;
        }
      }
      metrics.toolCalls = [...calls.entries()].toSorted(([a], [b]) => a - b).map(([, c]) => c);
      if (signal.aborted) fail('timeout', `no end of stream after ${timeoutMs}ms`);
      else if (metrics.status === 'ok' && metrics.finishReason === null)
        fail('stream_error', 'stream ended without a finish reason');
      else if (metrics.status === 'ok' && metrics.finishReason === 'length')
        metrics.status = 'truncated';
    }
  } catch (error) {
    if (signal.aborted) fail('timeout', `no response after ${timeoutMs}ms`);
    else fail('stream_error', errorMessage(error));
  }

  const tEnd = now();
  metrics.totalMs = tEnd - start;
  if (tFirst !== null) {
    metrics.ttftMs = tFirst - start;
    if (metrics.completionTokens !== null && tEnd > tFirst)
      metrics.outputTps = (metrics.completionTokens * 1000) / (tEnd - tFirst);
  }
  return metrics;
}

/** The message of a thrown error, with the network code of its cause (`fetch failed: ENOTFOUND`). */
function errorMessage(error: unknown) {
  if (!(error instanceof Error)) return String(error);
  const { cause } = error;
  const code = cause instanceof Error && 'code' in cause ? cause.code : undefined;
  return typeof code === 'string' ? `${error.message}: ${code}` : error.message;
}

const Generation = z.object({
  data: z.object({
    provider_name: z.string().nullish(),
    latency: z.number().nullish(),
    generation_time: z.number().nullish(),
  }),
});

export type Generation = {
  providerUsed: string | null;
  latencyMs: number | null;
  generationTimeMs: number | null;
};

export type GenerationOptions = {
  apiKey: string;
  fetch?: typeof fetch;
  attempts?: number;
  delayMs?: number;
  /** Per attempt: a stalled lookup is abandoned and retried like a missing entry. */
  attemptTimeoutMs?: number;
  sleep?: (ms: number) => Promise<void>;
};

/**
 * The provider that actually served a generation (the only way to know it for auto), and the
 * server-side timings. The entry shows up with a delay, so retry with exponential backoff.
 */
export async function fetchGeneration(
  id: string,
  {
    apiKey,
    fetch: fetchImpl = globalThis.fetch,
    attempts = 5,
    delayMs = 500,
    attemptTimeoutMs = 10_000,
    sleep = async (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
  }: GenerationOptions,
): Promise<Generation | null> {
  /* oxlint-disable no-await-in-loop -- each attempt waits for the previous one to fail */
  for (let attempt = 0; attempt < attempts; attempt++) {
    if (attempt > 0) await sleep(delayMs * 2 ** (attempt - 1));
    try {
      const response = await fetchImpl(`${API}/generation?id=${encodeURIComponent(id)}`, {
        headers: { authorization: `Bearer ${apiKey}` },
        signal: AbortSignal.timeout(attemptTimeoutMs),
      });
      if (!response.ok) continue;
      const { data } = Generation.parse(await response.json());
      return {
        providerUsed: data.provider_name ?? null,
        latencyMs: data.latency ?? null,
        generationTimeMs: data.generation_time ?? null,
      };
    } catch {
      // Network or parse error: retry like a missing entry.
    }
  }
  /* oxlint-enable no-await-in-loop */
  return null;
}
