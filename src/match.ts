import type { Endpoint } from "../rpc"

/** Dialog/argument value meaning "no pin, let OpenRouter route". */
export const AUTO = "__auto__"

export type QueryResult =
  | { readonly kind: "direct"; readonly value: string }
  | { readonly kind: "list"; readonly candidates: readonly Endpoint[] }
  | { readonly kind: "none" }

/**
 * Resolves the optional `/provider` argument: "auto", an exact tag (wins even when other
 * tags share it as a prefix), or a tag prefix / provider name word prefix that narrows the list.
 */
export function resolveQuery(query: string, endpoints: readonly Endpoint[]): QueryResult {
  const q = query.trim().toLowerCase()
  if (q === "auto") return { kind: "direct", value: AUTO }
  const exact = endpoints.find((e) => e.tag.toLowerCase() === q)
  if (exact) return { kind: "direct", value: exact.tag }
  // Provider names match on word starts: "bedrock" finds "Amazon Bedrock", "az" doesn't find "Amazon".
  const candidates = endpoints.filter(
    (e) => e.tag.toLowerCase().startsWith(q) || e.provider.toLowerCase().split(/\s+/).some((word) => word.startsWith(q)),
  )
  if (candidates.length === 1) return { kind: "direct", value: candidates[0]!.tag }
  if (candidates.length === 0) return { kind: "none" }
  return { kind: "list", candidates }
}
