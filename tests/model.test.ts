import { describe, expect, it, vi } from 'vitest';
import { resolveModel } from '../src/model.ts';

const sol = { providerID: 'openrouter', id: 'openai/gpt-6-sol', variant: 'low' };
const luna = { providerID: 'openrouter', id: 'openai/gpt-6-luna', variant: 'high' };

describe('resolveModel', () => {
  it("uses the session's model when nothing was picked on this screen", () => {
    const lastPicked = vi.fn<() => typeof luna>(() => luna);
    expect(
      resolveModel({ sessionID: 'ses_1', sessionModel: sol, pick: undefined, lastPicked }),
    ).toBe(sol);
    // Reopening a session must not follow a pick made elsewhere.
    expect(lastPicked).not.toHaveBeenCalled();
  });

  it("prefers a pick made on this screen over the session's model", () => {
    expect(
      resolveModel({
        sessionID: 'ses_1',
        sessionModel: sol,
        pick: luna,
        lastPicked: () => undefined,
      }),
    ).toBe(luna);
  });

  it('falls back to the last pick on the home screen', () => {
    expect(
      resolveModel({
        sessionID: undefined,
        sessionModel: undefined,
        pick: undefined,
        lastPicked: () => luna,
      }),
    ).toBe(luna);
  });

  it("prefers the home screen's own pick", () => {
    expect(
      resolveModel({
        sessionID: undefined,
        sessionModel: undefined,
        pick: sol,
        lastPicked: () => luna,
      }),
    ).toBe(sol);
  });

  it('returns nothing when no model is known', () => {
    expect(
      resolveModel({
        sessionID: 'ses_1',
        sessionModel: undefined,
        pick: undefined,
        lastPicked: () => luna,
      }),
    ).toBeUndefined();
  });
});
