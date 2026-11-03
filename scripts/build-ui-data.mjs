#!/usr/bin/env node
// SPDX-License-Identifier: MIT
// Build the static UI data file from skills/mvp-36.yaml (no browser YAML parser needed).
import { writeFileSync } from 'node:fs';
import { loadSkillCatalog } from '../dist/load-skills.js';
import { loadPresets } from '../dist/presets.js';

const catalog = loadSkillCatalog();
const payload = { meta: catalog.meta, nodes: catalog.nodes, presets: loadPresets() };
const out = new URL('../ui/nodes.js', import.meta.url);
writeFileSync(out, `window.SKILLTREE_DATA = ${JSON.stringify(payload, null, 2)};\n`);
console.log(`ui/nodes.js: ${catalog.nodes.length} nodes, ${payload.presets.length} presets`);
