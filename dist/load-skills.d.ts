import type { SkillCatalog, SkillNode } from './types.js';
/** Load and lightly validate skills/mvp-36.yaml (runtime shape, not full JSON Schema). */
export declare function loadSkillCatalog(path?: string): SkillCatalog;
export declare function indexNodes(catalog: SkillCatalog): Map<string, SkillNode>;
