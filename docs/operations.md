# Operations guide — agent-skilltree M1

## 1. Requirements

- Node.js **22+** (tested on v26.9.0) and npm.
- Optional: DSH **0.2.1-rc.5** for the host plugin.
- No database; state is one JSON file.

## 2. Install and check

```bash
npm ci
npm run build
npm test          # 19 tests
npm run check     # build + test + required files + secret scan
npm run ui:data   # generate ui/nodes.js from skills/mvp-36.yaml
```

If `git` is unavailable because of the Xcode licence, download a tarball with
`gh api repos/Kinfxhk/agent-skilltree/tarball/master` and extract it; the repo does not require git
for local development.

## 3. State

Default:

```
~/.dsh/skilltree-state.json
```

Override:

```bash
export SKILLTREE_STATE=/tmp/skilltree-state.json
```

Writes are atomic (`<file>.tmp-<pid>` → rename) with mode `0600`. Invalid JSON falls back to an empty
state (0 points) rather than crashing.

## 4. Human CLI

The agent never gets these commands.

```bash
npm run skilltree -- status
npm run skilltree -- path
npm run skilltree -- init 24          # create a fresh tree with 24 points
npm run skilltree -- grant 5          # add 5 human points
npm run skilltree -- allocate perception.files.1
npm run skilltree -- allocate execution.dev.repo_read
npm run skilltree -- respec           # refund all allocated points
npm run skilltree -- presets          # list named builds
npm run skilltree -- preset solo-dev  # apply a build in prerequisite order
npm run skilltree -- export           # SkillTreeState + AgentPolicy manifest
```

`status` prints points, unlocked nodes, unlockable nodes and the compiled tool policy.

## 5. Presets

| Preset | Points | Agent purpose | Approval |
|---|---:|---|---|
| `solo-dev` | 26 | Read repos, run tests, propose safe patches | `patch`, `release` |
| `research-analyst` | 30 | Search, verify citations, synthesise | outbound |
| `personal-assistant` | 24 | Read inbox/calendar, draft, schedule | `email_send`, `calendar_write` |
| `ops-squad` | 32 | Subagents, parallel operations | shell/write/network |
| `reader-safe` | 18 | Read-only review | write/shell/network |

Presets live in [`presets/`](../presets) and are validated by the test suite: every node exists, every
prerequisite is allocated first, and spend never exceeds the preset budget.

## 6. DSH profile install (local test)

```bash
cp -a ~/.dsh/profiles/headless ~/.dsh/profiles/skilltree-test
dsh plugin --profile skilltree-test add /path/to/agent-skilltree
dsh --profile skilltree-test --dump-config   # "# == agent-skilltree"
dsh --profile skilltree-test --help          # loads without crash
```

The plugin is a profile layer from `package.json` `dsh.bundle.patch` → `cordis.patch.yml`.

Rollback:

```bash
rm -rf ~/.dsh/profiles/skilltree-test
```

The profile is a copy; it does not touch the live web/desktop profiles.

## 7. UI

```bash
npm run ui:serve
# http://127.0.0.1:8780/preview.html
```

- Left rail **Presets** buttons apply a named build (same `applyPreset` order as the CLI) and write the shared state file.
- Locale: defaults to the browser/DSH language (`navigator.language`); force with `SKILLTREE_LOCALE=zh_HK npm run ui:serve` or `?lang=en` / `?lang=zh`.
- `GET /api/state` reads the state file.
- `POST /api/state` writes `{ unlocked, pointsRemaining }` (human UI only).
- The server binds `127.0.0.1`; do not expose it.
- If the page is opened via a plain static server, the UI falls back to `localStorage` and shows
  `State: localStorage` in the footer.

## 8. What to verify after a change

1. `npm run check` is green (19 tests).
2. `npm run skilltree -- preset solo-dev` → `toolAsk` contains `patch`/`release`.
3. `npm run skilltree -- preset personal-assistant` → `toolAsk` contains `email_send`/`calendar_write`.
4. Fake host: registered tools are `skilltree.inspect` / `skilltree.export`; guard rejects `email_send`
   and `copy C:\...`; `ls /tmp` passes.
5. DSH `--dump-config` has `agent-skilltree`; `--help` loads.
6. UI: click a `READY` node → inspector; Allocate decrements points; footer says `State: file`.

## 9. Troubleshooting

| Symptom | Fix |
|---|---|
| `git: not agreed to Xcode licence` | Use `gh api .../tarball/master` or accept the Xcode licence |
| pnpm peer warning on linked install | Expected in M1; peer deps are optional. Use `file:` or registry for production |
| `ask` call refused instead of approved | M1 limitation; approval service is M2 |
| Headless smoke says `MISSING_CREDENTIAL` | The headless profile has no `DEEPSEEK_API_KEY`; use the web profile or configure a provider |
| UI says `State: localStorage` | You opened it with a static server; use `npm run ui:serve` |
| Port 8780 busy | `SKILLTREE_UI_PORT=8781 npm run ui:serve` |
| Guard too strict | Inspect `policy.toolDeny`; allocate the matching node or adjust the preset |

## 10. Safety

- Human-only allocation is deliberate: an agent that can grant its own points has no policy boundary.
- The constitution constants are immutable in compiled policy; respec cannot clear them.
- Path hygiene never rewrites the command; it returns deny/ask and leaves the caller to handle it.
- Do not put API keys, customer data, or private paths in presets or the catalog.
