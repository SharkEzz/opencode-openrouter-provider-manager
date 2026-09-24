import { Plugin } from "@opencode/plugin/tui"
import { watch } from "node:fs"
import path from "node:path"
import { createEffect, createSignal, onCleanup, Show } from "solid-js"
import { type Choice, type Endpoint, OpenRouterProviders } from "./rpc"
import { degraded, price, summary, tokens } from "./src/format"
import { AUTO, resolveQuery } from "./src/match"
import { resolveModel } from "./src/model"
import { MODEL_STATE_FILE, type ModelRef, pickedModel } from "./src/tui-state"

const PROVIDER = "openrouter"
const COMMAND = "openrouter.provider"
const HOME = "__home__"

export default Plugin.define({
  id: "openrouter-provider-manager.tui",
  setup(ctx) {
    const rpc = ctx.client.rpc(OpenRouterProviders)
    // model id -> choice (null = Auto). Absent key = not loaded yet.
    const [choices, updateChoices] = ctx.storage.memory("choices", {
      initial: {} as Record<string, Choice | null>,
    })
    const loading = new Set<string>()

    function load(model: string) {
      if (model in choices || loading.has(model)) return
      loading.add(model)
      rpc
        .getChoice({ model })
        .then(({ choice }) => updateChoices((draft) => void (draft[model] = choice)))
        .catch(() => { })
        .finally(() => loading.delete(model))
    }

    const stopChoiceEvents = rpc.events.on("choice", (event) => {
      updateChoices((draft) => void (draft[event.data.model] = event.data.choice))
    })

    // Picks made in the TUI's model picker, keyed by the screen they were made on (a session
    // ID, or HOME). A pick only applies where it was made: reopening a session makes the TUI
    // restore that session's model, whatever was picked elsewhere since.
    const [picks, updatePicks] = ctx.storage.memory("picks", {
      initial: {} as Record<string, ModelRef>,
    })
    const screen = () => {
      const route = ctx.ui.router.current()
      return route.type === "session" ? route.sessionID : HOME
    }
    let watcher: ReturnType<typeof watch> | undefined
    try {
      watcher = watch(path.dirname(MODEL_STATE_FILE), (_event, file) => {
        if (file !== path.basename(MODEL_STATE_FILE)) return
        const picked = pickedModel()?.model
        if (picked) updatePicks((draft) => void (draft[screen()] = picked))
      })
    } catch { }

    function sessionModel(sessionID: string | undefined): ModelRef | undefined {
      return sessionID ? ctx.data.session.get(sessionID)?.model : undefined
    }

    /** A pick made on this screen, else the session's model; on the home screen, the last pick. */
    function currentModel(sessionID: string | undefined): ModelRef | undefined {
      return resolveModel({
        sessionID,
        sessionModel: sessionModel(sessionID),
        pick: picks[sessionID ?? HOME],
        lastPicked: () => pickedModel()?.model,
      })
    }

    async function activeModel(): Promise<ModelRef | undefined> {
      const route = ctx.ui.router.current()
      const current = currentModel(route.type === "session" ? route.sessionID : undefined)
      if (current) return current
      const fallback = await ctx.client.model.default().catch(() => undefined)
      const info = fallback?.data as { providerID?: string; id?: string } | null | undefined
      return info?.providerID && info.id ? { providerID: info.providerID, id: info.id } : undefined
    }

    function option(endpoint: Endpoint, model: ModelRef) {
      const warnings = [
        degraded(endpoint) ? "dégradé" : "",
        model.variant && !endpoint.reasoning ? `ignore l'effort « ${model.variant} »` : "",
      ].filter(Boolean)
      return {
        title: endpoint.provider,
        value: endpoint.tag,
        description: [
          `${price(endpoint.input)} in / ${price(endpoint.output)} out /M`,
          `ctx ${tokens(endpoint.context)}`,
          endpoint.quantization ?? "",
          endpoint.uptime !== null ? `uptime ${endpoint.uptime.toFixed(1)}%` : "",
          ...warnings,
        ]
          .filter(Boolean)
          .join(" · "),
        footer: endpoint.tag,
      }
    }

    const dialogTitle = (model: ModelRef) => `Endpoint OpenRouter · ${model.id}${model.variant ? ` #${model.variant}` : ""}`

    /** `query` is the optional argument of `/provider`: a tag, a tag prefix or provider name, or "auto". */
    async function pick(query?: string) {
      const model = await activeModel()
      if (!model || model.providerID !== PROVIDER) {
        ctx.ui.toast.show({
          title: "OpenRouter",
          message: model ? `${model.providerID}/${model.id} n'est pas un modèle OpenRouter.` : "Aucun modèle actif.",
          variant: "warning",
        })
        return
      }

      // Fetching endpoints can take a few seconds: show a loader right away. Esc closes it
      // and aborts the request.
      const abort = new AbortController()
      let loaded = false
      ctx.ui.dialog.show(
        () => <Loading ctx={ctx} title={dialogTitle(model)} />,
        () => loaded || abort.abort(),
      )
      const [listed, stored] = await Promise.all([
        rpc
          .listEndpoints({ model: model.id }, { signal: abort.signal })
          .catch((error: unknown) => (error instanceof Error ? error : new Error(String(error)))),
        rpc.getChoice({ model: model.id }).catch(() => ({ choice: null })),
      ])
      loaded = true
      if (abort.signal.aborted) return
      if (listed instanceof Error) {
        ctx.ui.dialog.clear()
        ctx.ui.toast.show({
          title: "OpenRouter",
          message: listed.message,
          variant: "error",
        })
        return
      }

      const current = stored.choice?.tag ?? AUTO
      let candidates: readonly Endpoint[] = listed.endpoints
      if (query?.trim()) {
        const result = resolveQuery(query, listed.endpoints)
        if (result.kind === "direct") {
          ctx.ui.dialog.clear()
          if (result.value !== current) await apply(model, result.value, listed.endpoints)
          else ctx.ui.toast.show({ title: "OpenRouter", message: `${model.id} utilise déjà ${result.value === AUTO ? "le routage automatique" : result.value}.`, variant: "info" })
          return
        }
        if (result.kind === "none") {
          ctx.ui.dialog.clear()
          const tags = listed.endpoints.map((e) => e.tag)
          ctx.ui.toast.show({
            title: "OpenRouter",
            message: `Aucun endpoint « ${query.trim()} » pour ${model.id}. Disponibles : auto, ${tags.slice(0, 8).join(", ")}${tags.length > 8 ? "…" : ""}`,
            variant: "error",
          })
          return
        }
        candidates = result.candidates
      }

      const selection = ctx.ui.dialog.select<string>({
        title: dialogTitle(model),
        placeholder: "Filtrer les providers…",
        current,
        options: [
          // An ambiguous argument narrows the list to its matches.
          ...(candidates !== listed.endpoints
            ? []
            : [
                {
                  title: "Auto",
                  value: AUTO,
                  description: "Routage OpenRouter par défaut (prix, disponibilité, fallbacks)",
                },
              ]),
          ...candidates.map((endpoint) => option(endpoint, model)),
        ],
      })
      // Prices and warnings don't fit the default width.
      ctx.ui.dialog.set({ size: "large" })
      const value = await selection
      if (value === undefined || value === current) return
      await apply(model, value, listed.endpoints)
    }

    async function apply(model: ModelRef, value: string, endpoints: readonly Endpoint[]) {
      const endpoint = endpoints.find((e) => e.tag === value)
      const choice: Choice | null = endpoint
        ? { tag: endpoint.tag, provider: endpoint.provider, tier: endpoint.tier, input: endpoint.input, output: endpoint.output }
        : null
      await rpc.setChoice({ model: model.id, choice })
      updateChoices((draft) => void (draft[model.id] = choice))
      ctx.ui.toast.show({
        title: "OpenRouter",
        message: choice ? `${model.id} → ${summary(choice)} (strict)` : `${model.id} → routage automatique`,
        variant: "success",
      })
    }

    // Request logging is a plugin option (cli.json `plugins[].options.debug`), mirrored to the
    // server plugin, which owns the request hook. Absent or false turns it off.
    const debug = ctx.options.debug === true
    rpc
      .debug({ enabled: debug })
      .then(({ log }) => {
        if (debug) ctx.ui.toast.show({ title: "OpenRouter", message: `Log des requêtes actif : ${log}`, variant: "info" })
      })
      .catch(() => {})

    // keymap.layer needs the host's Keymap provider, which only exists inside the rendered
    // tree: register it from an invisible component mounted in the `app` slot.
    ctx.ui.slot({
      append: "app",
      render: () => {
        ctx.keymap.layer(() => ({
          mode: "global",
          commands: [
            {
              id: COMMAND,
              title: "OpenRouter : choisir l'endpoint",
              description: "Épingle un provider OpenRouter pour le modèle actif",
              group: "OpenRouter",
              bind: "<leader>o",
              palette: true,
              slash: { name: "provider", arguments: true },
              run: (input) => pick(input),
            },
          ],
          bindings: [COMMAND],
        }))
        return null
      },
    })

    ctx.ui.slot({
      // First in the sidebar, right above the built-in "Context" section.
      prepend: "sidebar.content",
      render: (input) => (
        <SidebarSection ctx={ctx} model={() => currentModel(input.sessionID)} choices={choices} load={load} />
      ),
    })

    const stopModelSelected = ctx.data.on("session.model.selected", (event) => {
      updatePicks((draft) => void delete draft[event.data.sessionID])
    })

    // A strict pin fails loudly when its endpoint is down; point the user at the fix.
    const stopFailures = ctx.data.on("session.execution.failed", (event) => {
      const model = sessionModel(event.data.sessionID)
      const choice = model?.providerID === PROVIDER ? choices[model.id] : undefined
      if (!choice) return
      ctx.ui.toast.show({
        title: "OpenRouter",
        message: `Échec avec l'endpoint épinglé ${choice.tag}. /provider pour en changer ou repasser en Auto.`,
        variant: "error",
        sessionID: event.data.sessionID,
      })
    })

    return () => {
      stopChoiceEvents()
      stopFailures()
      stopModelSelected()
      watcher?.close()
    }
  },
})

