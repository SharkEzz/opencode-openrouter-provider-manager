import type { ToolCall } from '../client.ts';
import { z } from 'zod';
import { MAX_AGENTIC_TURNS } from '../config.ts';
import {
  estimateTokens,
  type Message,
  messageTokens,
  type WorkloadSpec,
  worstTokens,
} from './common.ts';

/**
 * A multi-turn coding task on a virtual project (SPEC §5): a cart total ignores quantities and
 * its test fails. The tools are mocked deterministically, so every run sees the same world:
 * `run_tests` fails until the faulty file has been rewritten, then passes.
 */

const FAULTY = 'src/cart.ts';

const FILES: Record<string, string> = {
  'package.json': `{
  "name": "cart",
  "type": "module",
  "scripts": { "test": "node --test test/" }
}
`,
  'README.md': `# cart

Computes the total of a shopping cart, in cents, with an optional percentage discount.
`,
  [FAULTY]: `export type Item = { sku: string; price: number; quantity: number };

/** Total in cents, with \`percent\` off every item, rounded to the cent. */
export function total(items: Item[], percent = 0): number {
  const subtotal = items.reduce((sum, item) => sum + item.price, 0);
  return Math.round(subtotal * (1 - percent / 100));
}
`,
  'test/cart.test.ts': `import assert from 'node:assert/strict';
import { test } from 'node:test';
import { total } from '../src/cart.ts';

const items = [
  { sku: 'pen', price: 250, quantity: 2 },
  { sku: 'pad', price: 100, quantity: 1 },
];

test('an empty cart costs nothing', () => assert.equal(total([]), 0));
test('each price counts once per unit', () => assert.equal(total(items), 600));
test('the discount applies to the whole cart', () => assert.equal(total(items, 10), 540));
`,
};

const FAILING = `▶ test/cart.test.ts
  ✔ an empty cart costs nothing (0.4ms)
  ✖ each price counts once per unit (0.6ms)
    AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:
    350 !== 600
        at test/cart.test.ts:10:52
  ✖ the discount applies to the whole cart (0.2ms)
    AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:
    315 !== 540
        at test/cart.test.ts:11:58
ℹ tests 3
ℹ pass 1
ℹ fail 2
`;

const PASSING = `▶ test/cart.test.ts
  ✔ an empty cart costs nothing (0.4ms)
  ✔ each price counts once per unit (0.3ms)
  ✔ the discount applies to the whole cart (0.2ms)
ℹ tests 3
ℹ pass 3
ℹ fail 0
`;

const SYSTEM = [
  'You are a coding agent working in a small TypeScript project.',
  'You can only act through the provided tools; paths are relative to the project root.',
  'Fix bugs with minimal changes: rewrite the whole faulty file with write_file.',
].join(' ');
const TASK =
  'The test suite fails. Find the cause, fix it, and run the tests again. Once they pass, ' +
  'reply with a one-line summary and no tool call.';

const pathParam = { type: 'string', description: 'Path relative to the project root' };
export const TOOLS = [
  tool('list_dir', 'List the entries of a directory; directories end with "/".', {
    path: pathParam,
  }),
  tool('read_file', 'Read a text file.', { path: pathParam }),
  tool('write_file', 'Replace the whole content of a text file.', {
    path: pathParam,
    content: { type: 'string', description: 'The new content of the file' },
  }),
  tool('run_tests', 'Run the test suite and return its output.', {}),
];

function tool(name: string, description: string, properties: Record<string, unknown>) {
  return {
    type: 'function',
    function: {
      name,
      description,
      parameters: {
        type: 'object',
        properties,
        required: Object.keys(properties),
        additionalProperties: false,
      },
    },
  };
}

/** Tool results are cut, and extra calls in one turn are refused, to bound the next input. */
export const MAX_TOOL_OUTPUT_CHARS = 2_000;
export const MAX_CALLS_PER_TURN = 4;

function initialMessages(): Message[] {
  return [
    { role: 'system', content: SYSTEM },
    { role: 'user', content: TASK },
  ];
}

