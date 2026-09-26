import type { Effort } from '../config.ts';

/**
 * The fixed prompts of each workload (SPEC §5). Prompts are English and versioned with the code:
 * changing one changes what a run measures.
 */

export type ToolCallMessage = {
  id: string;
  type: 'function';
  function: { name: string; arguments: string };
};

export type Message =
  | { role: 'system' | 'user'; content: string }
  /** Replayed assistant turns carry their tool calls only, never the response text. */
  | { role: 'assistant'; content: null; tool_calls: ToolCallMessage[] }
  | { role: 'tool'; tool_call_id: string; content: string };

/** Tokens of one request; `output` is visible output only, reasoning is added per effort. */
export type Tokens = { input: number; cachedInput: number; output: number };

export type WorkloadSpec = {
  /** Expected requests of one unit (a request, a task or a series), for the dry-run. */
  expected: Tokens[];
  /** Upper bound of the input tokens of each request of one unit, for the reservation. */
  worstInput: (maxTokens: number) => number[];
};

/** Estimate: about 4 characters per token. */
export const estimateTokens = (text: string) => Math.ceil(text.length / 4);
/** Upper bound for reservations: code and JSON tokenize denser, so count 3 characters. */
export const worstTokens = (text: string) => Math.ceil(text.length / 3);
/** Chat template overhead per message. */
export const MESSAGE_OVERHEAD = 16;

/** The request body shared by every workload; `buildBody` pins it afterwards. */
export function requestBody(
  model: string,
  effort: Effort,
  maxTokens: number,
  messages: Message[],
  tools?: unknown[],
): Record<string, unknown> {
  return {
    model,
    messages,
    max_tokens: maxTokens,
    reasoning: { effort },
    // OpenRouter drops parameters an endpoint does not support.
    temperature: 0,
    ...(tools && { tools, tool_choice: 'auto' }),
  };
}

/** Input tokens of a list of messages. */
export function messageTokens(messages: Message[], count = estimateTokens) {
  return messages.reduce(
    (sum, message) =>
      sum +
      MESSAGE_OVERHEAD +
      count(message.content ?? '') +
      (message.role === 'assistant' ? count(JSON.stringify(message.tool_calls)) : 0),
    0,
  );
}
