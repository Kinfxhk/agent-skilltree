// SPDX-License-Identifier: MIT
/** Persistent SkillTreeState — human-granted points and allocations only. */
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
export function defaultStatePath() {
    const root = process.env.DSH_HOME || join(homedir(), '.dsh');
    return process.env.SKILLTREE_STATE || join(root, 'skilltree-state.json');
}
export function emptyState(points = 0) {
    return { unlocked: {}, pointsRemaining: points, lastActor: 'system' };
}
export function loadState(path = defaultStatePath()) {
    if (!existsSync(path))
        return emptyState(0);
    try {
        const raw = JSON.parse(readFileSync(path, 'utf8'));
        if (!raw || typeof raw !== 'object')
            return emptyState(0);
        const unlocked = raw.unlocked && typeof raw.unlocked === 'object' ? raw.unlocked : {};
        const points = Number(raw.pointsRemaining);
        return {
            unlocked,
            pointsRemaining: Number.isFinite(points) ? Math.max(0, points) : 0,
            lastActor: raw.lastActor === 'human' || raw.lastActor === 'agent' ? raw.lastActor : 'system',
        };
    }
    catch {
        return emptyState(0);
    }
}
export function saveState(state, path = defaultStatePath()) {
    mkdirSync(dirname(path), { recursive: true });
    const tmp = `${path}.tmp-${process.pid}`;
    writeFileSync(tmp, JSON.stringify(state, null, 2) + '\n', { mode: 0o600 });
    renameSync(tmp, path);
}
