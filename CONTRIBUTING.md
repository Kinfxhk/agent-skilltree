# Contributing · agent-skilltree

## Scope

M0 is **policy-first**: YAML catalog, OsProfile, PolicyCompiler, path hygiene, tree API. Do not expand into a full game client or vendor whole `@deepseek-ai/dsh`.

## Clean-room

- No Blizzard / franchise art, fonts, SFX, or trademarked skill names.
- User-facing copy: “inspired by classic ARPG skill trees” only.
- Do not copy competitor agent-harness UI chrome.

## Secrets

Never commit API keys or tokens. `.env.example` stays empty.

## AI-assisted development

Human (or maintaining agent) reviews every line. Run `npm run check` before claiming done. Disclose AI tools in public PR text.

## Agent safety

Agents **must not** self-unlock dangerous skills or grant skill points. Keep Constitution locks in tests green.

## Checks

```bash
npm ci
npm run check
```

## License

MIT. By contributing you agree your changes are MIT-licensed.
