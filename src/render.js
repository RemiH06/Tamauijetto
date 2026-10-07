import { SPRITE_SIZE } from './pet.js';

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

// Lápida de 32×32 para cuando muere: piedra redondeada con cruz hueca.
const TOMBSTONE = {
  timing: [1],
  frames: [Array.from({ length: SPRITE_SIZE }, (_, y) => Array.from({ length: SPRITE_SIZE }, (_, x) => {
    if (y === 30 && x >= 4 && x <= 27) return '*';
    const stone = (y >= 16 && y <= 29 && x >= 9 && x <= 22) || (y < 16 && (x - 15.5) ** 2 + (y - 16) ** 2 <= 6.8 ** 2);
    const cross = (x >= 15 && x <= 16 && y >= 12 && y <= 22) || (y >= 15 && y <= 16 && x >= 12 && x <= 19);
    return stone && !cross ? '#' : '.';
  }).join(''))],
};

// Pantalla LCD: cada píxel del sprite es un cuadro de 4 px con 1 px de
// separación, igual en todas las etapas y especies.
const W = 520, H = 232, PX = 5, LCD = { x: 46, y: 49 };

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
const vars = (t) => Object.entries(t).map(([k, v]) => `--${k}:${v}`).join(';');

function ago(hours) {
  if (hours < 1) return 'hace <1 h';
  if (hours < 48) return `hace ${Math.floor(hours)} h`;
  return `hace ${Math.floor(hours / 24)} d`;
}

// Un path por tono: un cuadro "M x y h4 v4 h-4 z" por píxel encendido.
function pixels(frame, ch) {
  let d = '';
  frame.forEach((row, y) => [...row].forEach((c, x) => { if (c === ch) d += `M${x * PX} ${y * PX}h4v4h-4z`; }));
  return d;
}

// Cuadros que se alternan con opacidad en step-end; el primero es el que
// queda fijo con prefers-reduced-motion o sin soporte de animación.
function spriteBlock({ frames, timing = [1] }) {
  const total = timing.reduce((a, b) => a + b, 0);
  let t = 0;
  const css = frames.length < 2 ? '' : timing.map((d, i) => {
    const s = (t / total) * 100, e = ((t += d) / total) * 100;
    return `@keyframes f${i}{0%{opacity:${s === 0 ? 1 : 0}}${s > 0 ? `${s.toFixed(2)}%{opacity:1}` : ''}${e < 100 ? `${e.toFixed(2)}%{opacity:0}` : ''}}.f${i}{animation:f${i} ${+total.toFixed(2)}s step-end infinite}`;
  }).join('');
  const groups = frames.map((frame, i) =>
    `<g class="frame f${i}"><path class="body" d="${pixels(frame, '#')}"/><path class="detail" d="${pixels(frame, '*')}"/></g>`).join('');
  return { css, svg: `<g transform="translate(${LCD.x} ${LCD.y})"><rect class="ghost" width="${SPRITE_SIZE * PX}" height="${SPRITE_SIZE * PX}"/><g class="pet">${groups}</g></g>` };
}

export function terminalArt(frame) {
  return frame.map((row) => row.replace(/\./g, ' ').replace(/#/g, '█').replace(/\*/g, '▒').trimEnd()).join('\n');
}

const color = (c) => (c.startsWith('#') ? c : `var(--${c})`);

export function renderCard({ pet, mood, species, speciesName, petColor, detailColor, now }) {
  const m = MOODS[mood.state];
  const stage = species.stages.find((s) => s.name === pet.stage);
  const terminal = !Object.keys(stage.probabilities ?? {}).length;
  const sprite = spriteBlock(pet.diedAt ? TOMBSTONE : species.sprites[pet.stage]);
  const ageDays = Math.floor((now - Date.parse(pet.bornAt)) / 86_400_000);

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
svg{${vars(TOKENS.dark)};--mood:var(--${m.color});--petc:${pet.diedAt ? 'var(--text3)' : color(petColor)};--detc:${pet.diedAt ? 'var(--text3)' : color(detailColor)}}
@media (prefers-color-scheme:light){svg{${vars(TOKENS.light)}}}
text{font-family:'JetBrains Mono','Fira Code',ui-monospace,Consolas,monospace;font-size:13px;white-space:pre;fill:var(--text)}
.card{fill:var(--bg2);stroke:var(--border)}
.screen{fill:var(--bg);stroke:var(--border)}
.rule{stroke:var(--border)}
.title{fill:var(--cyan);font-weight:700;letter-spacing:1px;filter:drop-shadow(0 0 4px var(--cyan))}
.species{fill:var(--magenta);font-size:16px;font-weight:700;filter:drop-shadow(0 0 4px var(--magenta))}
.t1{fill:var(--text)}.t3{fill:var(--text3)}
.body{fill:var(--petc)}.detail{fill:var(--detc)}
.ghost{fill:url(#lcd)}
.pet{filter:drop-shadow(0 0 3px var(--petc))}
.frame{opacity:0}.f0{opacity:1}
${sprite.css}
.seg{fill:var(--border)}.seg.on{fill:var(--mood);filter:drop-shadow(0 0 3px var(--mood))}
.status{fill:var(--mood)}.prompt{fill:var(--electric)}
.scan{fill:url(#scan);pointer-events:none}
.alive .pet{animation:bob 1.6s step-end infinite}
.cursor{animation:blink 1s step-end infinite}
@keyframes bob{50%{transform:translateY(-${PX}px)}}
@keyframes blink{50%{opacity:0}}
@media (prefers-color-scheme:light){.title,.species,.pet,.seg.on{filter:none}}
@media (prefers-reduced-motion:reduce){.alive .pet,.cursor,.frame{animation:none!important}}
</style>
<defs><pattern id="scan" width="4" height="4" patternUnits="userSpaceOnUse"><rect y="2" width="4" height="2" style="fill:var(--text)" opacity=".05"/></pattern><pattern id="lcd" width="${PX}" height="${PX}" patternUnits="userSpaceOnUse"><rect width="4" height="4" style="fill:var(--text)" opacity=".04"/></pattern></defs>
<rect class="card" x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="2"/>
<text class="title" x="16" y="20">// TAMAUIJETTO</text>
<text class="t3" x="${W - 16}" y="20" text-anchor="end">gen ${pet.generation}</text>
<line class="rule" x1="0" y1="30.5" x2="${W}" y2="30.5"/>
<g class="${pet.diedAt ? 'dead' : 'alive'}">
<rect class="screen" x="16.5" y="42.5" width="220" height="174" rx="2"/>
${sprite.svg}
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
