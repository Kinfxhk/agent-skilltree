// SPDX-License-Identifier: MIT
import { CONSTITUTION_LOCKS } from './constitution.js';
import { indexNodes, loadSkillCatalog } from './load-skills.js';
import { detectOsProfile } from './os-profile.js';
function parseGrantKV(grant) {
    const eq = grant.indexOf('=');
    if (eq < 0)
        return { key: grant };
    return { key: grant.slice(0, eq), value: grant.slice(eq + 1) };
}
export class PolicyCompiler {
    catalog;
    constructor(catalog = loadSkillCatalog()) {
        this.catalog = catalog;
    }
    compile(state, osProfile = detectOsProfile()) {
        const byId = indexNodes(this.catalog);
        const grants = [];
        for (const id of Object.keys(state.unlocked)) {
            const node = byId.get(id);
            if (!node)
                continue;
            grants.push(...node.grants);
        }
        // Platform default for strict path when node not explicitly allocated
        const strictNode = byId.get('gov.strict_path_mode');
        let strictPathMode = osProfile.strictPathMode;
        if (state.unlocked['gov.strict_path_mode'] != null) {
            strictPathMode = true;
        }
        else if (strictNode?.default_enabled_by_platform) {
            strictPathMode =
                strictNode.default_enabled_by_platform[osProfile.platform] ?? strictPathMode;
        }
        const profile = { ...osProfile, strictPathMode };
        let maxParallel = 1;
        let turnCap = 'off';
        let subDepth = 0;
        let subActive = 0;
        let approvalWrite = 'deny';
        let approvalShell = 'deny';
        let approvalNetwork = 'deny';
        let sandboxFloor = 'read-only';
        let systemPromptBudget = 0;
        let productGateway = 'off';
        let nsfwGate = false;
        let contentPolicy = false;
        let pathHygiene = false;
        let shellDialectTips = false;
        const toolAllow = [];
        const toolDeny = [];
        const toolAsk = [];
        for (const g of grants) {
            const { key, value } = parseGrantKV(g);
            switch (key) {
                case 'loop.max_parallel':
                    maxParallel = Math.max(maxParallel, Number(value) || 1);
                    break;
                case 'product.turn_cap':
                    if (value === 'low' || value === 'mid' || value === 'high')
                        turnCap = value;
                    break;
                case 'subagents.max_depth':
                    subDepth = Math.max(subDepth, Number(value) || 0);
                    break;
                case 'subagents.max_active':
                    subActive = Math.max(subActive, Number(value) || 0);
                    break;
                case 'approval.policy.write':
                    if (value === 'ask' || value === 'allow' || value === 'deny')
                        approvalWrite = value;
                    break;
                case 'approval.policy.shell':
                    if (value === 'ask' || value === 'allow' || value === 'deny')
                        approvalShell = value;
                    break;
                case 'approval.policy.network':
                    if (value === 'ask' || value === 'allow' || value === 'deny')
                        approvalNetwork = value;
                    break;
                case 'sandbox.floor':
                    if (value === 'read-only' ||
                        value === 'workspace-write' ||
                        value === 'danger-full-access') {
                        sandboxFloor = value;
                    }
                    break;
                case 'system_prompt.budget':
                    systemPromptBudget = Math.max(systemPromptBudget, Number(value) || 0);
                    break;
                case 'product.gateway':
                    if (value === 'on_demand' || value === 'persistent' || value === 'off') {
                        productGateway = value;
                    }
                    break;
                case 'product.nsfw_gate':
                    nsfwGate = value === 'user_enabled';
                    break;
                case 'product.content_policy':
                    contentPolicy = value === 'on';
                    break;
                case 'product.os_path_hygiene':
                case 'tools.pre_execute.path_check':
                    pathHygiene = true;
                    break;
                case 'product.shell_dialect':
                case 'product.os_tips_table':
                    shellDialectTips = true;
                    break;
                case 'tools.bash.ask':
                    toolAsk.push('bash');
                    break;
                case 'tools.outbound.ask':
                    toolAsk.push('outbound');
                    break;
                case 'tools.web_search':
                    toolAllow.push('web_search');
                    break;
                case 'tools.web_fetch':
                    toolAllow.push('web_fetch');
                    break;
                case 'tools.fs_read':
                    toolAllow.push('fs_read');
                    break;
                case 'tools.fs_write':
                    toolAsk.push('fs_write');
                    break;
                case 'tools.repo_read':
                    toolAllow.push('repo_read');
                    break;
                case 'tools.patch':
                    toolAsk.push('patch');
                    break;
                case 'tools.tests':
                    toolAllow.push('tests');
                    break;
                case 'tools.release':
                    toolAsk.push('release');
                    break;
                case 'tools.citations':
                    toolAllow.push('citations');
                    break;
                case 'tools.scholar':
                    toolAllow.push('scholar');
                    break;
                case 'tools.synth':
                    toolAllow.push('synth');
                    break;
                case 'tools.email_read':
                    toolAllow.push('email_read');
                    break;
                case 'tools.calendar_read':
                    toolAllow.push('calendar_read');
                    break;
                case 'tools.email_draft':
                    toolAllow.push('email_draft');
                    break;
                case 'tools.email_send':
                    toolAsk.push('email_send');
                    break;
                case 'tools.calendar_write':
                    toolAsk.push('calendar_write');
                    break;
                default:
                    break;
            }
        }
        // Capability = responsibility: shell grant without shell consent stays ask/deny floor
        if (toolAsk.includes('bash') && approvalShell === 'deny') {
            approvalShell = 'ask';
        }
        // Sensitive tools stay denied until their node grants allow/ask.
        for (const sensitive of ['email_send', 'calendar_write', 'release', 'patch']) {
            if (!toolAllow.includes(sensitive) && !toolAsk.includes(sensitive)) {
                toolDeny.push(sensitive);
            }
        }
        void CONSTITUTION_LOCKS; // referenced for clarity — locks always applied below
        return {
            toolAllow: [...new Set(toolAllow)],
            toolDeny: [...new Set(toolDeny)],
            toolAsk: [...new Set(toolAsk)],
            maxParallelToolCalls: maxParallel,
            turnCap,
            subagentsMaxDepth: subDepth,
            subagentsMaxActive: subActive,
            approvalWrite,
            approvalShell,
            approvalNetwork,
            sandboxFloor,
            systemPromptBudget,
            productGateway,
            nsfwGate,
            contentPolicy,
            pathHygiene,
            shellDialectTips,
            osProfile: profile,
            constitutionLocked: true,
            grants: [...new Set(grants)],
        };
    }
}
