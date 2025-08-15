import fs from 'fs';
import path from 'path';
import { createCanvas } from 'canvas';
import terminalImage from 'terminal-image';
import { loadTamagotchiData, getCommits, evolveTamagotchi } from './tamagotchi.mjs';

// Función para generar imagen desde ASCII y texto extra con colores diferenciados
async function generateImageFromAscii(asciiArt, textLines = [], filePath, asciiColor = '#000000', textColor = '#FFFFFF', bgColor = '#FFFFFF') {
  const lines = asciiArt.split('\n');
  const lineHeight = 20;  // tamaño de fuente en px
  const charWidth = 12;   // ancho aproximado de cada caracter

  const canvasWidth = Math.max(...lines.map(l => l.length)) * charWidth;
  const canvasHeight = lines.length * lineHeight + textLines.length * lineHeight + 10; // +10 para espacio entre ASCII y texto

  // 1. Canvas ajustado al ASCII + texto
  const canvas = createCanvas(canvasWidth, canvasHeight);
  const ctx = canvas.getContext('2d');

  // Fondo
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  // ASCII
  ctx.font = `${lineHeight}px monospace`;
  ctx.fillStyle = asciiColor;

  lines.forEach((line, index) => {
    ctx.fillText(line, 0, lineHeight * (index + 0.9));  // 0.9 para alinear vertical
  });

  // Texto adicional debajo del ASCII
  textLines.forEach((line, index) => {
    ctx.fillStyle = textColor;  // Cambiar color de texto
    ctx.fillText(line, 0, lineHeight * (lines.length + index + 1.5));  // Ajustar para poner texto debajo del ASCII
  });

  // 2. Canvas final cuadrado de 256x256
  const finalSize = 256;
  const finalCanvas = createCanvas(finalSize, finalSize);
  const fCtx = finalCanvas.getContext('2d');

  // Fondo
  fCtx.fillStyle = bgColor;
  fCtx.fillRect(0, 0, finalSize, finalSize);

  // Escala para encajar ASCII + texto
  const scale = Math.min(finalSize / canvasWidth, finalSize / canvasHeight);
  fCtx.scale(scale, scale);
  fCtx.drawImage(canvas, 0, 0);

  // Guardar imagen
  const buffer = finalCanvas.toBuffer('image/png');
  fs.writeFileSync(filePath, buffer);
}

// Función principal que ejecuta todo
export async function runWidget(user, repo = '', date = '2025-01-01T00_00_00Z', jsonFile = 'amphibia.json', color1 = 'FFFF00', color2 = '00FFFF', bgColor = 'FFFFFF') {
  const tamagotchiData = loadTamagotchiData(jsonFile);
  if (!tamagotchiData) return;

  const commits = await getCommits(user, repo, date);

  const tamagotchiName = path.basename(jsonFile, '.json');

  // Evolución en consola y obtener ASCII final
  const finalAscii = evolveTamagotchi(commits, tamagotchiData, tamagotchiName, color1, color2);

  // Crear texto adicional debajo
  const currentStage = tamagotchiData.currentStage || 'unknown';
  const totalCommits = commits.length;
  const textLines = [
    `Species: ${tamagotchiName}`,
    `Stage: ${currentStage}`,
    `Total Commits: ${totalCommits}`
  ];

  // Crear nombre de archivo seguro
  const safeFileName = `tamagotchi_${user}_${repo}_${date}_${jsonFile}_${color1}_${color2}_${bgColor}.png`;
  const filePath = path.join('tamauijetto', safeFileName);

  // Generar imagen final con colores diferenciados
  await generateImageFromAscii(finalAscii, textLines, filePath, `#${color1}`, `#${color2}`, `#${bgColor}`);
}

// Ejemplo de ejecución
runWidget('HectorH06', 'Mapo', '2025-01-01T00_00_00Z', 'amphibia.json', '314131ff', '314131ff', '5c7d5cff');
