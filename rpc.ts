import { Rpc } from "@opencode/plugin"
import { z } from "zod"

export const Tier = z.enum(["flex", "default", "priority"])
export type Tier = z.infer<typeof Tier>

export const Endpoint = z.object({
  /** Provider slug accepted by `provider.only`, e.g. "openai/flex". */
  tag: z.string(),
  provider: z.string(),
  tier: Tier,
  /** USD per million tokens; null when OpenRouter does not publish the price. */
  input: z.number().nullable(),
  output: z.number().nullable(),
  context: z.number().nullable(),
  quantization: z.string().nullable(),
  /** 0 is healthy; any other value is a degraded endpoint. */
  status: z.number(),
  uptime: z.number().nullable(),
  reasoning: z.boolean(),
})
export type Endpoint = z.infer<typeof Endpoint>

/** What is persisted per model: enough to route and to render the footer without refetching. */
export const Choice = Endpoint.pick({ tag: true, provider: true, tier: true, input: true, output: true })
export type Choice = z.infer<typeof Choice>

const model = z.string().describe("OpenRouter model id, e.g. openai/gpt-6-sol")

export const OpenRouterProviders = Rpc.define({
  id: "openrouter-provider-manager",
  methods: {
    listEndpoints: {
      input: z.object({ model }),
      output: z.object({ endpoints: z.array(Endpoint) }),
    },
    getChoice: {
      input: z.object({ model }),
      output: z.object({ choice: Choice.nullable() }),
    },
    setChoice: {
      input: z.object({ model, choice: Choice.nullable() }),
      output: z.object({ choice: Choice.nullable() }),
    },
    debug: {
      input: z.object({ enabled: z.boolean().optional() }),
      output: z.object({ enabled: z.boolean(), log: z.string() }),
    },
  },
  events: {
    choice: { schema: z.object({ model, choice: Choice.nullable() }) },
  },
})

export default OpenRouterProviders
