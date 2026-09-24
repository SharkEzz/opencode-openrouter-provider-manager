import type { ModelRef } from './tui-state.ts';

/**
 * The model the TUI is showing. A pick made in the model picker only applies to the screen
 * it was made on: reopening a session restores that session's model, whatever was picked
 * elsewhere since. On the home screen there is no session, so the last pick applies.
 */
export function resolveModel(input: {
  readonly sessionID: string | undefined;
  readonly sessionModel: ModelRef | undefined;
  /** Pick made on this screen (session or home), if any. */
  readonly pick: ModelRef | undefined;
  /** Last pick persisted by the TUI, from any screen. */
  readonly lastPicked: () => ModelRef | undefined;
}): ModelRef | undefined {
  if (input.pick) return input.pick;
  return input.sessionID ? input.sessionModel : input.lastPicked();
}
