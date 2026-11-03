// SPDX-License-Identifier: MIT
/**
 * agent-skilltree — DSH/Cordis host half.
 *
 * Human operators allocate points via `scripts/skilltree.mjs`; the agent only gets
 * read-only inspect/export tools. The host guard enforces path hygiene + locked
 * sensitive tools, using the persisted SkillTreeState.
 *
 * Pin: @deepseek-ai/dsh@0.2.1-rc.5
 */
import { PolicyCompiler } from './policy-compiler.js';
import { pathHygieneCheck } from './path-hygiene.js';
import { detectOsProfile } from './os-profile.js';
import { createToolGuard, type ToolExecution } from './guard.js';
import { loadState } from './state-store.js';
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

type ToolDef = {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
  output: {
    schema: Record<string, unknown>;
    render: (args: unknown, value: unknown) => Array<{ type: 'text'; text: string }>;
  };
  execute: (args: Record<string, unknown>, exec: unknown) => Promise<string>;
};

type LooseCtx = {
  tools?: {
    register?: (def: ToolDef) => unknown;
    guard?: (fn: (exec: ToolExecution) => string | undefined) => unknown;
  };
  on?: (event: string, fn: (...args: unknown[]) => unknown) => unknown;
};

const textOutput: ToolDef['output'] = {
  schema: { type: 'string' },
  render: (_args, value) => [{ type: 'text', text: String(value) }],
};

function currentState(): SkillTreeState {
  return loadState();
}

export function apply(ctx: LooseCtx = {}): void {
  const register = ctx.tools?.register?.bind(ctx.tools);
  if (register) {
    register({
      name: 'skilltree.inspect',
      description: 'Inspect the human-allocated skill tree, unlockable nodes and compiled AgentPolicy.',
      parameters: {},
      output: textOutput,
      async execute() {
        return JSON.stringify(inspect(currentState()), null, 2);
      },
    });

    register({
      name: 'skilltree.export',
      description: 'Export SkillTreeState + AgentPolicy manifest (read-only).',
      parameters: {},
      output: textOutput,
      async execute() {
        return JSON.stringify(exportPolicy(currentState()), null, 2);
      },
    });
  }

  const guard = createToolGuard(currentState);

  // Real DSH host guard (see ds-bot/src/host/tools.js): a returned string refuses the call.
  if (typeof ctx.tools?.guard === 'function') {
    ctx.tools.guard(guard);
  }

  // Fallback for hosts that only expose the pre-execute event. Never mutate argv.
  if (typeof ctx.on === 'function') {
    ctx.on('tools/pre-execute', (...args: unknown[]) => {
      const reason = guard((args[0] ?? {}) as ToolExecution);
      return reason ? { decision: 'deny', reason } : { decision: 'allow' };
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
