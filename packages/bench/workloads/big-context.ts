import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { SERIES_LENGTH } from '../config.ts';
import {
  estimateTokens,
  type Message,
  MESSAGE_OVERHEAD,
  type WorkloadSpec,
  worstTokens,
} from './common.ts';

/**
 * About 30k input tokens behind a shared prefix (SPEC §5). A series sends `SERIES_LENGTH`
 * questions on the same prefix: the first call is cold, the next ones can hit the prompt cache.
 * A nonce heads the prefix, so no series, config or earlier run can warm another one's cache.
 */

export const CORPUS_FILE = path.join(import.meta.dirname, '..', 'fixtures', 'corpus.txt');
/** About 30k tokens of code. */
export const CORPUS_CHARS = 120_000;

const QUESTIONS = [
  'Which function pins a request body to a single provider, and in which file is it defined?',
  'What does the `status` field of an endpoint mean?',
  'Which HTTP route tells which provider served a generation?',
  'How are two strategies that resolve to the same tag handled?',
  'Which file defines the RPC contract between the server and the TUI?',
] as const;

let corpus: string | undefined;
function loadCorpus() {
  try {
    corpus ??= readFileSync(CORPUS_FILE, 'utf8');
  } catch {
    throw new Error(`${CORPUS_FILE} is missing; run \`pnpm --filter @orpm/bench bench:corpus\``);
  }
  return corpus;
}

/** Unique per run, model, config and series; deterministic, so a resumed series keeps it. */
export function nonce(runId: string, model: string, tag: string | null, series: number) {
  return createHash('sha256')
    .update(`${runId}\n${model}\n${tag ?? 'auto'}\n${series}`)
    .digest('hex')
    .slice(0, 16);
}

function system(id: string) {
  return (
    `Session ${id}. You answer questions about the code base below, in one sentence.\n\n` +
    loadCorpus()
  );
}

/** The messages of one request: the shared prefix, then the question at `position`. */
function messages(id: string, position: number): Message[] {
  return [
    { role: 'system', content: system(id) },
    { role: 'user', content: QUESTIONS[position % QUESTIONS.length]! },
  ];
}

const longestQuestion = Math.max(...QUESTIONS.map((q) => q.length));
const prefixChars = () => system('0'.repeat(16)).length;

const spec: WorkloadSpec = {
  get expected() {
    const prefix = estimateTokens('x'.repeat(prefixChars()));
    const question = 2 * MESSAGE_OVERHEAD + estimateTokens('x'.repeat(longestQuestion));
    return Array.from({ length: SERIES_LENGTH }, (_, position) => ({
      input: prefix + question,
      cachedInput: position === 0 ? 0 : prefix,
      output: 60,
    }));
  },
  worstInput: () => {
    const input = worstTokens('x'.repeat(prefixChars() + longestQuestion)) + 2 * MESSAGE_OVERHEAD;
    return Array.from({ length: SERIES_LENGTH }, () => input);
  },
};

export const bigContext = { QUESTIONS, messages, nonce, spec };
