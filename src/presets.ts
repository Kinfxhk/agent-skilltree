// SPDX-License-Identifier: MIT
/** Named agent builds: a human-granted point budget + a prerequisite-safe allocation order. */
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';
import { loadSkillCatalog } from './load-skills.js';
import { allocate, createEmptyState } from './tree-api.js';
import type { SkillCatalog, SkillTreeState } from './types.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

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

export function loadPresets(dir = join(ROOT, 'presets')): PresetBuild[] {
  return readdirSync(dir)
    .filter((file) => file.endsWith('.yaml') || file.endsWith('.yml'))
    .sort()
    .map((file) => {
      const raw = parse(readFileSync(join(dir, file), 'utf8')) as PresetBuild;
      if (!raw?.id || !raw.title || !Array.isArray(raw.allocate_order)) {
        throw new Error(`invalid preset: ${file}`);
      }
      return raw;
    });
}

export function getPreset(id: string, dir = join(ROOT, 'presets')): PresetBuild {
  const preset = loadPresets(dir).find((p) => p.id === id);
  if (!preset) throw new Error(`unknown preset: ${id}`);
  return preset;
}

export function applyPreset(preset: PresetBuild, catalog: SkillCatalog = loadSkillCatalog()): SkillTreeState {
  let state = createEmptyState(preset.points);
  for (const nodeId of preset.allocate_order) {
    state = allocate(state, nodeId, 'human', catalog);
  }
  return state;
}
