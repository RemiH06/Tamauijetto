// Una pasada: lee lo que el usuario hizo en GitHub, alimenta a la mascota
// (o la deja morir) y escribe out/pet.json + out/tamagotchi.svg.
// En CI corre cada hora; out/ se publica en la rama `pet`.
//   node src/index.js            una pasada real
//   node src/index.js --preview  dibuja todas las etapas y ánimos, sin red

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { styleText } from 'node:util';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { fetchEvents, nutrition, fromRepo } from './github.js';
import { validateSpecies, hatch, live, mood } from './pet.js';
import { renderCard } from './render.js';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const OUT = path.join(ROOT, 'out');

const readJson = async (file) => JSON.parse(await readFile(file, 'utf8'));

async function readOptional(file) {
  try {
    return await readFile(file, 'utf8');
  } catch (err) {
    if (err.code === 'ENOENT') return null;
    throw err;
  }
}

async function loadConfig() {
  const cfg = await readJson(path.join(ROOT, 'tamauijetto.config.json'));
  if (!cfg.user) throw new Error('Falta "user" en tamauijetto.config.json.');
  const { hungry, starving, dead } = cfg.hours ?? {};
  if (!(hungry < starving && starving < dead)) throw new Error('"hours" debe cumplir hungry < starving < dead.');
  if (cfg.bornAt && Number.isNaN(Date.parse(cfg.bornAt))) throw new Error(`"bornAt" no es una fecha ISO válida: ${cfg.bornAt}`);
  return cfg;
}

async function loadSpecies(id) {
  if (!/^[\w-]+$/.test(id)) throw new Error(`Nombre de especie inválido: ${id}`);
  const species = await readJson(path.join(ROOT, 'species', `${id}.json`));
  validateSpecies(species, id);
  return species;
}

// GITHUB_TOKEN en CI; en local, la variable o el archivo .secrets de siempre.
async function loadToken() {
  return process.env.GITHUB_TOKEN || (await readOptional(path.join(ROOT, '.secrets')))?.trim() || null;
}

async function run(cfg, species) {
  const now = Date.now();
  const statePath = path.join(OUT, 'pet.json');
  const saved = await readOptional(statePath);
  let state = saved ? JSON.parse(saved) : null;

  if (state && state.pet.species !== cfg.species) {
    console.log(styleText('yellow', `La especie cambió (${state.pet.species} → ${cfg.species}): nace un huevo nuevo.`));
    state = null;
  }
  state ??= { pet: hatch(cfg.species, species, cfg.bornAt ? Date.parse(cfg.bornAt) : now), seen: [] };

  const token = await loadToken();
  if (!token) console.log(styleText('yellow', 'Sin token: solo se ve la actividad pública y el límite es de 60 llamadas por hora.'));

  const seen = new Set(state.seen);
  const born = Date.parse(state.pet.bornAt);
  const fresh = (await fetchEvents(cfg.user, token))
    .filter((e) => !seen.has(e.id) && Date.parse(e.created_at) >= born && fromRepo(e, cfg.user, cfg.repo));
  const meals = [];
  for (const e of fresh) meals.push({ id: e.id, at: Date.parse(e.created_at), food: await nutrition(e, cfg.food, token) });

  const pet = live(state.pet, meals, species, cfg.hours, now);
  const next = { pet, seen: [...seen, ...fresh.map((e) => e.id)].slice(-600), updatedAt: new Date(now).toISOString() };

  await mkdir(OUT, { recursive: true });
  await writeFile(statePath, JSON.stringify(next, null, 2) + '\n');
  const m = mood(pet, cfg.hours, now);
  await writeFile(path.join(OUT, 'tamagotchi.svg'), renderCard({ pet, mood: m, species, speciesName: cfg.species, petColor: cfg.petColor, now }));

  const eaten = meals.reduce((sum, x) => sum + x.food, 0);
  if (!pet.diedAt) console.log(styleText('green', species[pet.stage].asciiArt));
  console.log(styleText('cyan', `${cfg.species} · gen ${pet.generation} · ${pet.stage} · comida ${pet.food} (+${eaten} en ${meals.length} eventos nuevos) · ${m.state}`));
}

// Una tarjeta por etapa y una por ánimo, para diseñar especies sin red.
async function preview(cfg, species) {
  const now = Date.now();
  const dir = path.join(OUT, 'preview');
  await mkdir(dir, { recursive: true });
  const base = hatch(cfg.species, species, now - 5 * 86_400_000);
  const cards = species.stages.map((s) => [s.name, { ...base, stage: s.name, food: s.requiredFood ?? 0, lastFedAt: new Date(now - 2 * 3_600_000).toISOString() }]);
  const last = cards.at(-1)[1];
  const ago = (h) => new Date(now - h * 3_600_000).toISOString();
  cards.push(
    ['_hungry', { ...last, lastFedAt: ago(cfg.hours.hungry + 1) }],
    ['_starving', { ...last, lastFedAt: ago(cfg.hours.starving + 1) }],
    ['_dead', { ...last, lastFedAt: ago(cfg.hours.dead + 1), diedAt: ago(1) }],
  );
  for (const [name, pet] of cards) {
    await writeFile(path.join(dir, `${name}.svg`), renderCard({ pet, mood: mood(pet, cfg.hours, now), species, speciesName: cfg.species, petColor: cfg.petColor, now }));
  }
  console.log(`${cards.length} tarjetas en ${path.relative(ROOT, dir)}`);
}

try {
  const cfg = await loadConfig();
  const species = await loadSpecies(cfg.species);
  await (process.argv.includes('--preview') ? preview(cfg, species) : run(cfg, species));
} catch (err) {
  console.error(styleText('red', err.message));
  process.exitCode = 1;
}
