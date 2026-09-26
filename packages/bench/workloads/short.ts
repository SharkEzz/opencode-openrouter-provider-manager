import { type Message, messageTokens, type WorkloadSpec, worstTokens } from './common.ts';

/** A short question with about 50 output tokens: mostly TTFT and routing overhead (SPEC §5). */

const SYSTEM = 'You are a concise assistant. Answer in plain text without Markdown.';
const QUESTION =
  'In two sentences, explain what the HTTP 429 status code means and how a client should react to it.';

function messages(): Message[] {
  return [
    { role: 'system', content: SYSTEM },
    { role: 'user', content: QUESTION },
  ];
}

const spec: WorkloadSpec = {
  expected: [{ input: messageTokens(messages()), cachedInput: 0, output: 50 }],
  worstInput: () => [messageTokens(messages(), worstTokens)],
};

export const short = { messages, spec };
