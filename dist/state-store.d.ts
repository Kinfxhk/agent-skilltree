import type { SkillTreeState } from './types.js';
export declare function defaultStatePath(): string;
export declare function emptyState(points?: number): SkillTreeState;
export declare function loadState(path?: string): SkillTreeState;
export declare function saveState(state: SkillTreeState, path?: string): void;
