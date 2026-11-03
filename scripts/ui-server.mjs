#!/usr/bin/env node
// SPDX-License-Identifier: MIT
// Local-only UI server: serves ui/ and exposes GET/POST /api/state backed by the
// same skilltree-state.json the CLI and DSH plugin use. Binds 127.0.0.1 only.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defaultStatePath, loadState, saveState } from '../dist/state-store.js';

const ROOT = resolve(fileURLToPath(new URL('../ui', import.meta.url)));
const PORT = Number(process.env.SKILLTREE_UI_PORT || 8780);
const STATE_PATH = defaultStatePath();
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.json': 'application/json; charset=utf-8',
};

function json(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
  res.end(body);
}

async function body(req) {
  let size = 0;
  const chunks = [];
  for await (const chunk of req) {
    size += chunk.length;
    if (size > 1_000_000) throw new Error('body too large');
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

function safeStatic(pathname) {
  const clean = decodeURIComponent(pathname.split('?')[0]);
  const full = resolve(ROOT, '.' + (clean === '/' ? '/preview.html' : clean));
  if (full !== ROOT && !full.startsWith(ROOT + sep)) return null;
  return full;
}

const server = createServer(async (req, res) => {
  try {
    if (req.method === 'GET' && req.url === '/api/health') {
      return json(res, 200, { ok: true, statePath: STATE_PATH });
    }
    if (req.method === 'GET' && req.url === '/api/state') {
      return json(res, 200, { state: loadState(STATE_PATH), statePath: STATE_PATH });
    }
    if (req.method === 'POST' && req.url === '/api/state') {
      const incoming = await body(req);
      const unlocked = incoming?.unlocked && typeof incoming.unlocked === 'object' ? incoming.unlocked : {};
      const points = Number(incoming?.pointsRemaining);
      if (!Number.isFinite(points) || points < 0) return json(res, 400, { error: 'invalid pointsRemaining' });
      const next = { unlocked, pointsRemaining: points, lastActor: 'human' };
      saveState(next, STATE_PATH);
      return json(res, 200, { state: next, statePath: STATE_PATH });
    }
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      return json(res, 405, { error: 'method not allowed' });
    }
    const file = safeStatic(req.url || '/');
    if (!file) return json(res, 403, { error: 'forbidden' });
    const data = await readFile(file);
    res.writeHead(200, {
      'content-type': MIME[extname(file).toLowerCase()] || 'application/octet-stream',
      'cache-control': 'no-store',
    });
    res.end(req.method === 'HEAD' ? undefined : data);
  } catch (error) {
    json(res, 500, { error: error instanceof Error ? error.message : String(error) });
  }
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`skilltree ui: http://127.0.0.1:${PORT}/preview.html`);
  console.log(`state: ${STATE_PATH}`);
});
