import { mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { afterAll } from "vitest"

// MODEL_STATE_FILE and DEBUG_LOG are resolved when their modules load, so the XDG dirs must
// point to a sandbox before any test imports them. Setup files run before test modules.
const sandbox = mkdtempSync(path.join(tmpdir(), "orpm-tests-"))
process.env.XDG_STATE_HOME = path.join(sandbox, "state")
process.env.XDG_DATA_HOME = path.join(sandbox, "data")
delete process.env.OPENROUTER_API_KEY

afterAll(() => rmSync(sandbox, { recursive: true, force: true }))
