import type { AgentPolicy, OsProfile, SkillCatalog, SkillTreeState } from './types.js';
export type Actor = 'human' | 'agent';
export declare class SkillTreeError extends Error {
    readonly code: string;
    constructor(message: string, code: string);
}
export declare function createEmptyState(points?: number): SkillTreeState;
export declare function allocate(state: SkillTreeState, nodeId: string, actor: Actor, catalog?: SkillCatalog): SkillTreeState;
/** Human-only respec: clear allocations and refund points. */
export declare function respec(state: SkillTreeState, actor: Actor): SkillTreeState;
export declare function inspect(state: SkillTreeState, catalog?: SkillCatalog, osProfile?: OsProfile): {
    state: SkillTreeState;
    unlockable: string[];
    constitution: readonly string[];
    policy: AgentPolicy;
};
export declare function exportPolicy(state: SkillTreeState, catalog?: SkillCatalog, osProfile?: OsProfile): {
    skillTreeState: SkillTreeState;
    agentPolicy: AgentPolicy;
    hostPin: string;
};