const Args = z.object({ path: z.string().optional(), content: z.string().optional() });

/** One task: the conversation and the virtual file system it acts on. */
export class Task {
  readonly messages = initialMessages();
  readonly files = new Map(Object.entries(FILES));
  fixed = false;

  /** Appends the assistant tool calls and their results; the calls are answered in order. */
  reply(calls: ToolCall[]) {
    this.messages.push({
      role: 'assistant',
      content: null,
      tool_calls: calls.map((call) => ({
        id: call.id,
        type: 'function',
        function: { name: call.name, arguments: call.arguments },
      })),
    });
    calls.forEach((call, index) => {
      const output =
        index < MAX_CALLS_PER_TURN
          ? this.run(call)
          : `error: at most ${MAX_CALLS_PER_TURN} tool calls per turn`;
      this.messages.push({
        role: 'tool',
        tool_call_id: call.id,
        content: output.slice(0, MAX_TOOL_OUTPUT_CHARS),
      });
    });
  }

  run(call: ToolCall): string {
    let json: unknown;
    try {
      json = call.arguments.trim() ? JSON.parse(call.arguments) : {};
    } catch {
      return 'error: arguments are not valid JSON';
    }
    const parsed = Args.safeParse(json);
    if (!parsed.success) return 'error: path and content must be strings';
    const args = parsed.data;
    const file = typeof args.path === 'string' ? normalize(args.path) : null;
    switch (call.name) {
      case 'list_dir':
        return this.list(file ?? '');
      case 'read_file':
        if (file === null) return 'error: missing path';
        return this.files.get(file) ?? `error: ${file}: no such file`;
      case 'write_file':
        if (file === null || typeof args.content !== 'string')
          return 'error: missing path or content';
        if (file === FAULTY && args.content !== FILES[FAULTY]) this.fixed = true;
        this.files.set(file, args.content);
        return `wrote ${file}`;
      case 'run_tests':
        return this.fixed ? PASSING : FAILING;
      default:
        return `error: unknown tool ${call.name}`;
    }
  }

  private list(dir: string) {
    const prefix = dir ? `${dir}/` : '';
    const entries = new Set<string>();
    for (const file of this.files.keys()) {
      if (!file.startsWith(prefix)) continue;
      const [head, ...rest] = file.slice(prefix.length).split('/');
      entries.add(rest.length > 0 ? `${head}/` : (head ?? ''));
    }
    return entries.size > 0 ? [...entries].sort().join('\n') : `error: ${dir}: no such directory`;
  }
}

/** `./src/`, `/src` and `src` are the same directory. */
function normalize(file: string) {
  return file
    .split('/')
    .filter((part) => part !== '' && part !== '.')
    .join('/');
}

/** Turns a successful solve usually takes: list, read ×2, write, test, summary. */
const EXPECTED_TURNS = 6;
/** Tool call arguments and results added to the conversation by one expected turn. */
const EXPECTED_TURN_GROWTH = 250;

const spec: WorkloadSpec = {
  expected: Array.from({ length: EXPECTED_TURNS }, (_, turn) => ({
    input:
      messageTokens(initialMessages()) +
      estimateTokens(JSON.stringify(TOOLS)) +
      turn * EXPECTED_TURN_GROWTH,
    cachedInput: 0,
    output: 120,
  })),
  // Each turn adds its tool calls (at most max_tokens) and their results.
  worstInput: (maxTokens) => {
    const base = messageTokens(initialMessages(), worstTokens) + worstTokens(JSON.stringify(TOOLS));
    const results = MAX_CALLS_PER_TURN * (worstTokens('x'.repeat(MAX_TOOL_OUTPUT_CHARS)) + 16);
    // Calls beyond the limit cost at least a few argument tokens each, so their short refusals
    // fit in a second max_tokens.
    const growth = 2 * maxTokens + results;
    return Array.from({ length: MAX_AGENTIC_TURNS }, (_, turn) => base + turn * growth);
  },
};

export const agentic = { TOOLS, Task, spec };
