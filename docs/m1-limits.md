# M1 limits — what is real, what is not

M1 is intentionally a **policy core with a real guard**, not a finished product. This page keeps the
line honest.

## Real

- `PolicyCompiler`: `SkillTreeState` + `OsProfile` → `AgentPolicy` (tool allow/ask/deny, sandbox floor,
  approval defaults, path hygiene, OS dialect).
- `pathHygieneCheck`: allow / deny / ask; never silently rewrites argv.
- `ctx.tools.guard`: rejects path-hygiene violations and tools in `policy.toolDeny`.
- Sensitive default-deny: `email_send`, `calendar_write`, `release`, `patch`.
- `skilltree.inspect` / `skilltree.export`: executable, read-only.
- Human CLI: `grant`, `allocate`, `respec`, `preset`, `status`, `export`.
- Persistent state: `~/.dsh/skilltree-state.json`, shared by CLI / UI server / plugin.
- 18 vitest tests + `npm run check` green; DSH `skilltree-test` profile loads.

## Not real yet

| Gap | Consequence |
|---|---|
| `ask` approval flow | Guard treats `ask` as deny; the user cannot approve a call in-flow |
| turnCap / subagent depth / sandbox floor | Compiled into `AgentPolicy`, but not enforced by a runtime hook |
| Live model task | No `DEEPSEEK_API_KEY` in the headless test profile, so no end-to-end agent turn was run |
| Cordis client UI | `ui/preview.html` is static HTML/JS, not a mounted DSH client plugin |
| UI vs CLI state | M1 UI server shares the file; the standalone `python3 -m http.server` fallback uses localStorage |
| Public install | No npm registry package yet; local path/link only |

## Security notes

- The UI server binds `127.0.0.1` only; it has no auth token because it is a local operator tool.
  Do not expose it on a LAN/Tailscale interface.
- State writes are atomic (`tmp` + rename) with mode `0600`.
- The agent never receives `allocate` / `respec` / `grant` tools.
- `guard` returns a refusal string; it does not mutate the command. A refusal is a denial, not approval.
- Do not put secrets in `presets/` or the skill catalog; the repo scanner checks for obvious secrets.

## Next (M2)

1. Wire DSH approval service so `ask` becomes a real approval, not a deny.
2. Enforce `turnCap`, subagent depth and sandbox floor in the host runtime.
3. Run a live task with a test key and prove a denied command never executes.
4. Mount the UI as a Cordis client plugin, with state through the host store.
5. Publish a registry install path and a migration from linked installs.
