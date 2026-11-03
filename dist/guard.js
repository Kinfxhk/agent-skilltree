// SPDX-License-Identifier: MIT
/** Real DSH tool guard: path hygiene + locked sensitive tools. */
import { detectOsProfile } from './os-profile.js';
import { pathHygieneCheck } from './path-hygiene.js';
import { PolicyCompiler } from './policy-compiler.js';
import { loadSkillCatalog } from './load-skills.js';
export function createToolGuard(getState, catalog = loadSkillCatalog()) {
    const compiler = new PolicyCompiler(catalog);
    return (exec) => {
        const policy = compiler.compile(getState(), detectOsProfile());
        if (exec.name && policy.toolDeny.includes(exec.name)) {
            return `skilltree: tool not unlocked: ${exec.name}. Allocate the matching skill node first.`;
        }
        // Built-in DSH tools. `ask` is left to the host approval card; `deny` stops here.
        const builtin = String(exec.name ?? '');
        if (builtin === 'bash' && policy.approvalShell === 'deny') {
            return 'skilltree: shell is not permitted by the current policy. Allocate Shell Consent first.';
        }
        if ((builtin === 'write' || builtin === 'edit') && policy.approvalWrite === 'deny') {
            return 'skilltree: file writes are not permitted by the current policy. Allocate Write Consent first.';
        }
        if ((builtin === 'subagent' || builtin === 'subagent_fork') && (policy.subagentsMaxDepth <= 0 || policy.subagentsMaxActive <= 0)) {
            return 'skilltree: subagents are not permitted by the current policy. Allocate Subagent Summon first.';
        }
        const requestedSandbox = String(exec.arguments?.sandbox_permissions ?? '');
        if (requestedSandbox === 'danger-full-access' && policy.sandboxFloor !== 'danger-full-access') {
            return 'skilltree: danger-full-access is above the sandbox floor.';
        }
        if (requestedSandbox === 'workspace-write' && policy.sandboxFloor === 'read-only') {
            return 'skilltree: workspace-write is above the sandbox floor.';
        }
        const command = String(exec.arguments?.command ?? exec.command ?? '');
        if (!command)
            return undefined;
        const result = pathHygieneCheck(command, policy.osProfile);
        if (result.decision === 'allow')
            return undefined;
        const hint = result.hint ? ` ${result.hint}` : '';
        return `skilltree: ${result.reason}.${hint}`;
    };
}
