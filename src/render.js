// Tarjeta SVG con la piel de iroFactory · sherry: neón sobre negro casi
// puro, monoespaciada, glow en oscuro y scanlines de CRT. Los tokens son
// los de 37.iroFactory/sherry/sherry.css (oscuro default, claro por
// prefers-color-scheme). GitHub sirve el SVG como <img>: no carga fuentes
// externas ni JS, así que todo va inline y la fuente cae a la mono local.

const TOKENS = {
  dark: {
    bg: '#080808', bg2: '#0e0e0e', border: '#2a2a2a', text: '#f0f0f0', text2: '#A8A8A8', text3: '#7F7F7F',
    magenta: '#FF1466', cyan: '#00F5FF', lime: '#39FF14', violet: '#AC4DFF', electric: '#FFE600', lavender: '#D4AAFF',
  },
  light: {
    bg: '#F5F2EC', bg2: '#EDEAD2', border: '#B8B6A4', text: '#0a0a0a', text2: '#3A3A3A', text3: '#5F5F5F',
    magenta: '#B2003F', cyan: '#006A6F', lime: '#2B6A10', violet: '#5A0FA8', electric: '#6C5E00', lavender: '#7744AA',
  },
};

const MOODS = {
  full: { color: 'lime', label: 'satisfecho' },
  hungry: { color: 'electric', label: 'tiene hambre' },
  starving: { color: 'magenta', label: 'se muere de hambre' },
  dead: { color: 'text3', label: 'murió de hambre' },
};

const TOMBSTONE = '   _____\n  /     \\\n |  RIP  |\n |       |\n |  x_x  |\n_|_______|_';

const W = 520, H = 232, FONT = 14, CHAR = FONT * 0.6, LINE = FONT * 1.15;

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
const vars = (t) => Object.entries(t).map(([k, v]) => `--${k}:${v}`).join(';');

function ago(hours) {
  if (hours < 1) return 'hace <1 h';
  if (hours < 48) return `hace ${Math.floor(hours)} h`;
  return `hace ${Math.floor(hours / 24)} d`;
}

// El braille en blanco (U+2800) se ve como puntitos en algunas fuentes;
// un espacio normal ocupa el mismo ancho en una monoespaciada.
function asciiBlock(art, box) {
  const lines = art.replace(/⠀/g, ' ').split('\n');
  const w = Math.max(...lines.map((l) => [...l].length)) * CHAR;
  const h = lines.length * LINE;
  const rows = lines.map((l, i) => `<text x="0" y="${((i + 0.85) * LINE).toFixed(1)}">${esc(l)}</text>`).join('');
  return `<svg x="${box.x}" y="${box.y}" width="${box.w}" height="${box.h}" viewBox="0 0 ${w.toFixed(1)} ${h.toFixed(1)}" preserveAspectRatio="xMidYMid meet"><g class="pet">${rows}</g></svg>`;
}

export function renderCard({ pet, mood, species, speciesName, petColor, now }) {
  const m = MOODS[mood.state];
  const stage = species.stages.find((s) => s.name === pet.stage);
  const terminal = !Object.keys(stage.probabilities ?? {}).length;
  const art = pet.diedAt ? TOMBSTONE : species[pet.stage].asciiArt;
  const ageDays = Math.floor((now - Date.parse(pet.bornAt)) / 86_400_000);
  const petVar = petColor.startsWith('#') ? petColor : `var(--${petColor})`;

  const rows = [
    ['etapa', pet.stage],
    ['edad', `${ageDays} d`],
    ['comida', terminal ? `${pet.food} · forma final` : `${pet.food} / ${stage.requiredFood}`],
    ['último', ago(mood.hungryFor)],
  ].map(([k, v], i) => `<text x="256" y="${92 + i * 20}"><tspan class="t3">${k.padEnd(8)}</tspan><tspan class="t1">${esc(v)}</tspan></text>`).join('');

  const SEGS = 12;
  const lit = Math.ceil(mood.health * SEGS);
  const bar = Array.from({ length: SEGS }, (_, i) =>
    `<rect x="${328 + i * 14}" y="164" width="10" height="12" class="${i < lit ? 'seg on' : 'seg'}"/>`).join('');

  const status = pet.diedAt ? `${m.label} · ${pet.diedAt.slice(0, 10)}` : m.label;
  const summary = `${speciesName} en etapa ${pet.stage}, generación ${pet.generation}: ${status}.`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="t d">
<title id="t">Tamauijetto · ${esc(speciesName)}</title>
<desc id="d">${esc(summary)}</desc>
<style>
svg{${vars(TOKENS.dark)};--mood:var(--${m.color});--petc:${pet.diedAt ? 'var(--text3)' : petVar}}
@media (prefers-color-scheme:light){svg{${vars(TOKENS.light)}}}
text{font-family:'JetBrains Mono','Fira Code',ui-monospace,Consolas,monospace;font-size:13px;white-space:pre;fill:var(--text)}
.card{fill:var(--bg2);stroke:var(--border)}
.screen{fill:var(--bg);stroke:var(--border)}
.rule{stroke:var(--border)}
.title{fill:var(--cyan);font-weight:700;letter-spacing:1px;filter:drop-shadow(0 0 4px var(--cyan))}
.species{fill:var(--magenta);font-size:16px;font-weight:700;filter:drop-shadow(0 0 4px var(--magenta))}
.t1{fill:var(--text)}.t3{fill:var(--text3)}
.pet text{fill:var(--petc);font-size:${FONT}px}
.pet{filter:drop-shadow(0 0 3px var(--petc))}
.seg{fill:var(--border)}.seg.on{fill:var(--mood);filter:drop-shadow(0 0 3px var(--mood))}
.status{fill:var(--mood)}.prompt{fill:var(--electric)}
.scan{fill:url(#scan);pointer-events:none}
.alive .pet{animation:bob 2.4s ease-in-out infinite}
.cursor{animation:blink 1s step-end infinite}
@keyframes bob{50%{transform:translateY(-${(LINE * 0.25).toFixed(1)}px)}}
@keyframes blink{50%{opacity:0}}
@media (prefers-color-scheme:light){.title,.species,.pet,.seg.on{filter:none}}
@media (prefers-reduced-motion:reduce){.alive .pet,.cursor{animation:none}}
</style>
<defs><pattern id="scan" width="4" height="4" patternUnits="userSpaceOnUse"><rect y="2" width="4" height="2" style="fill:var(--text)" opacity=".05"/></pattern></defs>
<rect class="card" x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="2"/>
<text class="title" x="16" y="20">// TAMAUIJETTO</text>
<text class="t3" x="${W - 16}" y="20" text-anchor="end">gen ${pet.generation}</text>
<line class="rule" x1="0" y1="30.5" x2="${W}" y2="30.5"/>
<g class="${pet.diedAt ? 'dead' : 'alive'}">
<rect class="screen" x="16.5" y="42.5" width="220" height="174" rx="2"/>
${asciiBlock(art, { x: 28, y: 54, w: 196, h: 150 })}
<rect class="scan" x="17" y="43" width="219" height="173"/>
</g>
<text class="species" x="256" y="64">&gt; ${esc(speciesName)}</text>
${rows}
<text x="256" y="174"><tspan class="t3">vida</tspan></text>
${bar}
<text x="256" y="206"><tspan class="prompt">$ </tspan><tspan class="status">${esc(status)}</tspan><tspan class="cursor status"> █</tspan></text>
</svg>
`;
}
