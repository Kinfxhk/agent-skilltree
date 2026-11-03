import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const source = fileURLToPath(new URL('./client-template.js', import.meta.url));
const out = fileURLToPath(new URL('../dist/client.js', import.meta.url));
writeFileSync(out, readFileSync(source));
console.log('dist/client.js: DSH client wrapper');