function SidebarSection(props: {
  ctx: Plugin.Context
  model: () => ModelRef | undefined
  choices: Record<string, Choice | null>
  load: (model: string) => void
}) {
  const openrouter = () => {
    const ref = props.model()
    return ref?.providerID === PROVIDER ? ref.id : undefined
  }
  createEffect(() => {
    const id = openrouter()
    if (id) props.load(id)
  })
  const choice = () => {
    const id = openrouter()
    return id ? props.choices[id] : undefined
  }
  const color = () => {
    const tier = choice()?.tier
    const theme = props.ctx.theme
    if (tier === "flex") return theme.text.feedback.success.base
    if (tier === "priority") return theme.text.feedback.warning.base
    return choice() ? theme.text.base : theme.text.muted
  }
  // Mirrors the built-in Context section: bold title, then muted detail lines.
  return (
    <Show when={openrouter()}>
      <box>
        <text fg={props.ctx.theme.text.base}>
          <b>OpenRouter</b>
        </text>
        <Show when={choice()} fallback={<text fg={color()}>Auto (routage OpenRouter)</text>}>
          {(pinned) => (
            <>
              <text fg={color()}>{pinned().tag}</text>
              <text fg={props.ctx.theme.text.muted}>
                {price(pinned().input)} in · {price(pinned().output)} out /M
              </text>
            </>
          )}
        </Show>
      </box>
    </Show>
  )
}

const SPINNER = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"]

function Loading(props: { ctx: Plugin.Context; title: string }) {
  const [frame, setFrame] = createSignal(0)
  const timer = setInterval(() => setFrame((f) => (f + 1) % SPINNER.length), 80)
  onCleanup(() => clearInterval(timer))
  return (
    <box paddingLeft={2} paddingRight={2} paddingBottom={1} gap={1}>
      <text fg={props.ctx.theme.text.base}>
        <b>{props.title}</b>
      </text>
      <text fg={props.ctx.theme.text.muted}>{SPINNER[frame()]} Chargement des endpoints…</text>
    </box>
  )
}
