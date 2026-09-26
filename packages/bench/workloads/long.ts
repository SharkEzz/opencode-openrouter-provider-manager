import { type Message, messageTokens, type WorkloadSpec, worstTokens } from './common.ts';

/**
 * A long generation (SPEC §5 asks ~1,500 tokens; the mini-runs measured 1,000 to 3,000 visible
 * tokens depending on the model): mostly throughput and total latency.
 */

const SYSTEM = 'You are a senior TypeScript engineer. Reply with a single TypeScript code block.';
const TASK = [
  'Write a self-contained TypeScript module implementing an LRU cache with a per-entry',
  'time-to-live. Export a generic `LruCache<K, V>` class with `get`, `set`, `delete`, `has`,',
  '`clear` and a `size` getter, an optional `onEvict` callback, and a `now` option to inject',
  'the clock. Document every public member with TSDoc, and end the module with a short usage',
  'example in a comment. Do not use any dependency.',
].join(' ');

function messages(): Message[] {
  return [
    { role: 'system', content: SYSTEM },
    { role: 'user', content: TASK },
  ];
}

const spec: WorkloadSpec = {
  expected: [{ input: messageTokens(messages()), cachedInput: 0, output: 2_000 }],
  worstInput: () => [messageTokens(messages(), worstTokens)],
};

export const long = { messages, spec };
