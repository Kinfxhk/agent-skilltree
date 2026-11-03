#!/usr/bin/env node
/**
 * M0 hygiene gate (post build+test): required files, dsh.bundle, catalog size,
 * README needles, no obvious secrets.
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse as parseYaml } from 'yaml';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

function fail(m) {
  console.error(`[check] FAIL: ${m}`);
  process.exit(1);
}
function ok(m) {
  console.log(`[check] OK: ${m}`);
}

const required = [
  'LICENSE',
  'NOTICE',
  'README.md',
  'CONTRIBUTING.md',
  'SECURITY.md',
  'CHANGELOG.md',
  'CODE_OF_CONDUCT.md',
  'THIRD_PARTY_NOTICES.md',
  '.env.example',
  '.gitignore',
  '.gitattributes',
  'package.json',
  'cordis.patch.yml',
  'skills/mvp-36.yaml',
  'ui/tokens.css',
  'ui/preview.html',
  'dist/index.js',
  'dist/policy-compiler.js',
  'dist/path-hygiene.js',
  'dist/os-profile.js',
  'src/index.ts',
  '.github/workflows/ci.yml',
];
for (const rel of required) {
  if (!existsSync(join(root, rel))) fail(`missing ${rel}`);
}
ok('required files');

const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
if (pkg.name !== 'agent-skilltree') fail(`name ${pkg.name}`);
if (pkg.license !== 'MIT') fail('license must be MIT');
if (!pkg.dsh?.bundle?.patch) fail('missing dsh.bundle.patch');
if (pkg.dsh.bundle.patch !== './cordis.patch.yml') fail('bad dsh.bundle.patch path');
if (!pkg.exports?.['./client']) fail('exports["./client"] missing');
ok('package.json + dsh.bundle');

const patch = readFileSync(join(root, 'cordis.patch.yml'), 'utf8');
if (!/id:\s*agent-skilltree/.test(patch)) fail('cordis.patch.yml missing id');
if (!/name:\s*'agent-skilltree'/.test(patch) && !/name:\s*"agent-skilltree"/.test(patch)) {
  fail('cordis.patch.yml missing name');
}
ok('cordis.patch.yml');

const doc = parseYaml(readFileSync(join(root, 'skills/mvp-36.yaml'), 'utf8'));
const nodes = doc.nodes ?? [];
if (nodes.length < 36) fail(`mvp nodes ${nodes.length} < 36`);
const ids = new Set(nodes.map((n) => n.id));
for (const id of [
  'execution.path_hygiene.1',
  'execution.shell_dialect.1',
  'gov.strict_path_mode',
  'perception.vision.1',
  'gov.consent.shell',
]) {
  if (!ids.has(id)) fail(`missing node ${id}`);
}
ok(`skills catalog (${nodes.length} nodes)`);

const readme = readFileSync(join(root, 'README.md'), 'utf8');
for (const needle of [
  'M1',
  '0.2.1-rc.5',
  'PolicyCompiler',
  'Path Hygiene',
  'Shell Dialect',
  'mermaid',
  'not affiliated',
  'ARPG',
  'dsh.bundle',
]) {
  if (!readme.includes(needle)) fail(`README missing needle: ${needle}`);
}
if (/Diablo|Blizzard Entertainment/i.test(readme) && !/not affiliated/i.test(readme)) {
  fail('README must not promote franchise names without disclaimer context');
}
if (/\bDiablo II\b|\bD2\b/i.test(readme)) {
  fail('README must not use Diablo II / D2 product naming');
}
ok('README needles');

const notice = readFileSync(join(root, 'NOTICE'), 'utf8');
if (!/not affiliated/i.test(notice)) fail('NOTICE missing not-affiliated');
if (!/Blizzard/i.test(notice)) fail('NOTICE should disclaim Blizzard affiliation');
ok('NOTICE');

const tokens = readFileSync(join(root, 'ui/tokens.css'), 'utf8');
if (!tokens.includes('--bg-deep') || !tokens.includes('--tab-perception')) {
  fail('ui/tokens.css missing expected Art tokens');
}
ok('ui/tokens.css');

const suspicious =
  /(?:sk-[a-zA-Z0-9]{20,}|api[_-]?key\s*[:=]\s*['"][^'"]+['"]|BEGIN (?:RSA |OPENSSH )?PRIVATE KEY)/i;
function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name === '.git' || name === 'dist') continue;
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, out);
    else if (
      /\.(md|json|ya?ml|mjs|js|ts|css|html|example|toml|txt)$/i.test(name) ||
      name === 'LICENSE' ||
      name === 'NOTICE'
    ) {
      out.push(p);
    }
  }
  return out;
}
for (const file of walk(root)) {
  const text = readFileSync(file, 'utf8');
  if (suspicious.test(text)) fail(`suspicious secret-like material in ${file}`);
}
ok('no obvious secrets (fallback scan)');

console.log('[check] all green');
