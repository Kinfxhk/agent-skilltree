# Security · agent-skilltree

## Reporting

Email the KINFX maintainer privately for vulnerabilities. Do not open public issues with exploit details or leaked secrets.

## Secrets policy

- No real credentials in git, CI logs, or fixtures.
- Path hygiene **never** silently rewrites shell commands (deny/ask + hint only).
- Skill allocate/respec are human-operator concerns; agents cannot self-unlock danger nodes.

## Supply chain

Pin host `@deepseek-ai/dsh@0.2.1-rc.5` when testing plugins. Re-verify seams after host upgrades.
