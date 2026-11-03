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
import { startUiServer } from './ui-http.js';
import {
  allocate,
  createEmptyState,
  exportPolicy,
  inspect,
  respec,
} from './tree-api.js';
import type { SkillTreeState } from './types.js';

/** Cordis requires an explicit inject before ctx.tools can be read. */
export const inject: string[] = ['tools'];

export const name = 'agent-skilltree';
const activeSubagents = new Map<string, number>();

function sessionKey(exec: ToolExecution & { agent?: { id?: string; session?: { id?: string } } }): string {
  return String(exec.agent?.session?.id ?? exec.agent?.id ?? 'global');
}

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
  if (!process.env.VITEST && process.env.SKILLTREE_UI !== '0') startUiServer();
  const register = ctx.tools?.register?.bind(ctx.tools);
  if (register) {
    register({
      name: 'skilltree_inspect',
      description: 'Inspect the human-allocated skill tree, unlockable nodes and compiled AgentPolicy.',
      parameters: {},
      output: textOutput,
      async execute() {
        return JSON.stringify(inspect(currentState()), null, 2);
      },
    });

    if (process.env.SKILLTREE_DEBUG === '1') register({
      name: 'skilltree_tools',
      description: 'Diagnostic: list the tools visible to this agent and the execution context keys.',
      parameters: {},
      output: textOutput,
      async execute(_args, exec) {
        const anyCtx = ctx as unknown as { tools?: { schemas?: (agent: unknown) => Array<{ name?: string }> } };
        const agent = (exec as { agent?: unknown } | undefined)?.agent;
        const schemas = anyCtx.tools?.schemas?.(agent) ?? [];
        const selected = new Set(['bash', 'write', 'edit', 'subagent', 'subagent_fork']);
        const focus = schemas.filter((schema) => selected.has(String(schema.name)));
        const anyAgent = (agent as { loopCtx?: object; options?: object; runtimeContext?: object; session?: object }) ?? {};
        const anyCtxWithGet = ctx as unknown as { get?: (name: string) => unknown; approval?: unknown };
        const approval = anyCtxWithGet.get?.('approval') ?? anyCtxWithGet.approval;
        return JSON.stringify({
          approvalService: typeof (approval as { request?: unknown } | undefined)?.request,
          tools: schemas.map((schema) => schema.name).filter(Boolean).sort(),
          focus: focus.map((schema) => ({
            name: schema.name,
            description: (schema as { description?: string }).description,
            parameters: (schema as { parameters?: unknown }).parameters,
          })),
          execKeys: Object.keys((exec as object) ?? {}).sort(),
          agentKeys: Object.keys((agent as object) ?? {}).sort(),
          loopCtxKeys: Object.keys(anyAgent.loopCtx ?? {}).sort(),
          optionsKeys: Object.keys(anyAgent.options ?? {}).sort(),
          runtimeContextKeys: Object.keys(anyAgent.runtimeContext ?? {}).sort(),
          sessionKeys: Object.keys(anyAgent.session ?? {}).sort(),
        }, null, 2);
      },
    });

    register({
      name: 'skilltree_export',
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

  // DSH pre-execute is a waterfall: return {kind:'ask'} and the host runs its
  // own approval card (ctx.get('approval')). This is the real M2 approval seam.
  if (typeof ctx.on === 'function') {
    ctx.on('tools/pre-execute', (...args: unknown[]) => {
      const call = (args[0] ?? {}) as ToolExecution;
      const reason = guard(call);
      if (reason) return { kind: 'deny', reason };

      const policy = new PolicyCompiler().compile(currentState(), detectOsProfile());
      if (call.name === 'bash' && policy.approvalShell === 'ask') {
        return { kind: 'ask', reason: 'Allow this shell command under the current skill tree?' };
      }
      if ((call.name === 'write' || call.name === 'edit') && policy.approvalWrite === 'ask') {
        return { kind: 'ask', reason: 'Allow this file write under the current skill tree?' };
      }
      if (call.name === 'subagent' || call.name === 'subagent_fork') {
        const key = sessionKey(call as ToolExecution & { agent?: { id?: string; session?: { id?: string } } });
        const active = activeSubagents.get(key) ?? 0;
        if (policy.subagentsMaxActive > 0 && active >= policy.subagentsMaxActive) {
          return { kind: 'deny', reason: 'skilltree: active subagent limit reached.' };
        }
        activeSubagents.set(key, active + 1);
      }
      return { kind: 'allow' };
    });
    ctx.on('tools/post-execute', (...args: unknown[]) => {
      const call = (args[0] ?? {}) as ToolExecution & { agent?: { id?: string; session?: { id?: string } } };
      if (call.name === 'subagent' || call.name === 'subagent_fork') {
        const key = sessionKey(call);
        const active = activeSubagents.get(key) ?? 0;
        if (active <= 1) activeSubagents.delete(key);
        else activeSubagents.set(key, active - 1);
      }
      const next = args[2];
      return typeof next === 'function' ? (next as () => unknown)() : undefined;
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
