// Comida: lo que el usuario hizo en GitHub, leído de la API de eventos.
// La API solo guarda los últimos 90 días (máx. 300 eventos); por eso el
// workflow corre cada hora y el estado recuerda qué eventos ya se comió.

const API = 'https://api.github.com';

async function gh(endpoint, token) {
  const res = await fetch(API + endpoint, {
    headers: {
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'tamauijetto',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  });
  if (!res.ok) throw new Error(`GitHub respondió ${res.status} en ${endpoint}: ${(await res.text()).slice(0, 200)}`);
  return res.json();
}

// Con el token del propio usuario, /events incluye también su actividad privada.
export async function fetchEvents(user, token) {
  const events = [];
  for (let page = 1; page <= 3; page++) {
    const batch = await gh(`/users/${encodeURIComponent(user)}/events?per_page=100&page=${page}`, token);
    events.push(...batch);
    if (batch.length < 100) break;
  }
  return events;
}

// Desde 2025 los PushEvent ya no traen la lista de commits: se cuentan
// comparando before...head. Si no se puede (rama nueva, repo privado sin
// acceso), el push cuenta como un commit.
async function commitsInPush(event, token) {
  const { before, head } = event.payload;
  if (!before || /^0+$/.test(before)) return 1;
  try {
    const cmp = await gh(`/repos/${event.repo.name}/compare/${before}...${head}`, token);
    return Math.max(1, cmp.total_commits ?? 1);
  } catch {
    return 1;
  }
}

export async function nutrition(event, food, token) {
  switch (event.type) {
    case 'PushEvent': {
      const commits = Math.min(await commitsInPush(event, token), food.commitCap);
      return food.push + food.commit * commits;
    }
    case 'PullRequestEvent':
      if (event.payload.action === 'opened') return food.pullRequest;
      if (event.payload.action === 'merged') return food.merge;
      return 0;
    default:
      return 0;
  }
}

export function fromRepo(event, user, repo) {
  if (!repo) return true;
  const full = repo.includes('/') ? repo : `${user}/${repo}`;
  return event.repo.name.toLowerCase() === full.toLowerCase();
}
