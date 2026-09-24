export function isRecord<T = unknown>(value: unknown): value is Record<string, T> {
  return typeof value === 'object' && value != undefined && !Array.isArray(value);
}
