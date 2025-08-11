import { Octokit } from "https://cdn.skypack.dev/@octokit/rest";

const octokit = new Octokit();

async function getCommits(user, repo = '') {
  let commits;
  if (repo) {
    commits = await octokit.request('GET /repos/{owner}/{repo}/commits', {
      owner: user,
      repo: repo,
    });
  } else {
    commits = await octokit.request('GET /users/{username}/events/public', {
      username: user,
    });
  }
  return commits;
}

function evolveTamagotchi(commits, tamagotchiData) {
  let currentStage = 'egg';
  let totalCommits = commits.length;

  for (let stage of tamagotchiData.stages) {
    if (totalCommits >= stage.requiredCommits) {

      currentStage = stage.name;
      break;
    }
  }

  console.log(tamagotchiData[currentStage].asciiArt);
}

const tamagotchiData = {
  stages: [
    {
      name: 'egg',
      requiredCommits: 3,
      probabilities: { baby1: 0.8, baby2: 0.2 },
    },
    {
      name: 'baby1',
      requiredCommits: 5,
      probabilities: { child: 0.7, baby2: 0.3 },
    },
    {
      name: 'baby2',
      requiredCommits: 5,
      probabilities: { child: 0.5, teen: 0.5 },
    },
    {
      name: 'child',
      requiredCommits: 8,
      probabilities: { teen: 0.6, adult: 0.4 },
    },
    {
      name: 'teen',
      requiredCommits: 12,
      probabilities: { adult: 1.0 },
    },
    {
      name: 'adult',
      requiredCommits: 20,
      probabilities: {},
    },
  ],
  egg: {
    asciiArt: `
egg
    `
  },
  baby1: {
    asciiArt: `
b1
    `
  },
  baby2: {
    asciiArt: `
b2
    `
  },
  child: {
    asciiArt: `
c
    `
  },
  teen: {
    asciiArt: `
t
    `
  },
  adult: {
    asciiArt: `
a
    `
  }
};



getCommits('HectorH06').then((commits) => {
  evolveTamagotchi(commits, tamagotchiData);
});
