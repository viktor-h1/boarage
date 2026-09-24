// Verifies that every t:boarage.* key used in sections and config exists in both schema locale files,
// and that the English and German boarage namespaces have identical key sets.
import fs from 'node:fs';
import path from 'node:path';

const read = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));
const en = read('locales/en.default.schema.json');
const de = read('locales/de.schema.json');
const get = (obj, dotted) => dotted.split('.').reduce((o, k) => (o && typeof o === 'object' ? o[k] : undefined), obj);
const flat = (o, prefix = '') => Object.entries(o).flatMap(([k, v]) => (v && typeof v === 'object' ? flat(v, prefix + k + '.') : [prefix + k]));

const used = new Set();
const files = [...fs.readdirSync('sections').map((f) => path.join('sections', f)), 'config/settings_schema.json'];
for (const f of files) {
  const src = fs.readFileSync(f, 'utf8');
  for (const m of src.matchAll(/"t:(boarage\.[A-Za-z0-9_.]+)"/g)) used.add(m[1]);
}
let bad = 0;
for (const key of [...used].sort()) {
  const e = get(en, key), d = get(de, key);
  if (typeof e !== 'string') { console.error(`missing in en: ${key}`); bad++; }
  if (typeof d !== 'string') { console.error(`missing in de: ${key}`); bad++; }
}
const enKeys = new Set(flat(en.boarage, 'boarage.')), deKeys = new Set(flat(de.boarage, 'boarage.'));
for (const k of enKeys) if (!deKeys.has(k)) { console.error(`de lacks ${k}`); bad++; }
for (const k of deKeys) if (!enKeys.has(k)) { console.error(`en lacks ${k}`); bad++; }
const unused = [...enKeys].filter((k) => !used.has(k) && !/\.(options|info)\./.test(k) && !k.endsWith('.info'));
console.log(`${used.size} keys used, ${enKeys.size} defined in en, ${deKeys.size} in de, ${bad} problems`);
if (unused.length) console.log('defined but not referenced (ok if intentional):', unused.join(', '));
process.exit(bad ? 1 : 0);
