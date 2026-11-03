// SPDX-License-Identifier: MIT
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse as parseYaml } from 'yaml';
import type { SkillCatalog, SkillNode, TabId } from './types.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

function isTab(v: unknown): v is TabId {
  return v === 'perception' || v === 'execution' || v === 'governance';
}

function normalizeNode(raw: Record<string, unknown>): SkillNode {
  const id = String(raw.id ?? '');
  const tab = raw.tab;
  if (!id || !isTab(tab)) {
    throw new Error(`Invalid skill node: ${JSON.stringify(raw)}`);
  }
  return {
    id,
    tab,
    name_zh: String(raw.name_zh ?? id),
    name_en: raw.name_en != null ? String(raw.name_en) : undefined,
    rank: typeof raw.rank === 'number' ? raw.rank : undefined,
    cost: typeof raw.cost === 'number' ? raw.cost : 0,
    requires: Array.isArray(raw.requires) ? raw.requires.map(String) : [],
    grants: Array.isArray(raw.grants) ? raw.grants.map(String) : [],
    danger:
      raw.danger === 'low' || raw.danger === 'medium' || raw.danger === 'high'
        ? raw.danger
        : undefined,
    capstone: Boolean(raw.capstone),
    default_enabled: raw.default_enabled === undefined ? undefined : Boolean(raw.default_enabled),
    default_enabled_by_platform: raw.default_enabled_by_platform as SkillNode['default_enabled_by_platform'],
    note: raw.note != null ? String(raw.note) : undefined,
  };
}

/** Load and lightly validate skills/mvp-36.yaml (runtime shape, not full JSON Schema). */
export function loadSkillCatalog(path = join(ROOT, 'skills', 'mvp-36.yaml')): SkillCatalog {
  const doc = parseYaml(readFileSync(path, 'utf8')) as Record<string, unknown>;
  const meta = doc.meta as SkillCatalog['meta'];
  const tabs = (doc.tabs as unknown[]).filter(isTab);
  const nodes = ((doc.nodes as unknown[]) ?? []).map((n) =>
    normalizeNode(n as Record<string, unknown>),
  );
  if (!meta?.schema || nodes.length < 36) {
    throw new Error(`Skill catalog invalid or too small (${nodes.length})`);
  }
  return { meta, tabs, nodes };
}

export function indexNodes(catalog: SkillCatalog): Map<string, SkillNode> {
  return new Map(catalog.nodes.map((n) => [n.id, n]));
}
