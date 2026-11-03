// SPDX-License-Identifier: MIT
import { describe, expect, it } from 'vitest';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { rmSync } from 'node:fs';
import { createToolGuard } from './guard.js';
import { emptyState, loadState, saveState } from './state-store.js';
import { applyPreset, loadPresets } from './presets.js';
import { CONSTITUTION_LOCKS, CONSTITUTION_RULES } from './constitution.js';
import { loadSkillCatalog } from './load-skills.js';
import { detectOsProfile } from './os-profile.js';
import { pathHygieneCheck } from './path-hygiene.js';
import { PolicyCompiler } from './policy-compiler.js';
import {
  allocate,
  createEmptyState,
  exportPolicy,
  inspect,
  respec,
  SkillTreeError,
} from './tree-api.js';

describe('skill catalog', () => {
  it('loads at least MVP 36 nodes plus OS add-ons', () => {
    const cat = loadSkillCatalog();
    expect(cat.nodes.length).toBeGreaterThanOrEqual(36);
    expect(cat.nodes.some((n) => n.id === 'execution.path_hygiene.1')).toBe(true);
    expect(cat.nodes.some((n) => n.id === 'execution.shell_dialect.1')).toBe(true);
    expect(cat.nodes.some((n) => n.id === 'gov.strict_path_mode')).toBe(true);
    expect(cat.meta.host_pin).toContain('0.2.1-rc.5');
  });
});

describe('prereq unlock', () => {
  it('blocks vision.2 until vision.1', () => {
    const cat = loadSkillCatalog();
    let state = createEmptyState(10);
    expect(() => allocate(state, 'perception.vision.2', 'human', cat)).toThrow(SkillTreeError);
    state = allocate(state, 'perception.vision.1', 'human', cat);
    state = allocate(state, 'perception.vision.2', 'human', cat);
    expect(state.unlocked['perception.vision.2']).toBe(2);
  });

  it('rejects agent allocate entirely', () => {
    const cat = loadSkillCatalog();
    const state = createEmptyState(5);
    expect(() => allocate(state, 'perception.vision.1', 'agent', cat)).toThrow(
      /cannot allocate/i,
    );
  });
});

describe('path hygiene win32 strict', () => {
  it('denies mixed separators on win32 Strict', () => {
    const os = detectOsProfile({
      platform: 'win32',
      strictPathMode: true,
      dialect: 'powershell',
    });
    const r = pathHygieneCheck(String.raw`type C:/Users\me\file.txt`, os);
    expect(r.decision).toBe('deny');
    expect(r.reason).toBe('mixed_path_sep');
  });

  it('denies Windows paths on linux', () => {
    const os = detectOsProfile({ platform: 'linux', strictPathMode: false });
    const r = pathHygieneCheck(String.raw`cat C:\Users\me\a.txt`, os);
    expect(r.decision).toBe('deny');
    expect(r.reason).toBe('windows_path_on_posix');
  });
});

describe('PolicyCompiler + OsProfile', () => {
  it('compile includes OsProfile and constitution lock', () => {
    const cat = loadSkillCatalog();
    let state = createEmptyState(20);
    state = allocate(state, 'execution.tools.whitelist', 'human', cat);
    state = allocate(state, 'execution.path_hygiene.1', 'human', cat);
    const os = detectOsProfile({ platform: 'darwin' });
    const policy = new PolicyCompiler(cat).compile(state, os);
    expect(policy.osProfile.platform).toBe('darwin');
    expect(policy.pathHygiene).toBe(true);
    expect(policy.constitutionLocked).toBe(true);
    expect(CONSTITUTION_LOCKS.constitutionLocked).toBe(true);
  });

  it('win32 defaults strictPathMode On via detectOsProfile', () => {
    const os = detectOsProfile({ platform: 'win32' });
    expect(os.strictPathMode).toBe(true);
    const policy = new PolicyCompiler().compile(createEmptyState(), os);
    expect(policy.osProfile.strictPathMode).toBe(true);
  });
});

describe('constitution cannot be cleared by allocate', () => {
  it('keeps constitutionLocked after allocate/respec/export', () => {
    const cat = loadSkillCatalog();
    let state = createEmptyState(10);
    state = allocate(state, 'gov.audit.1', 'human', cat);
    state = allocate(state, 'gov.respec', 'human', cat);
    const exported = exportPolicy(state, cat, detectOsProfile({ platform: 'linux' }));
    expect(exported.agentPolicy.constitutionLocked).toBe(true);
    expect(CONSTITUTION_RULES.length).toBeGreaterThan(0);
    state = respec(state, 'human');
    const again = inspect(state, cat).policy;
    expect(again.constitutionLocked).toBe(true);
  });

  it('rejects agent respec', () => {
    expect(() => respec(createEmptyState(1), 'agent')).toThrow(/human-only/i);
  });
});


