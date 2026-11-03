import type { SkillCatalog, SkillTreeState } from './types.js';
export type ToolExecution = {
    name?: string;
    command?: string;
    arguments?: {
        command?: string;
    };
};
export declare function createToolGuard(getState: () => SkillTreeState, catalog?: SkillCatalog): (exec: ToolExecution) => string | undefined;
