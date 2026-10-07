// Ciclo de vida: come, evoluciona, pasa hambre y muere. Todo es puro
// (sin red ni disco) para poder simular comidas en orden cronológico.

const HOUR = 3_600_000;
const iso = (ms) => new Date(ms).toISOString();

// Estándar común a todas las especies: cada cuadro es una cuadrícula de
// size×size con '.' vacío, '#' cuerpo y '*' detalle. Mismo tamaño de píxel
// en todas las etapas, así el crecimiento se ve.
export const SPRITE_SIZE = 32;

function validateSprite(sprite, where) {
  const frames = sprite?.frames;
  if (!Array.isArray(frames) || frames.length === 0) throw new Error(`${where}: no tiene frames.`);
  frames.forEach((frame, f) => {
    if (!Array.isArray(frame) || frame.length !== SPRITE_SIZE) throw new Error(`${where}, cuadro ${f}: debe tener ${SPRITE_SIZE} filas.`);
    frame.forEach((row, r) => {
      if (typeof row !== 'string' || !new RegExp(`^[.#*]{${SPRITE_SIZE}}$`).test(row)) {
        throw new Error(`${where}, cuadro ${f}, fila ${r}: deben ser ${SPRITE_SIZE} caracteres entre . # *`);
      }
    });
  });
  const timing = sprite.timing ?? [1];
  if (timing.length !== frames.length || !timing.every((t) => t > 0)) throw new Error(`${where}: "timing" necesita un número positivo (segundos) por cuadro.`);
}

export function validateSpecies(species, id) {
  if (!Array.isArray(species.stages) || species.stages.length === 0) throw new Error(`La especie ${id} no tiene etapas.`);
  if (species.size !== SPRITE_SIZE) throw new Error(`La especie ${id} debe declarar "size": ${SPRITE_SIZE}.`);
  const names = new Set(species.stages.map((s) => s.name));
  for (const stage of species.stages) {
    validateSprite(species.sprites?.[stage.name], `La especie ${id}, etapa "${stage.name}"`);
    for (const next of Object.keys(stage.probabilities ?? {})) {
      if (!names.has(next)) throw new Error(`La especie ${id} evoluciona de "${stage.name}" a "${next}", que no existe.`);
    }
  }
}

export const stageOf = (species, name) => species.stages.find((s) => s.name === name);

export function hatch(speciesId, species, at, generation = 1) {
  return { species: speciesId, generation, stage: species.stages[0].name, food: 0, bornAt: iso(at), lastFedAt: iso(at), diedAt: null };
}

// Ruleta con los pesos de la etapa; si no suman 1 se normalizan.
function pick(probabilities) {
  const entries = Object.entries(probabilities);
  let roll = Math.random() * entries.reduce((sum, [, p]) => sum + p, 0);
  for (const [name, p] of entries) if ((roll -= p) < 0) return name;
  return entries.at(-1)[0];
}

function evolve(pet, species) {
  let stage = stageOf(species, pet.stage);
  while (Object.keys(stage.probabilities ?? {}).length && pet.food >= stage.requiredFood) {
    pet.stage = pick(stage.probabilities);
    stage = stageOf(species, pet.stage);
  }
  return pet;
}

function starve(pet, at, hours) {
  const fed = Date.parse(pet.lastFedAt);
  if (!pet.diedAt && at - fed > hours.dead * HOUR) pet.diedAt = iso(fed + hours.dead * HOUR);
  return pet;
}

// meals: [{ id, at (ms), food }]. Lo que llegue después de morir hace
// nacer la siguiente generación.
export function live(pet, meals, species, hours, now) {
  pet = { ...pet };
  for (const meal of [...meals].sort((a, b) => a.at - b.at)) {
    if (meal.food <= 0 || meal.at < Date.parse(pet.bornAt)) continue;
    starve(pet, meal.at, hours);
    if (pet.diedAt) {
      if (meal.at <= Date.parse(pet.diedAt)) continue;
      pet = hatch(pet.species, species, meal.at, pet.generation + 1);
    }
    pet.food += meal.food;
    if (meal.at > Date.parse(pet.lastFedAt)) pet.lastFedAt = iso(meal.at);
    evolve(pet, species);
  }
  return starve(pet, now, hours);
}

export function mood(pet, hours, now) {
  const hungryFor = (now - Date.parse(pet.lastFedAt)) / HOUR;
  const health = pet.diedAt ? 0 : Math.max(0, 1 - hungryFor / hours.dead);
  const state = pet.diedAt ? 'dead' : hungryFor >= hours.starving ? 'starving' : hungryFor >= hours.hungry ? 'hungry' : 'full';
  return { state, health, hungryFor };
}