describe('domain packs', () => {
  it('ships development / research / assistant nodes', () => {
    const cat = loadSkillCatalog();
    for (const id of [
      'execution.dev.repo_read',
      'execution.dev.patch',
      'execution.dev.test',
      'execution.dev.release',
      'perception.research.citations',
      'perception.assistant.inbox',
      'execution.assistant.send',
      'execution.assistant.schedule',
    ]) {
      expect(cat.nodes.some((n) => n.id === id)).toBe(true);
    }
    expect(cat.nodes.some((n) => n.domain === 'development')).toBe(true);
    expect(cat.nodes.some((n) => n.domain === 'research')).toBe(true);
    expect(cat.nodes.some((n) => n.domain === 'assistant')).toBe(true);
  });

  it('compiles domain grants into tool policy', () => {
    const cat = loadSkillCatalog();
    let state = createEmptyState(10);
    state = allocate(state, 'perception.files.1', 'human', cat);
    state = allocate(state, 'execution.dev.repo_read', 'human', cat);
    const policy = new PolicyCompiler(cat).compile(state, detectOsProfile({ platform: 'darwin' }));
    expect(policy.toolAllow).toContain('repo_read');
    expect(policy.toolDeny).not.toContain('repo_read');
  });

  it('keeps sensitive tools denied until unlocked', () => {
    const policy = new PolicyCompiler().compile(createEmptyState(), detectOsProfile({ platform: 'darwin' }));
    expect(policy.toolDeny).toContain('email_send');
    expect(policy.toolDeny).toContain('calendar_write');
    expect(policy.toolDeny).toContain('release');
    expect(policy.toolDeny).toContain('patch');
  });
});

describe('tool guard', () => {
  it('denies locked sensitive tools and Windows paths on POSIX', () => {
    const guard = createToolGuard(() => emptyState(0));
    expect(guard({ name: 'email_send' })).toContain('not unlocked');
    expect(guard({ name: 'bash', arguments: { command: String.raw`copy C:\\a\\b.txt /tmp` } }))
      .toContain('windows_path_on_posix');
    expect(guard({ name: 'bash', arguments: { command: 'ls /tmp' } })).toBeUndefined();
  });
});

describe('state store', () => {
  it('round-trips state through a JSON file', () => {
    const dir = join(tmpdir(), `skilltree-${process.pid}-${Date.now()}`);
    const path = join(dir, 'state.json');
    const state = { ...emptyState(7), unlocked: { 'perception.search.1': 1 }, lastActor: 'human' as const };
    saveState(state, path);
    const loaded = loadState(path);
    expect(loaded.pointsRemaining).toBe(7);
    expect(loaded.unlocked['perception.search.1']).toBe(1);
    expect(loaded.lastActor).toBe('human');
    rmSync(dir, { recursive: true, force: true });
  });
});


describe('agent presets', () => {
  it('loads at least five presets with agent purposes', () => {
    const presets = loadPresets();
    expect(presets.length).toBeGreaterThanOrEqual(5);
    for (const p of presets) {
      expect(p.agent_purpose_zh.length).toBeGreaterThan(10);
      expect(p.agent_purpose_en.length).toBeGreaterThan(10);
      expect(p.allocate_order.length).toBeGreaterThan(3);
    }
  });

  it('applies every preset within its point budget', () => {
    for (const p of loadPresets()) {
      const state = applyPreset(p);
      const spent = Object.values(state.unlocked).reduce((a, b) => a + b, 0);
      expect(spent).toBeLessThanOrEqual(p.points);
      expect(state.pointsRemaining).toBe(p.points - spent);
    }
  });

  it('solo-dev preset grants repo read but keeps release sensitive', () => {
    const state = applyPreset(loadPresets().find((p) => p.id === 'solo-dev')!);
    expect(state.unlocked['execution.dev.repo_read']).toBe(1);
    const policy = new PolicyCompiler().compile(state, detectOsProfile({ platform: 'darwin' }));
    expect(policy.toolAllow).toContain('repo_read');
    expect(policy.toolAsk).toContain('patch');
    expect(policy.toolAsk).toContain('release');
  });

  it('personal-assistant preset gates send/calendar', () => {
    const state = applyPreset(loadPresets().find((p) => p.id === 'personal-assistant')!);
    const policy = new PolicyCompiler().compile(state, detectOsProfile({ platform: 'darwin' }));
    expect(policy.toolAllow).toContain('email_read');
    expect(policy.toolAllow).toContain('email_draft');
    expect(policy.toolAsk).toContain('email_send');
    expect(policy.toolAsk).toContain('calendar_write');
  });
});
