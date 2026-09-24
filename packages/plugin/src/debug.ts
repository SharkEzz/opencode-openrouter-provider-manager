import { appendFile, mkdir } from 'node:fs/promises';
import { homedir } from 'node:os';
import path from 'node:path';

export const DEBUG_LOG = path.join(
  process.env.XDG_DATA_HOME ?? path.join(homedir(), '.local', 'share'),
  'opencode',
  'log',
  'openrouter-provider-manager.log',
);

/** One line per outgoing OpenRouter request: the fields that decide effort and routing. */
export async function logRequest(entry: {
  kind: string;
  model: string;
  sessionID: string;
  body: Record<string, unknown>;
}) {
  const fields = Object.entries({
    model: entry.model,
    kind: entry.kind,
    session: entry.sessionID,
    // Chat Completions uses `reasoning`; keep the flat variants in case a driver sends them.
    reasoning: entry.body.reasoning,
    reasoning_effort: entry.body.reasoning_effort,
    service_tier: entry.body.service_tier,
    provider: entry.body.provider,
  })
    .filter(([, value]) => value !== undefined)
    .map(([key, value]) => `${key}=${typeof value === 'string' ? value : JSON.stringify(value)}`);
  await mkdir(path.dirname(DEBUG_LOG), { recursive: true });
  await appendFile(DEBUG_LOG, `${new Date().toISOString()} ${fields.join('  ')}\n`);
}
