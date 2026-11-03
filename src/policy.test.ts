// SPDX-License-Identifier: MIT
import { describe, expect, it } from 'vitest';
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
