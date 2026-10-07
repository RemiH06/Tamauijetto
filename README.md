![Built with Love](https://forthebadge.com/images/badges/built-with-love.svg)

```ascii
████████╗ █████╗ ███╗   ███╗ █████╗ ██╗   ██╗██╗     ██╗███████╗████████╗████████╗ ██████╗ 
╚══██╔══╝██╔══██╗████╗ ████║██╔══██╗██║   ██║██║     ██║██╔════╝╚══██╔══╝╚══██╔══╝██╔═══██╗
   ██║   ███████║██╔████╔██║███████║██║   ██║██║     ██║█████╗     ██║      ██║   ██║   ██║
   ██║   ██╔══██║██║╚██╔╝██║██╔══██║██║   ██║██║██   ██║██╔══╝     ██║      ██║   ██║   ██║
   ██║   ██║  ██║██║ ╚═╝ ██║██║  ██║╚██████╔╝██║╚█████╔╝███████╗   ██║      ██║   ╚██████╔╝
   ╚═╝   ╚═╝  ╚═╝╚═╝     ╚═╝╚═╝  ╚═╝ ╚═════╝ ╚═╝ ╚════╝ ╚══════╝   ╚═╝      ╚═╝    ╚═════╝ 
       by Hex (@RemiH06)          version 2.0
```

![GPL-3.0](https://img.shields.io/badge/License-GPLv3-blue.svg?style=for-the-badge)

![Tamagotchi](https://raw.githubusercontent.com/RemiH06/Tamauijetto/pet/tamagotchi.svg)

## Resumen

### Descripción general

Tamauijetto es un tamagotchi que vive de tu actividad en GitHub. Cada push, commit y pull request es comida; con suficiente comida evoluciona por las etapas de su especie, y algunas ramas de evolución se deciden al azar. Si pasa demasiado tiempo sin comer, primero tiene hambre, luego se muere de hambre y al final muere. La siguiente actividad después de su muerte hace nacer un huevo nuevo de la siguiente generación.

Un workflow de GitHub Actions lo revisa cada hora y publica una tarjeta SVG (piel `sherry` de iroFactory) en la rama `pet`, lista para incrustarse en cualquier README.

```diff
- La API de eventos de GitHub solo guarda 90 días y hasta 300 eventos; el estado recuerda lo que ya se comió, así que el workflow tiene que correr seguido.
- Sin el secreto TAMA_TOKEN solo cuenta la actividad pública.
- GitHub pausa los workflows programados de un repo sin actividad en 60 días.
```

## Installation

1. Clona el repo (Node 20.12 o más reciente, sin dependencias):

   ```bash
   git clone https://github.com/RemiH06/Tamauijetto.git
   cd Tamauijetto
   ```

2. Ajusta `tamauijetto.config.json`:

   | Campo | Qué hace |
   |---|---|
   | `user` | Usuario de GitHub cuya actividad lo alimenta. |
   | `repo` | `null` para toda la actividad, o un nombre (`Mapo` u `owner/Mapo`) para un solo repo. |
   | `species` | Archivo de `species/` sin `.json`. |
   | `bornAt` | `null` nace ahora; una fecha ISO hace que nazca antes y se coma la actividad desde ahí. |
   | `petColor` | Token de sherry (`lime`, `cyan`, `magenta`, `violet`, `electric`, `lavender`) o un hex. |
   | `hours` | Horas sin comer para `hungry`, `starving` y `dead`. |
   | `food` | Comida por `push`, por `commit` (máximo `commitCap` por push), por PR abierto (`pullRequest`) y por PR mergeado (`merge`). |

3. Opcional: para contar actividad privada, crea un token personal con lectura de eventos y guárdalo como secreto `TAMA_TOKEN` del repo.

4. Activa el workflow `tamagotchi` en la pestaña Actions y córrelo una vez a mano. A partir de ahí corre cada hora.

5. Incrusta la tarjeta donde quieras:

   ```markdown
   ![Tamagotchi](https://raw.githubusercontent.com/<usuario>/<repo>/pet/tamagotchi.svg)
   ```

## Launch arguments

Para correrlo en local, el token sale de la variable `GITHUB_TOKEN` o del archivo `.secrets`.

- `npm start` una pasada real: lee eventos, alimenta y escribe `out/pet.json` y `out/tamagotchi.svg`.
- `npm run preview` dibuja en `out/preview/` una tarjeta por etapa y una por estado de ánimo, sin red. Sirve para diseñar especies.

## Features

- Comida por push, commit y pull request, configurable.
- Hambre, agonía y muerte por inactividad; renace como nueva generación.
- Evolución con ramas aleatorias que se deciden una sola vez y quedan guardadas.
- Tarjeta SVG con la piel `sherry` de iroFactory: pantalla LCD con glow neón, modo claro u oscuro según el sistema y animación que respeta `prefers-reduced-motion`.
- Especies como JSON en `species/`, todas con el mismo estándar para que las etapas se vean del mismo mundo y el crecimiento se note:
  - `"size": 32` y cada etapa en `sprites.<etapa>` como cuadrícula de 32 filas por 32 caracteres: `.` vacío, `#` cuerpo (`petColor`), `*` detalle (`detailColor`).
  - Varios cuadros por etapa (`frames`) con su duración en segundos (`timing`); así parpadea: el segundo cuadro es el mismo sprite con los ojos cerrados.
  - Mismo tamaño de píxel en todas las etapas: el huevo ocupa poco y la forma final llena la pantalla.
  - Un rasgo común por linaje (en amphibia, los ojos huecos de 2×2 desde el huevo).

## Future Features

- Más especies (`plant` ya tiene etapas, faltan los sprites).

## Autoría

por Hex ([@RemiH06](https://github.com/RemiH06))
