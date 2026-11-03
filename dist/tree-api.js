// SPDX-License-Identifier: MIT
/**
 * allocate / respec / inspect / export — pure functions.
 * Agent cannot self-unlock dangerous nodes or grant points.
 */
import { CONSTITUTION_LOCKS, CONSTITUTION_RULES } from './constitution.js';
import { indexNodes, loadSkillCatalog } from './load-skills.js';
import { PolicyCompiler } from './policy-compiler.js';
import { detectOsProfile } from './os-profile.js';
export class SkillTreeError extends Error {
    code;
    constructor(message, code) {
        super(message);
        this.code = code;
        this.name = 'SkillTreeError';
    }
}
export function createEmptyState(points = 0) {
    return { unlocked: {}, pointsRemaining: points, lastActor: 'system' };
}
function prereqsMet(nodeId, state, catalog) {
    const byId = indexNodes(catalog);
    const node = byId.get(nodeId);
    if (!node)
        return false;
    return node.requires.every((r) => state.unlocked[r] != null);
}
export function allocate(state, nodeId, actor, catalog = loadSkillCatalog()) {
    const byId = indexNodes(catalog);
    const node = byId.get(nodeId);
    if (!node)
        throw new SkillTreeError(`Unknown node ${nodeId}`, 'unknown_node');
    if (state.unlocked[nodeId] != null) {
        throw new SkillTreeError(`Already unlocked: ${nodeId}`, 'already_unlocked');
    }
    if (!prereqsMet(nodeId, state, catalog)) {
        throw new SkillTreeError(`Prerequisites not met for ${nodeId}`, 'prereq');
    }
    if (actor === 'agent') {
        if (!CONSTITUTION_LOCKS.agentMayGrantPoints) {
            // Agent may never spend/grant points
            throw new SkillTreeError('Agent cannot allocate skill points', 'constitution_agent_points');
        }
    }
    if (actor === 'agent' && (node.danger === 'medium' || node.danger === 'high')) {
        throw new SkillTreeError('Agent cannot unlock dangerous skills', 'constitution_agent_danger');
    }
    if (state.pointsRemaining < node.cost) {
        throw new SkillTreeError(`Not enough points for ${nodeId}`, 'points');
    }
    return {
        unlocked: { ...state.unlocked, [nodeId]: node.cost },
        pointsRemaining: state.pointsRemaining - node.cost,
        lastActor: actor,
    };
}
/** Human-only respec: clear allocations and refund points. */
export function respec(state, actor) {
    if (actor !== 'human') {
        throw new SkillTreeError('Respec is human-only', 'constitution_respec_human');
    }
    const refund = Object.values(state.unlocked).reduce((a, b) => a + b, 0);
    return {
        unlocked: {},
        pointsRemaining: state.pointsRemaining + refund,
        lastActor: 'human',
    };
}
export function inspect(state, catalog = loadSkillCatalog(), osProfile) {
    const unlockable = catalog.nodes
        .filter((n) => state.unlocked[n.id] == null && prereqsMet(n.id, state, catalog))
        .map((n) => n.id);
    const policy = new PolicyCompiler(catalog).compile(state, osProfile ?? detectOsProfile());
    return {
        state,
        unlockable,
        constitution: CONSTITUTION_RULES,
        policy,
    };
}
export function exportPolicy(state, catalog = loadSkillCatalog(), osProfile) {
    const policy = new PolicyCompiler(catalog).compile(state, osProfile ?? detectOsProfile());
    return {
        skillTreeState: state,
        agentPolicy: policy,
        hostPin: catalog.meta.host_pin,
    };
}
