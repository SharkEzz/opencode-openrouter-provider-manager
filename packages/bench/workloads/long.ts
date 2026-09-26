import { type Message, messageTokens, type WorkloadSpec, worstTokens } from './common.ts';

/** A generation of about 1,500 tokens: mostly throughput and total latency (SPEC §5). */

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
  expected: [{ input: messageTokens(messages()), cachedInput: 0, output: 1_500 }],
  worstInput: () => [messageTokens(messages(), worstTokens)],
};

export const long = { messages, spec };
