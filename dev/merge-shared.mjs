// Merges the Boarage additions into a theme's shared files (idempotent):
//   config/settings_schema.json        + the "Boarage PDP" settings group
//   locales/en.default.schema.json     + the "boarage" editor strings (English)
//   locales/de.schema.json             + the "boarage" editor strings (German)
//   locales/en.default.json            + the "boarage" storefront strings (English)
//   locales/de.json                    + the "boarage" storefront strings (German)
// Usage: `node dev/merge-shared.mjs [theme-dir]` (default: the repo root, i.e. the Shrine files kept here).
// Files missing from the theme directory are skipped. For another theme (e.g. Horizon) pull its five files into a
// folder first, run this on that folder, then upload the result. Theme locale files may contain comments (JSONC);
// they are read tolerantly and written back as plain JSON.
import fs from 'node:fs';
import path from 'node:path';

const dir = process.argv[2] || '.';
const stripComments = (s) => s.replace(/^\s*\/\*[\s\S]*?\*\/\s*/, '').replace(/^\s*\/\/.*$/gm, '');
const read = (p) => JSON.parse(stripComments(fs.readFileSync(p, 'utf8')));
const write = (p, o) => fs.writeFileSync(p, JSON.stringify(o, null, 2) + '\n');
const target = (f) => path.join(dir, f);

const schemaPath = target('config/settings_schema.json');
if (fs.existsSync(schemaPath)) {
  const group = read('dev/shared/settings-group.json');
  const schema = read(schemaPath);
  const i = schema.findIndex((g) => g.name === group.name);
  if (i >= 0) schema[i] = group; else schema.push(group);
  write(schemaPath, schema);
  console.log(`${schemaPath}: group "${group.name}" ${i >= 0 ? 'replaced' : 'appended'} (${schema.length} groups)`);
}

for (const [file, frag] of [
  ['locales/en.default.schema.json', 'dev/shared/boarage.en.schema.json'],
  ['locales/de.schema.json', 'dev/shared/boarage.de.schema.json'],
  ['locales/en.default.json', 'dev/shared/boarage.en.json'],
  ['locales/de.json', 'dev/shared/boarage.de.json'],
]) {
  const p = target(file);
  if (!fs.existsSync(p)) continue;
  const json = read(p);
  json.boarage = read(frag);
  write(p, json);
  console.log(`${p}: boarage namespace written (${Object.keys(json.boarage).length} keys)`);
}

// Keys Shrine's own de.schema.json lacks (theme check MatchingTranslations); added only where missing, Shrine only.
if (dir === '.' && fs.existsSync('dev/shared/de.schema.extra.json')) {
  const deep = (t, extra, added = []) => {
    for (const [k, v] of Object.entries(extra)) {
      if (v && typeof v === 'object') { t[k] = t[k] && typeof t[k] === 'object' ? t[k] : {}; deep(t[k], v, added); }
      else if (t[k] === undefined) { t[k] = v; added.push(k); }
    }
    return added;
  };
  const de = read('locales/de.schema.json');
  const added = deep(de, read('dev/shared/de.schema.extra.json'));
  write('locales/de.schema.json', de);
  console.log(`locales/de.schema.json: ${added.length} missing Shrine keys filled`);
}
