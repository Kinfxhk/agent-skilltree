#!/usr/bin/env node
// SPDX-License-Identifier: MIT
// Human-only skill point operator. The agent never gets allocate/respec tools.
import { allocate, exportPolicy, inspect, respec } from '../dist/index.js';
import { applyPreset, getPreset, loadPresets } from '../dist/presets.js';
import { defaultStatePath, emptyState, loadState, saveState } from '../dist/state-store.js';

const [command = 'status', ...args] = process.argv.slice(2);
const path = defaultStatePath();
const state = loadState(path);

function printState(next = state) {
  const view = inspect(next);
  console.log(JSON.stringify({
    path,
    pointsRemaining: next.pointsRemaining,
    unlocked: next.unlocked,
    unlockable: view.unlockable,
    policy: {
      toolAllow: view.policy.toolAllow,
      toolAsk: view.policy.toolAsk,
      toolDeny: view.policy.toolDeny,
      sandboxFloor: view.policy.sandboxFloor,
      pathHygiene: view.policy.pathHygiene,
    },
  }, null, 2));
}

try {
  switch (command) {
    case 'status':
      printState();
      break;
    case 'path':
      console.log(path);
      break;
    case 'init': {
      const points = Number(args[0] ?? 10);
      const next = emptyState(Number.isFinite(points) ? points : 10);
      saveState(next, path);
      printState(next);
      break;
    }
    case 'grant': {
      const amount = Number(args[0]);
      if (!Number.isFinite(amount) || amount === 0) throw new Error('grant needs a non-zero number');
      const next = { ...state, pointsRemaining: Math.max(0, state.pointsRemaining + amount), lastActor: 'human' };
      saveState(next, path);
      printState(next);
      break;
    }
    case 'allocate': {
      const node = args[0];
      if (!node) throw new Error('allocate needs a node id');
      const next = allocate(state, node, 'human');
      saveState(next, path);
      printState(next);
      break;
    }
    case 'respec': {
      const next = respec(state, 'human');
      saveState(next, path);
      printState(next);
      break;
    }
    case 'presets': {
      for (const p of loadPresets()) {
        console.log(`${p.id}\t${p.title}\t${p.points} points\t${p.blurb_zh}`);
      }
      break;
    }
    case 'preset': {
      const id = args[0];
      if (!id) throw new Error('preset needs an id');
      const p = getPreset(id);
      const next = applyPreset(p);
      saveState(next, path);
      printState(next);
      break;
    }
    case 'export':
      console.log(JSON.stringify(exportPolicy(state, undefined, undefined), null, 2));
      break;
    default:
      console.error('usage: skilltree status|path|init [points]|grant <n>|allocate <node>|respec|presets|preset <id>|export');
      process.exit(2);
  }
} catch (error) {
  console.error(`skilltree: ${error?.code ?? 'error'}: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
}
