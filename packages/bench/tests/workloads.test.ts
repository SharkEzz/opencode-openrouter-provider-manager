import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import type { ToolCall } from '../client.ts';
import { MAX_AGENTIC_TURNS, SERIES_LENGTH } from '../config.ts';
import { MAX_CALLS_PER_TURN } from '../workloads/agentic.ts';
import { CORPUS_CHARS, CORPUS_FILE } from '../workloads/big-context.ts';
import { agentic, bigContext, SPECS } from '../workloads/index.ts';

const call = (name: string, args: object | string = {}, id = `call-${name}`): ToolCall => ({
  id,
  name,
  arguments: typeof args === 'string' ? args : JSON.stringify(args),
});

describe('agentic', () => {
  it('fails the tests until the faulty file is rewritten, then passes', () => {
    const task = new agentic.Task();
    expect(task.run(call('run_tests'))).toContain('fail 2');
    expect(task.run(call('write_file', { path: 'README.md', content: 'x' }))).toBe(
      'wrote README.md',
    );
    expect(task.run(call('run_tests'))).toContain('fail 2');
    const fixed = 'export const total = () => 0;\n';
    expect(task.run(call('write_file', { path: './src/cart.ts', content: fixed }))).toBe(
      'wrote src/cart.ts',
    );
    expect(task.run(call('read_file', { path: 'src/cart.ts' }))).toBe(fixed);
    expect(task.run(call('run_tests'))).toContain('fail 0');
  });

  it('lists directories and reports bad calls', () => {
    const task = new agentic.Task();
    expect(task.run(call('list_dir', { path: '.' }))).toBe('README.md\npackage.json\nsrc/\ntest/');
    expect(task.run(call('list_dir', { path: 'src' }))).toBe('cart.ts');
    expect(task.run(call('read_file', { path: 'nope.ts' }))).toMatch(/no such file/);
    expect(task.run(call('read_file', '{"path":'))).toMatch(/not valid JSON/);
    expect(task.run(call('read_file', { path: 3 }))).toMatch(/must be strings/);
    expect(task.run(call('rm', {}))).toMatch(/unknown tool/);
  });

  it('replays tool calls without text and answers each one, refusing extra calls', () => {
    const task = new agentic.Task();
    const calls = Array.from({ length: MAX_CALLS_PER_TURN + 1 }, (_, i) =>
      call('run_tests', {}, `c${i}`),
    );
    task.reply(calls);
    const [assistant, ...results] = task.messages.slice(2);
    expect(assistant).toMatchObject({ role: 'assistant', content: null });
    expect(results.map((m) => m.role === 'tool' && m.tool_call_id)).toEqual(calls.map((c) => c.id));
    expect(results.at(-1)?.content).toMatch(/at most/);
  });

  it('bounds the reservation over every turn', () => {
    const worst = SPECS.agentic.worstInput(4_000);
    expect(worst).toHaveLength(MAX_AGENTIC_TURNS);
    expect(worst[1]! - worst[0]!).toBeGreaterThan(2 * 4_000);
  });
});

describe('big-context', () => {
  it('shares one prefix within a series and changes it across series, configs and runs', () => {
    const id = bigContext.nonce('run-1', 'a/model', 'host', 0);
    const [first, second] = [0, 3].map((position) => bigContext.messages(id, position));
    expect(first![0]).toEqual(second![0]);
    expect(first![1]).not.toEqual(second![1]);
    const others = [
      bigContext.nonce('run-1', 'a/model', 'host', 1),
      bigContext.nonce('run-1', 'a/model', null, 0),
      bigContext.nonce('run-2', 'a/model', 'host', 0),
    ];
    expect(new Set([id, ...others]).size).toBe(4);
  });

  it('keeps the committed corpus near 30k tokens', () => {
    const corpus = readFileSync(CORPUS_FILE, 'utf8');
    expect(corpus.length).toBeLessThanOrEqual(CORPUS_CHARS);
    expect(corpus.length).toBeGreaterThan(0.9 * CORPUS_CHARS);
    expect(corpus.startsWith('// file: packages/plugin/')).toBe(true);
    expect(SPECS['big-context'].expected).toHaveLength(SERIES_LENGTH);
  });
});
