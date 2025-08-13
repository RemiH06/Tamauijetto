![Build with Love](http://ForTheBadge.com/images/badges/built-with-love.svg)

```ascii
████████╗ █████╗ ███╗   ███╗ █████╗ ██╗   ██╗██╗     ██╗███████╗████████╗████████╗ ██████╗ 
╚══██╔══╝██╔══██╗████╗ ████║██╔══██╗██║   ██║██║     ██║██╔════╝╚══██╔══╝╚══██╔══╝██╔═══██╗
   ██║   ███████║██╔████╔██║███████║██║   ██║██║     ██║█████╗     ██║      ██║   ██║   ██║
   ██║   ██╔══██║██║╚██╔╝██║██╔══██║██║   ██║██║██   ██║██╔══╝     ██║      ██║   ██║   ██║
   ██║   ██║  ██║██║ ╚═╝ ██║██║  ██║╚██████╔╝██║╚█████╔╝███████╗   ██║      ██║   ╚██████╔╝
   ╚═╝   ╚═╝  ╚═╝╚═╝     ╚═╝╚═╝  ╚═╝ ╚═════╝ ╚═╝ ╚════╝ ╚══════╝   ╚═╝      ╚═╝    ╚═════╝ 

       by HectorH06 (@HectorH06)          version 1.0
```

### General Description

Tamauijetto is a small digital "Tamagotchi" that evolves based on a GitHub user's activity.
It uses ASCII art contained in a json file, and then uses it to generate a PNG image that can be embedded in a README, webpage, or widget.

```diff
- Requires a GitHub personal access token with read access to public repos.
```

## Installation

1. Install requirements with the following command :

   `git clone https://github.com/HectorH06/tamauijetto.git`
   `cd tamauijetto`

2. Install Node.js dependencies:

   `npm install`

3. Add your GitHub token:

Create a .secrets file in the project root with your token:

   `github_XXXXXXXXXXXXXXXXXXXXXXX...`

4. Optional: prepare a Tamagotchi JSON file:

Tamagotchis are configured using a JSON file. Example: amphibia.json

5. Run the script:

   `node widgetArtifact.mjs <user> <repo> <startDate> <tamagotchiJSON> <color1> <color2>`
   `node widgetArtifact.mjs HectorH06 Mapo 2025_01_01T00_00_00Z amphibia.json FFFF00 00FFFF`

## Features

- Tamagotchi evolves based on GitHub commits.
- ASCII art in console and PNG image generation.
- Supports custom colors for ASCII art and details.

## Future Features

- Compatible with GitHub Actions to update the image automatically.
- Support for more GitHub events (issues, pull requests).

![Tamagotchi](https://raw.githubusercontent.com/HectorH06/tamauijetto/main/tamauijetto/tamagotchi_HectorH06_Mapo_2025-01-01T00_00_00Z_amphibia.json_FFFF00_00FFFF_000000.png)

![Tamagotchi](https://raw.githubusercontent.com/HectorH06/tamauijetto/main/tamauijetto/tamagotchi_HectorH06_Mapo_2025-01-01T00_00_00Z_amphibia.json_FFFF00_314131ff_5c7d5cff.png)