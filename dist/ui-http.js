// SPDX-License-Identifier: MIT
/** Loopback static server for the in-app skill-tree iframe. */
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defaultStatePath, loadState, saveState } from './state-store.js';
const ROOT = resolve(join(dirname(fileURLToPath(import.meta.url)), '..', 'ui'));
const STATE_PATH = defaultStatePath();
const PORT = Number(process.env.SKILLTREE_UI_PORT || 8780);
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
let server;
function json(res, status, payload) {
    res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
    res.end(JSON.stringify(payload));
}
async function readBody(req) {
    let size = 0;
    const chunks = [];
    for await (const chunk of req) {
        size += Buffer.byteLength(chunk);
        if (size > 1_000_000)
            throw new Error('body too large');
        chunks.push(Buffer.from(chunk));
    }
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}
function safe(pathname) {
    const clean = decodeURIComponent(pathname.split('?')[0]);
    const full = resolve(ROOT, '.' + (clean === '/' ? '/preview.html' : clean));
    if (full !== ROOT && !full.startsWith(ROOT + sep))
        return undefined;
    return full;
}
export function startUiServer() {
    if (server)
        return server;
    server = createServer(async (req, res) => {
        try {
            if (req.method === 'GET' && req.url === '/api/health') {
                return json(res, 200, { ok: true, statePath: STATE_PATH, locale: process.env.SKILLTREE_LOCALE || process.env.LC_ALL || process.env.LANG || null });
            }
            if (req.method === 'GET' && req.url === '/api/state') {
                return json(res, 200, { state: loadState(STATE_PATH), statePath: STATE_PATH });
            }
            if (req.method === 'POST' && req.url === '/api/state') {
                const incoming = await readBody(req);
                const unlocked = incoming?.unlocked && typeof incoming.unlocked === 'object' ? incoming.unlocked : {};
                const points = Number(incoming?.pointsRemaining);
                if (!Number.isFinite(points) || points < 0)
                    return json(res, 400, { error: 'invalid pointsRemaining' });
                const next = { unlocked, pointsRemaining: points, lastActor: 'human' };
                saveState(next, STATE_PATH);
                return json(res, 200, { state: next, statePath: STATE_PATH });
            }
            if (req.method !== 'GET' && req.method !== 'HEAD')
                return json(res, 405, { error: 'method not allowed' });
            const file = safe(req.url || '/');
            if (!file)
                return json(res, 403, { error: 'forbidden' });
            const data = await readFile(file);
            res.writeHead(200, { 'content-type': MIME[extname(file).toLowerCase()] || 'application/octet-stream', 'cache-control': 'no-store' });
            res.end(req.method === 'HEAD' ? undefined : data);
        }
        catch (error) {
            json(res, 500, { error: error instanceof Error ? error.message : String(error) });
        }
    });
    server.on('error', (error) => {
        if (error.code !== 'EADDRINUSE')
            console.warn('[agent-skilltree] ui server:', error.message);
    });
    server.listen(PORT, '127.0.0.1', () => console.log(`[agent-skilltree] ui: http://127.0.0.1:${PORT}/preview.html`));
    server.unref();
    return server;
}
