// SPDX-License-Identifier: MIT
/**
 * agent-skilltree — Host half (Cordis/DSH plugin stub).
 *
 * Registers skilltree.* tools (stubs) and documents where tools/pre-execute
 * path hygiene should wire. Full Cordis ctx typing is optional at M0 —
 * apply() accepts a loose host context.
 *
 * Pin: @deepseek-ai/dsh@0.2.1-rc.5
 */
import { PolicyCompiler } from './policy-compiler.js';
import { pathHygieneCheck } from './path-hygiene.js';
import { detectOsProfile } from './os-profile.js';
import {
  allocate,
  createEmptyState,
  exportPolicy,
  inspect,
  respec,
} from './tree-api.js';
import type { SkillTreeState } from './types.js';

/** Prefer tools + approval when present; empty inject keeps Host loadable without peers. */
export const inject: string[] = [];

export const name = 'agent-skilltree';

let treeState: SkillTreeState = createEmptyState(0);

type LooseCtx = {
  tools?: {
    register?: (def: Record<string, unknown>) => void;
    guard?: (name: string, fn: (...args: unknown[]) => unknown) => void;
  };
  on?: (event: string, fn: (...args: unknown[]) => unknown) => void;
};

/**
 * Host apply — stub registrations.
 *
 * tools/pre-execute wiring (when host exposes ctx.on):
 *   ctx.on('tools/pre-execute', (call) => {
 *     const os = detectOsProfile();
 *     const policy = new PolicyCompiler().compile(treeState, os);
 *     if (!policy.pathHygiene) return; // or always run when Strict Path On
 *     const cmd = String(call?.arguments?.command ?? call?.command ?? '');
 *     if (!cmd) return;
 *     const result = pathHygieneCheck(cmd, policy.osProfile);
 *     // return result.decision — never silent rewrite
 *   });
 */
export function apply(ctx: LooseCtx = {}): void {
  const register = ctx.tools?.register?.bind(ctx.tools);
  if (register) {
    register({
      name: 'skilltree.allocate',
      description: 'Allocate a skill point to a node (human operator).',
      // stub execute — real host binds via tools API
    });
    register({
      name: 'skilltree.respec',
      description: 'Respec skill tree (human-only).',
    });
    register({
      name: 'skilltree.inspect',
      description: 'Inspect tree state, unlockable nodes, compiled policy.',
    });
    register({
      name: 'skilltree.export',
      description: 'Export SkillTreeState + AgentPolicy manifest.',
    });
  }

  // Optional pre-execute hook comment-implemented when event bus exists
  if (typeof ctx.on === 'function') {
    ctx.on('tools/pre-execute', (...args: unknown[]) => {
      const call = (args[0] ?? {}) as {
        arguments?: { command?: string };
        command?: string;
      };
      const os = detectOsProfile();
      const policy = new PolicyCompiler().compile(treeState, os);
      if (!policy.pathHygiene && !policy.osProfile.strictPathMode) {
        return { decision: 'allow' };
      }
      const cmd = String(call.arguments?.command ?? call.command ?? '');
      if (!cmd) return { decision: 'allow' };
      const result = pathHygieneCheck(cmd, policy.osProfile);
      return {
        decision: result.decision,
        reason: result.reason,
        hint: result.hint,
        // NEVER rewrite call.arguments here
      };
    });
  }
}

export {
  PolicyCompiler,
  pathHygieneCheck,
  detectOsProfile,
  allocate,
  respec,
  inspect,
  exportPolicy,
  createEmptyState,
};

/** Test helper — not for agent use. */
export function __setTreeStateForTests(state: SkillTreeState): void {
  treeState = state;
}
