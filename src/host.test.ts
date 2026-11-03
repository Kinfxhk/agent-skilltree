// SPDX-License-Identifier: MIT
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { apply } from './index.js';

type Tool = { name: string; execute: (args: Record<string, unknown>, exec: unknown) => Promise<string> };
type Guard = (exec: { name?: string; command?: string; arguments?: { command?: string } }) => string | undefined;

describe('DSH host half', () => {
  let dir = '';
  let oldState: string | undefined;

  beforeEach(() => {
    oldState = process.env.SKILLTREE_STATE;
    dir = mkdtempSync(join(tmpdir(), 'skilltree-host-'));
    process.env.SKILLTREE_STATE = join(dir, 'state.json');
  });

  afterEach(() => {
    if (oldState === undefined) delete process.env.SKILLTREE_STATE;
    else process.env.SKILLTREE_STATE = oldState;
    rmSync(dir, { recursive: true, force: true });
  });

  it('registers read-only tools and a real guard', async () => {
    const tools: Tool[] = [];
    let guard: Guard | undefined;
    apply({
      tools: {
        register: (def) => tools.push(def as Tool),
        guard: (fn) => { guard = fn as Guard; },
      },
      on: () => {},
    });

    expect(tools.map((t) => t.name)).toEqual(['skilltree_inspect', 'skilltree_export']);
    const inspected = JSON.parse(await tools[0].execute({}, {}));
    expect(inspected.state).toBeDefined();
    expect(inspected.policy.toolDeny).toContain('email_send');

    expect(guard).toBeDefined();
    expect(guard!({ name: 'email_send' })).toContain('not unlocked');
    expect(guard!({ name: 'bash', arguments: { command: String.raw`copy C:\\a\\b.txt /tmp` } }))
      .toContain('windows_path_on_posix');
    expect(guard!({ name: 'bash', arguments: { command: 'ls /tmp' } })).toBeUndefined();
  });
});
