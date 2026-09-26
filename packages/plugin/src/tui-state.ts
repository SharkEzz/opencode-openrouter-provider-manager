import { readFileSync, statSync } from 'node:fs';
import { homedir } from 'node:os';
import path from 'node:path';
import { z } from 'zod';

export type ModelRef = { providerID: string; id: string; variant?: string | undefined };

// The TUI's own model picker persists its selection here. This is internal, undocumented
// state, read only because plugins cannot see the live selection yet
// (anomalyco/opencode#50315, PR #50745). Drop this once slot inputs expose the model.
export const MODEL_STATE_FILE = path.join(
  process.env.XDG_STATE_HOME ?? path.join(homedir(), '.local', 'state'),
  'opencode',
  'model.json',
);

const ModelState = z.object({
  recent: z.array(z.object({ providerID: z.string(), modelID: z.string() })).optional(),
  variant: z.record(z.string(), z.string()).optional(),
});

/** Last model picked in the TUI, with its variant, and when that selection was written. */
export function pickedModel(): { model: ModelRef; at: number } | undefined {
  try {
    const at = statSync(MODEL_STATE_FILE).mtimeMs;
    const parsed: unknown = JSON.parse(readFileSync(MODEL_STATE_FILE, 'utf8'));
    const result = ModelState.safeParse(parsed);
    if (!result.success) return undefined;
    const state = result.data;
    const last = state.recent?.[0];
    if (!last) return undefined;
    const variant = state.variant?.[`${last.providerID}/${last.modelID}`];
    return {
      model: {
        providerID: last.providerID,
        id: last.modelID,
        variant: variant && variant !== 'default' ? variant : undefined,
      },
      at,
    };
  } catch {
    return undefined;
  }
}
