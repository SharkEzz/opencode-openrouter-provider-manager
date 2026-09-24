/**
 * Pins an OpenRouter request body to one endpoint. Only `provider` changes, so the
 * variant's `reasoning` settings and every other field pass through untouched.
 */
export function pinProvider(body: Record<string, unknown>, tag: string): Record<string, unknown> {
  // `order` would let OpenRouter try other endpoints first; `only` is the whole point.
  const value = body.provider;
  const source = isRecord(value) ? value : {};
  const { order: _order, ...provider } = source;
  return { ...body, provider: { ...provider, only: [tag], allow_fallbacks: false } };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
