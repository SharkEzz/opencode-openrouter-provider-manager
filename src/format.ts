import type { Choice, Endpoint } from "../rpc"

export function price(value: number | null) {
  if (value === null) return "?"
  return `$${value < 1 ? value.toFixed(3).replace(/0$/, "") : value.toFixed(2)}`
}

export function tokens(value: number | null) {
  if (value === null) return "?"
  if (value >= 1_000_000) return `${+(value / 1_000_000).toFixed(1)}M`
  return `${Math.round(value / 1000)}k`
}

export function degraded(endpoint: Endpoint) {
  return endpoint.status !== 0 || (endpoint.uptime !== null && endpoint.uptime < 95)
}

export function summary(choice: Choice) {
  return `${choice.tag} · ${price(choice.input)}/${price(choice.output)}`
}
