import fs from 'fs';
import path from 'path';
import { Octokit } from '@octokit/core';
import fetch from 'node-fetch';
import chalk from 'chalk';

const token = fs.readFileSync('.secrets', 'utf8').trim();
const octokit = new Octokit({ auth: token, request: { fetch } });

export function loadTamagotchiData(filePath) {
  if (fs.existsSync(filePath)) {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } else {
    console.log(`File not found: ${filePath}`);
    return null;
  }
}

export async function getCommits(user, repo = '', since = '2025-01-01T00:00:00Z') {
  let commits = [];

  if (repo !== '') {
    const response = await octokit.request('GET /repos/{owner}/{repo}/commits', {
      owner: user,
      repo: repo,
      since
    });
    commits = response.data;
  } else {
    const events = await octokit.request('GET /users/{username}/events/public', { username: user });
    const pushEvents = events.data.filter(event => event.type === 'PushEvent');

    for (let event of pushEvents) {
      const repoName = event.repo.name;
      if (repoName) {
        let response = await octokit.request('GET /repos/{owner}/{repo}/commits', {
          owner: user,
          repo: repoName,
          since
        });
        if (response.data.length > 0) commits = commits.concat(response.data);
      }
    }
  }

  console.log(`Commits count since ${since}: ${commits.length}`);
  return commits;
}

export function evolveTamagotchi(commits, tamagotchiData, tamagotchiName, tamagotchiColor, detailsColor) {
  let currentStage = 'egg';
  let totalCommits = commits.length;
  let lastAscii = tamagotchiData[currentStage].asciiArt; // <-- guardar ASCII final

  console.log(`Total Commits: ${totalCommits}`);
  console.log(chalk.hex(tamagotchiColor)(lastAscii));

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

      lastAscii = tamagotchiData[currentStage].asciiArt;
      console.log(chalk.hex(tamagotchiColor)(lastAscii));
    }
  }

  console.log(chalk.hex(detailsColor)(`\nSpecies: ${tamagotchiName}`));
  console.log(chalk.hex(detailsColor)(`Stage: ${currentStage}`));
  console.log(chalk.hex(detailsColor)(`Total Commits: ${totalCommits}`));

  return lastAscii;
}


export async function main(user, repo = '', startDate = '2025-01-01T00_00_00Z', tamagotchiFile = 'tamagotchiData.json', tamagotchiColor = 'FFFF00', detailsColor = '00FFFF') {
  const tamagotchiData = loadTamagotchiData(tamagotchiFile);
  if (!tamagotchiData) return;

  const tamagotchiName = path.basename(tamagotchiFile, '.json');
  const commits = await getCommits(user, repo, startDate);

  evolveTamagotchi(commits, tamagotchiData, tamagotchiName, tamagotchiColor, detailsColor);
}

// main('HectorH06', 'Mapo', '2025-01-01T00_00_00Z', 'amphibia.json', 'FFFF00', '00FFFF');
