// SPDX-License-Identifier: MIT
/** Real DSH tool guard: path hygiene + locked sensitive tools. */
import { detectOsProfile } from './os-profile.js';
import { pathHygieneCheck } from './path-hygiene.js';
import { PolicyCompiler } from './policy-compiler.js';
import { loadSkillCatalog } from './load-skills.js';
import type { SkillCatalog, SkillTreeState } from './types.js';

export type ToolExecution = {
  name?: string;
  command?: string;
  arguments?: { command?: string };
};

export function createToolGuard(
  getState: () => SkillTreeState,
  catalog: SkillCatalog = loadSkillCatalog(),
) {
  const compiler = new PolicyCompiler(catalog);
  return (exec: ToolExecution): string | undefined => {
    const policy = compiler.compile(getState(), detectOsProfile());

    if (exec.name && policy.toolDeny.includes(exec.name)) {
      return `skilltree: tool not unlocked: ${exec.name}. Allocate the matching skill node first.`;
    }

    const command = String(exec.arguments?.command ?? exec.command ?? '');
    if (!command) return undefined;

    const result = pathHygieneCheck(command, policy.osProfile);
    if (result.decision === 'allow') return undefined;
    const hint = result.hint ? ` ${result.hint}` : '';
    return `skilltree: ${result.reason}.${hint}`;
  };
}
