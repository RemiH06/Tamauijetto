import fs from 'fs';
import path from 'path';
import { Octokit } from '@octokit/core';
import fetch from 'node-fetch';
import chalk from 'chalk';

const token = fs.readFileSync('.secrets', 'utf8').trim();

// Octokit
const octokit = new Octokit({ 
  auth: token,
  request: { fetch }
});

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
    // Si se pasa un repo, solo se toman de ese repo
    let response = await octokit.request('GET /repos/{owner}/{repo}/commits', {
      owner: user,
      repo: repo,
      since: since // Filtramos con la fecha
    });
    commits = response.data;
  } else {
    // Si no se pasa un repo, se hace de todo el usuario //!(NO FUNCIONA)
    const events = await octokit.request('GET /users/{username}/events/public', {
      username: user,
    });

    // Filtrar solo PushEvents //?(Quizá añada soporte para otro tipo de interacciones: issues/pullrequests)
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
          commits = commits.concat(response.data); // Añadir los commits encontrados
        }
      }
    }
  }

  console.log(`Commits count since ${since}: ${commits.length}`); // Count de commits
  return commits;
}

//* Bienvenido al mundo, Tamagotchi
function evolveTamagotchi(commits, tamagotchiData, tamagotchiName, tamagotchiColor, detailsColor) {
  let currentStage = 'egg'; // Se empieza como huevo
  let totalCommits = commits.length; // Y crece de acuerdo a la cantidad de commits requeridos en el json

  console.log(`Total Commits: ${totalCommits}`); // Verifica cuántos commits tiene el usuario
  console.log(chalk.hex(tamagotchiColor)(tamagotchiData[currentStage].asciiArt)); // Muestra el arte ASCII inicial

  // Fase por fase para hacer random la evo
  for (let i = 0; i < tamagotchiData.stages.length; i++) {
    const stage = tamagotchiData.stages[i];

    // Si tenemos suficientes commits para esta fase, procedemos a la siguiente
    if (totalCommits >= stage.requiredCommits && currentStage === stage.name) {
      console.log(chalk.hex(detailsColor)(`\nEvolving from ${currentStage} to next phase...`));

      // Si hay probabilidades de evolución, las calculamos
      if (stage.probabilities) {
        const probabilities = stage.probabilities;
        const random = Math.random(); // Número aleatorio entre 0 y 1
        let cumulativeProbability = 0;

        // Elegir la siguiente fase según las probabilidades
        for (let nextStage in probabilities) {
          cumulativeProbability += probabilities[nextStage];
          if (random < cumulativeProbability) {
            currentStage = nextStage; // Asignar la siguiente fase según la probabilidad
            break;
          }
        }
      } else {
        // Si no hay transiciones, terminamos la evolución
        break;
      }
      
      // Muestra la fase evolucionada
      console.log(chalk.hex(tamagotchiColor)(tamagotchiData[currentStage].asciiArt));
    }
  }

  // Mostrar los detalles debajo del arte ASCII con el color de los detalles
  console.log(chalk.hex(detailsColor)(`\nSpecies: ${tamagotchiName}`));
  console.log(chalk.hex(detailsColor)(`Stage: ${currentStage}`));
  console.log(chalk.hex(detailsColor)(`Total Commits: ${totalCommits}`));
}

// Función principal que toma parámetros para ejecutar el código
async function main(user, repo = '', startDate = '2025-01-01T00:00:00Z', tamagotchiFile = 'tamagotchiData.json', tamagotchiColor = '#FF5733', detailsColor = '#00FF00') {
  // Cargar los datos del Tamagotchi desde el archivo JSON especificado
  const tamagotchiData = loadTamagotchiData(tamagotchiFile);
  if (!tamagotchiData) {
    return;
  }

  // Extraer el nombre del Tamagotchi (sin la extensión .json)
  const tamagotchiName = path.basename(tamagotchiFile, '.json');

  // Obtener los commits desde la fecha y repositorio especificados
  const commits = await getCommits(user, repo, startDate);

  // Evolucionar el Tamagotchi basándose en los commits
  evolveTamagotchi(commits, tamagotchiData, tamagotchiName, tamagotchiColor, detailsColor);
}

// node tamagotchi.mjs
main('HectorH06', 'Mapo', '2025-01-01T00:00:00Z', 'amphibia.json', '#FFFF00', '#00FFFF');
