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
import { type ToolExecution } from './guard.js';
import { allocate, createEmptyState, exportPolicy, inspect, respec } from './tree-api.js';
/** Prefer tools + approval when present; empty inject keeps Host loadable without peers. */
export declare const inject: string[];
export declare const name = "agent-skilltree";
type ToolDef = {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
    output: {
        schema: Record<string, unknown>;
        render: (args: unknown, value: unknown) => Array<{
            type: 'text';
            text: string;
        }>;
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
export declare function apply(ctx?: LooseCtx): void;
export { PolicyCompiler, pathHygieneCheck, detectOsProfile, allocate, respec, inspect, exportPolicy, createEmptyState, };
