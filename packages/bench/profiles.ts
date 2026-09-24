import type { Observed, Profile } from './schema.ts';

/**
 * Token mix of real usage, from an observed export (SPEC §11.3, §11.9). In OpenRouter usage,
 * cached tokens are part of the prompt tokens and reasoning tokens part of the completion
 * tokens, so both are split out to keep the four shares disjoint.
 */
export function profileFromObserved(
  observed: Observed,
  { id = 'coding-agent', label = 'Coding agent' } = {},
): Profile {
  let prompt = 0;
  let cached = 0;
  let completion = 0;
  let reasoning = 0;
  let requests = 0;
  for (const row of observed.rows) {
    prompt += row.promptTokens;
    cached += Math.min(row.cachedTokens, row.promptTokens);
    completion += row.completionTokens;
    reasoning += Math.min(row.reasoningTokens, row.completionTokens);
    requests += row.requests;
  }
  const total = prompt + completion;
  if (total === 0) throw new Error('The observed export has no tokens');
  return {
    id,
    label,
    source: 'openrouter-observed',
    shares: {
      input: (prompt - cached) / total,
      cachedInput: cached / total,
      output: (completion - reasoning) / total,
      reasoning: reasoning / total,
    },
    n: requests,
    period: observed.period,
  };
}
