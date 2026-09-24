import { describe, expect, it } from "vitest"
import { pinProvider } from "../src/pin.ts"

describe("pinProvider", () => {
  it("adds a strict provider preference", () => {
    expect(pinProvider({ model: "openai/gpt-6-sol" }, "openai/flex")).toEqual({
      model: "openai/gpt-6-sol",
      provider: { only: ["openai/flex"], allow_fallbacks: false },
    })
  })

  it("replaces order and fallbacks but keeps other provider settings", () => {
    const pinned = pinProvider(
      { provider: { order: ["azure"], allow_fallbacks: true, sort: "price", data_collection: "deny" } },
      "openai/flex",
    )
    expect(pinned.provider).toEqual({
      only: ["openai/flex"],
      allow_fallbacks: false,
      sort: "price",
      data_collection: "deny",
    })
  })

  it("leaves the variant's reasoning and the rest of the body untouched", () => {
    const body = { reasoning: { effort: "high" }, service_tier: "flex", messages: [{ role: "user", content: "ok" }] }
    const pinned = pinProvider(body, "openai/flex")
    expect(pinned.reasoning).toBe(body.reasoning)
    expect(pinned.service_tier).toBe("flex")
    expect(pinned.messages).toBe(body.messages)
  })

  it("does not mutate its input", () => {
    const body = { provider: { order: ["azure"] } }
    pinProvider(body, "openai/flex")
    expect(body).toEqual({ provider: { order: ["azure"] } })
  })
})
