import { mkdirSync, rmSync, writeFileSync } from "node:fs"
import path from "node:path"
import { afterEach, describe, expect, it } from "vitest"
import { MODEL_STATE_FILE, pickedModel } from "../src/tui-state"

function writeState(content: unknown) {
  mkdirSync(path.dirname(MODEL_STATE_FILE), { recursive: true })
  writeFileSync(MODEL_STATE_FILE, typeof content === "string" ? content : JSON.stringify(content))
}

afterEach(() => rmSync(MODEL_STATE_FILE, { force: true }))

describe("pickedModel", () => {
  it("lives in the sandboxed XDG state dir", () => {
    expect(MODEL_STATE_FILE).toBe(path.join(process.env.XDG_STATE_HOME!, "opencode", "model.json"))
  })

  it("reads the most recent pick with its variant", () => {
    writeState({
      recent: [
        { providerID: "openrouter", modelID: "openai/gpt-6-luna" },
        { providerID: "openrouter", modelID: "openai/gpt-6-sol" },
      ],
      variant: { "openrouter/openai/gpt-6-luna": "high", "openrouter/openai/gpt-6-sol": "low" },
    })
    expect(pickedModel()?.model).toEqual({ providerID: "openrouter", id: "openai/gpt-6-luna", variant: "high" })
  })

  it("treats the default variant as no variant", () => {
    writeState({
      recent: [{ providerID: "openrouter", modelID: "upstage/solar-mini4" }],
      variant: { "openrouter/upstage/solar-mini4": "default" },
    })
    expect(pickedModel()?.model.variant).toBeUndefined()
  })

  it("returns nothing for a missing, empty or corrupt file", () => {
    expect(pickedModel()).toBeUndefined()
    writeState({ recent: [] })
    expect(pickedModel()).toBeUndefined()
    writeState("{not json")
    expect(pickedModel()).toBeUndefined()
  })
})
