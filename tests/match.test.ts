import { describe, expect, it } from "vitest"
import type { Endpoint } from "../rpc"
import { AUTO, resolveQuery } from "../src/match"

const endpoints: Endpoint[] = [
  ["openai/flex", "OpenAI"],
  ["openai", "OpenAI"],
  ["azure", "Azure"],
  ["azure/us", "Azure"],
  ["azure/eu", "Azure"],
  ["amazon-bedrock/us-east-1", "Amazon Bedrock"],
].map(([tag, provider]) => ({
  tag: tag!,
  provider: provider!,
  tier: "default" as const,
  input: 1,
  output: 1,
  context: null,
  quantization: null,
  status: 0,
  uptime: null,
  reasoning: true,
}))

describe("resolveQuery", () => {
  it("maps auto to the Auto choice", () => {
    expect(resolveQuery("auto", endpoints)).toEqual({ kind: "direct", value: AUTO })
  })

  it("pins an exact tag even when other tags start with it", () => {
    expect(resolveQuery("azure", endpoints)).toEqual({ kind: "direct", value: "azure" })
    expect(resolveQuery("openai", endpoints)).toEqual({ kind: "direct", value: "openai" })
  })

  it("pins a prefix or provider name matching a single endpoint", () => {
    expect(resolveQuery("amazon", endpoints)).toEqual({ kind: "direct", value: "amazon-bedrock/us-east-1" })
    expect(resolveQuery("bedrock", endpoints)).toEqual({ kind: "direct", value: "amazon-bedrock/us-east-1" })
  })

  it("narrows the list when several endpoints match", () => {
    const result = resolveQuery("az", endpoints)
    expect(result.kind).toBe("list")
    expect(result.kind === "list" && result.candidates.map((e) => e.tag)).toEqual(["azure", "azure/us", "azure/eu"])
  })

  it("matches provider names on word starts only", () => {
    // "Amazon" contains "az" but must not join the Azure endpoints.
    expect(resolveQuery("zon", endpoints)).toEqual({ kind: "none" })
  })

  it("reports no match", () => {
    expect(resolveQuery("zzz", endpoints)).toEqual({ kind: "none" })
  })

  it("ignores case and surrounding spaces", () => {
    expect(resolveQuery("  OpenAI/FLEX ", endpoints)).toEqual({ kind: "direct", value: "openai/flex" })
    expect(resolveQuery(" AUTO", endpoints)).toEqual({ kind: "direct", value: AUTO })
  })
})
