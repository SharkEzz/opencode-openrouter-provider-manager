import { describe, expect, it } from 'vitest';
import type { Endpoint } from '../rpc.ts';
import { degraded, price, summary, tokens } from '../src/format.ts';

const endpoint = (overrides: Partial<Endpoint> = {}): Endpoint => ({
  tag: 'openai',
  provider: 'OpenAI',
  tier: 'default',
  input: 2,
  output: 10,
  context: 1_100_000,
  quantization: null,
  status: 0,
  uptime: 100,
  reasoning: true,
  ...overrides,
});

describe('price', () => {
  it('formats dollars per million with two decimals from $1', () => {
    expect(price(2)).toBe('$2.00');
    expect(price(10.75)).toBe('$10.75');
  });
  it('keeps three decimals below $1, without a trailing zero', () => {
    expect(price(0.05)).toBe('$0.05');
    expect(price(0.046)).toBe('$0.046');
    expect(price(0.1)).toBe('$0.10');
  });
  it('shows ? when OpenRouter publishes no price', () => {
    expect(price(null)).toBe('?');
  });
});

describe('tokens', () => {
  it('uses k below a million and M above', () => {
    expect(tokens(8192)).toBe('8k');
    expect(tokens(524_288)).toBe('524k');
    expect(tokens(1_100_000)).toBe('1.1M');
    expect(tokens(1_000_000)).toBe('1M');
  });
  it('shows ? for an unknown context', () => {
    expect(tokens(null)).toBe('?');
  });
});

describe('degraded', () => {
  it('is false for a healthy endpoint', () => {
    expect(degraded(endpoint())).toBe(false);
  });
  it('flags a non-zero status', () => {
    expect(degraded(endpoint({ status: -2 }))).toBe(true);
  });
  it('flags uptime under 95% but not unknown uptime', () => {
    expect(degraded(endpoint({ uptime: 94.9 }))).toBe(true);
    expect(degraded(endpoint({ uptime: 95 }))).toBe(false);
    expect(degraded(endpoint({ uptime: null }))).toBe(false);
  });
});

describe('summary', () => {
  it('joins tag and prices', () => {
    expect(
      summary({ tag: 'openai/flex', provider: 'OpenAI', tier: 'flex', input: 1, output: 5 }),
    ).toBe('openai/flex · $1.00/$5.00');
  });
});
