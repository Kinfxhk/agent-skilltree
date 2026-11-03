# Reference builds（技能方案參考）

Sample **already-allocated** skill trees for humans to copy. YAML manifests + preview art live here (Dark Gothic Fantasy, original chrome — not affiliated with any game studio).

| Build | Pts | Best for | Manifest | Preview |
|-------|----:|----------|----------|---------|
| Reader Safe | 17 | Read / browse / light research; minimal shell | [reader-safe.yaml](./reader-safe.yaml) | [reader-safe.png](./reader-safe.png) |
| Coder Local | 26 | Local coding with shell + path hygiene | [coder-local.yaml](./coder-local.yaml) | [coder-local.png](./coder-local.png) |
| Research Scout | 27 | Vision + research + outbound ask | [research-scout.yaml](./research-scout.yaml) | [research-scout.png](./research-scout.png) |
| Ops Squad | 32 | Sub-agents + parallel + on-demand gateway | [ops-squad.yaml](./ops-squad.yaml) | [ops-squad.png](./ops-squad.png) |

## How to apply

1. Allocate only as a **human** (`skilltree.allocate` rejects agent actors).
2. Follow each YAML `allocate_order` (satisfies `requires` in `skills/mvp-36.yaml`).
3. Optional: unlock `gov.build_export` then `skilltree.export`.
4. Respec is human-only (`gov.respec`).

Constitution always stays on. NSFW Gate stays **off** in all sample builds. Preview PNGs are conceptual UI references for the invested nodes, not screenshots of a shipped interactive renderer.
