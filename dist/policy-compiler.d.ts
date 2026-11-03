import type { AgentPolicy, OsProfile, SkillCatalog, SkillTreeState } from './types.js';
export declare class PolicyCompiler {
    private readonly catalog;
    constructor(catalog?: SkillCatalog);
    compile(state: SkillTreeState, osProfile?: OsProfile): AgentPolicy;
}
