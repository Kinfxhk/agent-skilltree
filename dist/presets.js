// SPDX-License-Identifier: MIT
/** Named agent builds: a human-granted point budget + a prerequisite-safe allocation order. */
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';
import { loadSkillCatalog } from './load-skills.js';
import { allocate, createEmptyState } from './tree-api.js';
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
export function loadPresets(dir = join(ROOT, 'presets')) {
    return readdirSync(dir)
        .filter((file) => file.endsWith('.yaml') || file.endsWith('.yml'))
        .sort()
        .map((file) => {
        const raw = parse(readFileSync(join(dir, file), 'utf8'));
        if (!raw?.id || !raw.title || !Array.isArray(raw.allocate_order)) {
            throw new Error(`invalid preset: ${file}`);
        }
        return raw;
    });
}
export function getPreset(id, dir = join(ROOT, 'presets')) {
    const preset = loadPresets(dir).find((p) => p.id === id);
    if (!preset)
        throw new Error(`unknown preset: ${id}`);
    return preset;
}
export function applyPreset(preset, catalog = loadSkillCatalog()) {
    let state = createEmptyState(preset.points);
    for (const nodeId of preset.allocate_order) {
        state = allocate(state, nodeId, 'human', catalog);
    }
    return state;
}
