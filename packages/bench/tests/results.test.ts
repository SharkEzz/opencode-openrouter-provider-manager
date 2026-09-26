import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { appendLines, appendProviders, readLines, type ResultLine } from '../results.ts';

const dirs: string[] = [];
afterEach(() => {
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true });
});

const line = (overrides: Partial<ResultLine>): ResultLine => ({
  runId: 'run-1',
  key: 'unit',
  model: 'a/model',
  configs: ['auto'],
  tag: null,
  workload: 'agentic',
  effort: 'medium',
  iteration: 0,
  warmup: false,
  startedAt: '2026-09-26T00:00:00.000Z',
  status: 'ok',
  error: null,
  finishReason: 'stop',
  ttftMs: 1,
  ttfvtMs: null,
  totalMs: 2,
  outputTps: null,
  promptTokens: 1,
  completionTokens: 1,
  reasoningTokens: 0,
  cachedTokens: 0,
  costUsd: 0.001,
  toolCalls: 0,
  providerUsed: null,
  serverLatencyMs: null,
  generationTimeMs: null,
  ...overrides,
});

describe('readLines', () => {
  it('merges the providers recorded after the lines, and keeps null where none came', () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'bench-'));
    dirs.push(dir);
    const lines = [line({ turn: 0 }), line({ turn: 1 }), line({ key: 'other', turn: 0 })];
    appendLines('run-1', lines, dir);
    appendProviders(
      'run-1',
      [{ ...lines[1]!, providerUsed: 'Host B', serverLatencyMs: 700, generationTimeMs: 900 }],
      dir,
    );
    expect(readLines('run-1', dir).map((l) => [l.key, l.turn, l.providerUsed])).toEqual([
      ['unit', 0, null],
      ['unit', 1, 'Host B'],
      ['other', 0, null],
    ]);
  });
});
