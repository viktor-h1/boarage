// Merges the Boarage additions into the three shared theme files (idempotent).
// Run after a Shrine theme update: pull the theme's config/settings_schema.json,
// locales/en.default.schema.json and locales/de.schema.json into this repo, then `node dev/merge-shared.mjs`.
import fs from 'node:fs';

const read = (p) => JSON.parse(fs.readFileSync(p, 'utf8').replace(/^\s*\/\*[\s\S]*?\*\/\s*/, ''));
const write = (p, o) => fs.writeFileSync(p, JSON.stringify(o, null, 2) + '\n');

const group = read('dev/shared/settings-group.json');
const schemaPath = 'config/settings_schema.json';
const schema = read(schemaPath);
const i = schema.findIndex((g) => g.name === group.name);
if (i >= 0) schema[i] = group; else schema.push(group);
write(schemaPath, schema);
console.log(`${schemaPath}: group "${group.name}" ${i >= 0 ? 'replaced' : 'appended'} (${schema.length} groups)`);

for (const [file, frag] of [
  ['locales/en.default.schema.json', 'dev/shared/boarage.en.schema.json'],
  ['locales/de.schema.json', 'dev/shared/boarage.de.schema.json'],
]) {
  const json = read(file);
  json.boarage = read(frag);
  write(file, json);
  console.log(`${file}: boarage namespace written (${Object.keys(json.boarage).length} groups)`);
}

// Keys Shrine's own de.schema.json lacks (theme check MatchingTranslations); added only where missing.
const deep = (target, extra, added = []) => {
  for (const [k, v] of Object.entries(extra)) {
    if (v && typeof v === 'object') { target[k] = target[k] && typeof target[k] === 'object' ? target[k] : {}; deep(target[k], v, added); }
    else if (target[k] === undefined) { target[k] = v; added.push(k); }
  }
  return added;
};
if (fs.existsSync('dev/shared/de.schema.extra.json')) {
  const de = read('locales/de.schema.json');
  const added = deep(de, read('dev/shared/de.schema.extra.json'));
  write('locales/de.schema.json', de);
  console.log(`locales/de.schema.json: ${added.length} missing Shrine keys filled`);
}
