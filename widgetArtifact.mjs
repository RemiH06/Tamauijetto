import fs from 'fs';
import path from 'path';
import { createCanvas } from 'canvas';
import terminalImage from 'terminal-image';
import { loadTamagotchiData, getCommits, evolveTamagotchi } from './tamagotchi.mjs';

// Función para generar imagen desde ASCII
async function generateImageFromAscii(asciiArt, filePath) {
  const lines = asciiArt.split('\n');
  const lineHeight = 20;       // tamaño de fuente en px
  const charWidth = 12;        // ancho aproximado de cada caracter
  const canvasWidth = Math.max(...lines.map(l => l.length)) * charWidth;
  const canvasHeight = lines.length * lineHeight;

  // 1. Canvas ajustado al ASCII
  const canvas = createCanvas(canvasWidth, canvasHeight);
  const ctx = canvas.getContext('2d');

  ctx.font = `${lineHeight}px monospace`;
  ctx.fillStyle = '#FFFFFF';  // fondo blanco
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);
  ctx.fillStyle = '#000000';  // color del ASCII

  lines.forEach((line, index) => {
    ctx.fillText(line, 0, lineHeight * (index + 0.9)); // 0.9 para alinear vertical
  });

  // 2. Canvas final cuadrado de 256x256
  const finalSize = 256;
  const finalCanvas = createCanvas(finalSize, finalSize);
  const fCtx = finalCanvas.getContext('2d');

  // fondo blanco
  fCtx.fillStyle = '#FFFFFF';
  fCtx.fillRect(0, 0, finalSize, finalSize);

  // calcular escala para encajar ASCII en 256x256
  const scale = Math.min(finalSize / canvasWidth, finalSize / canvasHeight);

  fCtx.scale(scale, scale);
  fCtx.drawImage(canvas, 0, 0);

  // guardar archivo
  const buffer = finalCanvas.toBuffer('image/png');
  fs.writeFileSync(filePath, buffer);
}

// Función que ejecuta todo
export async function runWidget(user, repo = '', date = '2025-01-01T00_00_00Z', jsonFile = 'amphibia.json', color1 = 'FFFF00', color2 = '00FFFF') {
  const tamagotchiData = loadTamagotchiData(jsonFile);
  if (!tamagotchiData) return;

  const commits = await getCommits(user, repo, date);

  // Evolución en consola
  evolveTamagotchi(commits, tamagotchiData, path.basename(jsonFile, '.json'), color1, color2);

  // Generar nombre de archivo seguro
  const safeFileName = `tamagotchi_${user}_${repo}_${date}_${jsonFile}_${color1}_${color2}.png`;
  const filePath = path.join('tamauijetto', safeFileName);

  // Evolución en consola y obtener ASCII final
  const finalAscii = evolveTamagotchi(commits, tamagotchiData, path.basename(jsonFile, '.json'), color1, color2);

  // Generar imagen con el ASCII final
  await generateImageFromAscii(finalAscii, filePath);
}

runWidget('HectorH06', 'Mapo', '2025-01-01T00_00_00Z', 'amphibia.json', 'FFFF00', '00FFFF');
