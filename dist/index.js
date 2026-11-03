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
import { createToolGuard } from './guard.js';
import { loadState } from './state-store.js';
import { startUiServer } from './ui-http.js';
import { allocate, createEmptyState, exportPolicy, inspect, respec, } from './tree-api.js';
/** Cordis requires an explicit inject before ctx.tools can be read. */
export const inject = ['tools'];
export const name = 'agent-skilltree';
const textOutput = {
    schema: { type: 'string' },
    render: (_args, value) => [{ type: 'text', text: String(value) }],
};
function currentState() {
    return loadState();
}
export function apply(ctx = {}) {
    if (!process.env.VITEST && process.env.SKILLTREE_UI !== '0')
        startUiServer();
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
        if (process.env.SKILLTREE_DEBUG === '1')
            register({
                name: 'skilltree_tools',
                description: 'Diagnostic: list the tools visible to this agent and the execution context keys.',
                parameters: {},
                output: textOutput,
                async execute(_args, exec) {
                    const anyCtx = ctx;
                    const agent = exec?.agent;
                    const schemas = anyCtx.tools?.schemas?.(agent) ?? [];
                    const selected = new Set(['bash', 'write', 'edit', 'subagent', 'subagent_fork']);
                    const focus = schemas.filter((schema) => selected.has(String(schema.name)));
                    const anyAgent = agent ?? {};
                    const anyCtxWithGet = ctx;
                    const approval = anyCtxWithGet.get?.('approval') ?? anyCtxWithGet.approval;
                    return JSON.stringify({
                        approvalService: typeof approval?.request,
                        tools: schemas.map((schema) => schema.name).filter(Boolean).sort(),
                        focus: focus.map((schema) => ({
                            name: schema.name,
                            description: schema.description,
                            parameters: schema.parameters,
                        })),
                        execKeys: Object.keys(exec ?? {}).sort(),
                        agentKeys: Object.keys(agent ?? {}).sort(),
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
        ctx.on('tools/pre-execute', (...args) => {
            const call = (args[0] ?? {});
            const reason = guard(call);
            if (reason)
                return { kind: 'deny', reason };
            const policy = new PolicyCompiler().compile(currentState(), detectOsProfile());
            if (call.name === 'bash' && policy.approvalShell === 'ask') {
                return { kind: 'ask', reason: 'Allow this shell command under the current skill tree?' };
            }
            if ((call.name === 'write' || call.name === 'edit') && policy.approvalWrite === 'ask') {
                return { kind: 'ask', reason: 'Allow this file write under the current skill tree?' };
            }
            return { kind: 'allow' };
        });
    }
}
export { PolicyCompiler, pathHygieneCheck, detectOsProfile, allocate, respec, inspect, exportPolicy, createEmptyState, };
