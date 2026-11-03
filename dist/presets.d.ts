import type { SkillCatalog, SkillTreeState } from './types.js';
export type PresetBuild = {
    schema: string;
    id: string;
    title: string;
    points: number;
    blurb_zh: string;
    blurb_en: string;
    agent_purpose_zh: string;
    agent_purpose_en: string;
    requires_human_approval_for: string[];
    allocate_order: string[];
};
export declare function loadPresets(dir?: string): PresetBuild[];
export declare function getPreset(id: string, dir?: string): PresetBuild;
export declare function applyPreset(preset: PresetBuild, catalog?: SkillCatalog): SkillTreeState;
