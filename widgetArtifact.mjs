import fs from 'fs';
import path from 'path';
import { Octokit } from '@octokit/core';
import fetch from 'node-fetch';
import chalk from 'chalk';
import { createCanvas } from 'canvas'; // Para generar imágenes
import terminalImage from 'terminal-image'; // Para convertir el arte ASCII a imagen

const token = fs.readFileSync('.secrets', 'utf8').trim();

// Octokit
const octokit = new Octokit({ 
  auth: token,
  request: { fetch }
});

// Función para leer datos de un archivo JSON
function loadTamagotchiData(filePath) {
  if (fs.existsSync(filePath)) {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } else {
    console.log(`File not found: ${filePath}`);
    return null;
  }
}

// Fecha de comienzo desde la qué jalar commits
async function getCommits(user, repo = '', since = '2025-01-01T00:00:00Z') {
  let commits = [];

  if (repo !== '') {
    let response = await octokit.request('GET /repos/{owner}/{repo}/commits', {
      owner: user,
      repo: repo,
      since: since
    });
    commits = response.data;
  } else {
    const events = await octokit.request('GET /users/{username}/events/public', {
      username: user,
    });

    const pushEvents = events.data.filter(event => event.type === 'PushEvent');

    for (let event of pushEvents) {
      const repoName = event.repo.name;

      if (repoName) {
        console.log(`Obteniendo commits del repositorio: ${repoName}`);

        let response = await octokit.request('GET /repos/{owner}/{repo}/commits', {
          owner: user,
          repo: repoName,
          since: since
        });
        
        if (response.data.length > 0) {
          commits = commits.concat(response.data);
        }
      }
    }
  }

  console.log(`Commits count since ${since}: ${commits.length}`);
  return commits;
}

//* Bienvenido al mundo, Tamagotchi
function evolveTamagotchi(commits, tamagotchiData, tamagotchiName, tamagotchiColor, detailsColor) {
  let currentStage = 'egg';
  let totalCommits = commits.length;

  console.log(`Total Commits: ${totalCommits}`);
  console.log(chalk.hex(tamagotchiColor)(tamagotchiData[currentStage].asciiArt));

  for (let i = 0; i < tamagotchiData.stages.length; i++) {
    const stage = tamagotchiData.stages[i];

    if (totalCommits >= stage.requiredCommits && currentStage === stage.name) {
      console.log(chalk.hex(detailsColor)(`\nEvolving from ${currentStage} to next phase...`));

      if (stage.probabilities) {
        const probabilities = stage.probabilities;
        const random = Math.random();
        let cumulativeProbability = 0;

        for (let nextStage in probabilities) {
          cumulativeProbability += probabilities[nextStage];
          if (random < cumulativeProbability) {
            currentStage = nextStage;
            break;
          }
        }
      } else {
        break;
      }

      console.log(chalk.hex(tamagotchiColor)(tamagotchiData[currentStage].asciiArt));
    }
  }

  console.log(chalk.hex(detailsColor)(`\nSpecies: ${tamagotchiName}`));
  console.log(chalk.hex(detailsColor)(`Stage: ${currentStage}`));
  console.log(chalk.hex(detailsColor)(`Total Commits: ${totalCommits}`));

  return tamagotchiData[currentStage].asciiArt;
}

// Función para generar una imagen desde el arte ASCII
async function generateImageFromAscii(asciiArt, user, repo, date, json, color1, color2) {
  // Crear un nombre único para el archivo basado en los parámetros
  const fileName = `tamauijetto/tamagotchi_${user}_${repo}_${date}_${json}_${color1}_${color2}.png`;
  
  const canvas = createCanvas(600, 300);
  const ctx = canvas.getContext('2d');
  ctx.font = '20px monospace';
  ctx.fillText(asciiArt, 10, 50);
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(fileName, buffer); // Guardar la imagen en la carpeta tamauijetto con un nombre único
}

// Función principal que toma parámetros para ejecutar el código
async function main(user, repo = '', startDate = '2025-01-01T00:00:00Z', tamagotchiFile = 'tamagotchiData.json', tamagotchiColor = '#FFFF00', detailsColor = '#00FFFF') {
  // Cargar los datos del Tamagotchi desde el archivo JSON especificado
  const tamagotchiData = loadTamagotchiData(tamagotchiFile);
  if (!tamagotchiData) return;

  const tamagotchiName = path.basename(tamagotchiFile, '.json');

  // Obtener los commits desde la fecha y repositorio especificados
  const commits = await getCommits(user, repo, startDate);

  // Evolucionar el Tamagotchi basándose en los commits
  const finalAsciiArt = evolveTamagotchi(commits, tamagotchiData, tamagotchiName, tamagotchiColor, detailsColor);

  // Generar el nombre único para la imagen y guardarla
  await generateImageFromAscii(finalAsciiArt, user, repo, startDate, tamagotchiFile, tamagotchiColor, detailsColor);

  console.log("Imagen generada: " + `tamauijetto/tamagotchi_${user}_${repo}_${startDate}_${tamagotchiFile}_${tamagotchiColor}_${detailsColor}.png`);
}

main('HectorH06', 'Mapo', '2025-01-01T00:00:00Z', 'amphibia.json', '#FFFF00', '#00FFFF');
