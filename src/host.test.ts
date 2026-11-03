// SPDX-License-Identifier: MIT
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { allocate, apply, createEmptyState } from './index.js';
import { createToolGuard } from './guard.js';

type Tool = { name: string; execute: (args: Record<string, unknown>, exec: unknown) => Promise<string> };
type Guard = (exec: { name?: string; command?: string; arguments?: Record<string, unknown> }) => string | undefined;

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
    expect(guard!({ name: 'bash', arguments: { command: 'ls /tmp' } })).toContain('shell is not permitted');
    expect(guard!({ name: 'write', arguments: { file_path: '/tmp/x' } })).toContain('file writes are not permitted');
    expect(guard!({ name: 'subagent' })).toContain('subagents are not permitted');

    let unlocked = createEmptyState(10);
    unlocked = allocate(unlocked, 'gov.consent.write', 'human');
    unlocked = allocate(unlocked, 'gov.consent.shell', 'human');
    const allowed = createToolGuard(() => unlocked);
    expect(allowed({ name: 'bash', arguments: { command: 'ls /tmp' } })).toBeUndefined();
    expect(allowed({ name: 'bash', arguments: { command: String.raw`copy C:\\a\\b.txt /tmp` } }))
      .toContain('windows_path_on_posix');
  });
});
